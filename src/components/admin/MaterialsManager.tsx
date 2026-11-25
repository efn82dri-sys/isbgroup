import React, { useMemo, useRef, useState } from 'react';
import {
  Check,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  ImagePlus,
  Layers,
  Loader2,
  Plus,
  RotateCcw,
  Save,
  ShieldCheck,
  Trash2,
  X,
} from '../icons/IsbIcons';
import {
  deleteMaterialItem,
  saveMaterialItem,
  saveSiteSettings,
} from '../../services/contentStore';
import { deleteStudioImage, isMediaRef, uploadStudioImage } from '../../services/mediaStore';
import type {
  Locale,
  MaterialCategory,
  MaterialCertificate,
  MaterialItem,
  PartnerLogo,
  SiteSettings,
} from '../../types/content';
import {
  deriveMaterialSlug,
  MATERIAL_CATEGORY_LABELS,
  SEED_MATERIALS,
  validateMaterialForm,
  type MaterialFormInput,
} from '../../utils/materialsCatalog';
import { hasErrors, isSafeExternalUrl, type FieldErrors } from '../../utils/validation';
import { SafeImage } from '../BrandMark';
import { ImageUploaderField } from './ImageUploaderField';

interface MaterialsManagerProps {
  locale: Locale;
  materials: MaterialItem[];
  partners: PartnerLogo[];
  settings: SiteSettings;
  onRefresh: () => Promise<void>;
  onBanner: (text: string | null, tone?: 'info' | 'success' | 'error') => void;
}

interface MaterialDraft extends MaterialFormInput {
  id?: string;
}

const SEED_MATERIAL_ID_SET = new Set(SEED_MATERIALS.map((m) => m.id));

const CATEGORY_OPTIONS: MaterialCategory[] = [
  'thermal-envelope',
  'lightweight-structure',
  'facade-glazing',
  'smart-energy',
];

function createEmptyDraft(nextOrder: number): MaterialDraft {
  return {
    slug: '',
    titleFa: '',
    titleEn: '',
    subtitleFa: '',
    subtitleEn: '',
    summaryFa: '',
    summaryEn: '',
    category: 'thermal-envelope',
    brandNameFa: '',
    brandNameEn: '',
    performanceMetric: '',
    performanceLabelFa: '',
    performanceLabelEn: '',
    standardRefFa: '',
    standardRefEn: '',
    applicationFa: '',
    applicationEn: '',
    coverImage: '',
    certificates: [],
    catalogUrl: '',
    catalogLabelFa: '',
    catalogLabelEn: '',
    partnerIds: [],
    featured: false,
    order: nextOrder,
    status: 'published',
  };
}

export function MaterialsManager({
  locale,
  materials,
  partners,
  settings,
  onRefresh,
  onBanner,
}: MaterialsManagerProps) {
  const isFa = locale === 'fa';
  const [editing, setEditing] = useState<MaterialDraft | null>(null);
  const [showEnFields, setShowEnFields] = useState(false);
  const [errors, setErrors] = useState<FieldErrors<MaterialFormInput>>({});
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [uploadingCertCount, setUploadingCertCount] = useState(0);
  const [certUploadError, setCertUploadError] = useState<string | null>(null);
  const certInputRef = useRef<HTMLInputElement>(null);

  const hiddenSeedIds = settings.hiddenSeedMaterialIds ?? [];

  const nextOrder = useMemo(() => {
    if (materials.length === 0) return 1;
    return Math.max(...materials.map((m) => m.order)) + 1;
  }, [materials]);

  const publishedPartners = useMemo(
    () => [...partners].sort((a, b) => a.order - b.order),
    [partners]
  );

  const startNew = () => {
    setErrors({});
    setCertUploadError(null);
    setConfirmDeleteId(null);
    setShowEnFields(false);
    setEditing(createEmptyDraft(nextOrder));
  };

  const startEdit = (mat: MaterialItem) => {
    setErrors({});
    setCertUploadError(null);
    setConfirmDeleteId(null);
    setShowEnFields(false);
    setEditing({
      id: mat.id,
      slug: mat.slug,
      titleFa: mat.titleFa,
      titleEn: mat.titleEn,
      subtitleFa: mat.subtitleFa ?? '',
      subtitleEn: mat.subtitleEn ?? '',
      summaryFa: mat.summaryFa ?? '',
      summaryEn: mat.summaryEn ?? '',
      category: mat.category,
      brandNameFa: mat.brandNameFa ?? '',
      brandNameEn: mat.brandNameEn ?? '',
      performanceMetric: mat.performanceMetric ?? '',
      performanceLabelFa: mat.performanceLabelFa ?? '',
      performanceLabelEn: mat.performanceLabelEn ?? '',
      standardRefFa: mat.standardRefFa ?? '',
      standardRefEn: mat.standardRefEn ?? '',
      applicationFa: mat.applicationFa ?? '',
      applicationEn: mat.applicationEn ?? '',
      coverImage: mat.coverImage,
      certificates: (mat.certificates ?? []).map((c) => ({ ...c })),
      catalogUrl: mat.catalogUrl ?? '',
      catalogLabelFa: mat.catalogLabelFa ?? '',
      catalogLabelEn: mat.catalogLabelEn ?? '',
      partnerIds: [...(mat.partnerIds ?? [])],
      featured: Boolean(mat.featured),
      order: mat.order,
      status: mat.status,
    });
  };

  const handleUploadCertificates = async (fileList: FileList | null) => {
    if (!editing || !fileList || fileList.length === 0) return;
    const remaining = 8 - editing.certificates.length;
    if (remaining <= 0) {
      setCertUploadError(
        isFa ? 'حداکثر ۸ تصویر گواهینامه برای هر مصالح مجاز است.' : 'Maximum 8 certificate photos.'
      );
      return;
    }
    const files = Array.from(fileList).slice(0, remaining);
    setUploadingCertCount(files.length);
    setCertUploadError(null);

    const added: MaterialCertificate[] = [];
    for (const file of files) {
      try {
        const res = await uploadStudioImage(file, 'gallery');
        added.push({
          imageUrl: res.mediaRef,
          titleFa: '',
          issuerFa: '',
        });
      } catch {
        setCertUploadError(
          isFa
            ? 'آپلود یکی از تصاویر گواهینامه با خطا مواجه شد. فرمت JPG/PNG/WebP زیر ۱۸ مگابایت انتخاب کنید.'
            : 'One or more certificate images failed to upload.'
        );
      } finally {
        setUploadingCertCount((c) => Math.max(0, c - 1));
      }
    }

    if (added.length > 0) {
      setEditing((prev) =>
        prev ? { ...prev, certificates: [...prev.certificates, ...added].slice(0, 8) } : prev
      );
    }
    if (certInputRef.current) certInputRef.current.value = '';
  };

  const handleRemoveCertificate = async (idx: number) => {
    if (!editing) return;
    const target = editing.certificates[idx];
    if (target?.imageUrl && isMediaRef(target.imageUrl)) {
      await deleteStudioImage(target.imageUrl);
    }
    setEditing((prev) =>
      prev ? { ...prev, certificates: prev.certificates.filter((_, i) => i !== idx) } : prev
    );
  };

  const handleUpdateCertificateField = (
    idx: number,
    field: keyof MaterialCertificate,
    value: string
  ) => {
    setEditing((prev) => {
      if (!prev) return prev;
      const next = prev.certificates.map((cert, i) =>
        i === idx ? { ...cert, [field]: value } : cert
      );
      return { ...prev, certificates: next };
    });
  };

  const togglePartnerId = (partnerId: string) => {
    setEditing((prev) => {
      if (!prev) return prev;
      const exists = prev.partnerIds.includes(partnerId);
      const nextIds = exists
        ? prev.partnerIds.filter((id) => id !== partnerId)
        : [...prev.partnerIds, partnerId].slice(0, 8);
      return { ...prev, partnerIds: nextIds };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;

    const validationErrors = validateMaterialForm(editing, locale);
    setErrors(validationErrors);
    if (hasErrors(validationErrors)) return;

    setSaving(true);
    onBanner(null);
    try {
      const resolvedSlug = deriveMaterialSlug(editing.slug, editing.titleEn || editing.titleFa);
      await saveMaterialItem(
        {
          slug: resolvedSlug,
          titleFa: editing.titleFa.trim(),
          titleEn: (editing.titleEn.trim() || editing.titleFa.trim()),
          subtitleFa: editing.subtitleFa.trim() || undefined,
          subtitleEn: editing.subtitleEn.trim() || editing.subtitleFa.trim() || undefined,
          summaryFa: editing.summaryFa.trim() || undefined,
          summaryEn: editing.summaryEn.trim() || editing.summaryFa.trim() || undefined,
          category: editing.category,
          brandNameFa: editing.brandNameFa.trim() || undefined,
          brandNameEn: editing.brandNameEn.trim() || editing.brandNameFa.trim() || undefined,
          performanceMetric: editing.performanceMetric.trim() || undefined,
          performanceLabelFa: editing.performanceLabelFa.trim() || undefined,
          performanceLabelEn:
            editing.performanceLabelEn.trim() || editing.performanceLabelFa.trim() || undefined,
          standardRefFa: editing.standardRefFa.trim() || undefined,
          standardRefEn:
            editing.standardRefEn.trim() || editing.standardRefFa.trim() || undefined,
          applicationFa: editing.applicationFa.trim() || undefined,
          applicationEn:
            editing.applicationEn.trim() || editing.applicationFa.trim() || undefined,
          coverImage: editing.coverImage.trim(),
          certificates: editing.certificates,
          catalogUrl: editing.catalogUrl.trim() || undefined,
          catalogLabelFa: editing.catalogLabelFa.trim() || undefined,
          catalogLabelEn:
            editing.catalogLabelEn.trim() || editing.catalogLabelFa.trim() || undefined,
          partnerIds: editing.partnerIds,
          featured: editing.featured,
          order: editing.order,
          status: editing.status,
        },
        editing.id
      );

      if (editing.id && hiddenSeedIds.includes(editing.id)) {
        await saveSiteSettings({
          ...settings,
          hiddenSeedMaterialIds: hiddenSeedIds.filter((id) => id !== editing.id),
        });
      }

      setEditing(null);
      await onRefresh();
      onBanner(
        isFa
          ? 'مصالح و گواهینامه‌های آن با موفقیت ذخیره و در صفحه مصالح منتشر شد.'
          : 'Material item and certificates saved successfully.',
        'success'
      );
    } catch {
      onBanner(
        isFa
          ? 'خطا در ذخیره اطلاعات مصالح. لطفاً دوباره تلاش کنید.'
          : 'Could not save material item. Please try again.',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (mat: MaterialItem) => {
    const nextStatus: 'published' | 'draft' = mat.status === 'published' ? 'draft' : 'published';
    try {
      await saveMaterialItem(
        {
          slug: mat.slug,
          titleFa: mat.titleFa,
          titleEn: mat.titleEn,
          subtitleFa: mat.subtitleFa,
          subtitleEn: mat.subtitleEn,
          summaryFa: mat.summaryFa,
          summaryEn: mat.summaryEn,
          category: mat.category,
          brandNameFa: mat.brandNameFa,
          brandNameEn: mat.brandNameEn,
          performanceMetric: mat.performanceMetric,
          performanceLabelFa: mat.performanceLabelFa,
          performanceLabelEn: mat.performanceLabelEn,
          standardRefFa: mat.standardRefFa,
          standardRefEn: mat.standardRefEn,
          applicationFa: mat.applicationFa,
          applicationEn: mat.applicationEn,
          coverImage: mat.coverImage,
          certificates: mat.certificates,
          catalogUrl: mat.catalogUrl,
          catalogLabelFa: mat.catalogLabelFa,
          catalogLabelEn: mat.catalogLabelEn,
          partnerIds: mat.partnerIds,
          featured: mat.featured,
          order: mat.order,
          status: nextStatus,
        },
        mat.id
      );
      await onRefresh();
      onBanner(
        nextStatus === 'published'
          ? isFa
            ? 'مصالح در صفحه عمومی منتشر شد.'
            : 'Material published.'
          : isFa
            ? 'مصالح به حالت پیش‌نویس (مخفی) منتقل شد.'
            : 'Material moved to draft.',
        'success'
      );
    } catch {
      onBanner(
        isFa ? 'خطا در تغییر وضعیت نمایش مصالح.' : 'Could not update material status.',
        'error'
      );
    }
  };

  const handleDelete = async (mat: MaterialItem) => {
    setDeletingId(mat.id);
    onBanner(null);
    try {
      if (!mat.isSeedDefault) {
        await deleteMaterialItem(mat.id);
      }
      if (mat.coverImage && isMediaRef(mat.coverImage)) {
        await deleteStudioImage(mat.coverImage);
      }
      for (const cert of mat.certificates ?? []) {
        if (cert.imageUrl && isMediaRef(cert.imageUrl)) {
          await deleteStudioImage(cert.imageUrl);
        }
      }
      if (SEED_MATERIAL_ID_SET.has(mat.id) && !hiddenSeedIds.includes(mat.id)) {
        await saveSiteSettings({
          ...settings,
          hiddenSeedMaterialIds: [...hiddenSeedIds, mat.id],
        });
      }
      if (editing?.id === mat.id) setEditing(null);
      setConfirmDeleteId(null);
      await onRefresh();
      onBanner(
        isFa ? 'مصالح با موفقیت حذف شد.' : 'Material removed successfully.',
        'success'
      );
    } catch {
      onBanner(
        isFa ? 'خطا در حذف مصالح. لطفاً دوباره تلاش کنید.' : 'Could not delete material.',
        'error'
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleRestoreDefaults = async () => {
    if (hiddenSeedIds.length === 0) return;
    setRestoring(true);
    onBanner(null);
    try {
      await saveSiteSettings({
        ...settings,
        hiddenSeedMaterialIds: [],
      });
      await onRefresh();
      onBanner(
        isFa ? 'مصالح پیش‌فرض مخفی‌شده بازیابی شدند.' : 'Hidden starter materials restored.',
        'success'
      );
    } catch {
      onBanner(
        isFa ? 'خطا در بازیابی مصالح پیش‌فرض.' : 'Could not restore starter materials.',
        'error'
      );
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="glass-surface rounded-2xl p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-base sm:text-lg font-semibold text-[#F5F8FC] inline-flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#DFBA78]" />
            <span>
              {isFa
                ? 'مدیریت مصالح نوین، گواهینامه‌ها و کاتالوگ‌ها'
                : 'Modern Materials, Certificates & Catalogs CMS'}
            </span>
          </h2>
          <p className="text-xs text-[#9BB0CB] max-w-2xl">
            {isFa
              ? 'مصالح جدید اضافه کنید، تصویر مصالح و عکس گواهینامه‌های فنی آن‌ها را آپلود کنید، لینک کاتالوگ PDF قرار دهید و به برندهای همکار متصل کنید.'
              : 'Add or edit building materials, upload cover and technical certificate photos, attach PDF catalog links, and associate partner brands.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {hiddenSeedIds.length > 0 && (
            <button
              type="button"
              disabled={restoring}
              onClick={() => void handleRestoreDefaults()}
              className="glass-pill min-h-[40px] inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs text-[#C6D2E3] hover:border-[#DFBA78] disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>
                {isFa
                  ? `بازیابی پیش‌فرض‌ها (${hiddenSeedIds.length})`
                  : `Restore Defaults (${hiddenSeedIds.length})`}
              </span>
            </button>
          )}
          <button
            type="button"
            onClick={startNew}
            data-testid="admin-add-material-btn"
            className="min-h-[40px] inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-xs font-semibold text-[#13100A] bg-gradient-to-r from-[#F3DCA6] via-[#DFBA78] to-[#C89B54] hover:brightness-110 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isFa ? 'افزودن مصالح جدید' : 'Add New Material'}</span>
          </button>
        </div>
      </div>

      {/* Add / Edit Form */}
      {editing && (
        <form
          onSubmit={handleSave}
          noValidate
          data-testid="admin-material-form"
          className="glass-surface rounded-2xl border border-[#DFBA78]/35 p-5 sm:p-6 space-y-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3.5">
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-[#FBF6EB]">
                {editing.id
                  ? isFa
                    ? 'ویرایش مصالح و مستندات فنی'
                    : 'Edit Material & Technical Dossier'
                  : isFa
                    ? 'ثبت مصالح جدید در ویترین'
                    : 'Add New Material to Showcase'}
              </h3>
              <p className="text-[11px] text-[#9BB0CB] mt-0.5">
                {isFa
                  ? 'پر کردن فیلدهای فارسی کافی است؛ نسخه انگلیسی در صورت خالی بودن به‌صورت خودکار پر می‌شود.'
                  : 'Fill in the primary details; optional English fields can be expanded anytime.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowEnFields((prev) => !prev)}
                className="glass-pill rounded-full px-3 py-1.5 text-[11px] text-[#C6D2E3] hover:text-white"
              >
                {showEnFields
                  ? isFa
                    ? 'بستن فیلدهای انگلیسی'
                    : 'Hide English Fields'
                  : isFa
                    ? '+ ترجمه انگلیسی (اختیاری)'
                    : '+ English Fields (Optional)'}
              </button>
              <button
                type="button"
                onClick={() => setEditing(null)}
                aria-label={isFa ? 'بستن فرم' : 'Close form'}
                className="p-1.5 rounded-lg text-[#8B9DB7] hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 1. Material Cover Photo */}
          <ImageUploaderField
            locale={locale}
            label={isFa ? 'تصویر اصلی مصالح *' : 'Material Cover Photograph *'}
            value={editing.coverImage}
            preset="cover"
            aspectClass="aspect-[16/10]"
            hint={
              isFa
                ? 'عکس باکیفیت از بافت، نمونه واقعی یا اجرای مصالح در پروژه آپلود کنید.'
                : 'Upload a sharp photograph of the material specimen or architectural installation.'
            }
            error={errors.coverImage}
            onChange={(nextUrl) =>
              setEditing((prev) => (prev ? { ...prev, coverImage: nextUrl } : prev))
            }
          />

          {/* 2. Core Identity Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label htmlFor="mat-title-fa" className="block text-xs font-medium text-[#DCE6F5]">
                {isFa ? 'نام مصالح یا سامانه (فارسی) *' : 'Material Name (Persian) *'}
              </label>
              <input
                id="mat-title-fa"
                type="text"
                value={editing.titleFa}
                onChange={(e) =>
                  setEditing((prev) => (prev ? { ...prev, titleFa: e.target.value } : prev))
                }
                placeholder={isFa ? 'مثلاً سامانه عایق حرارتی نما (ETICS)' : 'Persian title'}
                className="glass-input w-full rounded-xl px-3.5 py-2.5 text-sm text-[#F5F8FC]"
              />
              {errors.titleFa && <p className="text-[11px] text-amber-300">{errors.titleFa}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="mat-category" className="block text-xs font-medium text-[#DCE6F5]">
                {isFa ? 'دسته‌بندی تخصصی *' : 'Category *'}
              </label>
              <select
                id="mat-category"
                value={editing.category}
                onChange={(e) =>
                  setEditing((prev) =>
                    prev ? { ...prev, category: e.target.value as MaterialCategory } : prev
                  )
                }
                className="w-full rounded-xl border border-[#6F9BFF]/25 bg-[#0E1626] px-3 py-2.5 text-xs text-[#F5F8FC]"
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>
                    {MATERIAL_CATEGORY_LABELS[cat][locale]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label htmlFor="mat-subtitle-fa" className="block text-xs font-medium text-[#DCE6F5]">
                {isFa ? 'توضیح یک‌خطی زیرعنوان (فارسی)' : 'Short One-Line Subtitle (Persian)'}
              </label>
              <input
                id="mat-subtitle-fa"
                type="text"
                value={editing.subtitleFa}
                onChange={(e) =>
                  setEditing((prev) => (prev ? { ...prev, subtitleFa: e.target.value } : prev))
                }
                placeholder={
                  isFa
                    ? 'مثلاً عایق‌کاری پیوسته جداره خارجی با حذف پل حرارتی'
                    : 'Concise subtitle'
                }
                className="glass-input w-full rounded-xl px-3.5 py-2.5 text-sm text-[#F5F8FC]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="mat-brand-fa" className="block text-xs font-medium text-[#DCE6F5]">
                {isFa ? 'نام برند / تولیدکننده' : 'Brand / Manufacturer'}
              </label>
              <input
                id="mat-brand-fa"
                type="text"
                value={editing.brandNameFa}
                onChange={(e) =>
                  setEditing((prev) => (prev ? { ...prev, brandNameFa: e.target.value } : prev))
                }
                placeholder={isFa ? 'مثلاً ایران ایتیکس · ایزولتکو' : 'Brand name'}
                className="glass-input w-full rounded-xl px-3.5 py-2.5 text-sm text-[#F5F8FC]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="mat-metric" className="block text-xs font-medium text-[#DCE6F5]">
                {isFa ? 'شاخص فنی کلیدی (اختیاری)' : 'Key Performance Metric'}
              </label>
              <input
                id="mat-metric"
                type="text"
                dir="ltr"
                value={editing.performanceMetric}
                onChange={(e) =>
                  setEditing((prev) =>
                    prev ? { ...prev, performanceMetric: e.target.value } : prev
                  )
                }
                placeholder="e.g. U ≤ 0.28 / NRC 0.85"
                className="glass-input w-full rounded-xl px-3.5 py-2.5 text-sm font-mono text-[#28CF77]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="mat-standard-fa" className="block text-xs font-medium text-[#DCE6F5]">
                {isFa ? 'استاندارد / مبحث مرجع' : 'Compliance Standard'}
              </label>
              <input
                id="mat-standard-fa"
                type="text"
                value={editing.standardRefFa}
                onChange={(e) =>
                  setEditing((prev) => (prev ? { ...prev, standardRefFa: e.target.value } : prev))
                }
                placeholder={isFa ? 'مثلاً مبحث ۱۹ · رده EC++' : 'e.g. Code 19 · EC++'}
                className="glass-input w-full rounded-xl px-3.5 py-2.5 text-sm text-[#F5F8FC]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="mat-app-fa" className="block text-xs font-medium text-[#DCE6F5]">
                {isFa ? 'کاربرد در پروژه' : 'Project Application'}
              </label>
              <input
                id="mat-app-fa"
                type="text"
                value={editing.applicationFa}
                onChange={(e) =>
                  setEditing((prev) => (prev ? { ...prev, applicationFa: e.target.value } : prev))
                }
                placeholder={isFa ? 'مثلاً نمای مسکونی، اداری و بازسازی' : 'Where it is used'}
                className="glass-input w-full rounded-xl px-3.5 py-2.5 text-sm text-[#F5F8FC]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="mat-summary-fa" className="block text-xs font-medium text-[#DCE6F5]">
              {isFa ? 'معرفی فنی و مزایا (فارسی)' : 'Technical Summary (Persian)'}
            </label>
            <textarea
              id="mat-summary-fa"
              rows={3}
              value={editing.summaryFa}
              onChange={(e) =>
                setEditing((prev) => (prev ? { ...prev, summaryFa: e.target.value } : prev))
              }
              placeholder={
                isFa
                  ? 'توضیح کوتاه و کاربردی درباره عملکرد، مزایا و ویژگی‌های فنی این مصالح...'
                  : 'Concise engineering summary and benefits...'
              }
              className="glass-input w-full rounded-xl px-3.5 py-2.5 text-sm text-[#F5F8FC] leading-relaxed"
            />
          </div>

          {/* 3. CERTIFICATES PHOTO GALLERY UPLOADER (Core Feature Requested by User) */}
          <div className="rounded-2xl border border-[#28CF77]/28 bg-[#08131A]/70 p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-0.5">
                <h4 className="text-xs sm:text-sm font-semibold text-[#F5F8FC] inline-flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#28CF77]" />
                  <span>
                    {isFa
                      ? `تصاویر گواهینامه‌های فنی (${editing.certificates.length} از ۸)`
                      : `Technical Certificate Photos (${editing.certificates.length} / 8)`}
                  </span>
                </h4>
                <p className="text-[11px] text-[#9BB0CB]">
                  {isFa
                    ? 'اسکن یا عکس گواهینامه‌های مرکز تحقیقات، استاندارد، تست آزمایشگاهی و ایزو را آپلود کنید تا مخاطب با کیفیت بالا و قابلیت بزرگ‌نمایی مشاهده کند.'
                    : 'Upload scans or photos of BHRC approvals, ISO, or lab test certificates for the zoomable public gallery.'}
                </p>
              </div>

              <div>
                <input
                  ref={certInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={(e) => void handleUploadCertificates(e.target.files)}
                  className="sr-only"
                />
                <button
                  type="button"
                  disabled={uploadingCertCount > 0 || editing.certificates.length >= 8}
                  onClick={() => certInputRef.current?.click()}
                  className="glass-cta-emerald min-h-[40px] inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold disabled:opacity-50"
                >
                  {uploadingCertCount > 0 ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ImagePlus className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {uploadingCertCount > 0
                      ? isFa
                        ? `در حال آپلود (${uploadingCertCount})...`
                        : `Uploading (${uploadingCertCount})...`
                      : isFa
                        ? 'آپلود عکس گواهینامه'
                        : 'Upload Certificate Photo'}
                  </span>
                </button>
              </div>
            </div>

            {editing.certificates.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/15 bg-black/20 py-7 px-4 text-center text-xs text-[#8FA4C2]">
                {isFa
                  ? 'هنوز تصویر گواهینامه‌ای برای این مصالح آپلود نشده است. از دکمه «آپلود عکس گواهینامه» استفاده کنید.'
                  : 'No certificate photos uploaded yet. Click Upload Certificate Photo to attach one.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {editing.certificates.map((cert, idx) => (
                  <div
                    key={`${cert.imageUrl}-${idx}`}
                    className="rounded-xl border border-white/12 bg-[#0B1220] p-3 space-y-2.5"
                  >
                    <div className="relative rounded-lg overflow-hidden aspect-[4/3] bg-black/40 border border-white/10">
                      <SafeImage
                        src={cert.imageUrl}
                        alt={cert.titleFa || `Certificate ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => void handleRemoveCertificate(idx)}
                        aria-label={isFa ? `حذف گواهینامه ${idx + 1}` : `Remove certificate ${idx + 1}`}
                        className="absolute top-2 end-2 w-7 h-7 rounded-full bg-black/75 border border-white/20 text-rose-300 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={cert.titleFa ?? ''}
                      onChange={(e) => handleUpdateCertificateField(idx, 'titleFa', e.target.value)}
                      placeholder={
                        isFa ? 'عنوان گواهینامه (مثلاً گواهی فنی مرکز تحقیقات)' : 'Certificate title'
                      }
                      className="glass-input w-full rounded-lg px-2.5 py-1.5 text-xs text-[#F5F8FC]"
                    />
                    <input
                      type="text"
                      value={cert.issuerFa ?? ''}
                      onChange={(e) => handleUpdateCertificateField(idx, 'issuerFa', e.target.value)}
                      placeholder={isFa ? 'مرجع صادرکننده (اختیاری)' : 'Issuing authority (optional)'}
                      className="glass-input w-full rounded-lg px-2.5 py-1.5 text-[11px] text-[#C6D2E3]"
                    />
                  </div>
                ))}
              </div>
            )}

            {(certUploadError || errors.certificates) && (
              <p role="alert" className="text-[11px] text-amber-300">
                {certUploadError || errors.certificates}
              </p>
            )}
          </div>

          {/* 4. TECHNICAL CATALOG LINK SECTION */}
          <div className="rounded-2xl border border-[#DFBA78]/25 bg-[#14110C]/65 p-4 sm:p-5 space-y-3.5">
            <h4 className="text-xs sm:text-sm font-semibold text-[#FBF6EB] inline-flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#DFBA78]" />
              <span>{isFa ? 'کاتالوگ فنی محصول (PDF یا لینک دانلود)' : 'Technical Catalog (PDF / Download Link)'}</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label htmlFor="mat-catalog-url" className="block text-xs font-medium text-[#DCE6F5]">
                  {isFa ? 'لینک دانلود یا مشاهده کاتالوگ (اختیاری)' : 'Catalog PDF / Page URL (Optional)'}
                </label>
                <input
                  id="mat-catalog-url"
                  type="url"
                  dir="ltr"
                  value={editing.catalogUrl}
                  onChange={(e) =>
                    setEditing((prev) => (prev ? { ...prev, catalogUrl: e.target.value } : prev))
                  }
                  placeholder="https://example.com/catalog.pdf"
                  className="glass-input w-full rounded-xl px-3.5 py-2.5 text-xs text-[#F5F8FC]"
                />
                {errors.catalogUrl && <p className="text-[11px] text-amber-300">{errors.catalogUrl}</p>}
              </div>
              <div className="space-y-1.5">
                <label htmlFor="mat-catalog-label" className="block text-xs font-medium text-[#DCE6F5]">
                  {isFa ? 'عنوان کاتالوگ (فارسی)' : 'Catalog Label (Persian)'}
                </label>
                <input
                  id="mat-catalog-label"
                  type="text"
                  value={editing.catalogLabelFa}
                  onChange={(e) =>
                    setEditing((prev) => (prev ? { ...prev, catalogLabelFa: e.target.value } : prev))
                  }
                  placeholder={isFa ? 'مثلاً کاتالوگ فنی و جداول انتخاب محصول' : 'Catalog display title'}
                  className="glass-input w-full rounded-xl px-3.5 py-2.5 text-xs text-[#F5F8FC]"
                />
              </div>
            </div>
          </div>

          {/* 5. LINKED PARTNER BRANDS */}
          {publishedPartners.length > 0 && (
            <div className="space-y-2">
              <span className="block text-xs font-medium text-[#DCE6F5]">
                {isFa ? 'اتصال به برندهای همکار (اختیاری)' : 'Link Partner Brands (Optional)'}
              </span>
              <div className="flex flex-wrap gap-2">
                {publishedPartners.map((brand) => {
                  const selected = editing.partnerIds.includes(brand.id);
                  return (
                    <button
                      key={brand.id}
                      type="button"
                      onClick={() => togglePartnerId(brand.id)}
                      className={`min-h-[34px] inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs border transition-colors ${
                        selected
                          ? 'border-[#DFBA78]/65 bg-[#DFBA78]/18 text-[#F7E5BE] font-semibold'
                          : 'border-white/12 bg-white/[0.03] text-[#9BB0CB] hover:text-white'
                      }`}
                    >
                      {selected && <Check className="w-3 h-3 text-[#DFBA78]" />}
                      <span>{isFa ? brand.nameFa : brand.nameEn}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Optional English & Slug fields */}
          {showEnFields && (
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4 grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label htmlFor="mat-title-en" className="block text-xs font-medium text-[#C6D2E3]">
                  English Title
                </label>
                <input
                  id="mat-title-en"
                  type="text"
                  dir="ltr"
                  value={editing.titleEn}
                  onChange={(e) =>
                    setEditing((prev) => (prev ? { ...prev, titleEn: e.target.value } : prev))
                  }
                  placeholder="Material English title"
                  className="glass-input w-full rounded-xl px-3 py-2 text-xs text-[#F5F8FC]"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="mat-slug" className="block text-xs font-medium text-[#C6D2E3]">
                  URL Slug (optional)
                </label>
                <input
                  id="mat-slug"
                  type="text"
                  dir="ltr"
                  value={editing.slug}
                  onChange={(e) =>
                    setEditing((prev) => (prev ? { ...prev, slug: e.target.value } : prev))
                  }
                  placeholder="etics-thermal-envelope"
                  className="glass-input w-full rounded-xl px-3 py-2 text-xs font-mono text-[#F5F8FC]"
                />
                {errors.slug && <p className="text-[11px] text-amber-300">{errors.slug}</p>}
              </div>
              <div className="space-y-1.5">
                <label htmlFor="mat-subtitle-en" className="block text-xs font-medium text-[#C6D2E3]">
                  English Subtitle
                </label>
                <input
                  id="mat-subtitle-en"
                  type="text"
                  dir="ltr"
                  value={editing.subtitleEn}
                  onChange={(e) =>
                    setEditing((prev) => (prev ? { ...prev, subtitleEn: e.target.value } : prev))
                  }
                  className="glass-input w-full rounded-xl px-3 py-2 text-xs text-[#F5F8FC]"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="mat-brand-en" className="block text-xs font-medium text-[#C6D2E3]">
                  Brand Name (English)
                </label>
                <input
                  id="mat-brand-en"
                  type="text"
                  dir="ltr"
                  value={editing.brandNameEn}
                  onChange={(e) =>
                    setEditing((prev) => (prev ? { ...prev, brandNameEn: e.target.value } : prev))
                  }
                  className="glass-input w-full rounded-xl px-3 py-2 text-xs text-[#F5F8FC]"
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label htmlFor="mat-summary-en" className="block text-xs font-medium text-[#C6D2E3]">
                  English Summary
                </label>
                <textarea
                  id="mat-summary-en"
                  rows={2}
                  dir="ltr"
                  value={editing.summaryEn}
                  onChange={(e) =>
                    setEditing((prev) => (prev ? { ...prev, summaryEn: e.target.value } : prev))
                  }
                  className="glass-input w-full rounded-xl px-3 py-2 text-xs text-[#F5F8FC]"
                />
              </div>
            </div>
          )}

          {/* Display Order, Status & Featured */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end border-t border-white/10 pt-4">
            <div className="space-y-1.5">
              <label htmlFor="mat-order" className="block text-xs font-medium text-[#DCE6F5]">
                {isFa ? 'ترتیب نمایش' : 'Display Order'}
              </label>
              <input
                id="mat-order"
                type="number"
                min={0}
                max={999}
                value={editing.order}
                onChange={(e) =>
                  setEditing((prev) =>
                    prev ? { ...prev, order: Number(e.target.value) || 0 } : prev
                  )
                }
                className="glass-input w-full rounded-xl px-3.5 py-2.5 text-sm font-mono font-numeric text-[#F5F8FC]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="mat-status" className="block text-xs font-medium text-[#DCE6F5]">
                {isFa ? 'وضعیت انتشار' : 'Visibility'}
              </label>
              <select
                id="mat-status"
                value={editing.status}
                onChange={(e) =>
                  setEditing((prev) =>
                    prev
                      ? { ...prev, status: e.target.value === 'draft' ? 'draft' : 'published' }
                      : prev
                  )
                }
                className="w-full rounded-xl border border-[#6F9BFF]/25 bg-[#0E1626] px-3 py-2.5 text-xs text-[#F5F8FC]"
              >
                <option value="published">{isFa ? 'منتشرشده در سایت' : 'Published'}</option>
                <option value="draft">{isFa ? 'پیش‌نویس (مخفی)' : 'Draft (Hidden)'}</option>
              </select>
            </div>

            <label className="inline-flex items-center gap-2.5 min-h-[42px] px-3 rounded-xl border border-white/10 bg-white/[0.02] cursor-pointer">
              <input
                type="checkbox"
                checked={editing.featured}
                onChange={(e) =>
                  setEditing((prev) => (prev ? { ...prev, featured: e.target.checked } : prev))
                }
                className="accent-[#DFBA78] w-4 h-4"
              />
              <span className="text-xs text-[#DCE6F5]">
                {isFa ? 'نمایش در ویترین ویژه' : 'Featured in Spotlight'}
              </span>
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="min-h-[44px] inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-xs font-semibold text-[#13100A] bg-gradient-to-r from-[#F3DCA6] via-[#DFBA78] to-[#C89B54] hover:brightness-110 disabled:opacity-60 transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>
                {saving
                  ? isFa
                    ? 'در حال ذخیره...'
                    : 'Saving...'
                  : isFa
                    ? 'ذخیره و انتشار مصالح'
                    : 'Save Material'}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="glass-pill min-h-[44px] rounded-full px-5 py-2 text-xs text-[#C6D2E3]"
            >
              {isFa ? 'انصراف' : 'Cancel'}
            </button>
          </div>
        </form>
      )}

      {/* Existing Materials Grid */}
      {materials.length === 0 ? (
        <div className="glass-surface rounded-2xl p-10 text-center text-sm text-[#8B9DB7]">
          {isFa
            ? 'هیچ مصالحی ثبت نشده است. از دکمه «افزودن مصالح جدید» استفاده کنید.'
            : 'No materials configured yet. Click Add New Material to create one.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {materials.map((mat) => {
            const isConfirming = confirmDeleteId === mat.id;
            const certCount = mat.certificates?.length ?? 0;
            const hasCatalog = Boolean(mat.catalogUrl?.trim() && isSafeExternalUrl(mat.catalogUrl));

            return (
              <div
                key={mat.id}
                className="glass-card rounded-2xl overflow-hidden flex flex-col justify-between border border-white/10"
              >
                <div>
                  <div className="relative aspect-[16/9] bg-[#070B14] overflow-hidden">
                    <SafeImage
                      src={mat.coverImage}
                      alt={isFa ? mat.titleFa : mat.titleEn}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#080D16]/85 via-transparent to-black/30" />
                    <div className="absolute top-2.5 inset-x-3 flex items-center justify-between gap-2 text-[10.5px]">
                      <span className="rounded-md bg-black/60 backdrop-blur px-2 py-0.5 font-mono text-[#F3DCA6]">
                        #{String(mat.order).padStart(2, '0')}
                      </span>
                      <span
                        className={`rounded-md px-2 py-0.5 font-medium ${
                          mat.status === 'published'
                            ? 'bg-[#00A651]/25 text-[#28CF77] border border-[#28CF77]/35'
                            : 'bg-black/65 text-[#C6D2E3] border border-white/15'
                        }`}
                      >
                        {mat.status === 'published'
                          ? isFa
                            ? 'منتشرشده'
                            : 'Live'
                          : isFa
                            ? 'پیش‌نویس'
                            : 'Draft'}
                      </span>
                    </div>
                    {mat.performanceMetric && (
                      <span className="absolute bottom-2.5 end-3 font-mono text-xs font-semibold text-[#28CF77] ltr-inline drop-shadow">
                        {mat.performanceMetric}
                      </span>
                    )}
                  </div>

                  <div className="p-4 space-y-2">
                    <div className="text-[11px] text-[#DFBA78]">
                      {MATERIAL_CATEGORY_LABELS[mat.category][locale]}
                    </div>
                    <h3 className="text-sm font-semibold text-[#F5F8FC] leading-snug">
                      {isFa ? mat.titleFa : mat.titleEn}
                    </h3>
                    {(isFa ? mat.brandNameFa : mat.brandNameEn) && (
                      <p className="text-xs text-[#9BB0CB] truncate">
                        {isFa ? mat.brandNameFa : mat.brandNameEn}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-[#B8C6DA]">
                      <span className="inline-flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#28CF77]" />
                        <span className="font-numeric">
                          {isFa
                            ? `${certCount.toLocaleString('fa-IR')} عکس گواهینامه`
                            : `${certCount} cert photo${certCount === 1 ? '' : 's'}`}
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-[#DFBA78]" />
                        <span>
                          {hasCatalog
                            ? isFa
                              ? 'کاتالوگ متصل'
                              : 'Catalog Linked'
                            : isFa
                              ? 'بدون لینک کاتالوگ'
                              : 'No catalog URL'}
                        </span>
                      </span>
                    </div>

                    {hasCatalog && (
                      <a
                        href={mat.catalogUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10.5px] text-[#6F9BFF] hover:underline truncate max-w-full"
                      >
                        <ExternalLink className="w-3 h-3 shrink-0" />
                        <span className="truncate ltr-inline">{mat.catalogUrl}</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Controls */}
                <div className="px-4 pb-4">
                  {isConfirming ? (
                    <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-3">
                      <span className="text-[11px] text-rose-300">
                        {isFa ? 'حذف شود؟' : 'Remove?'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={deletingId === mat.id}
                          onClick={() => void handleDelete(mat)}
                          className="rounded-lg bg-rose-500/80 hover:bg-rose-500 px-2.5 py-1 text-[11px] font-semibold text-white disabled:opacity-50"
                        >
                          {isFa ? 'بله، حذف' : 'Confirm'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="rounded-lg border border-white/15 px-2.5 py-1 text-[11px] text-[#C6D2E3]"
                        >
                          {isFa ? 'خیر' : 'No'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-3">
                      <button
                        type="button"
                        onClick={() => startEdit(mat)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#DFBA78]/35 bg-[#DFBA78]/12 px-3 py-1.5 text-[11px] font-medium text-[#F3DCA6] hover:border-[#DFBA78]"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>{isFa ? 'ویرایش و گواهینامه‌ها' : 'Edit & Certificates'}</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => void handleToggleStatus(mat)}
                          title={
                            mat.status === 'published'
                              ? isFa
                                ? 'مخفی کردن'
                                : 'Hide'
                              : isFa
                                ? 'انتشار'
                                : 'Publish'
                          }
                          className="p-1.5 rounded-lg border border-white/10 text-[#9BB0CB] hover:text-white hover:border-white/25 transition-colors"
                        >
                          {mat.status === 'published' ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(mat.id)}
                          title={isFa ? 'حذف' : 'Delete'}
                          className="p-1.5 rounded-lg border border-white/10 text-rose-300/80 hover:text-rose-200 hover:border-rose-400/40 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
