import React, { useEffect, useRef, useState } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Loader2,
  Mail,
  MessageSquareReply,
  ShieldCheck,
  User,
} from './icons/IsbIcons';
import { DISCIPLINES } from '../data/seedContent';
import { getCopy } from '../data/translations';
import { fetchMyProfile, signInMemberWithGoogle } from '../services/accountStore';
import { submitAssessmentRequest, submitProjectInquiry } from '../services/contentStore';
import type {
  AssessmentFormInput,
  DisciplineSlug,
  InquiryFormInput,
  Locale,
  PageRoute,
  ProjectStage,
} from '../types/content';
import { mapMemberAuthError } from '../utils/accountLogic';
import {
  hasErrors,
  validateAssessmentForm,
  validateInquiryForm,
  type FieldErrors,
} from '../utils/validation';

const inputBaseClass =
  'glass-input w-full min-h-[44px] rounded-xl px-3.5 py-2 sm:px-4 sm:py-2.5 text-[13.5px] sm:text-sm text-[#F5F8FC] placeholder:text-[#8B9DB7]/75 focus:outline-none transition-all';

function GoogleBrandMark({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.54 5.54 0 0 1-2.4 3.63v3.01h3.88c2.27-2.09 3.54-5.17 3.54-8.88z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.07 7.94-2.91l-3.88-3.01c-1.07.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.72-4.95H1.28v3.1A12 12 0 0 0 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.28A7.2 7.2 0 0 1 4.9 12c0-.79.14-1.56.38-2.28v-3.1H1.28a12 12 0 0 0 0 10.76l4-3.1z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.34.61 4.58 1.79l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.28 6.62l4 3.1c.95-2.84 3.6-4.95 6.72-4.95z"
      />
    </svg>
  );
}

function getFirebaseErrorCode(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code?: unknown }).code;
    return typeof code === 'string' ? code : undefined;
  }
  return undefined;
}

interface FormAuthGateProps {
  locale: Locale;
  variant: 'inquiry' | 'assessment';
  onNavigate?: (route: PageRoute) => void;
}

function FormAuthGate({ locale, variant, onNavigate }: FormAuthGateProps) {
  const isFa = locale === 'fa';
  const isLab = variant === 'assessment';
  const [signingIn, setSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const ArrowIcon = isFa ? ArrowLeft : ArrowRight;

  const handleInlineGoogleSignIn = async () => {
    if (signingIn) return;
    setSigningIn(true);
    setAuthError(null);
    try {
      await signInMemberWithGoogle(locale);
    } catch (error) {
      setAuthError(mapMemberAuthError(getFirebaseErrorCode(error), locale));
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div
      data-testid={isLab ? 'assessment-auth-gate' : 'inquiry-auth-gate'}
      className={`relative overflow-hidden rounded-2xl border p-4 sm:p-8 space-y-4 sm:space-y-6 ${
        isLab
          ? 'border-[#28CF77]/30 bg-[#08131A]/90'
          : 'border-[#6F9BFF]/28 bg-[#091222]/90'
      }`}
    >
      {/* Subtle architectural corner reticle */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute -top-24 -end-24 w-64 h-64 rounded-full blur-3xl opacity-25 ${
          isLab ? 'bg-[#00A651]' : 'bg-[#223A87]'
        }`}
      />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
        <div
          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl border flex items-center justify-center shrink-0 ${
            isLab
              ? 'border-[#28CF77]/40 bg-[#00A651]/16 text-[#28CF77]'
              : 'border-[#6F9BFF]/40 bg-[#223A87]/35 text-[#8AB0FF]'
          }`}
        >
          <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>

        <div className="space-y-1.5 sm:space-y-2 max-w-2xl">
          <p
            className={`text-[10.5px] sm:text-[11px] rtl:text-[11px] sm:rtl:text-xs font-medium uppercase tracking-[0.18em] rtl:tracking-normal ${
              isLab ? 'text-[#28CF77]' : 'text-[#6F9BFF]'
            }`}
          >
            {isFa
              ? 'ورود به حساب کاربری برای ثبت درخواست و دریافت پاسخ پشتیبانی'
              : 'Member Sign-In Required for Engineering Response Delivery'}
          </p>
          <h3 className="text-[16px] sm:text-xl font-semibold rtl:font-bold text-[#F5F8FC] leading-snug">
            {isLab
              ? isFa
                ? 'برای ثبت درخواست ارزیابی پایداری، وارد حساب کاربری خود شوید'
                : 'Sign in to submit a Sustainability Lab assessment'
              : isFa
                ? 'برای ثبت درخواست پروژه و دریافت پاسخ مهندسین، وارد حساب شوید'
                : 'Sign in to submit your project inquiry'}
          </h3>
          <p className="text-[12.5px] sm:text-sm text-[#C6D2E3] leading-relaxed rtl:leading-[1.8] sm:rtl:leading-[1.85]">
            {isLab
              ? isFa
                ? 'با ورود از طریق حساب گوگل، ایمیل و رمز عبور یا شماره همراه (پیامک)، درخواست ارزیابی به حساب شخصی شما متصل می‌شود تا وضعیت بررسی و پاسخ کارشناسان را مستقیم در پنل کاربری دریافت کنید.'
                : 'Sign in via Google, email & password, or mobile SMS to link your submission and receive official Sustainability Lab responses directly inside your Member Portal.'
              : isFa
                ? 'ثبت درخواست با حساب کاربری (گوگل، ایمیل یا شماره همراه) باعث می‌شود تمام مکاتبات، وضعیت بررسی پروژه و پاسخ مستقیم تیم مهندسی گروه ISB در پنل کاربری شما ذخیره و قابل پیگیری باشد.'
                : 'Signing in with Google, email & password, or mobile SMS links your brief to your personal portal so you can track review progress and receive official responses from ISB Group engineers.'}
          </p>
        </div>
      </div>

      {/* Unboxed architectural highlights strip */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4 border-y border-white/10 py-3 sm:py-4 text-[11.5px] sm:text-xs text-[#C6D2E3]">
        <div className="flex items-start gap-2.5">
          <MessageSquareReply
            className={`w-4 h-4 mt-0.5 shrink-0 ${isLab ? 'text-[#28CF77]' : 'text-[#6F9BFF]'}`}
          />
          <span>
            {isFa
              ? 'دریافت مستقیم پاسخ پشتیبانی و تیم فنی در پنل کاربری'
              : 'Direct engineering responses delivered in your Member Portal'}
          </span>
        </div>
        <div className="flex items-start gap-2.5">
          <Mail
            className={`w-4 h-4 mt-0.5 shrink-0 ${isLab ? 'text-[#28CF77]' : 'text-[#6F9BFF]'}`}
          />
          <span>
            {isFa
              ? 'تأیید آنی جیمیل و تکمیل خودکار اطلاعات تماس از پروفایل'
              : 'Verified Gmail identity with automatic contact prefill'}
          </span>
        </div>
        <div className="flex items-start gap-2.5">
          <User
            className={`w-4 h-4 mt-0.5 shrink-0 ${isLab ? 'text-[#28CF77]' : 'text-[#6F9BFF]'}`}
          />
          <span>
            {isFa
              ? 'آرشیو دائمی درخواست‌ها، سفارش‌ها و تیکت‌های شما در یک جا'
              : 'Unified archive of inquiries, assessments, courses & tickets'}
          </span>
        </div>
      </div>

      {authError && (
        <div
          role="alert"
          className="relative z-10 rounded-xl border border-amber-400/35 bg-amber-500/12 px-4 py-3 text-xs text-amber-200 flex items-start gap-2.5"
        >
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{authError}</span>
        </div>
      )}

      <div className="relative z-10 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3">
        <button
          type="button"
          onClick={() => void handleInlineGoogleSignIn()}
          disabled={signingIn}
          className={`w-full sm:w-auto min-h-[46px] inline-flex items-center justify-center gap-2.5 rounded-xl px-5 sm:px-6 py-2.5 text-[13px] sm:text-sm font-semibold transition-all active:scale-[0.98] cursor-pointer disabled:opacity-60 ${
            isLab ? 'glass-cta-emerald' : 'glass-cta'
          }`}
        >
          {signingIn ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center shrink-0">
              <GoogleBrandMark className="w-3.5 h-3.5" />
            </span>
          )}
          <span>
            {signingIn
              ? isFa
                ? 'در حال اتصال به گوگل...'
                : 'Connecting to Google...'
              : isFa
                ? 'ورود سریع با حساب گوگل (Gmail)'
                : 'Continue with Google Account'}
          </span>
        </button>

        {onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate({ page: 'account' })}
            className="w-full sm:w-auto min-h-[46px] inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.03] px-4 py-2.5 text-xs font-medium text-[#C6D2E3] hover:border-[#6F9BFF]/55 hover:text-white transition-colors active:scale-[0.98] cursor-pointer"
          >
            <span>{isFa ? 'ورود / ثبت‌نام با ایمیل یا پیامک موبایل' : 'Sign In / Up with Email or SMS'}</span>
            <ArrowIcon className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

function VerifiedSenderStrip({
  locale,
  authUser,
  variant,
}: {
  locale: Locale;
  authUser: FirebaseUser;
  variant: 'inquiry' | 'assessment';
}) {
  const isFa = locale === 'fa';
  const isLab = variant === 'assessment';

  return (
    <div
      className={`rounded-xl border px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs ${
        isLab
          ? 'border-[#28CF77]/30 bg-[#00A651]/10 text-[#DCE6F5]'
          : 'border-[#6F9BFF]/28 bg-[#223A87]/20 text-[#DCE6F5]'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {authUser.photoURL ? (
          <img
            src={authUser.photoURL}
            alt={authUser.displayName || 'Member'}
            referrerPolicy="no-referrer"
            className="w-7 h-7 rounded-full object-cover border border-white/20 shrink-0"
          />
        ) : (
          <span className="w-7 h-7 rounded-full bg-[#223A87] border border-[#6F9BFF]/45 flex items-center justify-center text-[11px] font-bold text-white shrink-0">
            {(authUser.displayName || authUser.email || 'U').slice(0, 1).toUpperCase()}
          </span>
        )}
        <div className="min-w-0">
          <span className="text-[#9FB0C9]">
            {isFa ? 'ارسال با حساب کاربری: ' : 'Submitting as signed-in account: '}
          </span>
          <span className="ltr-inline font-medium text-[#F5F8FC]">
            {authUser.email || authUser.phoneNumber || authUser.displayName || 'ISB Member'}
          </span>
        </div>
      </div>

      <span className="inline-flex items-center gap-1.5 text-[11px] text-[#28CF77]">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
        <span>
          {isFa
            ? 'پاسخ پشتیبانی در پنل کاربری شما ثبت می‌شود'
            : 'Replies delivered to your Member Portal'}
        </span>
      </span>
    </div>
  );
}

interface ProjectInquiryFormProps {
  locale: Locale;
  defaultDiscipline?: DisciplineSlug;
  authUser: FirebaseUser | null;
  onNavigate?: (route: PageRoute) => void;
}

export function ProjectInquiryForm({
  locale,
  defaultDiscipline,
  authUser,
  onNavigate,
}: ProjectInquiryFormProps) {
  const copy = getCopy(locale);
  const isFa = locale === 'fa';
  const ArrowIcon = isFa ? ArrowLeft : ArrowRight;

  const [form, setForm] = useState<InquiryFormInput>({
    fullName: authUser?.displayName ?? '',
    email: authUser?.email ?? '',
    phone: '',
    organization: '',
    projectType: copy.projectTypeOptions[0].id,
    disciplines: defaultDiscipline ? [defaultDiscipline] : ['architecture-urbanism'],
    city: '',
    message: '',
  });
  const [errors, setErrors] = useState<FieldErrors<InquiryFormInput>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const submitLockRef = useRef(false);

  // Sync verified email/phone and prefill member contact details when logged in
  useEffect(() => {
    if (!authUser) return;
    let cancelled = false;
    setForm((prev) => ({
      ...prev,
      email: authUser.email ?? prev.email,
      fullName: prev.fullName || authUser.displayName || '',
      phone: prev.phone || authUser.phoneNumber || '',
    }));
    fetchMyProfile(authUser.uid)
      .then((profile) => {
        if (cancelled || !profile) return;
        setForm((prev) => ({
          ...prev,
          email: authUser.email || profile.email || prev.email,
          fullName: prev.fullName || profile.fullName || authUser.displayName || '',
          phone: prev.phone || profile.phone || authUser.phoneNumber || '',
          organization: prev.organization || profile.organization || '',
          city: prev.city || profile.city || '',
        }));
      })
      .catch(() => {
        // Keep Firebase Auth displayName/email/phone fallback
      });
    return () => {
      cancelled = true;
    };
  }, [authUser]);

  if (!authUser) {
    return <FormAuthGate locale={locale} variant="inquiry" onNavigate={onNavigate} />;
  }

  const toggleDiscipline = (slug: DisciplineSlug) => {
    setForm((prev) => {
      const exists = prev.disciplines.includes(slug);
      const next = exists
        ? prev.disciplines.filter((item) => item !== slug)
        : [...prev.disciplines, slug];
      return { ...prev, disciplines: next };
    });
    setErrors((prev) => ({ ...prev, disciplines: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitLockRef.current || submitting) return;

    const payloadForm: InquiryFormInput = {
      ...form,
      email: authUser.email ?? form.email,
    };

    const validationErrors = validateInquiryForm(payloadForm, locale);
    setErrors(validationErrors);
    setSubmitError(null);
    if (hasErrors(validationErrors)) return;

    submitLockRef.current = true;
    setSubmitting(true);
    try {
      const result = await submitProjectInquiry(payloadForm, locale, authUser.uid);
      setSavedId(result.id);
    } catch {
      setSubmitError(copy.forms.submitError);
    } finally {
      setSubmitting(false);
      submitLockRef.current = false;
    }
  };

  if (savedId) {
    return (
      <div
        role="status"
        className="glass-card-active rounded-2xl p-6 sm:p-8 space-y-4"
      >
        <div className="flex items-center gap-3 text-[#28CF77]">
          <CheckCircle2 className="w-6 h-6 shrink-0" />
          <h3 className="text-lg font-semibold text-[#F5F8FC]">
            {copy.forms.inquirySuccessTitle}
          </h3>
        </div>
        <p className="text-sm text-[#C6D2E3] leading-relaxed">
          {isFa
            ? 'درخواست پروژه شما با موفقیت به حساب گوگل شما متصل و ثبت شد. پاسخ تیم مهندسی ISB پس از بررسی در بخش «درخواست‌ها و ارزیابی‌ها» در پنل کاربری شما نمایش داده می‌شود.'
            : 'Your project inquiry has been linked to your Google account. Once reviewed, ISB Group’s engineering response will appear directly inside your Member Portal.'}
        </p>
        <p className="text-xs text-[#8B9DB7] font-mono ltr-inline">
          {copy.forms.referenceId}: {savedId}
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate({ page: 'account' })}
              className="glass-cta min-h-[42px] inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-semibold cursor-pointer"
            >
              <span>{isFa ? 'پیگیری و مشاهده پاسخ در پنل کاربری' : 'Track Reply in Member Portal'}</span>
              <ArrowIcon className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setSavedId(null);
              setForm((prev) => ({
                ...prev,
                projectType: copy.projectTypeOptions[0].id,
                disciplines: defaultDiscipline ? [defaultDiscipline] : ['architecture-urbanism'],
                message: '',
              }));
            }}
            className="inline-flex items-center rounded-full border border-[#6F9BFF]/35 px-5 py-2 text-xs font-medium text-[#F5F8FC] hover:border-[#6F9BFF] transition-colors cursor-pointer"
          >
            {copy.forms.sendAnother}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <VerifiedSenderStrip locale={locale} authUser={authUser} variant="inquiry" />

      {submitError && (
        <div
          role="alert"
          className="rounded-xl border border-red-400/35 bg-red-950/35 px-4 py-3 text-sm text-red-200 flex items-start gap-2.5"
        >
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="inq-name" className="block text-xs font-medium text-[#C6D2E3]">
            {copy.forms.fullName} *
          </label>
          <input
            id="inq-name"
            type="text"
            value={form.fullName}
            onChange={(e) => {
              setForm({ ...form, fullName: e.target.value });
              setErrors((prev) => ({ ...prev, fullName: undefined }));
            }}
            placeholder={copy.forms.fullNamePlaceholder}
            aria-invalid={Boolean(errors.fullName)}
            className={inputBaseClass}
          />
          {errors.fullName && <p className="text-xs text-amber-300">{errors.fullName}</p>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="inq-email" className="block text-xs font-medium text-[#C6D2E3]">
            {authUser.email
              ? isFa
                ? 'ایمیل حساب کاربری *'
                : 'Account Email *'
              : `${copy.forms.email} *`}
          </label>
          {authUser.email ? (
            <input
              id="inq-email"
              type="email"
              dir="ltr"
              readOnly
              value={authUser.email}
              className="w-full min-h-[44px] rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2 sm:px-4 sm:py-2.5 text-[13.5px] sm:text-sm text-[#9FB0C9] cursor-not-allowed"
            />
          ) : (
            <>
              <input
                id="inq-email"
                type="email"
                dir="ltr"
                value={form.email}
                onChange={(e) => {
                  setForm({ ...form, email: e.target.value });
                  setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                placeholder={copy.forms.emailPlaceholder}
                aria-invalid={Boolean(errors.email)}
                className={inputBaseClass}
              />
              {errors.email && <p className="text-xs text-amber-300">{errors.email}</p>}
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="inq-phone" className="block text-xs font-medium text-[#C6D2E3]">
            {copy.forms.phone}
          </label>
          <input
            id="inq-phone"
            type="tel"
            dir="ltr"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder={copy.forms.phonePlaceholder}
            className={inputBaseClass}
          />
          {errors.phone && <p className="text-xs text-amber-300">{errors.phone}</p>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="inq-org" className="block text-xs font-medium text-[#C6D2E3]">
            {copy.forms.organization}
          </label>
          <input
            id="inq-org"
            type="text"
            value={form.organization}
            onChange={(e) => setForm({ ...form, organization: e.target.value })}
            placeholder={copy.forms.organizationPlaceholder}
            className={inputBaseClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="inq-type" className="block text-xs font-medium text-[#C6D2E3]">
            {copy.forms.projectType} *
          </label>
          <select
            id="inq-type"
            value={form.projectType}
            onChange={(e) => setForm({ ...form, projectType: e.target.value })}
            className={inputBaseClass}
          >
            {copy.projectTypeOptions.map((opt) => (
              <option key={opt.id} value={opt.id} className="bg-[#0E1626] text-[#F5F8FC]">
                {opt.label}
              </option>
            ))}
          </select>
          {errors.projectType && <p className="text-xs text-amber-300">{errors.projectType}</p>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="inq-city" className="block text-xs font-medium text-[#C6D2E3]">
            {copy.forms.city}
          </label>
          <input
            id="inq-city"
            type="text"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            placeholder={copy.forms.cityPlaceholder}
            className={inputBaseClass}
          />
        </div>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-xs font-medium text-[#C6D2E3]">
          {copy.contactPage.disciplinesPrompt} *
        </legend>
        <div className="flex flex-wrap gap-2">
          {DISCIPLINES.map((disc) => {
            const active = form.disciplines.includes(disc.slug);
            return (
              <button
                key={disc.slug}
                type="button"
                aria-pressed={active}
                onClick={() => toggleDiscipline(disc.slug)}
                className={`min-h-[40px] rounded-xl px-3.5 py-2 text-xs font-medium transition-all active:scale-[0.98] cursor-pointer ${
                  active
                    ? 'glass-card-active text-[#F5F8FC]'
                    : 'glass-input text-[#C6D2E3] hover:border-[#6F9BFF]/45'
                }`}
              >
                {disc.title[locale]}
              </button>
            );
          })}
        </div>
        {errors.disciplines && <p className="text-xs text-amber-300">{errors.disciplines}</p>}
      </fieldset>

      <div className="space-y-1.5">
        <label htmlFor="inq-message" className="block text-xs font-medium text-[#C6D2E3]">
          {copy.forms.message} *
        </label>
        <textarea
          id="inq-message"
          rows={5}
          value={form.message}
          onChange={(e) => {
            setForm({ ...form, message: e.target.value });
            setErrors((prev) => ({ ...prev, message: undefined }));
          }}
          placeholder={copy.forms.messagePlaceholder}
          aria-invalid={Boolean(errors.message)}
          className={inputBaseClass}
        />
        {errors.message && <p className="text-xs text-amber-300">{errors.message}</p>}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="glass-cta w-full sm:w-auto min-h-[46px] inline-flex items-center justify-center rounded-full px-7 py-3 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] cursor-pointer"
      >
        {submitting ? copy.forms.submitting : copy.forms.submitInquiry}
      </button>
    </form>
  );
}

interface SustainabilityAssessmentFormProps {
  locale: Locale;
  authUser: FirebaseUser | null;
  onNavigate?: (route: PageRoute) => void;
}

export function SustainabilityAssessmentForm({
  locale,
  authUser,
  onNavigate,
}: SustainabilityAssessmentFormProps) {
  const copy = getCopy(locale);
  const isFa = locale === 'fa';
  const ArrowIcon = isFa ? ArrowLeft : ArrowRight;

  const [form, setForm] = useState<AssessmentFormInput>({
    fullName: authUser?.displayName ?? '',
    email: authUser?.email ?? '',
    phone: '',
    organization: '',
    projectType: copy.projectTypeOptions[0].id,
    city: '',
    approximateFloorAreaSqm: '',
    projectStage: 'schematic',
    assessmentGoals: ['daylight', 'energy-eui'],
    notes: '',
  });
  const [errors, setErrors] = useState<FieldErrors<AssessmentFormInput>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const submitLockRef = useRef(false);

  useEffect(() => {
    if (!authUser) return;
    let cancelled = false;
    setForm((prev) => ({
      ...prev,
      email: authUser.email ?? prev.email,
      fullName: prev.fullName || authUser.displayName || '',
      phone: prev.phone || authUser.phoneNumber || '',
    }));
    fetchMyProfile(authUser.uid)
      .then((profile) => {
        if (cancelled || !profile) return;
        setForm((prev) => ({
          ...prev,
          email: authUser.email || profile.email || prev.email,
          fullName: prev.fullName || profile.fullName || authUser.displayName || '',
          phone: prev.phone || profile.phone || authUser.phoneNumber || '',
          organization: prev.organization || profile.organization || '',
          city: prev.city || profile.city || '',
        }));
      })
      .catch(() => {
        // Keep Firebase Auth displayName/email/phone fallback
      });
    return () => {
      cancelled = true;
    };
  }, [authUser]);

  if (!authUser) {
    return <FormAuthGate locale={locale} variant="assessment" onNavigate={onNavigate} />;
  }

  const toggleGoal = (goalId: string) => {
    setForm((prev) => {
      const exists = prev.assessmentGoals.includes(goalId);
      const next = exists
        ? prev.assessmentGoals.filter((g) => g !== goalId)
        : [...prev.assessmentGoals, goalId];
      return { ...prev, assessmentGoals: next };
    });
    setErrors((prev) => ({ ...prev, assessmentGoals: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitLockRef.current || submitting) return;

    const payloadForm: AssessmentFormInput = {
      ...form,
      email: authUser.email ?? form.email,
    };

    const validationErrors = validateAssessmentForm(payloadForm, locale);
    setErrors(validationErrors);
    setSubmitError(null);
    if (hasErrors(validationErrors)) return;

    submitLockRef.current = true;
    setSubmitting(true);
    try {
      const result = await submitAssessmentRequest(payloadForm, locale, authUser.uid);
      setSavedId(result.id);
    } catch {
      setSubmitError(copy.forms.submitError);
    } finally {
      setSubmitting(false);
      submitLockRef.current = false;
    }
  };

  if (savedId) {
    return (
      <div
        role="status"
        className="glass-card-active rounded-2xl p-6 sm:p-8 space-y-4"
      >
        <div className="flex items-center gap-3 text-[#28CF77]">
          <CheckCircle2 className="w-6 h-6 shrink-0" />
          <h3 className="text-lg font-semibold text-[#F5F8FC]">
            {copy.forms.assessmentSuccessTitle}
          </h3>
        </div>
        <p className="text-sm text-[#C6D2E3] leading-relaxed">
          {isFa
            ? 'درخواست ارزیابی پایداری پروژه شما در آزمایشگاه پایداری ISB ثبت و به حساب کاربری شما متصل شد. وضعیت بررسی و پاسخ رسمی تیم مهندسی انرژی در پنل کاربری شما نمایش داده خواهد شد.'
            : 'Your Sustainability Lab assessment request has been registered to your account. Review status and official engineering responses will appear inside your Member Portal.'}
        </p>
        <p className="text-xs text-[#8B9DB7] font-mono ltr-inline">
          {copy.forms.referenceId}: {savedId}
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate({ page: 'account' })}
              className="glass-cta-emerald min-h-[42px] inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-semibold cursor-pointer"
            >
              <span>{isFa ? 'پیگیری و مشاهده پاسخ در پنل کاربری' : 'Track Reply in Member Portal'}</span>
              <ArrowIcon className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setSavedId(null);
              setForm((prev) => ({
                ...prev,
                projectType: copy.projectTypeOptions[0].id,
                approximateFloorAreaSqm: '',
                projectStage: 'schematic',
                assessmentGoals: ['daylight', 'energy-eui'],
                notes: '',
              }));
            }}
            className="inline-flex items-center rounded-full border border-[#28CF77]/45 px-5 py-2 text-xs font-medium text-[#F5F8FC] hover:border-[#28CF77] transition-colors cursor-pointer"
          >
            {copy.forms.sendAnother}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <VerifiedSenderStrip locale={locale} authUser={authUser} variant="assessment" />

      {submitError && (
        <div
          role="alert"
          className="rounded-xl border border-red-400/35 bg-red-950/35 px-4 py-3 text-sm text-red-200 flex items-start gap-2.5"
        >
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="asr-type" className="block text-xs font-medium text-[#C6D2E3]">
            {copy.forms.projectType} *
          </label>
          <select
            id="asr-type"
            value={form.projectType}
            onChange={(e) => setForm({ ...form, projectType: e.target.value })}
            className={inputBaseClass}
          >
            {copy.projectTypeOptions.map((opt) => (
              <option key={opt.id} value={opt.id} className="bg-[#0E1626] text-[#F5F8FC]">
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="asr-city" className="block text-xs font-medium text-[#C6D2E3]">
            {copy.forms.city} *
          </label>
          <input
            id="asr-city"
            type="text"
            value={form.city}
            onChange={(e) => {
              setForm({ ...form, city: e.target.value });
              setErrors((prev) => ({ ...prev, city: undefined }));
            }}
            placeholder={copy.forms.cityPlaceholder}
            aria-invalid={Boolean(errors.city)}
            className={inputBaseClass}
          />
          {errors.city && <p className="text-xs text-amber-300">{errors.city}</p>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="asr-area" className="block text-xs font-medium text-[#C6D2E3]">
            {copy.forms.floorArea} *
          </label>
          <input
            id="asr-area"
            type="text"
            inputMode="numeric"
            dir="ltr"
            value={form.approximateFloorAreaSqm}
            onChange={(e) => {
              const cleaned = e.target.value.replace(/[^\d۰-۹٠-٩,\s٬]/g, '');
              setForm({ ...form, approximateFloorAreaSqm: cleaned });
              setErrors((prev) => ({ ...prev, approximateFloorAreaSqm: undefined }));
            }}
            placeholder={copy.forms.floorAreaPlaceholder}
            aria-invalid={Boolean(errors.approximateFloorAreaSqm)}
            className={`${inputBaseClass} font-numeric`}
          />
          {errors.approximateFloorAreaSqm && (
            <p className="text-xs text-amber-300">{errors.approximateFloorAreaSqm}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="asr-stage" className="block text-xs font-medium text-[#C6D2E3]">
            {copy.forms.projectStage} *
          </label>
          <select
            id="asr-stage"
            value={form.projectStage}
            onChange={(e) =>
              setForm({ ...form, projectStage: e.target.value as ProjectStage })
            }
            className={inputBaseClass}
          >
            {(Object.keys(copy.stages) as ProjectStage[]).map((stageKey) => (
              <option key={stageKey} value={stageKey} className="bg-[#0E1626] text-[#F5F8FC]">
                {copy.stages[stageKey]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-xs font-medium text-[#C6D2E3]">
          {copy.forms.assessmentGoals} *
        </legend>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {copy.assessmentGoalOptions.map((goal) => {
            const active = form.assessmentGoals.includes(goal.id);
            return (
              <button
                key={goal.id}
                type="button"
                aria-pressed={active}
                onClick={() => toggleGoal(goal.id)}
                className={`min-h-[44px] sm:min-h-[42px] inline-flex items-center justify-between gap-1.5 text-start rounded-xl px-2.5 sm:px-3 py-2 text-xs font-medium whitespace-nowrap transition-all active:scale-[0.98] cursor-pointer ${
                  active
                    ? 'border border-[#28CF77]/60 bg-[#00A651]/18 text-[#F5F8FC]'
                    : 'glass-input text-[#C6D2E3] hover:border-[#28CF77]/45'
                }`}
              >
                <span className="truncate">{goal.label}</span>
                {active && <Check className="w-3.5 h-3.5 text-[#28CF77] shrink-0" />}
              </button>
            );
          })}
        </div>

        {form.assessmentGoals.length > 0 && (
          <div
            data-testid="selected-goals-brief"
            className="rounded-xl border border-[#28CF77]/22 bg-[#08131A]/80 px-4 py-3 space-y-2"
          >
            {copy.assessmentGoalOptions
              .filter((goal) => form.assessmentGoals.includes(goal.id))
              .map((goal) => (
                <div
                  key={goal.id}
                  className="flex flex-col sm:flex-row sm:items-baseline gap-x-2 gap-y-0.5 text-xs leading-relaxed"
                >
                  <span className="font-semibold text-[#28CF77] shrink-0">
                    {goal.label}:
                  </span>
                  <span className="text-[#C6D2E3]">{goal.brief}</span>
                </div>
              ))}
          </div>
        )}

        {errors.assessmentGoals && (
          <p className="text-xs text-amber-300">{errors.assessmentGoals}</p>
        )}
      </fieldset>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-white/10">
        <div className="space-y-1.5">
          <label htmlFor="asr-name" className="block text-xs font-medium text-[#C6D2E3]">
            {copy.forms.fullName} *
          </label>
          <input
            id="asr-name"
            type="text"
            value={form.fullName}
            onChange={(e) => {
              setForm({ ...form, fullName: e.target.value });
              setErrors((prev) => ({ ...prev, fullName: undefined }));
            }}
            placeholder={copy.forms.fullNamePlaceholder}
            aria-invalid={Boolean(errors.fullName)}
            className={inputBaseClass}
          />
          {errors.fullName && <p className="text-xs text-amber-300">{errors.fullName}</p>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="asr-email" className="block text-xs font-medium text-[#C6D2E3]">
            {authUser.email
              ? isFa
                ? 'ایمیل حساب کاربری *'
                : 'Account Email *'
              : `${copy.forms.email} *`}
          </label>
          {authUser.email ? (
            <input
              id="asr-email"
              type="email"
              dir="ltr"
              readOnly
              value={authUser.email}
              className="w-full min-h-[44px] rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2 sm:px-4 sm:py-2.5 text-[13.5px] sm:text-sm text-[#9FB0C9] cursor-not-allowed"
            />
          ) : (
            <>
              <input
                id="asr-email"
                type="email"
                dir="ltr"
                value={form.email}
                onChange={(e) => {
                  setForm({ ...form, email: e.target.value });
                  setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                placeholder={copy.forms.emailPlaceholder}
                aria-invalid={Boolean(errors.email)}
                className={inputBaseClass}
              />
              {errors.email && <p className="text-xs text-amber-300">{errors.email}</p>}
            </>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="asr-phone" className="block text-xs font-medium text-[#C6D2E3]">
            {copy.forms.phone}
          </label>
          <input
            id="asr-phone"
            type="tel"
            dir="ltr"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder={copy.forms.phonePlaceholder}
            className={inputBaseClass}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="asr-org" className="block text-xs font-medium text-[#C6D2E3]">
            {copy.forms.organization}
          </label>
          <input
            id="asr-org"
            type="text"
            value={form.organization}
            onChange={(e) => setForm({ ...form, organization: e.target.value })}
            placeholder={copy.forms.organizationPlaceholder}
            className={inputBaseClass}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="asr-notes" className="block text-xs font-medium text-[#C6D2E3]">
          {copy.forms.notes}
        </label>
        <textarea
          id="asr-notes"
          rows={3}
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder={copy.forms.notesPlaceholder}
          className={inputBaseClass}
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="glass-cta-emerald w-full sm:w-auto min-h-[46px] inline-flex items-center justify-center rounded-full px-7 py-3 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] cursor-pointer"
      >
        {submitting ? copy.forms.submitting : copy.forms.submitAssessment}
      </button>
    </form>
  );
}
