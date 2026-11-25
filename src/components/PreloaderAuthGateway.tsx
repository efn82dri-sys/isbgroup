import React, { useEffect, useRef, useState } from 'react';
import type { ConfirmationResult, RecaptchaVerifier } from 'firebase/auth';
import { motion, useReducedMotion } from 'motion/react';
import { ASSETS } from '../data/assets';
import type { Locale, PageRoute } from '../types/content';
import { ARCHITECTURAL_EASE } from '../utils/motionMath';
import {
  evaluatePasswordStrength,
  mapMemberAuthError,
  normalizeDigits,
  normalizeIranPhoneToE164,
  validateEmailPasswordSignIn,
  validateEmailPasswordSignUp,
  validateOtpCode,
  type EmailSignInInput,
  type EmailSignUpInput,
} from '../utils/accountLogic';
import { hasErrors, type FieldErrors } from '../utils/validation';
import { IsbPatternOverlay } from './BrandMark';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Phone,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Ticket,
  User,
} from './icons/IsbIcons';

type AuthIntent = 'signin' | 'signup';
type AuthMethod = 'email' | 'phone';

interface PreloaderAuthGatewayProps {
  locale: Locale;
  onGoogleSignIn: () => Promise<void>;
  onEmailSignIn: (email: string, password: string) => Promise<void>;
  onEmailSignUp: (params: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
  }) => Promise<void>;
  onPasswordReset: (email: string) => Promise<void>;
  onCreateRecaptcha: (container: HTMLElement) => RecaptchaVerifier;
  onPhoneSendOtp: (phoneE164: string, verifier: RecaptchaVerifier) => Promise<ConfirmationResult>;
  onPhoneVerifyOtp: (
    confirmationResult: ConfirmationResult,
    code: string,
    fullName?: string
  ) => Promise<void>;
  onNavigate: (route: PageRoute) => void;
}

/**
 * Official 4-color Google G mark rendered as crisp inline vector SVG.
 */
function GoogleBrandMark({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29A7.22 7.22 0 0 1 4.88 12c0-.8.14-1.57.39-2.29V6.62H1.29A11.98 11.98 0 0 0 0 12c0 1.94.46 3.77 1.29 5.38l3.98-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96Z"
      />
    </svg>
  );
}

function getAuthErrorCode(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code?: unknown }).code;
    return typeof code === 'string' ? code : undefined;
  }
  return undefined;
}

const gatewayInputClass =
  'w-full rounded-xl border border-[#6F9BFF]/25 bg-[#070B14]/85 px-3.5 py-2.5 text-sm text-[#F5F8FC] placeholder:text-[#7E92B0]/80 focus:outline-none focus:border-[#6F9BFF] transition-colors';

/**
 * Signature Architectural Member Gateway (Preloader Visual Language)
 * Supports:
 * - Sign In & Sign Up modes
 * - Email & Password (+ password reset)
 * - Mobile Phone SMS OTP verification (with E.164 normalization & resend countdown)
 * - One-click Google OAuth Sign-In
 */
export function PreloaderAuthGateway({
  locale,
  onGoogleSignIn,
  onEmailSignIn,
  onEmailSignUp,
  onPasswordReset,
  onCreateRecaptcha,
  onPhoneSendOtp,
  onPhoneVerifyOtp,
  onNavigate,
}: PreloaderAuthGatewayProps) {
  const isFa = locale === 'fa';
  const prefersReducedMotion = Boolean(useReducedMotion());

  const [intent, setIntent] = useState<AuthIntent>('signin');
  const [method, setMethod] = useState<AuthMethod>('email');

  // Shared status
  const [busyAction, setBusyAction] = useState<'google' | 'email' | 'reset' | 'otp-send' | 'otp-verify' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Email Sign-In state
  const [signInForm, setSignInForm] = useState<EmailSignInInput>({ email: '', password: '' });
  const [signInErrors, setSignInErrors] = useState<FieldErrors<EmailSignInInput>>({});
  const [showSignInPass, setShowSignInPass] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);

  // Email Sign-Up state
  const [signUpForm, setSignUpForm] = useState<EmailSignUpInput>({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [signUpErrors, setSignUpErrors] = useState<FieldErrors<EmailSignUpInput>>({});
  const [showSignUpPass, setShowSignUpPass] = useState(false);

  // Phone SMS OTP state
  const [phoneFullName, setPhoneFullName] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [normalizedPhone, setNormalizedPhone] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [resendSeconds, setResendSeconds] = useState(0);

  const recaptchaContainerRef = useRef<HTMLDivElement | null>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  const BackArrow = isFa ? ArrowRight : ArrowLeft;
  const passwordStrength = evaluatePasswordStrength(signUpForm.password);

  // Clean up reCAPTCHA verifier on unmount
  useEffect(() => {
    return () => {
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch {
          // Ignore teardown errors
        }
        recaptchaVerifierRef.current = null;
      }
    };
  }, []);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setResendSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendSeconds]);

  const resetMessages = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleSwitchIntent = (next: AuthIntent) => {
    setIntent(next);
    setForgotMode(false);
    setSignInErrors({});
    setSignUpErrors({});
    resetMessages();
  };

  const handleSwitchMethod = (next: AuthMethod) => {
    setMethod(next);
    setForgotMode(false);
    resetMessages();
  };

  const handleGoogleClick = async () => {
    if (busyAction) return;
    resetMessages();
    setBusyAction('google');
    try {
      await onGoogleSignIn();
    } catch (err) {
      setErrorMessage(mapMemberAuthError(getAuthErrorCode(err), locale));
    } finally {
      setBusyAction(null);
    }
  };

  const handleEmailSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busyAction) return;
    resetMessages();

    if (forgotMode) {
      const cleanEmail = signInForm.email.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        setSignInErrors({
          email: isFa ? 'نشانی ایمیل معتبر وارد کنید.' : 'Enter a valid email address.',
        });
        return;
      }
      setBusyAction('reset');
      try {
        await onPasswordReset(cleanEmail);
        setSuccessMessage(
          isFa
            ? 'لینک بازیابی رمز عبور به ایمیل شما ارسال شد. لطفاً صندوق ورودی یا پوشه Spam را بررسی کنید.'
            : 'Password reset link sent. Please check your inbox or spam folder.'
        );
        setForgotMode(false);
      } catch (err) {
        setErrorMessage(mapMemberAuthError(getAuthErrorCode(err), locale));
      } finally {
        setBusyAction(null);
      }
      return;
    }

    const errors = validateEmailPasswordSignIn(signInForm, locale);
    setSignInErrors(errors);
    if (hasErrors(errors)) return;

    setBusyAction('email');
    try {
      await onEmailSignIn(signInForm.email.trim(), signInForm.password);
    } catch (err) {
      setErrorMessage(mapMemberAuthError(getAuthErrorCode(err), locale));
    } finally {
      setBusyAction(null);
    }
  };

  const handleEmailSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busyAction) return;
    resetMessages();

    const errors = validateEmailPasswordSignUp(signUpForm, locale);
    setSignUpErrors(errors);
    if (hasErrors(errors)) return;

    setBusyAction('email');
    try {
      await onEmailSignUp({
        fullName: signUpForm.fullName.trim(),
        email: signUpForm.email.trim(),
        password: signUpForm.password,
        phone: signUpForm.phone.trim() || undefined,
      });
    } catch (err) {
      setErrorMessage(mapMemberAuthError(getAuthErrorCode(err), locale));
    } finally {
      setBusyAction(null);
    }
  };

  const clearRecaptcha = () => {
    if (recaptchaVerifierRef.current) {
      try {
        recaptchaVerifierRef.current.clear();
      } catch {
        // Ignore clear errors
      }
      recaptchaVerifierRef.current = null;
    }
  };

  const handleSendOtpSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (busyAction) return;
    resetMessages();

    if (intent === 'signup' && phoneFullName.trim().length < 2) {
      setErrorMessage(
        isFa
          ? 'برای ثبت‌نام با شماره همراه، لطفاً نام و نام خانوادگی خود را وارد کنید.'
          : 'Please enter your full name to register with your mobile number.'
      );
      return;
    }

    const e164 = normalizeIranPhoneToE164(phoneInput);
    if (!e164) {
      setErrorMessage(
        isFa
          ? 'شماره همراه معتبر وارد کنید (مثال: 09151234567).'
          : 'Enter a valid mobile phone number (e.g. 09151234567 or +989151234567).'
      );
      return;
    }

    if (!recaptchaContainerRef.current) {
      setErrorMessage(
        isFa ? 'بستر امنیتی reCAPTCHA آماده نشد. صفحه را تازه‌سازی کنید.' : 'Security verifier unavailable.'
      );
      return;
    }

    setBusyAction('otp-send');
    try {
      clearRecaptcha();
      const verifier = onCreateRecaptcha(recaptchaContainerRef.current);
      recaptchaVerifierRef.current = verifier;
      const result = await onPhoneSendOtp(e164, verifier);
      setConfirmationResult(result);
      setNormalizedPhone(e164);
      setOtpCode('');
      setResendSeconds(60);
      setSuccessMessage(
        isFa
          ? `کد تأیید ۶ رقمی به شماره ${e164} پیامک شد.`
          : `A 6-digit verification code was sent via SMS to ${e164}.`
      );
    } catch (err) {
      clearRecaptcha();
      setErrorMessage(mapMemberAuthError(getAuthErrorCode(err), locale));
    } finally {
      setBusyAction(null);
    }
  };

  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busyAction || !confirmationResult) return;
    resetMessages();

    const otpErr = validateOtpCode(otpCode, locale);
    if (otpErr) {
      setErrorMessage(otpErr);
      return;
    }

    setBusyAction('otp-verify');
    try {
      await onPhoneVerifyOtp(
        confirmationResult,
        otpCode,
        intent === 'signup' ? phoneFullName.trim() : undefined
      );
    } catch (err) {
      setErrorMessage(mapMemberAuthError(getAuthErrorCode(err), locale));
    } finally {
      setBusyAction(null);
    }
  };

  const capabilities = [
    {
      code: '01',
      accent: '#6F9BFF',
      icon: CreditCard,
      title: isFa ? 'پروفایل و اطلاعات فاکتور' : 'Profile & Billing Ready',
      desc: isFa
        ? 'ذخیره ایمن اطلاعات کاربری برای ثبت‌نام سریع دوره‌ها و پرداخت آنلاین'
        : 'Saved identity & billing details for seamless course enrollment',
    },
    {
      code: '02',
      accent: '#28CF77',
      icon: ShoppingBag,
      title: isFa ? 'سفارش‌ها و دوره‌های من' : 'Orders & Courses',
      desc: isFa
        ? 'پیگیری وضعیت پرداخت، رسید سفارش‌ها و دسترسی مستقیم به آکادمی ISB'
        : 'Track order status, payment receipts, and academy course access',
    },
    {
      code: '03',
      accent: '#68C4F8',
      icon: Ticket,
      title: isFa ? 'تیکت و پیگیری مستقیم' : 'Direct Ticket Tracking',
      desc: isFa
        ? 'ثبت تیکت پشتیبانی، درخواست پروژه و ارزیابی پایداری با پیگیری لحظه‌ای'
        : 'Open support tickets and track engineering replies in one workspace',
    },
  ];

  return (
    <section
      data-testid="preloader-auth-gateway"
      aria-label={isFa ? 'درگاه ورود و ثبت‌نام کاربران گروه ساختمانی پایدار ایران زمین' : 'ISB Group Member Auth Gateway'}
      className="relative min-h-screen w-full bg-[#070B14] text-[#F5F8FC] overflow-hidden flex flex-col justify-between isolate"
    >
      {/* Hidden reCAPTCHA mount anchor for Firebase Phone Auth */}
      <div ref={recaptchaContainerRef} id="isb-phone-recaptcha-container" className="hidden" />

      {/* Architectural Blueprint Axes, Official ISB Catalog Pattern & Cobalt/Emerald Wash */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <IsbPatternOverlay
          color="#5A86F5"
          opacity={0.095}
          scale={1.05}
          maskStyle="radial-gradient(ellipse 85% 75% at 50% 50%, black 0%, transparent 78%)"
        />
        <div
          className="absolute -top-32 -start-24 w-[42rem] h-[42rem] rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(34,58,135,0.36) 0%, rgba(34,58,135,0.09) 45%, transparent 74%)',
          }}
        />
        <div
          className="absolute -bottom-36 -end-24 w-[42rem] h-[42rem] rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(0,166,81,0.20) 0%, rgba(0,166,81,0.045) 44%, transparent 74%)',
          }}
        />

        {/* Drafting frame hairlines matching ArchitecturalPreloader */}
        <div className="absolute top-3 right-3 bottom-3 left-3 sm:top-6 sm:right-6 sm:bottom-6 sm:left-6 lg:top-8 lg:right-8 lg:bottom-8 lg:left-8 rounded-[28px] border border-[#6F9BFF]/[0.14]" />
        <div className="absolute inset-y-8 left-1/2 w-px bg-gradient-to-b from-transparent via-[#6F9BFF]/[0.08] to-transparent" />
        <div className="absolute inset-x-8 top-1/2 h-px bg-gradient-to-r from-transparent via-[#6F9BFF]/[0.08] to-transparent" />
      </div>

      {/* Top Bar: Quiet Architectural Identity & Back to Site */}
      <div className="relative z-20 max-w-[1380px] w-full mx-auto px-5 sm:px-11 lg:px-14 pt-5 sm:pt-9 flex items-center justify-between gap-3 sm:gap-4">
        <p className="min-w-0 text-[11px] sm:text-xs rtl:text-[12px] sm:rtl:text-[13.5px] font-medium text-[#A4C3FF]/90 flex items-center gap-2 sm:gap-2.5">
          <span
            aria-hidden="true"
            className="w-4 sm:w-5 h-[1.5px] rounded-full bg-gradient-to-r from-[#28CF77] to-[#6F9BFF] shrink-0"
          />
          <span className="truncate">
            {isFa
              ? 'گروه ساختمانی پایدار ایران زمین'
              : 'Iran Zamin Sustainable Building Group'}
          </span>
        </p>

        <button
          type="button"
          data-testid="gateway-back-home-btn"
          onClick={() => onNavigate({ page: 'home' })}
          className="inline-flex items-center justify-center gap-1.5 sm:gap-2 min-h-[40px] sm:min-h-[44px] px-3.5 sm:px-5 rounded-full text-[11.5px] sm:text-xs rtl:text-[12px] sm:rtl:text-[13px] font-medium text-[#C6D2E3] hover:text-[#FFFFFF] border border-[#6F9BFF]/25 hover:border-[#6F9BFF]/65 bg-[#223A87]/20 transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <BackArrow className="w-3.5 h-3.5 shrink-0" />
          <span>{isFa ? 'بازگشت به سایت' : 'Back to Site'}</span>
        </button>
      </div>

      {/* Center Stage: Volumetric Logo Pedestal + Multi-Option Architectural Auth Dock */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-5 sm:px-10 py-6 sm:py-8 gap-7">
        <motion.div
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: ARCHITECTURAL_EASE }}
          className="relative w-full max-w-[540px]"
        >
          {/* Cobalt-Emerald architectural back-bloom */}
          <div
            aria-hidden="true"
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(34,58,135,0.44) 0%, rgba(0,166,81,0.14) 50%, transparent 76%)',
            }}
            className="pointer-events-none absolute -inset-12 rounded-full opacity-75"
          />

          <div className="relative rounded-[28px] bg-gradient-to-b from-[#101C36]/95 to-[#080E1C]/96 border border-[#6F9BFF]/28 shadow-[inset_0_1px_0_rgba(214,230,255,0.22),0_30px_70px_-24px_rgba(2,8,24,0.92)] px-5 py-7 sm:px-9 sm:py-8 overflow-hidden">
            {/* Architectural precision corner brackets */}
            <span
              aria-hidden="true"
              className="absolute top-3.5 start-3.5 w-4 h-4 border-t border-s border-[#6F9BFF]/70 rounded-tl-[3px]"
            />
            <span
              aria-hidden="true"
              className="absolute top-3.5 end-3.5 w-4 h-4 border-t border-e border-[#6F9BFF]/70 rounded-tr-[3px]"
            />
            <span
              aria-hidden="true"
              className="absolute bottom-3.5 start-3.5 w-4 h-4 border-b border-s border-[#28CF77]/70 rounded-bl-[3px]"
            />
            <span
              aria-hidden="true"
              className="absolute bottom-3.5 end-3.5 w-4 h-4 border-b border-e border-[#28CF77]/70 rounded-br-[3px]"
            />

            <div className="flex flex-col items-center space-y-5">
              {/* Illuminated ISB Horizontal Brand Logo */}
              <div className="relative w-[155px] sm:w-[190px] aspect-[3.4/1] flex items-center justify-center">
                <img
                  src={ASSETS.brandLogoHorizontal}
                  alt={isFa ? 'گروه ساختمانی پایدار ایران زمین' : 'ISB Group'}
                  draggable={false}
                  className="w-full h-full object-contain mix-blend-screen select-none brightness-110"
                />
              </div>

              {/* Calibrated Hairline Datum Divider */}
              <div className="w-full max-w-[340px] flex items-center gap-3">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#6F9BFF]/45 to-[#28CF77]/50" />
                <span
                  className={
                    isFa
                      ? 'text-xs font-medium tracking-normal text-[#8AB0FF] whitespace-nowrap'
                      : 'text-[10.5px] font-mono tracking-[0.2em] uppercase text-[#8AB0FF] whitespace-nowrap'
                  }
                >
                  {isFa ? 'درگاه حساب کاربری' : 'MEMBER GATEWAY'}
                </span>
                <div className="flex-1 h-px bg-gradient-to-l from-transparent via-[#6F9BFF]/45 to-[#28CF77]/50" />
              </div>

              {/* PRIMARY INTENT SWITCHER: Sign In vs Sign Up */}
              <div
                role="tablist"
                aria-label={isFa ? 'انتخاب ورود یا ثبت‌نام' : 'Choose sign in or sign up'}
                className="w-full grid grid-cols-2 gap-1.5 p-1 rounded-2xl border border-[#6F9BFF]/22 bg-[#070B14]/85"
              >
                <button
                  type="button"
                  role="tab"
                  data-testid="auth-tab-signin"
                  aria-selected={intent === 'signin'}
                  onClick={() => handleSwitchIntent('signin')}
                  className={`min-h-[42px] rounded-xl px-4 py-2 text-xs sm:text-[13.5px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    intent === 'signin'
                      ? 'bg-[#223A87] text-white shadow-[0_8px_22px_-8px_rgba(34,58,135,0.95)] border border-[#6F9BFF]/55'
                      : 'text-[#A6B8D4] hover:text-white'
                  }`}
                >
                  {isFa ? 'ورود به حساب' : 'Sign In'}
                </button>
                <button
                  type="button"
                  role="tab"
                  data-testid="auth-tab-signup"
                  aria-selected={intent === 'signup'}
                  onClick={() => handleSwitchIntent('signup')}
                  className={`min-h-[42px] rounded-xl px-4 py-2 text-xs sm:text-[13.5px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    intent === 'signup'
                      ? 'bg-[#00A651] text-white shadow-[0_8px_22px_-8px_rgba(0,166,81,0.85)] border border-[#28CF77]/60'
                      : 'text-[#A6B8D4] hover:text-white'
                  }`}
                >
                  {isFa ? 'ثبت‌نام عضو جدید' : 'Create Account'}
                </button>
              </div>

              {/* METHOD SWITCHER: Email+Password vs Phone SMS OTP */}
              <div
                role="tablist"
                aria-label={isFa ? 'روش احراز هویت' : 'Authentication method'}
                className="w-full flex items-center justify-center gap-2 border-b border-white/10 pb-3"
              >
                <button
                  type="button"
                  role="tab"
                  data-testid="auth-method-email"
                  aria-selected={method === 'email'}
                  onClick={() => handleSwitchMethod('email')}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    method === 'email'
                      ? 'bg-white/10 text-[#F5F8FC] border border-[#6F9BFF]/45'
                      : 'text-[#8B9DB7] hover:text-[#DCE6F5] border border-transparent'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5 text-[#6F9BFF]" />
                  <span>{isFa ? 'ایمیل و رمز عبور' : 'Email & Password'}</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  data-testid="auth-method-phone"
                  aria-selected={method === 'phone'}
                  onClick={() => handleSwitchMethod('phone')}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    method === 'phone'
                      ? 'bg-white/10 text-[#F5F8FC] border border-[#28CF77]/45'
                      : 'text-[#8B9DB7] hover:text-[#DCE6F5] border border-transparent'
                  }`}
                >
                  <Phone className="w-3.5 h-3.5 text-[#28CF77]" />
                  <span>{isFa ? 'شماره همراه (کد پیامکی)' : 'Mobile SMS Code'}</span>
                </button>
              </div>

              {/* FEEDBACK BANNERS */}
              {errorMessage && (
                <div
                  role="alert"
                  className="w-full rounded-xl border border-amber-400/35 bg-amber-500/12 px-4 py-3 text-xs text-amber-200 flex items-start gap-2.5 text-start leading-relaxed"
                >
                  <AlertCircle className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div
                  role="status"
                  className="w-full rounded-xl border border-[#28CF77]/40 bg-[#00A651]/14 px-4 py-3 text-xs text-[#D6FFE9] flex items-start gap-2.5 text-start leading-relaxed"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#28CF77] shrink-0 mt-0.5" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* ==================== METHOD 1: EMAIL & PASSWORD ==================== */}
              {method === 'email' && intent === 'signin' && (
                <form
                  onSubmit={handleEmailSignInSubmit}
                  noValidate
                  className="w-full space-y-3.5 text-start"
                >
                  <div className="space-y-1.5">
                    <label htmlFor="gw-signin-email" className="block text-xs font-medium text-[#C6D2E3]">
                      {isFa ? 'نشانی ایمیل' : 'Email Address'}
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#7E92B0] absolute top-1/2 -translate-y-1/2 start-3.5 pointer-events-none" />
                      <input
                        id="gw-signin-email"
                        type="email"
                        dir="ltr"
                        autoComplete="email"
                        value={signInForm.email}
                        onChange={(e) => {
                          setSignInForm((prev) => ({ ...prev, email: e.target.value }));
                          setSignInErrors((prev) => ({ ...prev, email: undefined }));
                        }}
                        placeholder="name@example.com"
                        className={`${gatewayInputClass} ps-10`}
                      />
                    </div>
                    {signInErrors.email && (
                      <p className="text-[11px] text-amber-300">{signInErrors.email}</p>
                    )}
                  </div>

                  {!forgotMode && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <label htmlFor="gw-signin-password" className="block text-xs font-medium text-[#C6D2E3]">
                          {isFa ? 'رمز عبور' : 'Password'}
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setForgotMode(true);
                            resetMessages();
                          }}
                          className="text-[11px] text-[#8AB0FF] hover:text-white transition-colors cursor-pointer"
                        >
                          {isFa ? 'فراموشی رمز عبور؟' : 'Forgot password?'}
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-[#7E92B0] absolute top-1/2 -translate-y-1/2 start-3.5 pointer-events-none" />
                        <input
                          id="gw-signin-password"
                          type={showSignInPass ? 'text' : 'password'}
                          dir="ltr"
                          autoComplete="current-password"
                          value={signInForm.password}
                          onChange={(e) => {
                            setSignInForm((prev) => ({ ...prev, password: e.target.value }));
                            setSignInErrors((prev) => ({ ...prev, password: undefined }));
                          }}
                          placeholder="••••••••"
                          className={`${gatewayInputClass} ps-10 pe-10`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowSignInPass((v) => !v)}
                          aria-label={showSignInPass ? (isFa ? 'پنهان کردن رمز' : 'Hide password') : (isFa ? 'نمایش رمز' : 'Show password')}
                          className="absolute top-1/2 -translate-y-1/2 end-3 text-[#8B9DB7] hover:text-white cursor-pointer"
                        >
                          {showSignInPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {signInErrors.password && (
                        <p className="text-[11px] text-amber-300">{signInErrors.password}</p>
                      )}
                    </div>
                  )}

                  {forgotMode && (
                    <div className="flex items-center justify-between gap-2 text-[11px] text-[#9FB0C9]">
                      <span>
                        {isFa
                          ? 'ایمیل ثبت‌شده را وارد کنید تا لینک تنظیم رمز جدید ارسال شود.'
                          : 'Enter your registered email to receive a password reset link.'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setForgotMode(false);
                          resetMessages();
                        }}
                        className="text-[#8AB0FF] hover:text-white whitespace-nowrap cursor-pointer"
                      >
                        {isFa ? 'بازگشت به ورود' : 'Back'}
                      </button>
                    </div>
                  )}

                  <button
                    type="submit"
                    data-testid="email-signin-submit-btn"
                    disabled={busyAction !== null}
                    className="glass-cta w-full min-h-[48px] rounded-xl px-5 py-3 text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {(busyAction === 'email' || busyAction === 'reset') && (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                    <span>
                      {forgotMode
                        ? busyAction === 'reset'
                          ? isFa
                            ? 'در حال ارسال لینک بازیابی...'
                            : 'Sending reset link...'
                          : isFa
                            ? 'ارسال لینک بازیابی رمز عبور'
                            : 'Send Password Reset Link'
                        : busyAction === 'email'
                          ? isFa
                            ? 'در حال بررسی و ورود...'
                            : 'Signing in...'
                          : isFa
                            ? 'ورود به پنل کاربری'
                            : 'Sign In to Member Portal'}
                    </span>
                  </button>
                </form>
              )}

              {method === 'email' && intent === 'signup' && (
                <form
                  onSubmit={handleEmailSignUpSubmit}
                  noValidate
                  className="w-full space-y-3 text-start"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label htmlFor="gw-signup-name" className="block text-xs font-medium text-[#C6D2E3]">
                        {isFa ? 'نام و نام خانوادگی *' : 'Full Name *'}
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-[#7E92B0] absolute top-1/2 -translate-y-1/2 start-3.5 pointer-events-none" />
                        <input
                          id="gw-signup-name"
                          type="text"
                          autoComplete="name"
                          value={signUpForm.fullName}
                          onChange={(e) => {
                            setSignUpForm((prev) => ({ ...prev, fullName: e.target.value }));
                            setSignUpErrors((prev) => ({ ...prev, fullName: undefined }));
                          }}
                          placeholder={isFa ? 'مثال: سارا محمدی' : 'e.g. Sara Mohammadi'}
                          className={`${gatewayInputClass} ps-10`}
                        />
                      </div>
                      {signUpErrors.fullName && (
                        <p className="text-[11px] text-amber-300">{signUpErrors.fullName}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="gw-signup-phone" className="block text-xs font-medium text-[#C6D2E3]">
                        {isFa ? 'شماره همراه (اختیاری)' : 'Mobile Phone (Optional)'}
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-[#7E92B0] absolute top-1/2 -translate-y-1/2 start-3.5 pointer-events-none" />
                        <input
                          id="gw-signup-phone"
                          type="tel"
                          dir="ltr"
                          autoComplete="tel"
                          value={signUpForm.phone}
                          onChange={(e) => {
                            setSignUpForm((prev) => ({ ...prev, phone: e.target.value }));
                            setSignUpErrors((prev) => ({ ...prev, phone: undefined }));
                          }}
                          placeholder="09151234567"
                          className={`${gatewayInputClass} ps-10 font-numeric`}
                        />
                      </div>
                      {signUpErrors.phone && (
                        <p className="text-[11px] text-amber-300">{signUpErrors.phone}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="gw-signup-email" className="block text-xs font-medium text-[#C6D2E3]">
                      {isFa ? 'نشانی ایمیل *' : 'Email Address *'}
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#7E92B0] absolute top-1/2 -translate-y-1/2 start-3.5 pointer-events-none" />
                      <input
                        id="gw-signup-email"
                        type="email"
                        dir="ltr"
                        autoComplete="email"
                        value={signUpForm.email}
                        onChange={(e) => {
                          setSignUpForm((prev) => ({ ...prev, email: e.target.value }));
                          setSignUpErrors((prev) => ({ ...prev, email: undefined }));
                        }}
                        placeholder="name@example.com"
                        className={`${gatewayInputClass} ps-10`}
                      />
                    </div>
                    {signUpErrors.email && (
                      <p className="text-[11px] text-amber-300">{signUpErrors.email}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label htmlFor="gw-signup-pass" className="block text-xs font-medium text-[#C6D2E3]">
                        {isFa ? 'تعیین رمز عبور *' : 'Create Password *'}
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-[#7E92B0] absolute top-1/2 -translate-y-1/2 start-3.5 pointer-events-none" />
                        <input
                          id="gw-signup-pass"
                          type={showSignUpPass ? 'text' : 'password'}
                          dir="ltr"
                          autoComplete="new-password"
                          value={signUpForm.password}
                          onChange={(e) => {
                            setSignUpForm((prev) => ({ ...prev, password: e.target.value }));
                            setSignUpErrors((prev) => ({ ...prev, password: undefined }));
                          }}
                          placeholder={isFa ? 'حداقل ۸ کاراکتر' : 'Min. 8 chars'}
                          className={`${gatewayInputClass} ps-10 pe-10`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowSignUpPass((v) => !v)}
                          aria-label={showSignUpPass ? (isFa ? 'پنهان کردن رمز' : 'Hide password') : (isFa ? 'نمایش رمز' : 'Show password')}
                          className="absolute top-1/2 -translate-y-1/2 end-3 text-[#8B9DB7] hover:text-white cursor-pointer"
                        >
                          {showSignUpPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {signUpErrors.password && (
                        <p className="text-[11px] text-amber-300">{signUpErrors.password}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="gw-signup-confirm" className="block text-xs font-medium text-[#C6D2E3]">
                        {isFa ? 'تکرار رمز عبور *' : 'Confirm Password *'}
                      </label>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 text-[#7E92B0] absolute top-1/2 -translate-y-1/2 start-3.5 pointer-events-none" />
                        <input
                          id="gw-signup-confirm"
                          type={showSignUpPass ? 'text' : 'password'}
                          dir="ltr"
                          autoComplete="new-password"
                          value={signUpForm.confirmPassword}
                          onChange={(e) => {
                            setSignUpForm((prev) => ({ ...prev, confirmPassword: e.target.value }));
                            setSignUpErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                          }}
                          placeholder="••••••••"
                          className={`${gatewayInputClass} ps-10`}
                        />
                      </div>
                      {signUpErrors.confirmPassword && (
                        <p className="text-[11px] text-amber-300">{signUpErrors.confirmPassword}</p>
                      )}
                    </div>
                  </div>

                  {/* Subtle architectural password strength gauge */}
                  {signUpForm.password.length > 0 && (
                    <div className="flex items-center gap-2 pt-0.5">
                      <div className="flex-1 grid grid-cols-4 gap-1">
                        {[1, 2, 3, 4].map((level) => (
                          <span
                            key={level}
                            className={`h-1 rounded-full transition-colors ${
                              passwordStrength.score >= level
                                ? passwordStrength.score >= 3
                                  ? 'bg-[#28CF77]'
                                  : passwordStrength.score === 2
                                    ? 'bg-amber-400'
                                    : 'bg-rose-400'
                                : 'bg-white/10'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[11px] text-[#9FB0C9] whitespace-nowrap">
                        {isFa ? passwordStrength.labelFa : passwordStrength.labelEn}
                      </span>
                    </div>
                  )}

                  <button
                    type="submit"
                    data-testid="email-signup-submit-btn"
                    disabled={busyAction !== null}
                    className="glass-cta-emerald w-full min-h-[48px] rounded-xl px-5 py-3 text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {busyAction === 'email' && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>
                      {busyAction === 'email'
                        ? isFa
                          ? 'در حال ایجاد حساب کاربری...'
                          : 'Creating your account...'
                        : isFa
                          ? 'ثبت‌نام و ساخت حساب کاربری'
                          : 'Create Member Account'}
                    </span>
                  </button>
                </form>
              )}

              {/* ==================== METHOD 2: MOBILE PHONE SMS OTP ==================== */}
              {method === 'phone' && !confirmationResult && (
                <form
                  onSubmit={handleSendOtpSubmit}
                  noValidate
                  className="w-full space-y-3.5 text-start"
                >
                  {intent === 'signup' && (
                    <div className="space-y-1.5">
                      <label htmlFor="gw-phone-name" className="block text-xs font-medium text-[#C6D2E3]">
                        {isFa ? 'نام و نام خانوادگی *' : 'Full Name *'}
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-[#7E92B0] absolute top-1/2 -translate-y-1/2 start-3.5 pointer-events-none" />
                        <input
                          id="gw-phone-name"
                          type="text"
                          value={phoneFullName}
                          onChange={(e) => setPhoneFullName(e.target.value)}
                          placeholder={isFa ? 'مثال: سارا محمدی' : 'e.g. Sara Mohammadi'}
                          className={`${gatewayInputClass} ps-10`}
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label htmlFor="gw-phone-number" className="block text-xs font-medium text-[#C6D2E3]">
                      {isFa ? 'شماره تلفن همراه (ارسال کد تأیید پیامکی)' : 'Mobile Phone Number (SMS Verification)'}
                    </label>
                    <div className="relative flex items-center">
                      <span
                        dir="ltr"
                        className="absolute start-3 px-2 py-0.5 rounded-md bg-white/[0.06] border border-white/10 text-[11px] font-mono font-numeric text-[#8AB0FF] pointer-events-none"
                      >
                        +98
                      </span>
                      <input
                        id="gw-phone-number"
                        type="tel"
                        dir="ltr"
                        inputMode="tel"
                        autoComplete="tel"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        placeholder="0915 123 4567"
                        className={`${gatewayInputClass} ps-16 font-numeric`}
                      />
                    </div>
                    <p className="text-[11px] text-[#8B9DB7] leading-relaxed">
                      {isFa
                        ? 'کد تأیید یک‌بارمصرف ۶ رقمی برای این شماره پیامک می‌شود.'
                        : 'A 6-digit one-time verification code will be sent via SMS.'}
                    </p>
                  </div>

                  <button
                    type="submit"
                    data-testid="phone-send-otp-btn"
                    disabled={busyAction !== null}
                    className={`${
                      intent === 'signup' ? 'glass-cta-emerald' : 'glass-cta'
                    } w-full min-h-[48px] rounded-xl px-5 py-3 text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60`}
                  >
                    {busyAction === 'otp-send' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Phone className="w-4 h-4" />
                    )}
                    <span>
                      {busyAction === 'otp-send'
                        ? isFa
                          ? 'در حال ارسال کد پیامکی...'
                          : 'Sending SMS code...'
                        : isFa
                          ? 'دریافت کد تأیید پیامکی'
                          : 'Send SMS Verification Code'}
                    </span>
                  </button>
                </form>
              )}

              {method === 'phone' && confirmationResult && (
                <form
                  onSubmit={handleVerifyOtpSubmit}
                  noValidate
                  className="w-full space-y-3.5 text-start"
                >
                  <div className="rounded-xl border border-[#28CF77]/28 bg-[#00A651]/10 px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs">
                    <span className="text-[#DCE6F5]">
                      {isFa ? 'کد به شماره ارسال شد: ' : 'Code sent to: '}
                      <strong className="ltr-inline font-mono font-numeric text-[#28CF77]">
                        {normalizedPhone}
                      </strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmationResult(null);
                        setOtpCode('');
                        resetMessages();
                      }}
                      className="text-[11px] text-[#8AB0FF] hover:text-white whitespace-nowrap cursor-pointer"
                    >
                      {isFa ? 'تغییر شماره' : 'Change'}
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="gw-otp-code" className="block text-xs font-medium text-[#C6D2E3]">
                      {isFa ? 'کد تأیید ۶ رقمی پیامک‌شده' : '6-Digit SMS Verification Code'}
                    </label>
                    <input
                      id="gw-otp-code"
                      type="text"
                      dir="ltr"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) =>
                        setOtpCode(normalizeDigits(e.target.value).replace(/\D/g, '').slice(0, 6))
                      }
                      placeholder="• • • • • •"
                      className={`${gatewayInputClass} text-center font-mono font-numeric text-lg tracking-[0.45em] py-3`}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2 text-xs">
                    {resendSeconds > 0 ? (
                      <span className="text-[#8B9DB7] font-numeric tabular-nums">
                        {isFa
                          ? `ارسال مجدد کد تا ${resendSeconds} ثانیه دیگر`
                          : `Resend available in ${resendSeconds}s`}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void handleSendOtpSubmit()}
                        disabled={busyAction !== null}
                        className="inline-flex items-center gap-1.5 text-[#8AB0FF] hover:text-white cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>{isFa ? 'ارسال مجدد کد پیامکی' : 'Resend SMS Code'}</span>
                      </button>
                    )}
                  </div>

                  <button
                    type="submit"
                    data-testid="phone-verify-otp-btn"
                    disabled={busyAction !== null || otpCode.length < 6}
                    className="glass-cta-emerald w-full min-h-[48px] rounded-xl px-5 py-3 text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {busyAction === 'otp-verify' && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>
                      {busyAction === 'otp-verify'
                        ? isFa
                          ? 'در حال تأیید کد...'
                          : 'Verifying code...'
                        : intent === 'signup'
                          ? isFa
                            ? 'تأیید شماره و تکمیل ثبت‌نام'
                            : 'Verify & Complete Registration'
                          : isFa
                            ? 'تأیید کد و ورود به پنل'
                            : 'Verify Code & Sign In'}
                    </span>
                  </button>
                </form>
              )}

              {/* ==================== DIVIDER + GOOGLE OAUTH SIGN-IN ==================== */}
              <div className="w-full flex items-center gap-3 pt-1">
                <div className="flex-1 h-px bg-white/12" />
                <span className="text-[11px] text-[#8B9DB7] whitespace-nowrap">
                  {isFa ? 'یا ادامه سریع با حساب گوگل' : 'or continue instantly with'}
                </span>
                <div className="flex-1 h-px bg-white/12" />
              </div>

              <button
                type="button"
                data-testid="google-gateway-signin-btn"
                disabled={busyAction !== null}
                onClick={handleGoogleClick}
                className="group relative w-full min-h-[50px] rounded-2xl px-6 py-3 inline-flex items-center justify-center gap-3 text-sm font-semibold rtl:font-bold text-[#0A101E] bg-[#F5F8FC] hover:bg-white border border-white/80 shadow-[0_12px_32px_-14px_rgba(111,155,255,0.6),inset_0_1px_0_rgba(255,255,255,1)] hover:shadow-[0_16px_42px_-12px_rgba(40,207,119,0.5)] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-65 disabled:cursor-wait"
              >
                {busyAction === 'google' ? (
                  <Loader2 className="w-5 h-5 text-[#223A87] animate-spin" />
                ) : (
                  <GoogleBrandMark className="w-5 h-5 shrink-0" />
                )}
                <span>
                  {busyAction === 'google'
                    ? isFa
                      ? 'در حال اتصال امن به گوگل...'
                      : 'Connecting securely to Google...'
                    : intent === 'signup'
                      ? isFa
                        ? 'ثبت‌نام سریع با حساب گوگل (Gmail)'
                        : 'Sign Up Instantly with Google'
                      : isFa
                        ? 'ورود سریع با حساب گوگل (Gmail)'
                        : 'Continue Securely with Google'}
                </span>
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#8B9DB7] leading-relaxed text-center">
                <ShieldCheck className="w-3.5 h-3.5 text-[#28CF77] shrink-0" />
                <span>
                  {isFa
                    ? 'رمزنگاری کامل اطلاعات کاربری · اتصال امن به پنل دوره‌ها و تیکت‌ها'
                    : 'Encrypted member sessions · Unified access to courses & support'}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Three Calibrated Architectural Capability Medallions */}
        <motion.div
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.12, ease: ARCHITECTURAL_EASE }}
          className="w-full max-w-[780px] space-y-4"
        >
          <div aria-hidden="true" className="flex items-center justify-between px-1 opacity-40">
            {Array.from({ length: 25 }).map((_, idx) => (
              <span
                key={idx}
                className={`w-px rounded-full ${
                  idx % 6 === 0 ? 'h-2 bg-[#6F9BFF]' : 'h-1 bg-white/55'
                }`}
              />
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {capabilities.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.code}
                  className="relative rounded-2xl p-4 bg-gradient-to-b from-[#223A87]/[0.18] to-white/[0.02] border border-[#6F9BFF]/22 shadow-[inset_0_1px_0_rgba(214,230,255,0.14)] flex flex-col gap-2.5 overflow-hidden"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="ltr-inline text-[11px] font-mono font-numeric font-medium"
                      style={{ color: item.accent }}
                    >
                      {item.code}
                    </span>
                    <div className="flex-1 h-[1.5px] rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full w-full"
                        style={{
                          background: `linear-gradient(90deg, ${item.accent} 0%, transparent 100%)`,
                          opacity: 0.65,
                        }}
                      />
                    </div>
                    <Icon className="w-4 h-4 shrink-0" style={{ color: item.accent }} />
                  </div>

                  <div className="space-y-1">
                    <h2 className="text-xs sm:text-[13.5px] font-semibold text-[#F5F8FC]">
                      {item.title}
                    </h2>
                    <p className="text-[11.5px] text-[#9FB0C9] leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Quiet Editorial Footer Anchor */}
      <div className="relative z-10 max-w-[1380px] w-full mx-auto px-6 sm:px-11 lg:px-14 pb-6 sm:pb-8 flex items-center justify-center">
        <p className="text-[11px] rtl:text-xs text-[#8B9DB7]/85 text-center">
          {isFa
            ? 'گروه ساختمانی پایدار ایران زمین · در تلاقی معماری، اقلیم و مهندسی پایدار'
            : 'Iran Zamin Sustainable Building Group · Where Climate Meets Sustainable Engineering'}
        </p>
      </div>
    </section>
  );
}
