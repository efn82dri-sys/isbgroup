import React, { useEffect, useRef, useState } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Loader2,
  ShieldCheck,
  ShoppingBag,
  X,
} from './icons/IsbIcons';
import { SafeImage } from './BrandMark';
import {
  createMemberCourseOrder,
  fetchMyProfile,
  signInMemberWithGoogle,
  submitMemberOrderPaymentRef,
  syncMemberProfileOnLogin,
} from '../services/accountStore';
import type {
  Course,
  Locale,
  MemberCheckoutInput,
  PageRoute,
  SiteSettings,
  UserOrder,
  UserProfile,
} from '../types/content';
import {
  COURSE_DEPARTMENT_LABELS,
  COURSE_FORMAT_LABELS,
  formatTomanAmount,
  mapMemberAuthError,
  validateMemberCheckoutForm,
  validatePaymentRefInput,
} from '../utils/accountLogic';
import { hasErrors, isSafeExternalUrl, type FieldErrors } from '../utils/validation';

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

interface CourseCheckoutModalProps {
  course: Course | null;
  locale: Locale;
  authUser: FirebaseUser | null;
  settings: SiteSettings;
  onClose: () => void;
  onNavigate: (route: PageRoute) => void;
}

export function CourseCheckoutModal({
  course,
  locale,
  authUser,
  settings,
  onClose,
  onNavigate,
}: CourseCheckoutModalProps) {
  const isFa = locale === 'fa';
  const ArrowIcon = isFa ? ArrowLeft : ArrowRight;

  const [signingIn, setSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const [form, setForm] = useState<MemberCheckoutInput>({
    fullName: '',
    phone: '',
    city: '',
    nationalId: '',
    organization: '',
    notes: '',
  });
  const [errors, setErrors] = useState<FieldErrors<MemberCheckoutInput>>({});
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  const [createdOrder, setCreatedOrder] = useState<UserOrder | null>(null);
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentRefError, setPaymentRefError] = useState<string | null>(null);
  const [submittingRef, setSubmittingRef] = useState(false);
  const [refSubmitted, setRefSubmitted] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!course) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [course, onClose]);

  // Reset modal flow whenever selected course changes
  useEffect(() => {
    setCreatedOrder(null);
    setOrderError(null);
    setAuthError(null);
    setErrors({});
    setPaymentRef('');
    setPaymentRefError(null);
    setRefSubmitted(false);
  }, [course?.id]);

  // Load member profile once signed in
  useEffect(() => {
    if (!course || !authUser) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    setLoadingProfile(true);
    fetchMyProfile(authUser.uid)
      .then(async (fetched) => {
        const activeProfile = fetched ?? (await syncMemberProfileOnLogin(authUser, locale));
        if (cancelled) return;
        setProfile(activeProfile);
        setForm({
          fullName: activeProfile.fullName || authUser.displayName || '',
          phone: activeProfile.phone || authUser.phoneNumber || '',
          city: activeProfile.city || '',
          nationalId: activeProfile.nationalId || '',
          organization: activeProfile.organization || '',
          notes: '',
        });
      })
      .catch(() => {
        if (!cancelled) {
          setForm((prev) => ({
            ...prev,
            fullName: prev.fullName || authUser.displayName || '',
            phone: prev.phone || authUser.phoneNumber || '',
          }));
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingProfile(false);
      });
    return () => {
      cancelled = true;
    };
  }, [course, authUser, locale]);

  if (!course) return null;

  const isFree = course.priceToman === 0;
  const hasGatewayUrl = Boolean(course.paymentUrl && isSafeExternalUrl(course.paymentUrl));
  const paymentNote =
    (isFa ? course.paymentNoteFa : course.paymentNoteEn)?.trim() ||
    (isFa ? settings.paymentInstructionsFa : settings.paymentInstructionsEn)?.trim() ||
    '';

  const handleGoogleSignIn = async () => {
    if (signingIn) return;
    setSigningIn(true);
    setAuthError(null);
    try {
      await signInMemberWithGoogle(locale);
    } catch (err) {
      setAuthError(mapMemberAuthError(getFirebaseErrorCode(err), locale));
    } finally {
      setSigningIn(false);
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser || creatingOrder) return;

    const validationErrors = validateMemberCheckoutForm(form, locale);
    setErrors(validationErrors);
    setOrderError(null);
    if (hasErrors(validationErrors)) return;

    setCreatingOrder(true);
    try {
      const activeProfile = profile ?? (await syncMemberProfileOnLogin(authUser, locale));
      const order = await createMemberCourseOrder(activeProfile, course, form);
      setCreatedOrder(order);
    } catch {
      setOrderError(
        isFa
          ? 'ثبت سفارش با خطا مواجه شد. لطفاً اتصال اینترنت را بررسی کرده و دوباره تلاش کنید.'
          : 'Could not create enrollment order. Please check your connection and try again.'
      );
    } finally {
      setCreatingOrder(false);
    }
  };

  const handleSubmitPaymentRef = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createdOrder || submittingRef) return;
    const err = validatePaymentRefInput(paymentRef, locale);
    setPaymentRefError(err);
    if (err) return;

    setSubmittingRef(true);
    try {
      await submitMemberOrderPaymentRef(
        createdOrder.id,
        paymentRef,
        hasGatewayUrl ? 'online-gateway' : 'bank-transfer'
      );
      setCreatedOrder({ ...createdOrder, paymentRef: paymentRef.trim() });
      setRefSubmitted(true);
    } catch {
      setPaymentRefError(
        isFa
          ? 'ذخیره کد پیگیری ناموفق بود. می‌توانید از بخش سفارش‌ها در پنل کاربری مجدداً ثبت کنید.'
          : 'Could not save reference. You can submit it anytime from your Member Portal.'
      );
    } finally {
      setSubmittingRef(false);
    }
  };

  const inputClass =
    'w-full rounded-xl border border-[#6F9BFF]/25 bg-[#070B14]/85 px-3.5 py-2.5 text-sm text-[#F5F8FC] placeholder:text-[#8B9DB7]/70 focus:outline-none focus:border-[#6F9BFF]';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="course-checkout-title"
      data-testid="course-checkout-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#040811]/82 backdrop-blur-md overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="relative w-full max-w-2xl rounded-3xl border border-[#6F9BFF]/28 bg-[#0B1322] shadow-[0_30px_90px_rgba(0,0,0,0.7)] overflow-hidden my-auto"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 sm:px-7 py-4 bg-[#080F1C]">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-8 h-8 rounded-xl border border-[#28CF77]/35 bg-[#00A651]/16 flex items-center justify-center text-[#28CF77] shrink-0">
              <ShoppingBag className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <h2
                id="course-checkout-title"
                className="text-sm sm:text-base font-semibold text-[#F5F8FC] truncate"
              >
                {createdOrder
                  ? isFa
                    ? 'تکمیل پرداخت و ثبت‌نام دوره'
                    : 'Complete Payment & Enrollment'
                  : isFa
                    ? 'ثبت‌نام مستقیم و پرداخت دوره'
                    : 'Direct Course Enrollment & Checkout'}
              </h2>
              <p className="text-[11px] text-[#8B9DB7]">
                {isFa
                  ? 'آکادمی گروه ساختمانی پایدار ایران زمین (ISB)'
                  : 'ISB Group Technical Academy'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={isFa ? 'بستن پنجره' : 'Close dialog'}
            className="w-9 h-9 rounded-xl border border-white/12 bg-white/[0.04] flex items-center justify-center text-[#C6D2E3] hover:text-white hover:border-[#6F9BFF]/50 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selected Course Summary Strip */}
        <div className="px-5 sm:px-7 py-4 bg-[#0D1729]/85 border-b border-white/10 flex items-center gap-4">
          <div className="w-16 h-16 sm:w-20 sm:h-16 rounded-xl overflow-hidden border border-white/12 shrink-0 bg-[#080D16]">
            <SafeImage
              src={course.coverImage}
              alt={isFa ? course.titleFa : course.titleEn}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-[11px] text-[#8AB0FF] truncate">
              {isFa
                ? `${COURSE_DEPARTMENT_LABELS[course.department].fa} · ${COURSE_FORMAT_LABELS[course.format].fa}`
                : `${COURSE_DEPARTMENT_LABELS[course.department].en} · ${COURSE_FORMAT_LABELS[course.format].en}`}
            </p>
            <h3 className="text-sm font-semibold text-[#F5F8FC] line-clamp-2 leading-snug">
              {isFa ? course.titleFa : course.titleEn}
            </h3>
            <p className="text-[11.5px] text-[#9FB0C9] truncate">
              {isFa ? course.instructorFa : course.instructorEn} ·{' '}
              {isFa ? course.durationFa : course.durationEn}
            </p>
          </div>

          <div className="text-end shrink-0">
            {course.originalPriceToman && course.originalPriceToman > course.priceToman && (
              <span className="block text-[11px] font-mono font-numeric text-[#8B9DB7] line-through">
                {formatTomanAmount(course.originalPriceToman, locale)}
              </span>
            )}
            <span className="block text-sm sm:text-base font-mono font-numeric font-bold text-[#28CF77]">
              {formatTomanAmount(course.priceToman, locale)}
            </span>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-7 max-h-[70vh] overflow-y-auto">
          {/* STAGE 0: Member Sign-In Required */}
          {!authUser ? (
            <div className="space-y-5">
              <div className="rounded-2xl border border-[#6F9BFF]/25 bg-[#08101E] p-5 space-y-3">
                <div className="flex items-center gap-2.5 text-[#8AB0FF]">
                  <ShieldCheck className="w-5 h-5 shrink-0" />
                  <h3 className="text-sm sm:text-base font-semibold text-[#F5F8FC]">
                    {isFa
                      ? 'برای ثبت‌نام دوره و صدور فاکتور، وارد حساب کاربری خود شوید'
                      : 'Sign in to enroll and generate your invoice'}
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-[#C6D2E3] leading-relaxed rtl:leading-[1.85]">
                  {isFa
                    ? 'می‌توانید به‌صورت سریع با حساب گوگل وارد شوید یا از طریق درگاه ورود/ثبت‌نام با ایمیل و رمز عبور یا پیامک شماره همراه اقدام کنید.'
                    : 'Continue instantly with Google or open the full Member Gateway to sign in / sign up with Email & Password or Mobile SMS OTP.'}
                </p>
              </div>

              {authError && (
                <div
                  role="alert"
                  className="rounded-xl border border-amber-400/35 bg-amber-500/12 px-4 py-3 text-xs text-amber-200 flex items-start gap-2"
                >
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  type="button"
                  onClick={() => void handleGoogleSignIn()}
                  disabled={signingIn}
                  className="glass-cta flex-1 min-h-[48px] inline-flex items-center justify-center gap-2.5 rounded-xl px-6 py-3 text-sm font-semibold cursor-pointer disabled:opacity-60"
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
                        ? 'ورود سریع با حساب گوگل'
                        : 'Continue with Google'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigate({ page: 'account' });
                  }}
                  className="min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.03] px-5 py-3 text-xs font-medium text-[#DCE6F5] hover:border-[#6F9BFF]/55 hover:text-white transition-colors cursor-pointer"
                >
                  <span>{isFa ? 'ورود / ثبت‌نام با ایمیل یا پیامک' : 'Email / SMS Sign In'}</span>
                  <ArrowIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : !createdOrder ? (
            /* STAGE 1: Confirm Complete Student/Billing Info & Create Order */
            <form onSubmit={handleCreateOrder} noValidate className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#28CF77]/25 bg-[#00A651]/10 px-3.5 py-2.5 text-xs">
                <span className="text-[#C6D2E3]">
                  {isFa ? 'حساب کاربری: ' : 'Signed-in Account: '}
                  <strong className="ltr-inline text-[#F5F8FC]">
                    {authUser.email || authUser.phoneNumber || authUser.displayName}
                  </strong>
                </span>
                <span className="text-[#28CF77] text-[11px]">
                  {isFa ? 'مرحله ۱ از ۲ · تأیید مشخصات' : 'Step 1 of 2 · Billing Details'}
                </span>
              </div>

              {loadingProfile ? (
                <div className="py-8 flex items-center justify-center gap-2 text-xs text-[#9FB0C9]">
                  <Loader2 className="w-4 h-4 animate-spin text-[#6F9BFF]" />
                  <span>{isFa ? 'در حال بارگذاری مشخصات شما...' : 'Loading your profile...'}</span>
                </div>
              ) : (
                <>
                  {orderError && (
                    <div
                      role="alert"
                      className="rounded-xl border border-amber-400/35 bg-amber-500/12 px-4 py-3 text-xs text-amber-200 flex items-start gap-2"
                    >
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>{orderError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label htmlFor="chk-name" className="block text-xs font-medium text-[#DCE6F5]">
                        {isFa ? 'نام و نام خانوادگی (برای گواهینامه) *' : 'Full Name *'}
                      </label>
                      <input
                        id="chk-name"
                        type="text"
                        value={form.fullName}
                        onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                        placeholder={isFa ? 'نام کامل شما' : 'Your full name'}
                        className={inputClass}
                      />
                      {errors.fullName && <p className="text-[11px] text-amber-300">{errors.fullName}</p>}
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="chk-phone" className="block text-xs font-medium text-[#DCE6F5]">
                        {isFa ? 'شماره موبایل *' : 'Mobile Phone *'}
                      </label>
                      <input
                        id="chk-phone"
                        type="tel"
                        dir="ltr"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="09151234567"
                        className={`${inputClass} font-numeric`}
                      />
                      {errors.phone && <p className="text-[11px] text-amber-300">{errors.phone}</p>}
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="chk-city" className="block text-xs font-medium text-[#DCE6F5]">
                        {isFa ? 'شهر محل سکونت *' : 'City *'}
                      </label>
                      <input
                        id="chk-city"
                        type="text"
                        value={form.city}
                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                        placeholder={isFa ? 'مشهد / تهران' : 'Mashhad / Tehran'}
                        className={inputClass}
                      />
                      {errors.city && <p className="text-[11px] text-amber-300">{errors.city}</p>}
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="chk-nid" className="block text-xs font-medium text-[#DCE6F5]">
                        {isFa ? 'کد ملی (اختیاری · جهت گواهینامه)' : 'National ID (Optional)'}
                      </label>
                      <input
                        id="chk-nid"
                        type="text"
                        dir="ltr"
                        maxLength={10}
                        value={form.nationalId}
                        onChange={(e) => setForm({ ...form, nationalId: e.target.value })}
                        placeholder="0921234567"
                        className={`${inputClass} font-numeric`}
                      />
                      {errors.nationalId && (
                        <p className="text-[11px] text-amber-300">{errors.nationalId}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label htmlFor="chk-org" className="block text-xs font-medium text-[#DCE6F5]">
                        {isFa ? 'شرکت یا دانشگاه (اختیاری)' : 'Company / University (Optional)'}
                      </label>
                      <input
                        id="chk-org"
                        type="text"
                        value={form.organization}
                        onChange={(e) => setForm({ ...form, organization: e.target.value })}
                        className={inputClass}
                      />
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="chk-notes" className="block text-xs font-medium text-[#DCE6F5]">
                        {isFa ? 'توضیحات یا کد تخفیف (اختیاری)' : 'Notes / Preference (Optional)'}
                      </label>
                      <input
                        id="chk-notes"
                        type="text"
                        value={form.notes}
                        onChange={(e) => setForm({ ...form, notes: e.target.value })}
                        placeholder={isFa ? 'مثلاً شرکت حضوری یا آنلاین' : 'e.g. In-person or online'}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="block text-[11px] text-[#8B9DB7]">
                        {isFa ? 'مبلغ قابل پرداخت' : 'Total Payable'}
                      </span>
                      <span className="text-lg font-mono font-numeric font-bold text-[#28CF77]">
                        {formatTomanAmount(course.priceToman, locale)}
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={creatingOrder}
                      className="glass-cta-emerald min-h-[46px] inline-flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold cursor-pointer disabled:opacity-60"
                    >
                      {creatingOrder ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CreditCard className="w-4 h-4" />
                      )}
                      <span>
                        {creatingOrder
                          ? isFa
                            ? 'در حال ثبت سفارش...'
                            : 'Creating Order...'
                          : isFree
                            ? isFa
                              ? 'تکمیل ثبت‌نام رایگان'
                              : 'Complete Free Enrollment'
                            : isFa
                              ? 'ثبت سفارش و ورود به مرحله پرداخت'
                              : 'Create Order & Proceed to Payment'}
                      </span>
                    </button>
                  </div>
                </>
              )}
            </form>
          ) : (
            /* STAGE 2: Order Created -> Payment Gateway / Reference Submission */
            <div className="space-y-5">
              <div className="rounded-2xl border border-[#28CF77]/35 bg-[#00A651]/12 p-5 space-y-2.5">
                <div className="flex items-center gap-2.5 text-[#28CF77]">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <h3 className="text-base font-semibold text-[#F5F8FC]">
                    {createdOrder.paymentStatus === 'paid'
                      ? isFa
                        ? 'ثبت‌نام شما با موفقیت نهایی شد!'
                        : 'Your enrollment is confirmed!'
                      : isFa
                        ? 'سفارش شما ثبت شد — مرحله پرداخت'
                        : 'Enrollment Order Created — Complete Payment'}
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-[#DCE6F5]">
                  <span>
                    {isFa ? 'کد سفارش: ' : 'Order Code: '}
                    <strong className="ltr-inline font-mono text-[#6F9BFF]">
                      {createdOrder.orderNumber}
                    </strong>
                  </span>
                  <span>
                    {isFa ? 'مبلغ: ' : 'Amount: '}
                    <strong className="font-mono font-numeric text-[#28CF77]">
                      {formatTomanAmount(createdOrder.amountToman, locale)}
                    </strong>
                  </span>
                </div>
              </div>

              {createdOrder.paymentStatus === 'paid' ? (
                <div className="space-y-4">
                  <p className="text-sm text-[#C6D2E3] leading-relaxed">
                    {isFa
                      ? 'این دوره برای همیشه در بخش «سفارش‌ها و دوره‌های من» در پنل کاربری شما ثبت شد.'
                      : 'This course is permanently saved under "My Orders & Courses" in your Member Portal.'}
                  </p>
                  {(createdOrder.accessUrl || course.accessUrl) &&
                    isSafeExternalUrl(createdOrder.accessUrl || course.accessUrl || '') && (
                      <a
                        href={createdOrder.accessUrl || course.accessUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="glass-cta-emerald w-full min-h-[46px] inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold"
                      >
                        <span>
                          {isFa ? 'ورود به کلاس / فایل‌های دوره' : 'Enter Classroom / Files'}
                        </span>
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                </div>
              ) : (
                <div className="space-y-4">
                  {hasGatewayUrl && course.paymentUrl && (
                    <a
                      href={course.paymentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="glass-cta-emerald w-full min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>
                        {isFa
                          ? 'ورود به درگاه پرداخت آنلاین امن دوره'
                          : 'Proceed to Secure Online Payment Gateway'}
                      </span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}

                  {paymentNote && (
                    <div className="rounded-xl border border-white/12 bg-[#080F1C] p-4 space-y-1.5">
                      <span className="block text-[11px] font-semibold text-[#8AB0FF]">
                        {isFa ? 'راهنمای پرداخت و فعال‌سازی دوره' : 'Payment & Activation Instructions'}
                      </span>
                      <p className="text-xs text-[#C6D2E3] leading-relaxed whitespace-pre-line">
                        {paymentNote}
                      </p>
                    </div>
                  )}

                  {refSubmitted ? (
                    <div className="rounded-xl border border-[#28CF77]/35 bg-[#00A651]/14 p-4 space-y-1.5 text-xs text-[#D6FFE9]">
                      <p className="font-semibold">
                        {isFa
                          ? 'کد پیگیری پرداخت شما با موفقیت ثبت شد.'
                          : 'Your payment reference has been submitted.'}
                      </p>
                      <p className="text-[#C6D2E3]">
                        {isFa
                          ? `کد ثبت‌شده: ${createdOrder.paymentRef} — پس از تأیید کارشناسان آکادمی، وضعیت سفارش به «پرداخت‌شده» تغییر کرده و لینک دسترسی دوره در پنل کاربری شما فعال می‌شود.`
                          : `Reference ${createdOrder.paymentRef} recorded. Once verified by ISB Academy, your order switches to Paid and course access unlocks in your portal.`}
                      </p>
                    </div>
                  ) : (
                    <form
                      onSubmit={handleSubmitPaymentRef}
                      className="rounded-xl border border-[#6F9BFF]/22 bg-[#080F1C] p-4 space-y-3"
                    >
                      <label htmlFor="chk-payref" className="block text-xs font-medium text-[#DCE6F5]">
                        {isFa
                          ? 'پس از پرداخت، شماره پیگیری / کد مرجع بانکی را اینجا ثبت کنید:'
                          : 'After payment, enter your transaction tracking reference:'}
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2.5">
                        <input
                          id="chk-payref"
                          type="text"
                          dir="ltr"
                          value={paymentRef}
                          onChange={(e) => {
                            setPaymentRef(e.target.value);
                            setPaymentRefError(null);
                          }}
                          placeholder={
                            isFa ? 'مثال: 9482716402' : 'e.g. TXN-94827164'
                          }
                          className={`${inputClass} font-mono flex-1`}
                        />
                        <button
                          type="submit"
                          disabled={submittingRef}
                          className="glass-cta min-h-[42px] inline-flex items-center justify-center gap-1.5 rounded-xl px-5 py-2 text-xs font-semibold cursor-pointer disabled:opacity-60 shrink-0"
                        >
                          {submittingRef ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          <span>{isFa ? 'ثبت کد پیگیری' : 'Submit Reference'}</span>
                        </button>
                      </div>
                      {paymentRefError && (
                        <p className="text-[11px] text-amber-300">{paymentRefError}</p>
                      )}
                    </form>
                  )}
                </div>
              )}

              <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    try {
                      window.sessionStorage.setItem('isb_account_initial_tab', 'orders');
                    } catch {
                      // Ignore storage restrictions
                    }
                    onClose();
                    onNavigate({ page: 'account' });
                  }}
                  className="glass-cta min-h-[42px] inline-flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-semibold cursor-pointer"
                >
                  <span>
                    {isFa
                      ? 'مشاهده سفارش‌ها و دوره‌های من'
                      : 'Open My Orders & Courses'}
                  </span>
                  <ArrowIcon className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[42px] rounded-xl border border-white/15 px-4 py-2 text-xs text-[#C6D2E3] hover:text-white cursor-pointer"
                >
                  {isFa ? 'بستن' : 'Close'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
