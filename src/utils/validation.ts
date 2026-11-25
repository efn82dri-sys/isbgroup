import type { AssessmentFormInput, InquiryFormInput, Locale } from '../types/content';

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function sanitizeText(value: string, maxLength: number): string {
  return value.trim().slice(0, maxLength);
}

export function validateInquiryForm(
  input: InquiryFormInput,
  locale: Locale
): FieldErrors<InquiryFormInput> {
  const errors: FieldErrors<InquiryFormInput> = {};
  const isFa = locale === 'fa';

  const fullName = input.fullName.trim();
  if (fullName.length < 2) {
    errors.fullName = isFa
      ? 'لطفاً نام و نام خانوادگی خود را وارد کنید (حداقل ۲ کاراکتر).'
      : 'Please enter your full name (at least 2 characters).';
  } else if (fullName.length > 120) {
    errors.fullName = isFa
      ? 'نام نباید بیشتر از ۱۲۰ کاراکتر باشد.'
      : 'Name must be 120 characters or fewer.';
  }

  const email = input.email.trim();
  if (!EMAIL_REGEX.test(email) || email.length > 160) {
    errors.email = isFa
      ? 'لطفاً یک نشانی ایمیل معتبر وارد کنید.'
      : 'Please enter a valid email address.';
  }

  if (input.phone.trim().length > 40) {
    errors.phone = isFa
      ? 'شماره تماس نباید بیشتر از ۴۰ کاراکتر باشد.'
      : 'Phone number must be 40 characters or fewer.';
  }

  if (!input.projectType.trim()) {
    errors.projectType = isFa
      ? 'لطفاً نوع پروژه را انتخاب کنید.'
      : 'Please select a project type.';
  }

  if (!input.disciplines || input.disciplines.length === 0) {
    errors.disciplines = isFa
      ? 'حداقل یک حوزه تخصصی مرتبط را انتخاب کنید.'
      : 'Please select at least one relevant discipline.';
  }

  const message = input.message.trim();
  if (message.length < 10) {
    errors.message = isFa
      ? 'لطفاً شرح کوتاهی از پروژه یا نیاز خود بنویسید (حداقل ۱۰ کاراکتر).'
      : 'Please provide a brief description of your project or inquiry (at least 10 characters).';
  } else if (message.length > 3000) {
    errors.message = isFa
      ? 'متن پیام نباید بیشتر از ۳۰۰۰ کاراکتر باشد.'
      : 'Message must be 3,000 characters or fewer.';
  }

  return errors;
}

export function validateAssessmentForm(
  input: AssessmentFormInput,
  locale: Locale
): FieldErrors<AssessmentFormInput> {
  const errors: FieldErrors<AssessmentFormInput> = {};
  const isFa = locale === 'fa';

  const fullName = input.fullName.trim();
  if (fullName.length < 2) {
    errors.fullName = isFa
      ? 'لطفاً نام و نام خانوادگی خود را وارد کنید.'
      : 'Please enter your full name.';
  } else if (fullName.length > 120) {
    errors.fullName = isFa
      ? 'نام نباید بیشتر از ۱۲۰ کاراکتر باشد.'
      : 'Name must be 120 characters or fewer.';
  }

  const email = input.email.trim();
  if (!EMAIL_REGEX.test(email) || email.length > 160) {
    errors.email = isFa
      ? 'لطفاً یک نشانی ایمیل معتبر وارد کنید.'
      : 'Please enter a valid email address.';
  }

  if (!input.projectType.trim()) {
    errors.projectType = isFa
      ? 'لطفاً کاربری یا نوع پروژه را انتخاب کنید.'
      : 'Please select a project type.';
  }

  if (input.city.trim().length < 2) {
    errors.city = isFa
      ? 'لطفاً شهر محل پروژه را وارد کنید.'
      : 'Please enter the project city.';
  } else if (input.city.trim().length > 100) {
    errors.city = isFa
      ? 'نام شهر نباید بیشتر از ۱۰۰ کاراکتر باشد.'
      : 'City name must be 100 characters or fewer.';
  }

  const normalizedAreaRaw = input.approximateFloorAreaSqm
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[,\s٬]/g, '');
  const areaNum = Number(normalizedAreaRaw);
  if (
    !normalizedAreaRaw ||
    Number.isNaN(areaNum) ||
    areaNum < 20 ||
    areaNum > 5000000
  ) {
    errors.approximateFloorAreaSqm = isFa
      ? 'زیربنای تقریبی باید عددی بین ۲۰ تا ۵٬۰۰۰٬۰۰۰ متر مربع باشد.'
      : 'Approximate floor area must be a number between 20 and 5,000,000 m².';
  }

  if (!input.projectStage) {
    errors.projectStage = isFa
      ? 'لطفاً مرحله فعلی پروژه را انتخاب کنید.'
      : 'Please select the current project stage.';
  }

  if (!input.assessmentGoals || input.assessmentGoals.length === 0) {
    errors.assessmentGoals = isFa
      ? 'حداقل یک هدف ارزیابی را انتخاب کنید.'
      : 'Please select at least one assessment goal.';
  } else if (input.assessmentGoals.length > 6) {
    errors.assessmentGoals = isFa
      ? 'حداکثر ۶ هدف ارزیابی قابل انتخاب است.'
      : 'You may select up to 6 assessment goals.';
  }

  if (input.notes.trim().length > 2000) {
    errors.notes = isFa
      ? 'توضیحات تکمیلی نباید بیشتر از ۲۰۰۰ کاراکتر باشد.'
      : 'Additional notes must be 2,000 characters or fewer.';
  }

  return errors;
}

export function hasErrors<T>(errors: FieldErrors<T>): boolean {
  return Object.keys(errors).length > 0;
}

export interface InsightFormInput {
  slug: string;
  titleEn: string;
  titleFa: string;
  subtitleEn?: string;
  subtitleFa?: string;
  excerptEn: string;
  excerptFa: string;
  bodyEn: string;
  bodyFa: string;
  coverImage?: string;
  hasRichBlocks?: boolean;
}

const SLUG_REGEX = /^[a-z0-9-]+$/;

export function normalizeSlug(raw: string): string {
  return raw.trim().toLowerCase();
}

export function validateInsightForm(
  input: InsightFormInput,
  locale: Locale
): FieldErrors<InsightFormInput> {
  const errors: FieldErrors<InsightFormInput> = {};
  const isFa = locale === 'fa';

  const slug = normalizeSlug(input.slug);
  if (slug.length < 2 || slug.length > 120 || !SLUG_REGEX.test(slug)) {
    errors.slug = isFa
      ? 'شناسه مقاله باید با حروف کوچک انگلیسی، عدد و خط‌تیره باشد (حداقل ۲ کاراکتر، مثال: daylight-study).'
      : 'Slug must use lowercase letters, numbers, and hyphens only (2–120 chars, e.g. daylight-study).';
  }

  const titleEn = input.titleEn.trim();
  if (titleEn.length < 2 || titleEn.length > 200) {
    errors.titleEn = isFa
      ? 'عنوان انگلیسی باید بین ۲ تا ۲۰۰ کاراکتر باشد.'
      : 'English title must be between 2 and 200 characters.';
  }

  const titleFa = input.titleFa.trim();
  if (titleFa.length < 2 || titleFa.length > 200) {
    errors.titleFa = isFa
      ? 'عنوان فارسی باید بین ۲ تا ۲۰۰ کاراکتر باشد.'
      : 'Persian title must be between 2 and 200 characters.';
  }

  const excerptEn = input.excerptEn.trim();
  if (excerptEn.length < 2 || excerptEn.length > 600) {
    errors.excerptEn = isFa
      ? 'چکیده انگلیسی باید بین ۲ تا ۶۰۰ کاراکتر باشد.'
      : 'English excerpt must be between 2 and 600 characters.';
  }

  const excerptFa = input.excerptFa.trim();
  if (excerptFa.length < 2 || excerptFa.length > 600) {
    errors.excerptFa = isFa
      ? 'چکیده فارسی باید بین ۲ تا ۶۰۰ کاراکتر باشد.'
      : 'Persian excerpt must be between 2 and 600 characters.';
  }

  if (input.coverImage && input.coverImage.trim()) {
    if (!isSafeImageSrc(input.coverImage) || input.coverImage.trim().length > 500) {
      errors.coverImage = isFa
        ? 'آدرس یا فایل تصویر شاخص مقاله معتبر نیست.'
        : 'Article cover image URL or upload is invalid.';
    }
  }

  const bodyEn = input.bodyEn.trim();
  const bodyFa = input.bodyFa.trim();
  if (input.hasRichBlocks) {
    if (bodyEn.length > 24000) {
      errors.bodyEn = isFa
        ? 'حجم متن انگلیسی بیش از حد مجاز است (حداکثر ۲۴٬۰۰۰ کاراکتر).'
        : 'English content exceeds 24,000 characters.';
    }
    if (bodyFa.length > 24000) {
      errors.bodyFa = isFa
        ? 'حجم متن فارسی بیش از حد مجاز است (حداکثر ۲۴٬۰۰۰ کاراکتر).'
        : 'Persian content exceeds 24,000 characters.';
    }
  } else {
    if (bodyEn.length < 2 || bodyEn.length > 24000) {
      errors.bodyEn = isFa
        ? 'متن انگلیسی مقاله باید حداقل ۲ کاراکتر باشد.'
        : 'English article body must be at least 2 characters.';
    }
    if (bodyFa.length < 2 || bodyFa.length > 24000) {
      errors.bodyFa = isFa
        ? 'متن فارسی مقاله باید حداقل ۲ کاراکتر باشد.'
        : 'Persian article body must be at least 2 characters.';
    }
  }

  return errors;
}

export function validateStudioPassword(
  password: string,
  confirmPassword: string,
  locale: Locale
): string | null {
  const isFa = locale === 'fa';
  if (password.length < 8) {
    return isFa
      ? 'رمز عبور باید حداقل ۸ کاراکتر باشد.'
      : 'Password must be at least 8 characters long.';
  }
  if (password.length > 128) {
    return isFa
      ? 'رمز عبور نباید بیشتر از ۱۲۸ کاراکتر باشد.'
      : 'Password must be 128 characters or fewer.';
  }
  if (password !== confirmPassword) {
    return isFa
      ? 'رمز عبور و تکرار آن با یکدیگر مطابقت ندارند.'
      : 'Password and confirmation do not match.';
  }
  return null;
}

export function mapStudioAuthError(errorCode: string | undefined, locale: Locale): string {
  const isFa = locale === 'fa';
  switch (errorCode) {
    case 'auth/operation-not-allowed':
      return isFa
        ? 'ورود با رمز عبور هنوز در کنسول فایربیس فعال نشده است. لطفاً ابتدا گزینه Email/Password را در Firebase Console فعال کنید یا همین حالا با حساب گوگل وارد شوید.'
        : 'Password sign-in is not yet enabled in Firebase Console. Enable the Email/Password provider in Firebase Authentication, or sign in with Google now.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return isFa
        ? 'رمز عبور نادرست است یا هنوز برای حساب مدیریت رمز تنظیم نشده است. اگر اولین بار است، با گوگل وارد شوید و در بخش «تنظیمات سایت» رمز عبور دلخواهتان را ثبت کنید.'
        : 'Incorrect password, or no password has been set yet. For first-time setup, sign in with Google and set your studio password under Site Settings.';
    case 'auth/too-many-requests':
      return isFa
        ? 'تعداد تلاش‌های ناموفق بیش از حد مجاز است. لطفاً چند دقیقه دیگر دوباره تلاش کنید یا با حساب گوگل وارد شوید.'
        : 'Too many failed attempts. Please wait a few minutes and try again, or sign in with Google.';
    case 'auth/requires-recent-login':
      return isFa
        ? 'برای تغییر رمز عبور لازم است یک‌بار از پنل خارج شده و مجدداً وارد شوید.'
        : 'Please sign out and sign in again before updating your password.';
    case 'auth/weak-password':
      return isFa
        ? 'رمز عبور انتخاب‌شده ضعیف است. لطفاً حداقل ۸ کاراکتر ترکیبی وارد کنید.'
        : 'Password is too weak. Please choose at least 8 characters.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return isFa
        ? 'پنجره ورود گوگل بسته شد. در صورت تمایل دوباره تلاش کنید.'
        : 'The Google sign-in window was closed. Please try again.';
    default:
      return isFa
        ? 'ورود به پنل مدیریت انجام نشد. لطفاً دوباره تلاش کنید.'
        : 'Unable to complete sign-in. Please try again.';
  }
}

export function isSafeImageSrc(src: string | undefined): boolean {
  if (!src) return false;
  const trimmed = src.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('/')) return !trimmed.startsWith('//');
  if (trimmed.startsWith('media://')) {
    return /^media:\/\/[a-zA-Z0-9_-]{1,128}$/.test(trimmed);
  }
  if (/^data:image\/(webp|jpeg|png);base64,[A-Za-z0-9+/=]+$/.test(trimmed)) {
    return true;
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function isSafeExternalUrl(url: string | undefined): boolean {
  if (!url || !url.trim()) return true;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function slugifyEnglish(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

export function parseSpecialtiesList(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/[،,\n|]+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .slice(0, 12);
}

export function buildMailtoReplyHref(params: {
  recipientEmail: string;
  recipientName: string;
  subject: string;
  replyBody: string;
}): string {
  const cleanEmail = params.recipientEmail.trim();
  const safeSubject = params.subject.trim().slice(0, 180);
  const safeBody = params.replyBody.trim().slice(0, 3500);
  return `mailto:${encodeURIComponent(cleanEmail)}?subject=${encodeURIComponent(safeSubject)}&body=${encodeURIComponent(safeBody)}`;
}

export interface ProjectFormInput {
  slug: string;
  titleFa: string;
  titleEn: string;
  cityFa: string;
  cityEn: string;
  serviceFa: string;
  serviceEn: string;
  disciplines: string[];
  coverImage: string;
  roleFa?: string;
  roleEn?: string;
  briefFa?: string;
  briefEn?: string;
  approachFa?: string;
  approachEn?: string;
  year?: string;
  areaSqm?: string;
  gallery?: string[];
}

export function validateProjectForm(
  input: ProjectFormInput,
  locale: Locale
): FieldErrors<ProjectFormInput> {
  const errors: FieldErrors<ProjectFormInput> = {};
  const isFa = locale === 'fa';

  const slug = normalizeSlug(input.slug);
  if (slug.length < 2 || slug.length > 100 || !SLUG_REGEX.test(slug)) {
    errors.slug = isFa
      ? 'شناسه URL پروژه باید با حروف کوچک انگلیسی، عدد و خط‌تیره باشد (مثال: mashhad-tower).'
      : 'Project slug must use lowercase English letters, numbers, and hyphens (2–100 chars).';
  }

  if (input.titleFa.trim().length < 2 || input.titleFa.trim().length > 160) {
    errors.titleFa = isFa
      ? 'عنوان فارسی پروژه باید حداقل ۲ کاراکتر باشد.'
      : 'Persian project title must be 2–160 characters.';
  }
  if (input.titleEn.trim().length < 2 || input.titleEn.trim().length > 160) {
    errors.titleEn = isFa
      ? 'عنوان انگلیسی پروژه باید حداقل ۲ کاراکتر باشد.'
      : 'English project title must be 2–160 characters.';
  }
  if (input.cityFa.trim().length < 2 || input.cityFa.trim().length > 100) {
    errors.cityFa = isFa ? 'نام شهر (فارسی) را وارد کنید.' : 'Enter Persian city name.';
  }
  if (input.cityEn.trim().length < 2 || input.cityEn.trim().length > 100) {
    errors.cityEn = isFa ? 'نام شهر (انگلیسی) را وارد کنید.' : 'Enter English city name.';
  }
  if (input.serviceFa.trim().length < 2 || input.serviceFa.trim().length > 100) {
    errors.serviceFa = isFa ? 'برچسب خدمت (فارسی) را وارد کنید.' : 'Enter Persian service label.';
  }
  if (input.serviceEn.trim().length < 2 || input.serviceEn.trim().length > 100) {
    errors.serviceEn = isFa ? 'برچسب خدمت (انگلیسی) را وارد کنید.' : 'Enter English service label.';
  }
  if (!input.disciplines || input.disciplines.length < 1 || input.disciplines.length > 3) {
    errors.disciplines = isFa
      ? 'حداقل ۱ و حداکثر ۳ حوزه تخصصی انتخاب کنید.'
      : 'Select between 1 and 3 disciplines.';
  }
  if (!isSafeImageSrc(input.coverImage) || input.coverImage.trim().length > 500) {
    errors.coverImage = isFa
      ? 'لطفاً تصویر شاخص پروژه را آپلود کنید یا یک آدرس معتبر تصویر وارد کنید.'
      : 'Please upload a cover image or enter a valid image URL.';
  }
  if (input.gallery && input.gallery.length > 8) {
    errors.gallery = isFa
      ? 'حداکثر ۸ تصویر برای گالری پروژه مجاز است.'
      : 'Up to 8 gallery images are allowed per project.';
  }

  return errors;
}

export interface TeamMemberFormInput {
  nameFa: string;
  nameEn: string;
  roleFa: string;
  roleEn: string;
  bioFa?: string;
  bioEn?: string;
  specialtiesFa?: string;
  specialtiesEn?: string;
  resumeFa?: string;
  resumeEn?: string;
  linkedinUrl?: string;
  portraitUrl?: string;
}

export function validateTeamMemberForm(
  input: TeamMemberFormInput,
  locale: Locale
): FieldErrors<TeamMemberFormInput> {
  const errors: FieldErrors<TeamMemberFormInput> = {};
  const isFa = locale === 'fa';

  if (input.nameFa.trim().length < 2 || input.nameFa.trim().length > 120) {
    errors.nameFa = isFa ? 'نام و نام خانوادگی (فارسی) الزامی است.' : 'Persian name is required (2–120 chars).';
  }
  if (input.nameEn.trim().length < 2 || input.nameEn.trim().length > 120) {
    errors.nameEn = isFa ? 'نام و نام خانوادگی (انگلیسی) الزامی است.' : 'English name is required (2–120 chars).';
  }
  if (input.roleFa.trim().length < 2 || input.roleFa.trim().length > 140) {
    errors.roleFa = isFa ? 'سمت / عنوان شغلی (فارسی) الزامی است.' : 'Persian role title is required.';
  }
  if (input.roleEn.trim().length < 2 || input.roleEn.trim().length > 140) {
    errors.roleEn = isFa ? 'سمت / عنوان شغلی (انگلیسی) الزامی است.' : 'English role title is required.';
  }
  if (input.portraitUrl && input.portraitUrl.trim() && !isSafeImageSrc(input.portraitUrl)) {
    errors.portraitUrl = isFa ? 'آدرس تصویر پروفایل معتبر نیست.' : 'Portrait image URL is invalid.';
  }
  if (input.linkedinUrl && !isSafeExternalUrl(input.linkedinUrl)) {
    errors.linkedinUrl = isFa
      ? 'لینک لینکدین باید با https:// شروع شود.'
      : 'LinkedIn URL must start with https://.';
  }
  if ((input.resumeFa?.trim().length ?? 0) > 3000) {
    errors.resumeFa = isFa ? 'رزومه فارسی حداکثر ۳۰۰۰ کاراکتر مجاز است.' : 'Persian resume max 3,000 chars.';
  }
  if ((input.resumeEn?.trim().length ?? 0) > 3000) {
    errors.resumeEn = isFa ? 'رزومه انگلیسی حداکثر ۳۰۰۰ کاراکتر مجاز است.' : 'English resume max 3,000 chars.';
  }

  return errors;
}

export function mergeCatalogProjects<
  T extends {
    slug: string;
    featuredOrder: number;
    isSeedDefault?: boolean;
    verifiedMetrics?: unknown;
  },
>(seedProjects: T[], firestoreProjects: T[], hiddenSeedSlugs: string[] = []): T[] {
  const hiddenSet = new Set(hiddenSeedSlugs);
  const seedBySlug = new Map<string, T>();
  const map = new Map<string, T>();
  for (const seed of seedProjects) {
    seedBySlug.set(seed.slug, seed);
    if (!hiddenSet.has(seed.slug)) {
      map.set(seed.slug, { ...seed, isSeedDefault: true });
    }
  }
  for (const fp of firestoreProjects) {
    const matchingSeed = seedBySlug.get(fp.slug);
    map.set(fp.slug, {
      ...fp,
      verifiedMetrics: fp.verifiedMetrics ?? matchingSeed?.verifiedMetrics,
      isSeedDefault: false,
    });
  }
  return Array.from(map.values()).sort((a, b) => a.featuredOrder - b.featuredOrder);
}

const TEAM_HONORIFIC_RE =
  /^(دکتر|مهندس|استاد|سرکار خانم|جناب آقای|آقای|خانم|dr\.?|eng\.?|arch\.?|prof\.?)\s+/i;

function normalizePersonTokens(name: string): string[] {
  const stripped = name
    .trim()
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/\u200c/g, ' ')
    .replace(TEAM_HONORIFIC_RE, '')
    .replace(/\s+/g, ' ')
    .toLowerCase();
  return stripped.split(' ').filter(Boolean);
}

function isSamePersonName(a: string, b: string): boolean {
  const ta = normalizePersonTokens(a);
  const tb = normalizePersonTokens(b);
  if (ta.length === 0 || tb.length === 0) return false;
  if (ta.join(' ') === tb.join(' ')) return true;
  const [shorter, longer] = ta.length <= tb.length ? [ta, tb] : [tb, ta];
  if (shorter.length < 2) return false;
  const longerSet = new Set(longer);
  return shorter.every((token) => longerSet.has(token));
}

export function mergeTeamMembers<
  T extends {
    id: string;
    nameFa: string;
    order: number;
    tier?: string;
    portraitUrl?: string;
    bioFa?: string;
    bioEn?: string;
    specialtiesFa?: string;
    specialtiesEn?: string;
    resumeFa?: string;
    resumeEn?: string;
    isSeedDefault?: boolean;
  },
>(seedMembers: T[], firestoreMembers: T[]): T[] {
  const byId = new Map<string, T>();
  const seedList: T[] = [];

  for (const seed of seedMembers) {
    const entry = { ...seed, isSeedDefault: true };
    byId.set(seed.id, entry);
    seedList.push(entry);
  }

  for (const fm of firestoreMembers) {
    const matchedSeed =
      (byId.has(fm.id) ? byId.get(fm.id) : undefined) ??
      seedList.find((seed) => isSamePersonName(seed.nameFa, fm.nameFa));

    if (matchedSeed) {
      byId.delete(matchedSeed.id);
      byId.set(fm.id, {
        ...matchedSeed,
        ...fm,
        tier: fm.tier ?? matchedSeed.tier,
        portraitUrl: fm.portraitUrl?.trim() ? fm.portraitUrl : matchedSeed.portraitUrl,
        bioFa: fm.bioFa?.trim() ? fm.bioFa : matchedSeed.bioFa,
        bioEn: fm.bioEn?.trim() ? fm.bioEn : matchedSeed.bioEn,
        specialtiesFa: fm.specialtiesFa?.trim() ? fm.specialtiesFa : matchedSeed.specialtiesFa,
        specialtiesEn: fm.specialtiesEn?.trim() ? fm.specialtiesEn : matchedSeed.specialtiesEn,
        resumeFa: fm.resumeFa?.trim() ? fm.resumeFa : matchedSeed.resumeFa,
        resumeEn: fm.resumeEn?.trim() ? fm.resumeEn : matchedSeed.resumeEn,
        isSeedDefault: false,
      });
    } else {
      byId.set(fm.id, { ...fm, isSeedDefault: false });
    }
  }

  return Array.from(byId.values()).sort((a, b) => a.order - b.order);
}

export interface PartnerLogoFormInput {
  nameFa: string;
  nameEn: string;
  descriptionFa?: string;
  descriptionEn?: string;
  logoUrl?: string;
  presetMarkId?: string;
  websiteUrl?: string;
  order: number;
}

export function validatePartnerLogoForm(
  input: PartnerLogoFormInput,
  locale: Locale
): FieldErrors<PartnerLogoFormInput> {
  const errors: FieldErrors<PartnerLogoFormInput> = {};
  const isFa = locale === 'fa';

  if (input.nameFa.trim().length < 2 || input.nameFa.trim().length > 120) {
    errors.nameFa = isFa
      ? 'نام مجموعه (فارسی) باید بین ۲ تا ۱۲۰ کاراکتر باشد.'
      : 'Persian partner name must be 2–120 characters.';
  }
  if (input.nameEn.trim().length < 2 || input.nameEn.trim().length > 120) {
    errors.nameEn = isFa
      ? 'نام مجموعه (انگلیسی) باید بین ۲ تا ۱۲۰ کاراکتر باشد.'
      : 'English partner name must be 2–120 characters.';
  }
  if (input.descriptionFa && input.descriptionFa.trim().length > 240) {
    errors.descriptionFa = isFa
      ? 'توضیح فارسی نباید بیشتر از ۲۴۰ کاراکتر باشد.'
      : 'Persian description must be 240 characters or fewer.';
  }
  if (input.descriptionEn && input.descriptionEn.trim().length > 240) {
    errors.descriptionEn = isFa
      ? 'توضیح انگلیسی نباید بیشتر از ۲۴۰ کاراکتر باشد.'
      : 'English description must be 240 characters or fewer.';
  }
  if (input.logoUrl && input.logoUrl.trim()) {
    if (!isSafeImageSrc(input.logoUrl) || input.logoUrl.trim().length > 500) {
      errors.logoUrl = isFa
        ? 'آدرس یا فایل تصویر لوگو معتبر نیست.'
        : 'Logo image URL or uploaded file is invalid.';
    }
  }
  if (input.websiteUrl && input.websiteUrl.trim()) {
    if (!isSafeExternalUrl(input.websiteUrl) || input.websiteUrl.trim().length > 240) {
      errors.websiteUrl = isFa
        ? 'نشانی وب‌سایت باید با https:// یا http:// شروع شود.'
        : 'Website URL must start with https:// or http://.';
    }
  }
  if (!Number.isFinite(input.order) || input.order < 0 || input.order > 999) {
    errors.order = isFa ? 'ترتیب نمایش باید عددی بین ۰ تا ۹۹۹ باشد.' : 'Display order must be 0–999.';
  }

  return errors;
}

export function mergePartnerLogos<
  T extends {
    id: string;
    order: number;
    status: 'published' | 'draft';
    descriptionFa?: string;
    descriptionEn?: string;
    isSeedDefault?: boolean;
  },
>(
  seedPartners: T[],
  firestorePartners: T[],
  hiddenSeedIds: string[] = [],
  includeDrafts = false
): T[] {
  const hiddenSet = new Set(hiddenSeedIds);
  const seedById = new Map<string, T>();
  const byId = new Map<string, T>();

  for (const seed of seedPartners) {
    seedById.set(seed.id, seed);
    if (!hiddenSet.has(seed.id)) {
      byId.set(seed.id, { ...seed, isSeedDefault: true });
    }
  }

  for (const fp of firestorePartners) {
    const matchingSeed = seedById.get(fp.id);
    byId.set(fp.id, {
      ...fp,
      descriptionFa: fp.descriptionFa?.trim() ? fp.descriptionFa : matchingSeed?.descriptionFa,
      descriptionEn: fp.descriptionEn?.trim() ? fp.descriptionEn : matchingSeed?.descriptionEn,
      isSeedDefault: false,
    });
  }

  return Array.from(byId.values())
    .filter((item) => includeDrafts || item.status === 'published')
    .sort((a, b) => a.order - b.order);
}





