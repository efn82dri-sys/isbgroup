import type {
  AdminOrderFormInput,
  AssessmentRecord,
  Course,
  CourseDepartment,
  CourseFormat,
  CourseFormInput,
  InquiryRecord,
  Locale,
  MemberCheckoutInput,
  OrderItemType,
  OrderPaymentStatus,
  TicketCategory,
  TicketFormInput,
  TicketPriority,
  TicketStatus,
  UserOrder,
  UserProfile,
  UserProfileFormInput,
} from '../types/content';
import { isSafeExternalUrl, isSafeImageSrc, normalizeSlug, type FieldErrors } from './validation';

const IRAN_NATIONAL_ID_REGEX = /^\d{10}$/;
const PHONE_CLEAN_REGEX = /^[+\d\s\-()]{7,30}$/;

export const STUDIO_ADMIN_EMAIL = 'isbgroup58@gmail.com';

/**
 * Pure guard returning true strictly for the verified Studio Admin Gmail account.
 * Used to keep private admin entry points hidden from public visitors and regular members.
 */
export function isStudioAdminUser(
  user: { email?: string | null; emailVerified?: boolean | null } | null | undefined
): boolean {
  if (!user?.email) return false;
  return (
    user.email.trim().toLowerCase() === STUDIO_ADMIN_EMAIL &&
    user.emailVerified === true
  );
}

export interface ProfileCompletenessResult {
  percent: number;
  completedCount: number;
  totalCount: number;
  missingFields: ('fullName' | 'phone' | 'city' | 'profession' | 'nationalId' | 'billingAddress')[];
  isCheckoutReady: boolean;
}

/**
 * Pure helper evaluating whether a user's profile contains the essential billing & identity
 * details needed for future ISB Academy course registration, invoicing, and payment gateways.
 */
export function computeProfileCompleteness(
  profile: Partial<UserProfile> | null | undefined
): ProfileCompletenessResult {
  const checks: {
    key: 'fullName' | 'phone' | 'city' | 'profession' | 'nationalId' | 'billingAddress';
    weight: number;
    filled: boolean;
  }[] = [
    { key: 'fullName', weight: 20, filled: (profile?.fullName?.trim().length ?? 0) >= 2 },
    { key: 'phone', weight: 25, filled: (profile?.phone?.trim().length ?? 0) >= 7 },
    { key: 'city', weight: 15, filled: (profile?.city?.trim().length ?? 0) >= 2 },
    { key: 'profession', weight: 15, filled: (profile?.profession?.trim().length ?? 0) >= 2 },
    { key: 'nationalId', weight: 15, filled: IRAN_NATIONAL_ID_REGEX.test(profile?.nationalId?.trim() ?? '') },
    { key: 'billingAddress', weight: 10, filled: (profile?.billingAddress?.trim().length ?? 0) >= 6 },
  ];

  let percent = 0;
  let completedCount = 0;
  const missingFields: ProfileCompletenessResult['missingFields'] = [];

  for (const item of checks) {
    if (item.filled) {
      percent += item.weight;
      completedCount += 1;
    } else {
      missingFields.push(item.key);
    }
  }

  const isCheckoutReady =
    (profile?.fullName?.trim().length ?? 0) >= 2 &&
    (profile?.phone?.trim().length ?? 0) >= 7 &&
    (profile?.city?.trim().length ?? 0) >= 2;

  return {
    percent,
    completedCount,
    totalCount: checks.length,
    missingFields,
    isCheckoutReady,
  };
}

export function normalizeDigits(raw: string): string {
  return raw
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));
}

const SIMPLE_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Normalizes Iranian or international mobile numbers into strict E.164 format (+989xxxxxxxxx)
 * for Firebase Phone Authentication (SMS OTP). Returns null if invalid.
 */
export function normalizeIranPhoneToE164(raw: string): string | null {
  const cleaned = normalizeDigits(raw).replace(/[\s\-().]/g, '');
  if (!cleaned) return null;

  // Iranian local mobile: 09xxxxxxxxx -> +989xxxxxxxxx
  if (/^09\d{9}$/.test(cleaned)) {
    return `+98${cleaned.slice(1)}`;
  }
  // Iranian mobile without leading zero: 9xxxxxxxxx -> +989xxxxxxxxx
  if (/^9\d{9}$/.test(cleaned)) {
    return `+98${cleaned}`;
  }
  // Iranian with 0098 or 98 prefix
  if (/^00989\d{9}$/.test(cleaned)) {
    return `+98${cleaned.slice(4)}`;
  }
  if (/^989\d{9}$/.test(cleaned)) {
    return `+${cleaned}`;
  }
  if (/^\+989\d{9}$/.test(cleaned)) {
    return cleaned;
  }
  // Generic international E.164 (+ followed by 8–15 digits)
  if (/^\+[1-9]\d{7,14}$/.test(cleaned)) {
    return cleaned;
  }
  if (/^00[1-9]\d{7,14}$/.test(cleaned)) {
    return `+${cleaned.slice(2)}`;
  }
  return null;
}

export interface EmailSignUpInput {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export interface EmailSignInInput {
  email: string;
  password: string;
}

export function validateEmailPasswordSignUp(
  input: EmailSignUpInput,
  locale: Locale
): FieldErrors<EmailSignUpInput> {
  const errors: FieldErrors<EmailSignUpInput> = {};
  const isFa = locale === 'fa';

  const fullName = input.fullName.trim();
  if (fullName.length < 2 || fullName.length > 120) {
    errors.fullName = isFa
      ? 'نام و نام خانوادگی کامل را وارد کنید (حداقل ۲ کاراکتر).'
      : 'Please enter your full name (at least 2 characters).';
  }

  const email = input.email.trim();
  if (!SIMPLE_EMAIL_REGEX.test(email) || email.length > 160) {
    errors.email = isFa
      ? 'نشانی ایمیل معتبر وارد کنید (مثال: name@gmail.com).'
      : 'Please enter a valid email address.';
  }

  const phone = normalizeDigits(input.phone.trim());
  if (phone && (!PHONE_CLEAN_REGEX.test(phone) || phone.length > 40)) {
    errors.phone = isFa
      ? 'شماره همراه معتبر وارد کنید (مثال: 09151234567).'
      : 'Please enter a valid mobile phone number.';
  }

  if (input.password.length < 8) {
    errors.password = isFa
      ? 'رمز عبور باید حداقل ۸ کاراکتر باشد.'
      : 'Password must be at least 8 characters long.';
  }

  if (input.password !== input.confirmPassword) {
    errors.confirmPassword = isFa
      ? 'تکرار رمز عبور با رمز عبور واردشده مطابقت ندارد.'
      : 'Passwords do not match.';
  }

  return errors;
}

export function validateEmailPasswordSignIn(
  input: EmailSignInInput,
  locale: Locale
): FieldErrors<EmailSignInInput> {
  const errors: FieldErrors<EmailSignInInput> = {};
  const isFa = locale === 'fa';

  const email = input.email.trim();
  if (!SIMPLE_EMAIL_REGEX.test(email)) {
    errors.email = isFa ? 'نشانی ایمیل معتبر وارد کنید.' : 'Enter a valid email address.';
  }
  if (input.password.length < 6) {
    errors.password = isFa ? 'رمز عبور خود را وارد کنید.' : 'Please enter your password.';
  }
  return errors;
}

export function validateOtpCode(raw: string, locale: Locale): string | null {
  const digits = normalizeDigits(raw).replace(/\s+/g, '');
  if (!/^\d{6}$/.test(digits)) {
    return locale === 'fa'
      ? 'کد تأیید پیامکی باید دقیقاً ۶ رقم عددی باشد.'
      : 'Verification code must be exactly 6 digits.';
  }
  return null;
}

export function evaluatePasswordStrength(password: string): {
  score: 0 | 1 | 2 | 3 | 4;
  labelFa: string;
  labelEn: string;
} {
  if (!password) return { score: 0, labelFa: '', labelEn: '' };
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 11) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score += 1;
  else if (/\d/.test(password)) score = Math.min(4, score + 1);
  const clamped = Math.min(4, Math.max(1, score)) as 1 | 2 | 3 | 4;
  const labels: Record<1 | 2 | 3 | 4, { fa: string; en: string }> = {
    1: { fa: 'ضعیف', en: 'Weak' },
    2: { fa: 'متوسط', en: 'Fair' },
    3: { fa: 'قوی', en: 'Strong' },
    4: { fa: 'بسیار امن', en: 'Very Strong' },
  };
  return { score: clamped, labelFa: labels[clamped].fa, labelEn: labels[clamped].en };
}

export function validateUserProfileForm(
  input: UserProfileFormInput,
  locale: Locale
): FieldErrors<UserProfileFormInput> {
  const errors: FieldErrors<UserProfileFormInput> = {};
  const isFa = locale === 'fa';

  const fullName = input.fullName.trim();
  if (fullName.length < 2 || fullName.length > 120) {
    errors.fullName = isFa
      ? 'نام و نام خانوادگی کامل باید بین ۲ تا ۱۲۰ کاراکتر باشد.'
      : 'Full name must be between 2 and 120 characters.';
  }

  if (input.email !== undefined) {
    const emailClean = input.email.trim();
    if (emailClean && (!SIMPLE_EMAIL_REGEX.test(emailClean) || emailClean.length > 160)) {
      errors.email = isFa
        ? 'نشانی ایمیل واردشده معتبر نیست.'
        : 'Please enter a valid email address.';
    }
  }

  const phone = normalizeDigits(input.phone.trim());
  if (phone && (!PHONE_CLEAN_REGEX.test(phone) || phone.length > 40)) {
    errors.phone = isFa
      ? 'شماره تماس معتبر وارد کنید (مثال: 09151234567).'
      : 'Enter a valid phone number (e.g. +98 915 123 4567).';
  }

  const nationalId = normalizeDigits(input.nationalId.trim());
  if (nationalId && !IRAN_NATIONAL_ID_REGEX.test(nationalId)) {
    errors.nationalId = isFa
      ? 'کد ملی باید دقیقاً ۱۰ رقم عددی باشد.'
      : 'National ID must be exactly 10 numeric digits.';
  }

  if (input.city.trim().length > 100) {
    errors.city = isFa
      ? 'نام شهر نباید بیشتر از ۱۰۰ کاراکتر باشد.'
      : 'City must be 100 characters or fewer.';
  }

  if (input.organization.trim().length > 140) {
    errors.organization = isFa
      ? 'نام شرکت یا دانشگاه نباید بیشتر از ۱۴۰ کاراکتر باشد.'
      : 'Organization must be 140 characters or fewer.';
  }

  if (input.profession.trim().length > 120) {
    errors.profession = isFa
      ? 'عنوان تخصص نباید بیشتر از ۱۲۰ کاراکتر باشد.'
      : 'Profession must be 120 characters or fewer.';
  }

  if (input.billingAddress.trim().length > 500) {
    errors.billingAddress = isFa
      ? 'نشانی فاکتور نباید بیشتر از ۵۰۰ کاراکتر باشد.'
      : 'Billing address must be 500 characters or fewer.';
  }

  return errors;
}

export function validateTicketForm(
  input: TicketFormInput,
  locale: Locale
): FieldErrors<TicketFormInput> {
  const errors: FieldErrors<TicketFormInput> = {};
  const isFa = locale === 'fa';

  const subject = input.subject.trim();
  if (subject.length < 3 || subject.length > 160) {
    errors.subject = isFa
      ? 'موضوع تیکت باید بین ۳ تا ۱۶۰ کاراکتر باشد.'
      : 'Ticket subject must be between 3 and 160 characters.';
  }

  const message = input.message.trim();
  if (message.length < 5 || message.length > 3000) {
    errors.message = isFa
      ? 'شرح درخواست یا سؤال خود را بنویسید (حداقل ۵ کاراکتر).'
      : 'Please describe your request (at least 5 characters).';
  }

  const orderNum = input.orderNumber.trim();
  if (orderNum.length > 40) {
    errors.orderNumber = isFa
      ? 'کد سفارش نباید بیشتر از ۴۰ کاراکتر باشد.'
      : 'Order reference must be 40 characters or fewer.';
  }

  return errors;
}

export function validateTicketReply(body: string, locale: Locale): string | null {
  const clean = body.trim();
  const isFa = locale === 'fa';
  if (clean.length < 2) {
    return isFa
      ? 'لطفاً متن پاسخ را وارد کنید (حداقل ۲ کاراکتر).'
      : 'Please enter a reply (at least 2 characters).';
  }
  if (clean.length > 3000) {
    return isFa
      ? 'متن پاسخ نباید بیشتر از ۳۰۰۰ کاراکتر باشد.'
      : 'Reply must be 3,000 characters or fewer.';
  }
  return null;
}

export function validateAdminOrderForm(
  input: AdminOrderFormInput,
  locale: Locale
): FieldErrors<AdminOrderFormInput> {
  const errors: FieldErrors<AdminOrderFormInput> = {};
  const isFa = locale === 'fa';

  if (!input.userId.trim()) {
    errors.userId = isFa ? 'لطفاً کاربر خریدار را انتخاب کنید.' : 'Please select a registered user.';
  }

  if (input.titleFa.trim().length < 2 || input.titleFa.trim().length > 180) {
    errors.titleFa = isFa
      ? 'عنوان فارسی دوره یا سفارش الزامی است (۲ تا ۱۸۰ کاراکتر).'
      : 'Persian order title is required (2–180 chars).';
  }

  if (input.titleEn.trim().length < 2 || input.titleEn.trim().length > 180) {
    errors.titleEn = isFa
      ? 'عنوان انگلیسی دوره یا سفارش الزامی است (۲ تا ۱۸۰ کاراکتر).'
      : 'English order title is required (2–180 chars).';
  }

  const normalizedAmount = normalizeDigits(input.amountToman.replace(/[,\s٬]/g, ''));
  const numericAmount = Number(normalizedAmount);
  if (
    !normalizedAmount ||
    Number.isNaN(numericAmount) ||
    numericAmount < 0 ||
    numericAmount > 5000000000
  ) {
    errors.amountToman = isFa
      ? 'مبلغ باید عددی معتبر به تومان باشد.'
      : 'Amount must be a valid number in Toman.';
  }

  if (input.accessUrl.trim() && !isSafeExternalUrl(input.accessUrl.trim())) {
    errors.accessUrl = isFa
      ? 'لینک دسترسی دوره باید با https:// شروع شود.'
      : 'Course access URL must start with https://.';
  }

  if (input.notes.trim().length > 1500) {
    errors.notes = isFa
      ? 'توضیحات سفارش نباید بیشتر از ۱۵۰۰ کاراکتر باشد.'
      : 'Notes must be 1,500 characters or fewer.';
  }

  return errors;
}

export function generateTrackingCode(prefix: 'ISB-TK' | 'ISB-OR', now = Date.now()): string {
  const timeChunk = (now % 100000).toString(36).toUpperCase().padStart(3, '0').slice(-3);
  const randChunk = Math.floor(100 + Math.random() * 900);
  return `${prefix}-${timeChunk}${randChunk}`;
}

export function formatTomanAmount(amount: number, locale: Locale): string {
  if (!Number.isFinite(amount)) return locale === 'fa' ? '۰ تومان' : '0 Toman';
  if (amount === 0) return locale === 'fa' ? 'رایگان' : 'Free';
  const formatted = new Intl.NumberFormat(locale === 'fa' ? 'fa-IR' : 'en-US').format(
    Math.round(amount)
  );
  return locale === 'fa' ? `${formatted} تومان` : `${formatted} Toman`;
}

export function mapMemberAuthError(errorCode: string | undefined, locale: Locale): string {
  const isFa = locale === 'fa';
  switch (errorCode) {
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return isFa
        ? 'پنجره ورود گوگل بسته شد. برای ورود دوباره روی دکمه گوگل کلیک کنید.'
        : 'The Google sign-in popup was closed. Click the Google button to try again.';
    case 'auth/popup-blocked':
      return isFa
        ? 'مرورگر پنجره بازشو (Popup) را مسدود کرده است. لطفاً اجازه باز شدن پنجره گوگل را فعال کنید.'
        : 'Your browser blocked the sign-in popup. Please allow popups for this site and try again.';
    case 'auth/email-already-in-use':
      return isFa
        ? 'این ایمیل قبلاً ثبت‌نام شده است. لطفاً از تب «ورود» با رمز عبور خود یا حساب گوگل وارد شوید.'
        : 'This email is already registered. Please switch to Sign In or continue with Google.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return isFa
        ? 'ایمیل یا رمز عبور نادرست است. اگر قبلاً با گوگل وارد شده‌اید، از دکمه گوگل یا بازیابی رمز استفاده کنید.'
        : 'Invalid email or password. If you originally joined with Google, use Google Sign-In or reset your password.';
    case 'auth/weak-password':
      return isFa
        ? 'رمز عبور انتخاب‌شده ضعیف است. لطفاً حداقل ۸ کاراکتر شامل حرف و عدد انتخاب کنید.'
        : 'Password is too weak. Please choose at least 8 characters with letters and numbers.';
    case 'auth/invalid-email':
      return isFa
        ? 'قالب نشانی ایمیل نادرست است.'
        : 'The email address format is invalid.';
    case 'auth/invalid-phone-number':
      return isFa
        ? 'شماره همراه واردشده معتبر نیست. لطفاً شماره را با فرمت 09151234567 وارد کنید.'
        : 'Invalid phone number. Please enter a valid mobile number (e.g. 09151234567).';
    case 'auth/invalid-verification-code':
      return isFa
        ? 'کد تأیید پیامکی نادرست است. لطفاً کد ۶ رقمی ارسال‌شده را دوباره بررسی کنید.'
        : 'The 6-digit SMS verification code is incorrect. Please check and try again.';
    case 'auth/code-expired':
      return isFa
        ? 'اعتبار کد پیامکی به پایان رسیده است. لطفاً درخواست ارسال مجدد کد بزنید.'
        : 'The verification code has expired. Please request a new SMS code.';
    case 'auth/quota-exceeded':
      return isFa
        ? 'سقف ارسال پیامک این شماره موقتاً تکمیل شده است. لطفاً کمی بعد یا با ایمیل و گوگل وارد شوید.'
        : 'SMS quota temporarily reached. Please try again later or sign in with Google or Email.';
    case 'auth/captcha-check-failed':
      return isFa
        ? 'تأیید امنیتی reCAPTCHA انجام نشد. لطفاً دوباره تلاش کنید.'
        : 'Security verification (reCAPTCHA) failed. Please try again.';
    case 'auth/operation-not-allowed':
      return isFa
        ? 'این روش ورود هنوز در کنسول Firebase پروژه فعال نشده است. مدیر سایت باید در بخش Authentication → Sign-in method گزینه «Email/Password» یا «Phone» را فعال کند. تا آن زمان می‌توانید با حساب گوگل وارد شوید.'
        : 'This sign-in method is not yet enabled in Firebase Console (Authentication → Sign-in method). Please enable Email/Password or Phone, or continue with Google.';
    case 'auth/billing-not-enabled':
      return isFa
        ? 'ارسال پیامک OTP واقعی در Firebase نیازمند فعال‌سازی سرویس SMS (طرح Blaze یا شماره تست در Firebase Console) است. لطفاً از ورود با ایمیل یا گوگل استفاده کنید.'
        : 'Live SMS delivery requires Firebase Phone Auth billing or test numbers configured in Firebase Console. You can sign in with Email or Google.';
    case 'auth/network-request-failed':
      return isFa
        ? 'اتصال به سرور احراز هویت برقرار نشد. لطفاً اتصال اینترنت خود را بررسی کنید.'
        : 'Network error while connecting to authentication servers. Please check your connection.';
    case 'auth/too-many-requests':
      return isFa
        ? 'تعداد تلاش‌های ورود زیاد بوده است. لطفاً چند دقیقه بعد مجدداً تلاش کنید.'
        : 'Too many attempts. Please wait a few minutes and try again.';
    default:
      return isFa
        ? 'احراز هویت انجام نشد. لطفاً مشخصات خود را بررسی کرده و دوباره تلاش کنید.'
        : 'Authentication could not be completed. Please verify your details and try again.';
  }
}

export const TICKET_CATEGORY_LABELS: Record<TicketCategory, { fa: string; en: string }> = {
  courses: { fa: 'دوره‌ها و آموزش', en: 'Courses & Academy' },
  'orders-billing': { fa: 'سفارش‌ها و پرداخت', en: 'Orders & Billing' },
  technical: { fa: 'مشاوره فنی و مهندسی', en: 'Technical & Engineering' },
  general: { fa: 'پشتیبانی عمومی', en: 'General Support' },
};

export const TICKET_STATUS_LABELS: Record<TicketStatus, { fa: string; en: string }> = {
  open: { fa: 'باز', en: 'Open' },
  'in-progress': { fa: 'در حال بررسی', en: 'In Progress' },
  answered: { fa: 'پاسخ داده شد', en: 'Answered' },
  closed: { fa: 'بسته شده', en: 'Closed' },
};

export const TICKET_PRIORITY_LABELS: Record<TicketPriority, { fa: string; en: string }> = {
  normal: { fa: 'عادی', en: 'Normal' },
  high: { fa: 'فوری', en: 'High Priority' },
};

export const ORDER_STATUS_LABELS: Record<OrderPaymentStatus, { fa: string; en: string }> = {
  pending: { fa: 'در انتظار پرداخت', en: 'Pending Payment' },
  paid: { fa: 'پرداخت‌شده', en: 'Paid' },
  cancelled: { fa: 'لغوشده', en: 'Cancelled' },
  refunded: { fa: 'مستردشده', en: 'Refunded' },
};

export const ORDER_TYPE_LABELS: Record<OrderItemType, { fa: string; en: string }> = {
  course: { fa: 'دوره آموزشی', en: 'Course' },
  workshop: { fa: 'کارگاه تخصصی', en: 'Workshop' },
  consultation: { fa: 'جلسه مشاوره', en: 'Consultation' },
  publication: { fa: 'پکیج و منابع', en: 'Resource Pack' },
};

export const PROFESSION_OPTIONS: { value: string; fa: string; en: string }[] = [
  { value: 'معمار / طراح', fa: 'معمار / طراح', en: 'Architect / Designer' },
  { value: 'مهندس انرژی و تأسیسات', fa: 'مهندس انرژی و تأسیسات', en: 'Energy & MEP Engineer' },
  { value: 'مهندس سازه و عمران', fa: 'مهندس سازه و عمران', en: 'Structural / Civil Engineer' },
  { value: 'دانشجو / پژوهشگر', fa: 'دانشجو / پژوهشگر', en: 'Student / Researcher' },
  { value: 'کارفرما / سازنده / سرمایه‌گذار', fa: 'کارفرما / سازنده / سرمایه‌گذار', en: 'Client / Developer' },
  { value: 'مدیر پروژه', fa: 'مدیر پروژه', en: 'Project Manager' },
  { value: 'سایر', fa: 'سایر', en: 'Other' },
];

export const COURSE_FORMAT_LABELS: Record<CourseFormat, { fa: string; en: string }> = {
  'online-live': { fa: 'آنلاین زنده', en: 'Live Online' },
  recorded: { fa: 'ویدئویی ضبط‌شده', en: 'Self-Paced Recorded' },
  'in-person': { fa: 'حضوری (مشهد)', en: 'In-Person (Mashhad)' },
  hybrid: { fa: 'ترکیبی (حضوری و آنلاین)', en: 'Hybrid (Studio + Online)' },
};

export const COURSE_DEPARTMENT_LABELS: Record<CourseDepartment, { fa: string; en: string }> = {
  'architecture-urbanism': { fa: 'معماری و شهرسازی', en: 'Architecture & Urbanism' },
  'energy-mep': { fa: 'انرژی و تأسیسات', en: 'Energy & MEP' },
  'structure-seismic': { fa: 'سازه و مهندسی زلزله', en: 'Structure & Seismic' },
  multidisciplinary: { fa: 'میان‌رشته‌ای و BIM', en: 'Multidisciplinary & BIM' },
};

export const MEMBER_INQUIRY_STATUS_LABELS: Record<
  InquiryRecord['internalStatus'],
  { fa: string; en: string }
> = {
  new: { fa: 'ثبت‌شده · در انتظار بررسی', en: 'Received · Pending Review' },
  reviewing: { fa: 'در حال بررسی مهندسین', en: 'Under Engineering Review' },
  contacted: { fa: 'پاسخ داده شد', en: 'Replied by Studio' },
  archived: { fa: 'بایگانی‌شده', en: 'Archived' },
};

export const MEMBER_ASSESSMENT_STATUS_LABELS: Record<
  AssessmentRecord['internalStatus'],
  { fa: string; en: string }
> = {
  new: { fa: 'ثبت‌شده · در انتظار ارزیابی', en: 'Received · Pending Triage' },
  reviewing: { fa: 'در حال تحلیل آزمایشگاه', en: 'Lab Analysis in Progress' },
  scheduled: { fa: 'جلسه بررسی زمان‌بندی شد', en: 'Consultation Scheduled' },
  completed: { fa: 'ارزیابی تکمیل شد', en: 'Assessment Completed' },
  archived: { fa: 'بایگانی‌شده', en: 'Archived' },
};

/**
 * Pure helper merging Firestore-authored courses with curated starter courses.
 * Firestore overrides starter courses matching the same slug; admin-hidden starter slugs are excluded.
 */
export function mergeCatalogCourses(
  firestoreCourses: Course[],
  seedCourses: Course[],
  hiddenSeedSlugs: string[] = [],
  includeDrafts = false
): Course[] {
  const hiddenSet = new Set(hiddenSeedSlugs);
  const bySlug = new Map<string, Course>();

  for (const seed of seedCourses) {
    if (hiddenSet.has(seed.slug)) continue;
    bySlug.set(seed.slug, { ...seed, isSeedDefault: true });
  }

  for (const live of firestoreCourses) {
    bySlug.set(live.slug, { ...live, isSeedDefault: false });
  }

  const merged = Array.from(bySlug.values());
  const filtered = includeDrafts ? merged : merged.filter((c) => c.status === 'published');
  return filtered.sort((a, b) => a.featuredOrder - b.featuredOrder);
}

export function parseSyllabusLines(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-•*·\d.\s]+/, '').trim())
    .filter((line) => line.length >= 2)
    .slice(0, 16);
}

export function validateCourseForm(
  input: CourseFormInput,
  locale: Locale
): FieldErrors<CourseFormInput> {
  const errors: FieldErrors<CourseFormInput> = {};
  const isFa = locale === 'fa';

  const slug = normalizeSlug(input.slug);
  if (slug.length < 2 || slug.length > 100 || !/^[a-z0-9-]+$/.test(slug)) {
    errors.slug = isFa
      ? 'شناسه انگلیسی دوره (slug) الزامی است (فقط حروف کوچک انگلیسی، عدد و خط تیره).'
      : 'Course slug is required (2–100 lowercase letters, digits, or hyphens).';
  }

  if (input.titleFa.trim().length < 2 || input.titleFa.trim().length > 160) {
    errors.titleFa = isFa
      ? 'عنوان فارسی دوره باید بین ۲ تا ۱۶۰ کاراکتر باشد.'
      : 'Persian course title must be 2–160 characters.';
  }

  if (input.titleEn.trim().length < 2 || input.titleEn.trim().length > 160) {
    errors.titleEn = isFa
      ? 'عنوان انگلیسی دوره باید بین ۲ تا ۱۶۰ کاراکتر باشد.'
      : 'English course title must be 2–160 characters.';
  }

  if (input.instructorFa.trim().length < 2 || input.instructorFa.trim().length > 120) {
    errors.instructorFa = isFa
      ? 'نام مدرس (فارسی) را وارد کنید.'
      : 'Persian instructor name is required.';
  }

  if (input.instructorEn.trim().length < 2 || input.instructorEn.trim().length > 120) {
    errors.instructorEn = isFa
      ? 'نام مدرس (انگلیسی) را وارد کنید.'
      : 'English instructor name is required.';
  }

  if (input.durationFa.trim().length < 2 || input.durationFa.trim().length > 80) {
    errors.durationFa = isFa
      ? 'مدت زمان دوره (فارسی) الزامی است (مثال: ۲۴ ساعت).'
      : 'Persian duration is required (e.g. 24 hours).';
  }

  if (input.durationEn.trim().length < 2 || input.durationEn.trim().length > 80) {
    errors.durationEn = isFa
      ? 'مدت زمان دوره (انگلیسی) الزامی است (مثال: 24 Hours).'
      : 'English duration is required (e.g. 24 Hours).';
  }

  const priceNorm = normalizeDigits(input.priceToman.replace(/[,\s٬]/g, ''));
  const priceNum = Number(priceNorm);
  if (priceNorm === '' || Number.isNaN(priceNum) || priceNum < 0 || priceNum > 500000000) {
    errors.priceToman = isFa
      ? 'شهریه دوره به تومان باید عددی معتبر (۰ برای رایگان) باشد.'
      : 'Course price in Toman must be a valid number (0 for free).';
  }

  if (input.originalPriceToman.trim()) {
    const origNorm = normalizeDigits(input.originalPriceToman.replace(/[,\s٬]/g, ''));
    const origNum = Number(origNorm);
    if (Number.isNaN(origNum) || origNum < 0 || origNum > 500000000) {
      errors.originalPriceToman = isFa
        ? 'مبلغ قبل از تخفیف باید عددی معتبر باشد.'
        : 'Original price must be a valid number.';
    }
  }

  if (input.capacity.trim()) {
    const capNorm = normalizeDigits(input.capacity.trim());
    const capNum = Number(capNorm);
    if (Number.isNaN(capNum) || capNum < 1 || capNum > 10000) {
      errors.capacity = isFa
        ? 'ظرفیت دوره باید عددی بین ۱ تا ۱۰۰۰۰ باشد.'
        : 'Capacity must be between 1 and 10,000.';
    }
  }

  if (input.summaryFa.trim().length < 5 || input.summaryFa.trim().length > 1500) {
    errors.summaryFa = isFa
      ? 'معرفی کوتاه فارسی دوره را وارد کنید (حداقل ۵ کاراکتر).'
      : 'Persian course summary is required (min 5 chars).';
  }

  if (input.summaryEn.trim().length < 5 || input.summaryEn.trim().length > 1500) {
    errors.summaryEn = isFa
      ? 'معرفی کوتاه انگلیسی دوره را وارد کنید (حداقل ۵ کاراکتر).'
      : 'English course summary is required (min 5 chars).';
  }

  if (!input.coverImage.trim() || !isSafeImageSrc(input.coverImage.trim())) {
    errors.coverImage = isFa
      ? 'تصویر کاور دوره معتبر نیست. لطفاً تصویر امن آپلود یا انتخاب کنید.'
      : 'Please upload or select a valid course cover image.';
  }

  if (input.paymentUrl.trim() && !isSafeExternalUrl(input.paymentUrl.trim())) {
    errors.paymentUrl = isFa
      ? 'لینک درگاه پرداخت باید با https:// شروع شود.'
      : 'Payment gateway URL must start with https://.';
  }

  if (input.accessUrl.trim() && !isSafeExternalUrl(input.accessUrl.trim())) {
    errors.accessUrl = isFa
      ? 'لینک ورود به کلاس یا فایل‌های دوره باید با https:// شروع شود.'
      : 'Classroom / access URL must start with https://.';
  }

  return errors;
}

export function validateMemberCheckoutForm(
  input: MemberCheckoutInput,
  locale: Locale
): FieldErrors<MemberCheckoutInput> {
  const errors: FieldErrors<MemberCheckoutInput> = {};
  const isFa = locale === 'fa';

  const fullName = input.fullName.trim();
  if (fullName.length < 2 || fullName.length > 120) {
    errors.fullName = isFa
      ? 'نام و نام خانوادگی کامل را وارد کنید.'
      : 'Please enter your full name.';
  }

  const phone = normalizeDigits(input.phone.trim());
  if (!phone || !PHONE_CLEAN_REGEX.test(phone) || phone.length > 40) {
    errors.phone = isFa
      ? 'شماره موبایل معتبر برای ثبت‌نام و صدور رسید الزامی است.'
      : 'A valid mobile phone number is required for enrollment.';
  }

  if (input.city.trim().length < 2 || input.city.trim().length > 100) {
    errors.city = isFa ? 'نام شهر را وارد کنید.' : 'Please enter your city.';
  }

  const nationalId = normalizeDigits(input.nationalId.trim());
  if (nationalId && !IRAN_NATIONAL_ID_REGEX.test(nationalId)) {
    errors.nationalId = isFa
      ? 'کد ملی در صورت وارد شدن باید دقیقاً ۱۰ رقم باشد.'
      : 'If provided, National ID must be 10 numeric digits.';
  }

  if (input.notes.trim().length > 600) {
    errors.notes = isFa
      ? 'توضیحات نباید بیشتر از ۶۰۰ کاراکتر باشد.'
      : 'Notes must be 600 characters or fewer.';
  }

  return errors;
}

export function validatePaymentRefInput(ref: string, locale: Locale): string | null {
  const clean = normalizeDigits(ref.trim());
  const isFa = locale === 'fa';
  if (clean.length < 4 || clean.length > 120) {
    return isFa
      ? 'شماره پیگیری یا کد مرجع پرداخت را به‌درستی وارد کنید (حداقل ۴ کاراکتر).'
      : 'Please enter a valid payment tracking reference (at least 4 characters).';
  }
  return null;
}

function normalizeCourseTitleKey(raw: string | undefined): string {
  return (raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\u200c\s]+/g, ' ');
}

/**
 * Pure helper matching a member's order back to its live catalog course by courseId,
 * slug, or normalized Persian/English title (handles both current and legacy orders).
 */
export function resolveOrderCourse(
  order: Pick<UserOrder, 'courseId' | 'titleFa' | 'titleEn'>,
  courses: readonly Course[]
): Course | undefined {
  if (!courses.length) return undefined;
  if (order.courseId) {
    const byId = courses.find((c) => c.id === order.courseId || c.slug === order.courseId);
    if (byId) return byId;
  }
  const faKey = normalizeCourseTitleKey(order.titleFa);
  const enKey = normalizeCourseTitleKey(order.titleEn);
  return courses.find((c) => {
    if (faKey && normalizeCourseTitleKey(c.titleFa) === faKey) return true;
    if (enKey && normalizeCourseTitleKey(c.titleEn) === enKey) return true;
    return false;
  });
}

/**
 * Pure lifetime course classroom/materials URL resolver.
 * Strictly returns undefined for non-paid orders (pending, cancelled, refunded).
 * For paid orders, prefers the order's persisted snapshot/override URL and seamlessly
 * falls back to the live catalog course's accessUrl so every purchased course retains
 * permanent lifetime access inside "My Orders & Courses".
 */
export function resolveOrderLifetimeAccessUrl(
  order: Pick<UserOrder, 'paymentStatus' | 'accessUrl' | 'courseId' | 'titleFa' | 'titleEn'>,
  courses: readonly Course[]
): string | undefined {
  if (order.paymentStatus !== 'paid') return undefined;

  const direct = order.accessUrl?.trim();
  if (direct && isSafeExternalUrl(direct)) {
    return direct;
  }

  const matchedCourse = resolveOrderCourse(order, courses);
  const courseLink = matchedCourse?.accessUrl?.trim();
  if (courseLink && isSafeExternalUrl(courseLink)) {
    return courseLink;
  }

  return undefined;
}

/**
 * Formats an external classroom URL into a compact readable host + path preview
 * (e.g. "meet.google.com/abc-defg-hij") without protocol clutter.
 */
export function formatAccessUrlDisplay(url: string): string {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname === '/' ? '' : parsed.pathname;
    const combined = `${parsed.host}${path}`;
    return combined.length > 52 ? `${combined.slice(0, 49)}...` : combined;
  } catch {
    return url.slice(0, 52);
  }
}

