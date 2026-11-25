import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Edit3,
  Eye,
  EyeOff,
  Plus,
  RotateCcw,
  Save,
  Search,
  Trash2,
  X,
} from '../icons/IsbIcons';
import { ASSETS } from '../../data/assets';
import { SEED_COURSES } from '../../data/seedContent';
import { deleteCourse, saveCourse, saveSiteSettings } from '../../services/contentStore';
import type {
  Course,
  CourseDepartment,
  CourseFormat,
  CourseFormInput,
  Locale,
  SiteSettings,
} from '../../types/content';
import {
  COURSE_DEPARTMENT_LABELS,
  COURSE_FORMAT_LABELS,
  formatTomanAmount,
  normalizeDigits,
  parseSyllabusLines,
  validateCourseForm,
} from '../../utils/accountLogic';
import {
  hasErrors,
  normalizeSlug,
  slugifyEnglish,
  type FieldErrors,
} from '../../utils/validation';
import { SafeImage } from '../BrandMark';
import { ImageUploaderField } from './ImageUploaderField';

const DEPARTMENT_OPTIONS: CourseDepartment[] = [
  'architecture-urbanism',
  'energy-mep',
  'structure-seismic',
  'multidisciplinary',
];

const FORMAT_OPTIONS: CourseFormat[] = ['online-live', 'hybrid', 'in-person', 'recorded'];

interface CourseEditorState extends CourseFormInput {
  existingId?: string;
  isSeedDefault?: boolean;
}

function createEmptyCourse(nextOrder: number): CourseEditorState {
  return {
    slug: '',
    titleFa: '',
    titleEn: '',
    department: 'energy-mep',
    format: 'hybrid',
    instructorFa: 'تیم تخصصی گروه ISB',
    instructorEn: 'ISB Group Faculty',
    durationFa: '۲۰ ساعت آموزشی',
    durationEn: '20 Hours',
    scheduleFa: '',
    scheduleEn: '',
    priceToman: '3500000',
    originalPriceToman: '',
    capacity: '25',
    summaryFa: '',
    summaryEn: '',
    syllabusFaText: '',
    syllabusEnText: '',
    coverImage: ASSETS.expertiseEnergyMep,
    paymentUrl: '',
    paymentNoteFa: '',
    paymentNoteEn: '',
    accessUrl: '',
    featuredOrder: nextOrder,
    status: 'published',
  };
}

function courseToEditor(course: Course): CourseEditorState {
  return {
    existingId: course.isSeedDefault ? course.slug : course.id,
    isSeedDefault: course.isSeedDefault,
    slug: course.slug,
    titleFa: course.titleFa,
    titleEn: course.titleEn,
    department: course.department,
    format: course.format,
    instructorFa: course.instructorFa,
    instructorEn: course.instructorEn,
    durationFa: course.durationFa,
    durationEn: course.durationEn,
    scheduleFa: course.scheduleFa ?? '',
    scheduleEn: course.scheduleEn ?? '',
    priceToman: String(course.priceToman),
    originalPriceToman:
      typeof course.originalPriceToman === 'number' ? String(course.originalPriceToman) : '',
    capacity: typeof course.capacity === 'number' ? String(course.capacity) : '',
    summaryFa: course.summaryFa,
    summaryEn: course.summaryEn,
    syllabusFaText: (course.syllabusFa ?? []).join('\n'),
    syllabusEnText: (course.syllabusEn ?? []).join('\n'),
    coverImage: course.coverImage,
    paymentUrl: course.paymentUrl ?? '',
    paymentNoteFa: course.paymentNoteFa ?? '',
    paymentNoteEn: course.paymentNoteEn ?? '',
    accessUrl: course.accessUrl ?? '',
    featuredOrder: course.featuredOrder,
    status: course.status,
  };
}

interface CoursesManagerProps {
  locale: Locale;
  courses: Course[];
  settings: SiteSettings;
  onRefresh: () => Promise<void>;
  onBanner: (text: string, tone?: 'info' | 'success' | 'error') => void;
}

export function CoursesManager({
  locale,
  courses,
  settings,
  onRefresh,
  onBanner,
}: CoursesManagerProps) {
  const isFa = locale === 'fa';
  const [search, setSearch] = useState('');
  const [editor, setEditor] = useState<CourseEditorState | null>(null);
  const [errors, setErrors] = useState<FieldErrors<CourseFormInput>>({});
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [paymentInstrFa, setPaymentInstrFa] = useState(settings.paymentInstructionsFa ?? '');
  const [paymentInstrEn, setPaymentInstrEn] = useState(settings.paymentInstructionsEn ?? '');
  const [savingPaymentInstr, setSavingPaymentInstr] = useState(false);
  const [showPaymentSettings, setShowPaymentSettings] = useState(false);

  const filtered = courses.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      c.titleFa.toLowerCase().includes(q) ||
      c.titleEn.toLowerCase().includes(q) ||
      c.instructorFa.toLowerCase().includes(q) ||
      c.slug.toLowerCase().includes(q)
    );
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editor) return;

    const validationErrors = validateCourseForm(editor, locale);
    setErrors(validationErrors);
    if (hasErrors(validationErrors)) {
      onBanner(
        isFa
          ? 'لطفاً فیلدهای مشخص‌شده در فرم دوره را تکمیل کنید.'
          : 'Please complete the highlighted course fields.',
        'error'
      );
      return;
    }

    setSaving(true);
    try {
      const priceNum = Number(normalizeDigits(editor.priceToman.replace(/[,\s٬]/g, ''))) || 0;
      const origNum = editor.originalPriceToman.trim()
        ? Number(normalizeDigits(editor.originalPriceToman.replace(/[,\s٬]/g, '')))
        : undefined;
      const capNum = editor.capacity.trim()
        ? Number(normalizeDigits(editor.capacity.trim()))
        : undefined;

      await saveCourse(
        {
          slug: normalizeSlug(editor.slug),
          titleFa: editor.titleFa,
          titleEn: editor.titleEn,
          department: editor.department,
          format: editor.format,
          instructorFa: editor.instructorFa,
          instructorEn: editor.instructorEn,
          durationFa: editor.durationFa,
          durationEn: editor.durationEn,
          scheduleFa: editor.scheduleFa || undefined,
          scheduleEn: editor.scheduleEn || undefined,
          priceToman: Math.max(0, Math.round(priceNum)),
          originalPriceToman:
            typeof origNum === 'number' && !Number.isNaN(origNum) && origNum > 0
              ? Math.round(origNum)
              : undefined,
          capacity:
            typeof capNum === 'number' && !Number.isNaN(capNum) && capNum >= 1
              ? Math.round(capNum)
              : undefined,
          summaryFa: editor.summaryFa,
          summaryEn: editor.summaryEn,
          syllabusFa: parseSyllabusLines(editor.syllabusFaText),
          syllabusEn: parseSyllabusLines(editor.syllabusEnText),
          coverImage: editor.coverImage,
          paymentUrl: editor.paymentUrl.trim() || undefined,
          paymentNoteFa: editor.paymentNoteFa.trim() || undefined,
          paymentNoteEn: editor.paymentNoteEn.trim() || undefined,
          accessUrl: editor.accessUrl.trim() || undefined,
          featuredOrder: editor.featuredOrder,
          status: editor.status,
        },
        editor.existingId
      );

      // Ensure this slug isn't listed as hidden if admin re-publishes a starter course
      if ((settings.hiddenSeedCourseSlugs ?? []).includes(normalizeSlug(editor.slug))) {
        await saveSiteSettings({
          ...settings,
          hiddenSeedCourseSlugs: (settings.hiddenSeedCourseSlugs ?? []).filter(
            (s) => s !== normalizeSlug(editor.slug)
          ),
        });
      }

      await onRefresh();
      setEditor(null);
      setErrors({});
      onBanner(
        isFa
          ? 'دوره با موفقیت ذخیره و در صفحه دوره‌های سایت منتشر شد.'
          : 'Course saved and updated live on the Courses page.',
        'success'
      );
    } catch {
      onBanner(
        isFa ? 'خطا در ذخیره دوره. لطفاً دوباره تلاش کنید.' : 'Could not save course.',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (course: Course) => {
    const nextStatus = course.status === 'published' ? 'draft' : 'published';
    try {
      await saveCourse(
        {
          slug: course.slug,
          titleFa: course.titleFa,
          titleEn: course.titleEn,
          department: course.department,
          format: course.format,
          instructorFa: course.instructorFa,
          instructorEn: course.instructorEn,
          durationFa: course.durationFa,
          durationEn: course.durationEn,
          scheduleFa: course.scheduleFa,
          scheduleEn: course.scheduleEn,
          priceToman: course.priceToman,
          originalPriceToman: course.originalPriceToman,
          capacity: course.capacity,
          summaryFa: course.summaryFa,
          summaryEn: course.summaryEn,
          syllabusFa: course.syllabusFa,
          syllabusEn: course.syllabusEn,
          coverImage: course.coverImage,
          paymentUrl: course.paymentUrl,
          paymentNoteFa: course.paymentNoteFa,
          paymentNoteEn: course.paymentNoteEn,
          accessUrl: course.accessUrl,
          featuredOrder: course.featuredOrder,
          status: nextStatus,
        },
        course.isSeedDefault ? course.slug : course.id
      );
      await onRefresh();
      onBanner(
        nextStatus === 'published'
          ? isFa
            ? 'دوره در سایت منتشر شد.'
            : 'Course published.'
          : isFa
            ? 'دوره به حالت پیش‌نویس منتقل شد.'
            : 'Course moved to draft.',
        'success'
      );
    } catch {
      onBanner(isFa ? 'تغییر وضعیت دوره ناموفق بود.' : 'Could not toggle course status.', 'error');
    }
  };

  const handleDeleteOrHide = async (course: Course) => {
    try {
      if (!course.isSeedDefault) {
        await deleteCourse(course.id);
      }
      const hidden = new Set(settings.hiddenSeedCourseSlugs ?? []);
      if (course.isSeedDefault || SEED_COURSES.some((seed) => seed.slug === course.slug)) {
        hidden.add(course.slug);
        await saveSiteSettings({
          ...settings,
          hiddenSeedCourseSlugs: Array.from(hidden),
        });
      }
      setConfirmDeleteId(null);
      await onRefresh();
      onBanner(isFa ? 'دوره از فهرست حذف شد.' : 'Course removed from catalog.', 'success');
    } catch {
      onBanner(isFa ? 'خطا در حذف دوره.' : 'Could not delete course.', 'error');
    }
  };

  const handleRestoreStarterCourses = async () => {
    try {
      await saveSiteSettings({
        ...settings,
        hiddenSeedCourseSlugs: [],
      });
      await onRefresh();
      onBanner(
        isFa ? 'دوره‌های پیش‌فرض آکادمی بازیابی شدند.' : 'Starter academy courses restored.',
        'success'
      );
    } catch {
      onBanner(isFa ? 'خطا در بازیابی دوره‌ها.' : 'Could not restore starter courses.', 'error');
    }
  };

  const handleSaveGlobalPaymentInstructions = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPaymentInstr(true);
    try {
      await saveSiteSettings({
        ...settings,
        paymentInstructionsFa: paymentInstrFa,
        paymentInstructionsEn: paymentInstrEn,
      });
      await onRefresh();
      setShowPaymentSettings(false);
      onBanner(
        isFa
          ? 'راهنمای پرداخت دوره‌ها ذخیره شد.'
          : 'Default course payment instructions updated.',
        'success'
      );
    } catch {
      onBanner(
        isFa ? 'خطا در ذخیره راهنمای پرداخت.' : 'Could not save payment instructions.',
        'error'
      );
    } finally {
      setSavingPaymentInstr(false);
    }
  };

  const inputClass =
    'w-full rounded-xl border border-[#6F9BFF]/25 bg-[#080D16]/80 px-3.5 py-2.5 text-sm text-[#F5F8FC] placeholder:text-[#8B9DB7]/70 focus:outline-none focus:border-[#6F9BFF]';

  if (editor) {
    return (
      <form onSubmit={handleSave} noValidate className="glass-surface rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-[#F5F8FC]">
              {editor.existingId
                ? isFa
                  ? 'ویرایش دوره آموزشی'
                  : 'Edit Course'
                : isFa
                  ? 'افزودن دوره آموزشی جدید'
                  : 'Create New Course'}
            </h2>
            <p className="text-xs text-[#9FB0C9]">
              {isFa
                ? 'تمامی تغییرات پس از ذخیره بلافاصله در تب «دوره‌ها» برای ثبت‌نام و پرداخت کاربران فعال می‌شود.'
                : 'Changes go live immediately on the public Courses page for member enrollment and checkout.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditor(null);
              setErrors({});
            }}
            className="glass-pill min-h-[38px] inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs text-[#C6D2E3] hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>{isFa ? 'انصراف و بازگشت' : 'Cancel'}</span>
          </button>
        </div>

        {/* Core Titles & Slug */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="crs-title-fa" className="block text-xs font-medium text-[#DCE6F5]">
              {isFa ? 'عنوان فارسی دوره *' : 'Persian Title *'}
            </label>
            <input
              id="crs-title-fa"
              type="text"
              value={editor.titleFa}
              onChange={(e) => setEditor({ ...editor, titleFa: e.target.value })}
              placeholder={isFa ? 'مثال: شبیه‌سازی انرژی و نور روز' : 'Persian course title'}
              className={inputClass}
            />
            {errors.titleFa && <p className="text-xs text-amber-300">{errors.titleFa}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="crs-title-en" className="block text-xs font-medium text-[#DCE6F5]">
              {isFa ? 'عنوان انگلیسی دوره *' : 'English Title *'}
            </label>
            <input
              id="crs-title-en"
              type="text"
              dir="ltr"
              value={editor.titleEn}
              onChange={(e) => {
                const nextEn = e.target.value;
                setEditor((prev) =>
                  prev
                    ? {
                        ...prev,
                        titleEn: nextEn,
                        slug: prev.existingId ? prev.slug : slugifyEnglish(nextEn),
                      }
                    : prev
                );
              }}
              placeholder="Applied Building Energy Simulation"
              className={inputClass}
            />
            {errors.titleEn && <p className="text-xs text-amber-300">{errors.titleEn}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="crs-slug" className="block text-xs font-medium text-[#DCE6F5]">
              {isFa ? 'شناسه یکتا انگلیسی (Slug) *' : 'URL Slug *'}
            </label>
            <input
              id="crs-slug"
              type="text"
              dir="ltr"
              value={editor.slug}
              onChange={(e) => setEditor({ ...editor, slug: e.target.value })}
              placeholder="building-energy-simulation"
              className={`${inputClass} font-mono`}
            />
            {errors.slug && <p className="text-xs text-amber-300">{errors.slug}</p>}
          </div>
        </div>

        {/* Classification, Pricing & Schedule */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="crs-dept" className="block text-xs font-medium text-[#DCE6F5]">
              {isFa ? 'دپارتمان برگزارکننده *' : 'Department *'}
            </label>
            <select
              id="crs-dept"
              value={editor.department}
              onChange={(e) =>
                setEditor({ ...editor, department: e.target.value as CourseDepartment })
              }
              className={inputClass}
            >
              {DEPARTMENT_OPTIONS.map((dept) => (
                <option key={dept} value={dept} className="bg-[#0E1626]">
                  {isFa ? COURSE_DEPARTMENT_LABELS[dept].fa : COURSE_DEPARTMENT_LABELS[dept].en}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="crs-format" className="block text-xs font-medium text-[#DCE6F5]">
              {isFa ? 'نحوه برگزاری *' : 'Format *'}
            </label>
            <select
              id="crs-format"
              value={editor.format}
              onChange={(e) => setEditor({ ...editor, format: e.target.value as CourseFormat })}
              className={inputClass}
            >
              {FORMAT_OPTIONS.map((fmt) => (
                <option key={fmt} value={fmt} className="bg-[#0E1626]">
                  {isFa ? COURSE_FORMAT_LABELS[fmt].fa : COURSE_FORMAT_LABELS[fmt].en}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="crs-price" className="block text-xs font-medium text-[#DCE6F5]">
              {isFa ? 'شهریه دوره (تومان · ۰ برای رایگان) *' : 'Price (Toman · 0 = Free) *'}
            </label>
            <input
              id="crs-price"
              type="text"
              dir="ltr"
              value={editor.priceToman}
              onChange={(e) => setEditor({ ...editor, priceToman: e.target.value })}
              placeholder="4800000"
              className={`${inputClass} font-mono font-numeric`}
            />
            {errors.priceToman && <p className="text-xs text-amber-300">{errors.priceToman}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="crs-orig-price" className="block text-xs font-medium text-[#DCE6F5]">
              {isFa ? 'مبلغ قبل از تخفیف (اختیاری)' : 'Original Price (Optional)'}
            </label>
            <input
              id="crs-orig-price"
              type="text"
              dir="ltr"
              value={editor.originalPriceToman}
              onChange={(e) => setEditor({ ...editor, originalPriceToman: e.target.value })}
              placeholder="5900000"
              className={`${inputClass} font-mono font-numeric`}
            />
            {errors.originalPriceToman && (
              <p className="text-xs text-amber-300">{errors.originalPriceToman}</p>
            )}
          </div>
        </div>

        {/* Instructor & Duration */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="crs-inst-fa" className="block text-xs font-medium text-[#DCE6F5]">
              {isFa ? 'مدرس / تیم آموزشی (فارسی) *' : 'Instructor (FA) *'}
            </label>
            <input
              id="crs-inst-fa"
              type="text"
              value={editor.instructorFa}
              onChange={(e) => setEditor({ ...editor, instructorFa: e.target.value })}
              className={inputClass}
            />
            {errors.instructorFa && <p className="text-xs text-amber-300">{errors.instructorFa}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="crs-inst-en" className="block text-xs font-medium text-[#DCE6F5]">
              {isFa ? 'مدرس / تیم آموزشی (انگلیسی) *' : 'Instructor (EN) *'}
            </label>
            <input
              id="crs-inst-en"
              type="text"
              dir="ltr"
              value={editor.instructorEn}
              onChange={(e) => setEditor({ ...editor, instructorEn: e.target.value })}
              className={inputClass}
            />
            {errors.instructorEn && <p className="text-xs text-amber-300">{errors.instructorEn}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="crs-dur-fa" className="block text-xs font-medium text-[#DCE6F5]">
              {isFa ? 'مدت دوره (فارسی) *' : 'Duration (FA) *'}
            </label>
            <input
              id="crs-dur-fa"
              type="text"
              value={editor.durationFa}
              onChange={(e) => setEditor({ ...editor, durationFa: e.target.value })}
              placeholder="۲۴ ساعت آموزشی"
              className={inputClass}
            />
            {errors.durationFa && <p className="text-xs text-amber-300">{errors.durationFa}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="crs-dur-en" className="block text-xs font-medium text-[#DCE6F5]">
              {isFa ? 'مدت دوره (انگلیسی) *' : 'Duration (EN) *'}
            </label>
            <input
              id="crs-dur-en"
              type="text"
              dir="ltr"
              value={editor.durationEn}
              onChange={(e) => setEditor({ ...editor, durationEn: e.target.value })}
              placeholder="24 Hours"
              className={inputClass}
            />
            {errors.durationEn && <p className="text-xs text-amber-300">{errors.durationEn}</p>}
          </div>
        </div>

        {/* Schedule, Capacity, Order, Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="crs-sch-fa" className="block text-xs font-medium text-[#DCE6F5]">
              {isFa ? 'زمان‌بندی کلاس (فارسی)' : 'Schedule (FA)'}
            </label>
            <input
              id="crs-sch-fa"
              type="text"
              value={editor.scheduleFa}
              onChange={(e) => setEditor({ ...editor, scheduleFa: e.target.value })}
              placeholder="پنج‌شنبه‌ها ساعت ۱۶ تا ۱۹"
              className={inputClass}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="crs-sch-en" className="block text-xs font-medium text-[#DCE6F5]">
              {isFa ? 'زمان‌بندی کلاس (انگلیسی)' : 'Schedule (EN)'}
            </label>
            <input
              id="crs-sch-en"
              type="text"
              dir="ltr"
              value={editor.scheduleEn}
              onChange={(e) => setEditor({ ...editor, scheduleEn: e.target.value })}
              placeholder="Thursdays · 16:00–19:00 IRST"
              className={inputClass}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="crs-cap" className="block text-xs font-medium text-[#DCE6F5]">
              {isFa ? 'ظرفیت (نفر)' : 'Capacity'}
            </label>
            <input
              id="crs-cap"
              type="number"
              min={1}
              max={10000}
              dir="ltr"
              value={editor.capacity}
              onChange={(e) => setEditor({ ...editor, capacity: e.target.value })}
              className={`${inputClass} font-numeric`}
            />
            {errors.capacity && <p className="text-xs text-amber-300">{errors.capacity}</p>}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <label htmlFor="crs-order" className="block text-xs font-medium text-[#DCE6F5]">
                {isFa ? 'ترتیب' : 'Order'}
              </label>
              <input
                id="crs-order"
                type="number"
                min={0}
                max={999}
                dir="ltr"
                value={editor.featuredOrder}
                onChange={(e) =>
                  setEditor({ ...editor, featuredOrder: Number(e.target.value) || 0 })
                }
                className={`${inputClass} font-numeric`}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="crs-status" className="block text-xs font-medium text-[#DCE6F5]">
                {isFa ? 'وضعیت' : 'Status'}
              </label>
              <select
                id="crs-status"
                value={editor.status}
                onChange={(e) =>
                  setEditor({
                    ...editor,
                    status: e.target.value === 'draft' ? 'draft' : 'published',
                  })
                }
                className={inputClass}
              >
                <option value="published" className="bg-[#0E1626]">
                  {isFa ? 'منتشرشده' : 'Published'}
                </option>
                <option value="draft" className="bg-[#0E1626]">
                  {isFa ? 'پیش‌نویس' : 'Draft'}
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* Cover Image Upload + Quick Presets */}
        <div className="space-y-3 rounded-2xl border border-white/10 bg-[#080D16]/45 p-4">
          <ImageUploaderField
            locale={locale}
            label={isFa ? 'تصویر کاور دوره *' : 'Course Cover Image *'}
            value={editor.coverImage}
            preset="cover"
            onChange={(url) => setEditor({ ...editor, coverImage: url })}
            error={errors.coverImage}
          />
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#9FB0C9]">
            <span>{isFa ? 'یا انتخاب سریع از تصاویر استودیو:' : 'Quick studio cover presets:'}</span>
            {[
              { label: isFa ? 'معماری' : 'Architecture', src: ASSETS.expertiseArchitecture },
              { label: isFa ? 'انرژی و پایداری' : 'Energy', src: ASSETS.expertiseEnergyMep },
              { label: isFa ? 'سازه و زلزله' : 'Structure', src: ASSETS.expertiseStructure },
            ].map((preset) => (
              <button
                key={preset.src}
                type="button"
                onClick={() => setEditor({ ...editor, coverImage: preset.src })}
                className={`rounded-lg border px-2.5 py-1 transition-colors cursor-pointer ${
                  editor.coverImage === preset.src
                    ? 'border-[#28CF77] bg-[#00A651]/18 text-white'
                    : 'border-white/15 bg-white/5 text-[#C6D2E3] hover:border-[#6F9BFF]'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bilingual Summaries */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="crs-sum-fa" className="block text-xs font-medium text-[#DCE6F5]">
              {isFa ? 'معرفی و توضیحات فارسی دوره *' : 'Persian Summary *'}
            </label>
            <textarea
              id="crs-sum-fa"
              rows={4}
              value={editor.summaryFa}
              onChange={(e) => setEditor({ ...editor, summaryFa: e.target.value })}
              className={inputClass}
            />
            {errors.summaryFa && <p className="text-xs text-amber-300">{errors.summaryFa}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="crs-sum-en" className="block text-xs font-medium text-[#DCE6F5]">
              {isFa ? 'معرفی و توضیحات انگلیسی دوره *' : 'English Summary *'}
            </label>
            <textarea
              id="crs-sum-en"
              rows={4}
              dir="ltr"
              value={editor.summaryEn}
              onChange={(e) => setEditor({ ...editor, summaryEn: e.target.value })}
              className={inputClass}
            />
            {errors.summaryEn && <p className="text-xs text-amber-300">{errors.summaryEn}</p>}
          </div>
        </div>

        {/* Bilingual Syllabus Lines */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="crs-syl-fa" className="block text-xs font-medium text-[#DCE6F5]">
              {isFa ? 'سرفصل‌های فارسی (هر سرفصل در یک خط)' : 'Persian Syllabus (one per line)'}
            </label>
            <textarea
              id="crs-syl-fa"
              rows={5}
              value={editor.syllabusFaText}
              onChange={(e) => setEditor({ ...editor, syllabusFaText: e.target.value })}
              placeholder={
                isFa
                  ? 'فصل اول: مبانی و اقلیم‌شناسی\nفصل دوم: مدلسازی حرارتی و نور روز'
                  : 'Module 1...\nModule 2...'
              }
              className={inputClass}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="crs-syl-en" className="block text-xs font-medium text-[#DCE6F5]">
              {isFa ? 'سرفصل‌های انگلیسی (هر سرفصل در یک خط)' : 'English Syllabus (one per line)'}
            </label>
            <textarea
              id="crs-syl-en"
              rows={5}
              dir="ltr"
              value={editor.syllabusEnText}
              onChange={(e) => setEditor({ ...editor, syllabusEnText: e.target.value })}
              placeholder={'Module 1: Climate & site analysis\nModule 2: Energy & daylight simulation'}
              className={inputClass}
            />
          </div>
        </div>

        {/* Payment Gateway & Classroom Access Settings */}
        <div className="rounded-2xl border border-[#28CF77]/25 bg-[#08151B]/65 p-5 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-[#28CF77]">
              {isFa ? 'تنظیمات پرداخت و لینک دسترسی دوره' : 'Payment Gateway & Course Access'}
            </h3>
            <p className="text-xs text-[#9FB0C9] mt-0.5">
              {isFa
                ? 'می‌توانید لینک درگاه پرداخت (مثلاً زرین‌پال، آیدی‌پی، زیبال) و یا توضیحات شماره کارت/حساب اختصاصی این دوره را وارد کنید.'
                : 'Optionally connect a direct payment link (e.g. Zarinpal/IDPay) and custom payment instructions or classroom URL.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="crs-pay-url" className="block text-xs font-medium text-[#DCE6F5]">
                {isFa ? 'لینک مستقیم درگاه پرداخت (https://)' : 'Direct Payment Gateway URL (https://)'}
              </label>
              <input
                id="crs-pay-url"
                type="url"
                dir="ltr"
                value={editor.paymentUrl}
                onChange={(e) => setEditor({ ...editor, paymentUrl: e.target.value })}
                placeholder="https://zarinp.al/..."
                className={inputClass}
              />
              {errors.paymentUrl && <p className="text-xs text-amber-300">{errors.paymentUrl}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="crs-access-url" className="block text-xs font-medium text-[#DCE6F5]">
                {isFa ? 'لینک کلاس / فایل‌های دوره (پس از تأیید پرداخت)' : 'Course Access / Classroom URL'}
              </label>
              <input
                id="crs-access-url"
                type="url"
                dir="ltr"
                value={editor.accessUrl}
                onChange={(e) => setEditor({ ...editor, accessUrl: e.target.value })}
                placeholder="https://..."
                className={inputClass}
              />
              {errors.accessUrl && <p className="text-xs text-amber-300">{errors.accessUrl}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="crs-pay-fa" className="block text-xs font-medium text-[#DCE6F5]">
                {isFa ? 'توضیحات پرداخت یا شماره کارت (فارسی)' : 'Payment Instructions (FA)'}
              </label>
              <textarea
                id="crs-pay-fa"
                rows={2}
                value={editor.paymentNoteFa}
                onChange={(e) => setEditor({ ...editor, paymentNoteFa: e.target.value })}
                placeholder={isFa ? 'مثلاً شماره کارت یا توضیحات واریز...' : 'Optional card / transfer note'}
                className={inputClass}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="crs-pay-en" className="block text-xs font-medium text-[#DCE6F5]">
                {isFa ? 'توضیحات پرداخت (انگلیسی)' : 'Payment Instructions (EN)'}
              </label>
              <textarea
                id="crs-pay-en"
                rows={2}
                dir="ltr"
                value={editor.paymentNoteEn}
                onChange={(e) => setEditor({ ...editor, paymentNoteEn: e.target.value })}
                placeholder="Optional payment instructions shown during checkout"
                className={inputClass}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={() => {
              setEditor(null);
              setErrors({});
            }}
            className="glass-pill min-h-[42px] rounded-full px-5 py-2 text-xs text-[#C6D2E3] cursor-pointer"
          >
            {isFa ? 'انصراف' : 'Cancel'}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="glass-cta-emerald min-h-[42px] inline-flex items-center gap-2 rounded-full px-6 py-2 text-xs font-semibold cursor-pointer disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            <span>
              {saving
                ? isFa
                  ? 'در حال ذخیره...'
                  : 'Saving...'
                : isFa
                  ? 'ذخیره و انتشار دوره'
                  : 'Save Course'}
            </span>
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search
            className={`w-4 h-4 text-[#8B9DB7] absolute top-1/2 -translate-y-1/2 ${
              isFa ? 'right-3.5' : 'left-3.5'
            }`}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isFa ? 'جستجو در دوره‌ها...' : 'Search courses...'}
            className={`w-full rounded-full border border-[#6F9BFF]/25 bg-[#0C1424]/85 py-2 text-xs text-[#F5F8FC] focus:outline-none focus:border-[#6F9BFF] ${
              isFa ? 'pr-10 pl-4' : 'pl-10 pr-4'
            }`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPaymentSettings((prev) => !prev)}
            className="glass-pill min-h-[40px] inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs text-[#C6D2E3] hover:border-[#6F9BFF] cursor-pointer"
          >
            <span>{isFa ? 'راهنمای پرداخت پیش‌فرض' : 'Default Payment Note'}</span>
          </button>

          {(settings.hiddenSeedCourseSlugs?.length ?? 0) > 0 && (
            <button
              type="button"
              onClick={() => void handleRestoreStarterCourses()}
              className="glass-pill min-h-[40px] inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs text-[#C6D2E3] hover:border-[#28CF77] cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isFa ? 'بازیابی دوره‌های نمونه' : 'Restore Defaults'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setEditor(createEmptyCourse(courses.length + 1));
              setErrors({});
            }}
            className="glass-cta-emerald min-h-[40px] inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-xs font-semibold cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isFa ? 'افزودن دوره جدید' : 'Add New Course'}</span>
          </button>
        </div>
      </div>

      {/* Collapsible Global Payment Instructions Editor */}
      {showPaymentSettings && (
        <form
          onSubmit={handleSaveGlobalPaymentInstructions}
          className="glass-surface rounded-2xl p-5 space-y-4 border border-[#28CF77]/25"
        >
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-[#F5F8FC]">
              {isFa
                ? 'راهنمای پرداخت عمومی دوره‌ها (شماره کارت / توضیحات واریز)'
                : 'Default Payment Instructions for All Courses'}
            </h3>
            <button
              type="button"
              onClick={() => setShowPaymentSettings(false)}
              className="text-xs text-[#8B9DB7] hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="global-pay-fa" className="block text-xs text-[#C6D2E3]">
                {isFa ? 'متن فارسی (نمایش در مرحله پرداخت)' : 'Persian Instructions'}
              </label>
              <textarea
                id="global-pay-fa"
                rows={3}
                value={paymentInstrFa}
                onChange={(e) => setPaymentInstrFa(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="global-pay-en" className="block text-xs text-[#C6D2E3]">
                {isFa ? 'متن انگلیسی' : 'English Instructions'}
              </label>
              <textarea
                id="global-pay-en"
                rows={3}
                dir="ltr"
                value={paymentInstrEn}
                onChange={(e) => setPaymentInstrEn(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingPaymentInstr}
              className="glass-cta min-h-[38px] inline-flex items-center gap-1.5 rounded-full px-5 py-1.5 text-xs font-semibold cursor-pointer disabled:opacity-60"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{savingPaymentInstr ? (isFa ? 'در حال ذخیره...' : 'Saving...') : isFa ? 'ذخیره راهنما' : 'Save Note'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Courses List */}
      {filtered.length === 0 ? (
        <div className="glass-surface rounded-2xl p-10 text-center space-y-3">
          <BookOpen className="w-8 h-8 text-[#6F9BFF] mx-auto" />
          <p className="text-sm text-[#C6D2E3]">
            {isFa ? 'دوره‌ای یافت نشد. اولین دوره را اضافه کنید.' : 'No courses found.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((course) => (
            <div
              key={course.id}
              className="glass-surface rounded-2xl overflow-hidden border border-white/10 flex flex-col"
            >
              <div className="flex gap-4 p-4">
                <div className="w-24 h-24 rounded-xl overflow-hidden border border-white/10 shrink-0 bg-[#080D16]">
                  <SafeImage
                    src={course.coverImage}
                    alt={isFa ? course.titleFa : course.titleEn}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2 text-[11px]">
                    <span
                      className={`font-semibold ${
                        course.status === 'published' ? 'text-[#28CF77]' : 'text-amber-300'
                      }`}
                    >
                      {course.status === 'published'
                        ? isFa
                          ? 'منتشرشده'
                          : 'Published'
                        : isFa
                          ? 'پیش‌نویس'
                          : 'Draft'}
                    </span>
                    <span className="text-[#8B9DB7]">·</span>
                    <span className="text-[#8AB0FF]">
                      {isFa
                        ? COURSE_DEPARTMENT_LABELS[course.department].fa
                        : COURSE_DEPARTMENT_LABELS[course.department].en}
                    </span>
                    {course.isSeedDefault && (
                      <>
                        <span className="text-[#8B9DB7]">·</span>
                        <span className="text-[#9FB0C9]">{isFa ? 'پیش‌فرض' : 'Starter'}</span>
                      </>
                    )}
                  </div>

                  <h3 className="text-sm font-semibold text-[#F5F8FC] line-clamp-2 leading-snug">
                    {isFa ? course.titleFa : course.titleEn}
                  </h3>

                  <p className="text-xs text-[#9FB0C9] truncate">
                    {isFa ? course.instructorFa : course.instructorEn} ·{' '}
                    {isFa ? course.durationFa : course.durationEn}
                  </p>

                  <div className="flex items-center gap-2 pt-0.5">
                    <span className="text-xs font-mono font-numeric font-semibold text-[#28CF77]">
                      {formatTomanAmount(course.priceToman, locale)}
                    </span>
                    {course.originalPriceToman && course.originalPriceToman > course.priceToman && (
                      <span className="text-[11px] font-mono font-numeric text-[#8B9DB7] line-through">
                        {formatTomanAmount(course.originalPriceToman, locale)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-auto border-t border-white/10 px-4 py-3 bg-[#080D16]/45 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditor(courseToEditor(course));
                      setErrors({});
                    }}
                    className="min-h-[34px] inline-flex items-center gap-1.5 rounded-lg border border-[#6F9BFF]/35 bg-[#223A87]/25 px-3 py-1 text-xs font-medium text-[#DCE8FF] hover:border-[#6F9BFF] cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{isFa ? 'ویرایش' : 'Edit'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleToggleStatus(course)}
                    className="min-h-[34px] inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1 text-xs text-[#C6D2E3] hover:text-white cursor-pointer"
                  >
                    {course.status === 'published' ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>{isFa ? 'پیش‌نویس' : 'Unpublish'}</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>{isFa ? 'انتشار' : 'Publish'}</span>
                      </>
                    )}
                  </button>
                </div>

                {confirmDeleteId === course.id ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => void handleDeleteOrHide(course)}
                      className="rounded-lg bg-rose-600/80 px-2.5 py-1 text-[11px] font-semibold text-white cursor-pointer"
                    >
                      {isFa ? 'تأیید حذف' : 'Confirm'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="rounded-lg border border-white/15 px-2.5 py-1 text-[11px] text-[#C6D2E3] cursor-pointer"
                    >
                      {isFa ? 'لغو' : 'Cancel'}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(course.id)}
                    aria-label={isFa ? 'حذف دوره' : 'Delete course'}
                    className="p-2 rounded-lg border border-rose-400/25 text-rose-300 hover:bg-rose-500/15 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
