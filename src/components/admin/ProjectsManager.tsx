import React, { useState } from 'react';
import {
  CheckCircle2,
  Edit3,
  Eye,
  EyeOff,
  FolderPlus,
  MapPin,
  RotateCcw,
  Save,
  Search,
  Trash2,
  X,
} from '../icons/IsbIcons';
import { DISCIPLINES, SEED_PROJECTS } from '../../data/seedContent';
import { deleteProject, saveProject, saveSiteSettings } from '../../services/contentStore';
import type {
  DisciplineSlug,
  Locale,
  Project,
  ProjectCategory,
  SiteSettings,
} from '../../types/content';
import {
  hasErrors,
  normalizeSlug,
  slugifyEnglish,
  validateProjectForm,
  type FieldErrors,
  type ProjectFormInput,
} from '../../utils/validation';
import { SafeImage } from '../BrandMark';
import { GalleryUploader, ImageUploaderField } from './ImageUploaderField';

const CATEGORY_OPTIONS: { value: ProjectCategory; fa: string; en: string }[] = [
  { value: 'administrative', fa: 'اداری و سازمانی', en: 'Administrative' },
  { value: 'residential', fa: 'مسکونی', en: 'Residential' },
  { value: 'industrial', fa: 'صنعتی و کارخانه', en: 'Industrial' },
  { value: 'educational', fa: 'آموزشی و مدرسه', en: 'Educational' },
  { value: 'urban-park', fa: 'پارک و فضای شهری', en: 'Urban Park' },
  { value: 'mixed-use', fa: 'چندمنظوره / تجاری', en: 'Mixed-Use' },
  { value: 'cultural', fa: 'فرهنگی و عمومی', en: 'Cultural / Civic' },
];

interface ProjectEditorState {
  existingId?: string;
  isSeedDefault?: boolean;
  slug: string;
  titleFa: string;
  titleEn: string;
  cityFa: string;
  cityEn: string;
  category: ProjectCategory;
  serviceFa: string;
  serviceEn: string;
  disciplines: DisciplineSlug[];
  roleFa: string;
  roleEn: string;
  briefFa: string;
  briefEn: string;
  approachFa: string;
  approachEn: string;
  year: string;
  areaSqm: string;
  coverImage: string;
  gallery: string[];
  imageDisclosure: 'concept' | 'photograph';
  featuredOrder: number;
  status: 'draft' | 'published';
}

function createEmptyProject(nextOrder: number): ProjectEditorState {
  return {
    slug: '',
    titleFa: '',
    titleEn: '',
    cityFa: 'مشهد',
    cityEn: 'Mashhad',
    category: 'residential',
    serviceFa: 'معماری و طراحی',
    serviceEn: 'Architecture',
    disciplines: ['architecture-urbanism'],
    roleFa: '',
    roleEn: '',
    briefFa: '',
    briefEn: '',
    approachFa: '',
    approachEn: '',
    year: '',
    areaSqm: '',
    coverImage: '',
    gallery: [],
    imageDisclosure: 'photograph',
    featuredOrder: nextOrder,
    status: 'published',
  };
}

function projectToEditor(p: Project): ProjectEditorState {
  return {
    existingId: p.isSeedDefault ? p.slug : p.id,
    isSeedDefault: p.isSeedDefault,
    slug: p.slug,
    titleFa: p.titleFa,
    titleEn: p.titleEn,
    cityFa: p.cityFa,
    cityEn: p.cityEn,
    category: p.category,
    serviceFa: p.serviceFa,
    serviceEn: p.serviceEn,
    disciplines: p.disciplines.length > 0 ? p.disciplines : ['architecture-urbanism'],
    roleFa: p.roleFa ?? '',
    roleEn: p.roleEn ?? '',
    briefFa: p.briefFa ?? '',
    briefEn: p.briefEn ?? '',
    approachFa: p.approachFa ?? '',
    approachEn: p.approachEn ?? '',
    year: p.year ?? '',
    areaSqm: p.areaSqm ?? '',
    coverImage: p.coverImage,
    gallery: p.gallery ?? [],
    imageDisclosure: p.imageDisclosure,
    featuredOrder: p.featuredOrder,
    status: p.status,
  };
}

interface ProjectsManagerProps {
  locale: Locale;
  projects: Project[];
  settings: SiteSettings;
  onRefresh: () => Promise<void>;
  onBanner: (text: string, tone?: 'info' | 'success' | 'error') => void;
}

export function ProjectsManager({
  locale,
  projects,
  settings,
  onRefresh,
  onBanner,
}: ProjectsManagerProps) {
  const isFa = locale === 'fa';
  const [search, setSearch] = useState('');
  const [editor, setEditor] = useState<ProjectEditorState | null>(null);
  const [errors, setErrors] = useState<FieldErrors<ProjectFormInput>>({});
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filtered = projects.filter((p) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      p.titleFa.toLowerCase().includes(q) ||
      p.titleEn.toLowerCase().includes(q) ||
      p.cityFa.toLowerCase().includes(q) ||
      p.slug.toLowerCase().includes(q)
    );
  });

  const toggleDiscipline = (slug: DisciplineSlug) => {
    if (!editor) return;
    const exists = editor.disciplines.includes(slug);
    const next = exists
      ? editor.disciplines.filter((d) => d !== slug)
      : [...editor.disciplines, slug].slice(0, 3);
    setEditor({ ...editor, disciplines: next });
    if (errors.disciplines) setErrors({ ...errors, disciplines: undefined });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editor) return;

    const validationErrors = validateProjectForm(editor, locale);
    setErrors(validationErrors);
    if (hasErrors(validationErrors)) {
      onBanner(
        isFa
          ? 'لطفاً فیلدهای مشخص‌شده در فرم پروژه را تکمیل کنید.'
          : 'Please complete the highlighted project fields.',
        'error'
      );
      return;
    }

    setSaving(true);
    try {
      await saveProject(
        {
          slug: normalizeSlug(editor.slug),
          titleFa: editor.titleFa,
          titleEn: editor.titleEn,
          cityFa: editor.cityFa,
          cityEn: editor.cityEn,
          category: editor.category,
          serviceFa: editor.serviceFa,
          serviceEn: editor.serviceEn,
          disciplines: editor.disciplines,
          roleFa: editor.roleFa,
          roleEn: editor.roleEn,
          briefFa: editor.briefFa,
          briefEn: editor.briefEn,
          approachFa: editor.approachFa,
          approachEn: editor.approachEn,
          year: editor.year,
          areaSqm: editor.areaSqm,
          coverImage: editor.coverImage,
          gallery: editor.gallery,
          imageDisclosure: editor.imageDisclosure,
          featuredOrder: editor.featuredOrder,
          status: editor.status,
        },
        editor.existingId
      );
      await onRefresh();
      setEditor(null);
      setErrors({});
      onBanner(
        isFa
          ? 'پروژه با موفقیت ذخیره و در سایت به‌روزرسانی شد.'
          : 'Project saved and live on the website.',
        'success'
      );
    } catch {
      onBanner(
        isFa ? 'خطا در ذخیره پروژه. لطفاً دوباره تلاش کنید.' : 'Could not save project.',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOrHide = async (project: Project) => {
    try {
      if (!project.isSeedDefault) {
        await deleteProject(project.id);
      }
      // If it matches a seed slug, also hide the seed fallback cleanly
      const hidden = new Set(settings.hiddenSeedProjectSlugs ?? []);
      if (
        project.isSeedDefault ||
        SEED_PROJECTS.some((seed) => seed.slug === project.slug)
      ) {
        hidden.add(project.slug);
        await saveSiteSettings({
          ...settings,
          hiddenSeedProjectSlugs: Array.from(hidden),
        });
      }
      setConfirmDeleteId(null);
      await onRefresh();
      onBanner(
        isFa ? 'پروژه حذف شد.' : 'Project removed from catalog.',
        'success'
      );
    } catch {
      onBanner(isFa ? 'خطا در حذف پروژه.' : 'Could not delete project.', 'error');
    }
  };

  const handleRestoreHiddenSeeds = async () => {
    try {
      await saveSiteSettings({ ...settings, hiddenSeedProjectSlugs: [] });
      await onRefresh();
      onBanner(
        isFa ? 'پروژه‌های پیش‌فرض بازگردانی شدند.' : 'Default projects restored.',
        'success'
      );
    } catch {
      onBanner(isFa ? 'خطا در بازگردانی پروژه‌ها.' : 'Could not restore projects.', 'error');
    }
  };

  if (editor) {
    return (
      <form onSubmit={handleSave} noValidate className="glass-surface rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/12 pb-4">
          <div>
            <h2 className="text-lg font-semibold text-[#F7F5F0]">
              {editor.existingId
                ? isFa
                  ? 'ویرایش پروژه'
                  : 'Edit Project'
                : isFa
                  ? 'افزودن پروژه جدید'
                  : 'Add New Project'}
            </h2>
            <p className="text-xs text-[#A4A9A5] mt-0.5">
              {isFa
                ? 'تصویر شاخص، گالری تصاویر و توضیحات دوزبانه پروژه را تنظیم کنید. پس از ذخیره بلافاصله در سایت نمایش داده می‌شود.'
                : 'Upload cover image, gallery photos, and bilingual project details. Changes publish immediately.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditor(null);
              setErrors({});
            }}
            className="glass-pill min-h-[38px] inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs text-[#D5D4CC]"
          >
            <X className="w-3.5 h-3.5" />
            <span>{isFa ? 'بازگشت به لیست' : 'Back to list'}</span>
          </button>
        </div>

        {/* Cover Image */}
        <ImageUploaderField
          locale={locale}
          label={isFa ? 'تصویر شاخص (اصلی) پروژه *' : 'Project Cover Image *'}
          value={editor.coverImage}
          preset="cover"
          error={errors.coverImage}
          onChange={(url) => {
            setEditor({ ...editor, coverImage: url });
            if (errors.coverImage) setErrors({ ...errors, coverImage: undefined });
          }}
        />

        {/* Core Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <label className="space-y-1.5 text-xs text-[#D0D0C8]">
            <span>{isFa ? 'عنوان فارسی پروژه *' : 'Persian Title *'}</span>
            <input
              type="text"
              dir="rtl"
              value={editor.titleFa}
              onChange={(e) => {
                setEditor({ ...editor, titleFa: e.target.value });
                if (errors.titleFa) setErrors({ ...errors, titleFa: undefined });
              }}
              placeholder="مثال: مجتمع تجاری-اداری آفتاب"
              className="w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2.5 text-sm text-[#F5F3EE]"
            />
            {errors.titleFa && <p className="text-[11px] text-amber-300">{errors.titleFa}</p>}
          </label>

          <label className="space-y-1.5 text-xs text-[#D0D0C8]">
            <span>{isFa ? 'عنوان انگلیسی پروژه *' : 'English Title *'}</span>
            <input
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
                        slug: !prev.existingId ? slugifyEnglish(nextEn) : prev.slug,
                      }
                    : prev
                );
                if (errors.titleEn) setErrors({ ...errors, titleEn: undefined });
              }}
              placeholder="e.g. Aftab Commercial Tower"
              className="w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2.5 text-sm text-[#F5F3EE]"
            />
            {errors.titleEn && <p className="text-[11px] text-amber-300">{errors.titleEn}</p>}
          </label>

          <label className="space-y-1.5 text-xs text-[#D0D0C8]">
            <span>{isFa ? 'شناسه آدرس صفحه (انگلیسی) *' : 'URL Slug *'}</span>
            <input
              type="text"
              dir="ltr"
              value={editor.slug}
              onChange={(e) => {
                setEditor({ ...editor, slug: e.target.value });
                if (errors.slug) setErrors({ ...errors, slug: undefined });
              }}
              placeholder="aftab-commercial-tower"
              className="w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2.5 text-sm text-[#F5F3EE]"
            />
            {errors.slug && <p className="text-[11px] text-amber-300">{errors.slug}</p>}
          </label>

          <label className="space-y-1.5 text-xs text-[#D0D0C8]">
            <span>{isFa ? 'شهر (فارسی) *' : 'City (FA) *'}</span>
            <input
              type="text"
              dir="rtl"
              value={editor.cityFa}
              onChange={(e) => setEditor({ ...editor, cityFa: e.target.value })}
              className="w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2.5 text-sm text-[#F5F3EE]"
            />
            {errors.cityFa && <p className="text-[11px] text-amber-300">{errors.cityFa}</p>}
          </label>

          <label className="space-y-1.5 text-xs text-[#D0D0C8]">
            <span>{isFa ? 'شهر (انگلیسی) *' : 'City (EN) *'}</span>
            <input
              type="text"
              dir="ltr"
              value={editor.cityEn}
              onChange={(e) => setEditor({ ...editor, cityEn: e.target.value })}
              className="w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2.5 text-sm text-[#F5F3EE]"
            />
            {errors.cityEn && <p className="text-[11px] text-amber-300">{errors.cityEn}</p>}
          </label>

          <label className="space-y-1.5 text-xs text-[#D0D0C8]">
            <span>{isFa ? 'کاربری پروژه' : 'Project Category'}</span>
            <select
              value={editor.category}
              onChange={(e) =>
                setEditor({ ...editor, category: e.target.value as ProjectCategory })
              }
              className="w-full rounded-xl border border-white/15 bg-[#16191A] px-3 py-2.5 text-sm text-[#F5F3EE]"
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {isFa ? opt.fa : opt.en}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1.5 text-xs text-[#D0D0C8]">
            <span>{isFa ? 'برچسب خدمت (فارسی) *' : 'Service Tag (FA) *'}</span>
            <input
              type="text"
              dir="rtl"
              value={editor.serviceFa}
              onChange={(e) => setEditor({ ...editor, serviceFa: e.target.value })}
              placeholder="مثال: معماری و عملکرد انرژی"
              className="w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2.5 text-sm text-[#F5F3EE]"
            />
            {errors.serviceFa && <p className="text-[11px] text-amber-300">{errors.serviceFa}</p>}
          </label>

          <label className="space-y-1.5 text-xs text-[#D0D0C8]">
            <span>{isFa ? 'برچسب خدمت (انگلیسی) *' : 'Service Tag (EN) *'}</span>
            <input
              type="text"
              dir="ltr"
              value={editor.serviceEn}
              onChange={(e) => setEditor({ ...editor, serviceEn: e.target.value })}
              placeholder="e.g. Architecture & Energy"
              className="w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2.5 text-sm text-[#F5F3EE]"
            />
            {errors.serviceEn && <p className="text-[11px] text-amber-300">{errors.serviceEn}</p>}
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1.5 text-xs text-[#D0D0C8]">
              <span>{isFa ? 'سال اجرا (اختیاری)' : 'Year (optional)'}</span>
              <input
                type="text"
                value={editor.year}
                onChange={(e) => setEditor({ ...editor, year: e.target.value })}
                placeholder="۱۴۰۴"
                className="w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2.5 text-sm text-[#F5F3EE]"
              />
            </label>
            <label className="space-y-1.5 text-xs text-[#D0D0C8]">
              <span>{isFa ? 'زیربنا (اختیاری)' : 'Area (optional)'}</span>
              <input
                type="text"
                value={editor.areaSqm}
                onChange={(e) => setEditor({ ...editor, areaSqm: e.target.value })}
                placeholder="6,500 m²"
                className="w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2.5 text-sm text-[#F5F3EE]"
              />
            </label>
          </div>
        </div>

        {/* Disciplines + Display Settings */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-2 border-t border-white/10">
          <div className="lg:col-span-6 space-y-2">
            <span className="text-xs font-medium text-[#E4E3DC]">
              {isFa ? 'حوزه‌های تخصصی مرتبط *' : 'Related Disciplines *'}
            </span>
            <div className="flex flex-wrap gap-2">
              {DISCIPLINES.map((disc) => {
                const active = editor.disciplines.includes(disc.slug);
                return (
                  <button
                    key={disc.slug}
                    type="button"
                    onClick={() => toggleDiscipline(disc.slug)}
                    className={`rounded-full px-3.5 py-2 text-xs font-medium transition-all ${
                      active
                        ? 'glass-cta font-semibold'
                        : 'glass-pill text-[#D5D4CC] hover:border-white/35'
                    }`}
                  >
                    {disc.title[locale]}
                  </button>
                );
              })}
            </div>
            {errors.disciplines && (
              <p className="text-[11px] text-amber-300">{errors.disciplines}</p>
            )}
          </div>

          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="space-y-1.5 text-xs text-[#D0D0C8]">
              <span>{isFa ? 'نوع تصویر' : 'Media Type'}</span>
              <select
                value={editor.imageDisclosure}
                onChange={(e) =>
                  setEditor({
                    ...editor,
                    imageDisclosure: e.target.value as 'concept' | 'photograph',
                  })
                }
                className="w-full rounded-xl border border-white/15 bg-[#16191A] px-3 py-2 text-xs text-[#F5F3EE]"
              >
                <option value="photograph">{isFa ? 'عکس واقعی پروژه' : 'Photograph'}</option>
                <option value="concept">{isFa ? 'رندر / مفهومی' : 'Concept Visual'}</option>
              </select>
            </label>

            <label className="space-y-1.5 text-xs text-[#D0D0C8]">
              <span>{isFa ? 'ترتیب نمایش' : 'Display Order'}</span>
              <input
                type="number"
                min={0}
                max={999}
                value={editor.featuredOrder}
                onChange={(e) =>
                  setEditor({ ...editor, featuredOrder: Number(e.target.value) || 0 })
                }
                className="w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2 text-xs text-[#F5F3EE]"
              />
            </label>

            <label className="space-y-1.5 text-xs text-[#D0D0C8]">
              <span>{isFa ? 'وضعیت انتشار' : 'Status'}</span>
              <select
                value={editor.status}
                onChange={(e) =>
                  setEditor({ ...editor, status: e.target.value as 'draft' | 'published' })
                }
                className="w-full rounded-xl border border-white/15 bg-[#16191A] px-3 py-2 text-xs text-[#F5F3EE]"
              >
                <option value="published">{isFa ? 'منتشرشده در سایت' : 'Published'}</option>
                <option value="draft">{isFa ? 'پیش‌نویس (مخفی)' : 'Draft (Hidden)'}</option>
              </select>
            </label>
          </div>
        </div>

        {/* Descriptions (Bilingual) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-white/10">
          <label className="space-y-1.5 text-xs text-[#D0D0C8]">
            <span>{isFa ? 'نقش گروه ISB (فارسی)' : 'ISB Role (FA)'}</span>
            <textarea
              rows={2}
              dir="rtl"
              value={editor.roleFa}
              onChange={(e) => setEditor({ ...editor, roleFa: e.target.value })}
              placeholder="مثال: طراحی معماری، مدل‌سازی انرژی و نظارت..."
              className="w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2.5 text-sm text-[#F5F3EE]"
            />
          </label>
          <label className="space-y-1.5 text-xs text-[#D0D0C8]">
            <span>{isFa ? 'نقش گروه ISB (انگلیسی)' : 'ISB Role (EN)'}</span>
            <textarea
              rows={2}
              dir="ltr"
              value={editor.roleEn}
              onChange={(e) => setEditor({ ...editor, roleEn: e.target.value })}
              placeholder="e.g. Architectural design, energy modeling..."
              className="w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2.5 text-sm text-[#F5F3EE]"
            />
          </label>
          <label className="space-y-1.5 text-xs text-[#D0D0C8]">
            <span>{isFa ? 'معرفی و چالش پروژه (فارسی)' : 'Project Brief (FA)'}</span>
            <textarea
              rows={4}
              dir="rtl"
              value={editor.briefFa}
              onChange={(e) => setEditor({ ...editor, briefFa: e.target.value })}
              className="w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2.5 text-sm text-[#F5F3EE]"
            />
          </label>
          <label className="space-y-1.5 text-xs text-[#D0D0C8]">
            <span>{isFa ? 'معرفی و چالش پروژه (انگلیسی)' : 'Project Brief (EN)'}</span>
            <textarea
              rows={4}
              dir="ltr"
              value={editor.briefEn}
              onChange={(e) => setEditor({ ...editor, briefEn: e.target.value })}
              className="w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2.5 text-sm text-[#F5F3EE]"
            />
          </label>
          <label className="space-y-1.5 text-xs text-[#D0D0C8]">
            <span>{isFa ? 'رویکرد طراحی و مهندسی (فارسی)' : 'Design & Engineering Approach (FA)'}</span>
            <textarea
              rows={4}
              dir="rtl"
              value={editor.approachFa}
              onChange={(e) => setEditor({ ...editor, approachFa: e.target.value })}
              className="w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2.5 text-sm text-[#F5F3EE]"
            />
          </label>
          <label className="space-y-1.5 text-xs text-[#D0D0C8]">
            <span>{isFa ? 'رویکرد طراحی و مهندسی (انگلیسی)' : 'Design & Engineering Approach (EN)'}</span>
            <textarea
              rows={4}
              dir="ltr"
              value={editor.approachEn}
              onChange={(e) => setEditor({ ...editor, approachEn: e.target.value })}
              className="w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2.5 text-sm text-[#F5F3EE]"
            />
          </label>
        </div>

        {/* Multi-Photo Gallery */}
        <div className="pt-2 border-t border-white/10">
          <GalleryUploader
            locale={locale}
            images={editor.gallery}
            onChange={(nextGallery) => setEditor({ ...editor, gallery: nextGallery })}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="glass-cta min-h-[44px] inline-flex items-center gap-2 rounded-full px-7 py-2.5 text-xs font-semibold disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            <span>
              {saving
                ? isFa
                  ? 'در حال ذخیره...'
                  : 'Saving...'
                : isFa
                  ? 'ذخیره و انتشار پروژه'
                  : 'Save Project'}
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              setEditor(null);
              setErrors({});
            }}
            className="glass-pill min-h-[44px] rounded-full px-5 py-2.5 text-xs text-[#D5D4CC]"
          >
            {isFa ? 'انصراف' : 'Cancel'}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#9EA39F] absolute top-1/2 -translate-y-1/2 start-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isFa ? 'جستجو در پروژه‌ها...' : 'Search projects...'}
            className="w-full rounded-full border border-white/15 bg-black/35 ps-10 pe-4 py-2.5 text-xs text-[#F5F3EE]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {(settings.hiddenSeedProjectSlugs?.length ?? 0) > 0 && (
            <button
              type="button"
              onClick={() => void handleRestoreHiddenSeeds()}
              className="glass-pill min-h-[42px] inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs text-[#D5D4CC]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isFa ? 'بازگردانی پروژه‌های پیش‌فرض' : 'Restore Default Projects'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setErrors({});
              setEditor(createEmptyProject(projects.length + 1));
            }}
            className="glass-cta min-h-[42px] inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-semibold"
          >
            <FolderPlus className="w-4 h-4" />
            <span>{isFa ? 'افزودن پروژه جدید' : 'Add New Project'}</span>
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      {filtered.length === 0 ? (
        <div className="glass-surface rounded-2xl p-10 text-center text-sm text-[#A4A9A5]">
          {isFa ? 'پروژه‌ای مطابق جستجو یافت نشد.' : 'No projects found.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((project) => (
            <div
              key={project.id}
              className="glass-card rounded-2xl overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-[16/10] bg-black/40 overflow-hidden">
                  <SafeImage
                    src={project.coverImage}
                    alt={isFa ? project.titleFa : project.titleEn}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 start-3 flex flex-wrap gap-1.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-medium backdrop-blur-md ${
                        project.status === 'published'
                          ? 'bg-[#00A651]/28 border border-[#28CF77]/50 text-[#F5F8FC]'
                          : 'bg-[#080D16]/75 border border-white/20 text-[#C6D2E3]'
                      }`}
                    >
                      {project.status === 'published' ? (
                        <Eye className="w-3 h-3" />
                      ) : (
                        <EyeOff className="w-3 h-3" />
                      )}
                      <span>
                        {project.status === 'published'
                          ? isFa
                            ? 'منتشرشده'
                            : 'Published'
                          : isFa
                            ? 'پیش‌نویس'
                            : 'Draft'}
                      </span>
                    </span>
                    {project.isSeedDefault && (
                      <span className="rounded-full bg-[#080D16]/75 border border-[#6F9BFF]/35 px-2.5 py-0.5 text-[10px] text-[#93BCFF]">
                        {isFa ? 'پیش‌فرض · قابل ویرایش' : 'Default · Editable'}
                      </span>
                    )}
                  </div>
                  <span className="absolute top-3 end-3 rounded-full bg-[#080D16]/75 border border-white/15 px-2 py-0.5 text-[10px] font-numeric text-[#C6D2E3]">
                    #{project.featuredOrder}
                  </span>
                </div>

                <div className="p-4 space-y-1.5">
                  <h3 className="text-base font-semibold text-[#F5F8FC]">
                    {isFa ? project.titleFa : project.titleEn}
                  </h3>
                  <p className="text-xs text-[#8B9DB7] flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#6F9BFF]" />
                    <span>{isFa ? project.cityFa : project.cityEn}</span>
                    <span>·</span>
                    <span className="text-[#28CF77]">
                      {isFa ? project.serviceFa : project.serviceEn}
                    </span>
                  </p>
                  {(project.gallery?.length ?? 0) > 0 && (
                    <p className="text-[11px] text-[#8B9DB7] inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-[#28CF77]" />
                      <span>
                        {isFa
                          ? `${project.gallery?.length} تصویر در گالری`
                          : `${project.gallery?.length} gallery photos`}
                      </span>
                    </p>
                  )}
                </div>
              </div>

              <div className="px-4 pb-4 pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setErrors({});
                    setEditor(projectToEditor(project));
                  }}
                  className="glass-pill min-h-[36px] inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium text-[#F5F8FC] hover:border-[#6F9BFF]"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#6F9BFF]" />
                  <span>{isFa ? 'ویرایش و عکس‌ها' : 'Edit & Photos'}</span>
                </button>

                {confirmDeleteId === project.id ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => void handleDeleteOrHide(project)}
                      className="rounded-full bg-rose-500/85 hover:bg-rose-500 px-3 py-1 text-[11px] font-semibold text-white"
                    >
                      {isFa ? 'تأیید حذف' : 'Confirm'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="rounded-full px-2 py-1 text-[11px] text-[#D0D0C8]"
                    >
                      {isFa ? 'لغو' : 'Cancel'}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(project.id)}
                    aria-label={isFa ? 'حذف پروژه' : 'Delete project'}
                    className="p-2 rounded-full text-rose-300/75 hover:text-rose-200 hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
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
