import React, { useMemo, useState } from 'react';
import {
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  Images,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  X,
} from '../icons/IsbIcons';
import { SEED_PARTNER_LOGOS } from '../../data/seedContent';
import {
  deletePartnerLogo,
  savePartnerLogo,
  saveSiteSettings,
} from '../../services/contentStore';
import { deleteStudioImage, isMediaRef } from '../../services/mediaStore';
import type { Locale, PartnerLogo, SiteSettings } from '../../types/content';
import {
  hasErrors,
  validatePartnerLogoForm,
  type FieldErrors,
  type PartnerLogoFormInput,
} from '../../utils/validation';
import { SafeImage } from '../BrandMark';
import {
  PartnerLogos,
  PRESET_PARTNER_MARK_OPTIONS,
  renderPartnerPresetMark,
} from '../PartnerLogos';
import { ImageUploaderField } from './ImageUploaderField';

interface PartnersManagerProps {
  locale: Locale;
  partners: PartnerLogo[];
  settings: SiteSettings;
  onRefresh: () => Promise<void>;
  onBanner: (text: string | null, tone?: 'info' | 'success' | 'error') => void;
}

interface PartnerDraft {
  id?: string;
  nameFa: string;
  nameEn: string;
  descriptionFa: string;
  descriptionEn: string;
  logoUrl: string;
  presetMarkId: string;
  websiteUrl: string;
  order: number;
  status: 'published' | 'draft';
}

const SEED_PARTNER_ID_SET = new Set(SEED_PARTNER_LOGOS.map((item) => item.id));

function createEmptyDraft(nextOrder: number): PartnerDraft {
  return {
    nameFa: '',
    nameEn: '',
    descriptionFa: '',
    descriptionEn: '',
    logoUrl: '',
    presetMarkId: '',
    websiteUrl: '',
    order: nextOrder,
    status: 'published',
  };
}

export function PartnersManager({
  locale,
  partners,
  settings,
  onRefresh,
  onBanner,
}: PartnersManagerProps) {
  const isFa = locale === 'fa';
  const [editing, setEditing] = useState<PartnerDraft | null>(null);
  const [errors, setErrors] = useState<FieldErrors<PartnerLogoFormInput>>({});
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);

  const hiddenSeedIds = settings.hiddenSeedPartnerIds ?? [];
  const nextOrder = useMemo(() => {
    if (partners.length === 0) return 1;
    return Math.max(...partners.map((p) => p.order)) + 1;
  }, [partners]);

  const startNew = () => {
    setErrors({});
    setConfirmDeleteId(null);
    setEditing(createEmptyDraft(nextOrder));
  };

  const startEdit = (partner: PartnerLogo) => {
    setErrors({});
    setConfirmDeleteId(null);
    setEditing({
      id: partner.id,
      nameFa: partner.nameFa,
      nameEn: partner.nameEn,
      descriptionFa: partner.descriptionFa ?? '',
      descriptionEn: partner.descriptionEn ?? '',
      logoUrl: partner.logoUrl ?? '',
      presetMarkId: partner.presetMarkId ?? '',
      websiteUrl: partner.websiteUrl ?? '',
      order: partner.order,
      status: partner.status,
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;

    const validationErrors = validatePartnerLogoForm(
      {
        nameFa: editing.nameFa,
        nameEn: editing.nameEn,
        descriptionFa: editing.descriptionFa,
        descriptionEn: editing.descriptionEn,
        logoUrl: editing.logoUrl,
        presetMarkId: editing.presetMarkId,
        websiteUrl: editing.websiteUrl,
        order: editing.order,
      },
      locale
    );
    setErrors(validationErrors);
    if (hasErrors(validationErrors)) return;

    setSaving(true);
    onBanner(null);
    try {
      await savePartnerLogo(
        {
          nameFa: editing.nameFa.trim(),
          nameEn: editing.nameEn.trim(),
          descriptionFa: editing.descriptionFa.trim() || undefined,
          descriptionEn: editing.descriptionEn.trim() || undefined,
          logoUrl: editing.logoUrl.trim() || undefined,
          presetMarkId: editing.presetMarkId.trim() || undefined,
          websiteUrl: editing.websiteUrl.trim() || undefined,
          order: editing.order,
          status: editing.status,
        },
        editing.id
      );

      // If this ID was previously hidden, unhide it automatically when saved
      if (editing.id && hiddenSeedIds.includes(editing.id)) {
        await saveSiteSettings({
          ...settings,
          hiddenSeedPartnerIds: hiddenSeedIds.filter((id) => id !== editing.id),
        });
      }

      setEditing(null);
      await onRefresh();
      onBanner(
        isFa ? 'اطلاعات همکار با موفقیت ذخیره و در سایت به‌روزرسانی شد.' : 'Partner profile saved and updated.',
        'success'
      );
    } catch {
      onBanner(
        isFa ? 'خطا در ذخیره لوگوی همکار. لطفاً دوباره تلاش کنید.' : 'Could not save partner logo.',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (partner: PartnerLogo) => {
    const nextStatus: 'published' | 'draft' = partner.status === 'published' ? 'draft' : 'published';
    try {
      await savePartnerLogo(
        {
          nameFa: partner.nameFa,
          nameEn: partner.nameEn,
          descriptionFa: partner.descriptionFa,
          descriptionEn: partner.descriptionEn,
          logoUrl: partner.logoUrl,
          presetMarkId: partner.presetMarkId,
          websiteUrl: partner.websiteUrl,
          order: partner.order,
          status: nextStatus,
        },
        partner.id
      );
      await onRefresh();
      onBanner(
        nextStatus === 'published'
          ? isFa
            ? 'لوگو در نوار عمومی سایت منتشر شد.'
            : 'Partner logo published.'
          : isFa
            ? 'لوگو به حالت پیش‌نویس (مخفی) منتقل شد.'
            : 'Partner logo hidden as draft.',
        'success'
      );
    } catch {
      onBanner(
        isFa ? 'خطا در تغییر وضعیت انتشار لوگو.' : 'Could not update partner logo status.',
        'error'
      );
    }
  };

  const handleDelete = async (partner: PartnerLogo) => {
    setDeletingId(partner.id);
    onBanner(null);
    try {
      if (!partner.isSeedDefault) {
        await deletePartnerLogo(partner.id);
      }
      if (partner.logoUrl && isMediaRef(partner.logoUrl)) {
        await deleteStudioImage(partner.logoUrl);
      }
      if (SEED_PARTNER_ID_SET.has(partner.id) && !hiddenSeedIds.includes(partner.id)) {
        await saveSiteSettings({
          ...settings,
          hiddenSeedPartnerIds: [...hiddenSeedIds, partner.id],
        });
      }
      if (editing?.id === partner.id) {
        setEditing(null);
      }
      setConfirmDeleteId(null);
      await onRefresh();
      onBanner(
        isFa ? 'لوگو با موفقیت از نوار همکاران حذف شد.' : 'Partner logo removed.',
        'success'
      );
    } catch {
      onBanner(
        isFa ? 'خطا در حذف لوگو. لطفاً دوباره تلاش کنید.' : 'Could not delete partner logo.',
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
        hiddenSeedPartnerIds: [],
      });
      await onRefresh();
      onBanner(
        isFa ? 'لوگوهای پیش‌فرض مخفی‌شده با موفقیت بازیابی شدند.' : 'Hidden starter logos restored.',
        'success'
      );
    } catch {
      onBanner(
        isFa ? 'خطا در بازیابی لوگوهای پیش‌فرض.' : 'Could not restore starter logos.',
        'error'
      );
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="glass-surface rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-semibold text-[#F5F8FC] inline-flex items-center gap-2">
              <Images className="w-4 h-4 text-[#28CF77]" />
              <span>{isFa ? 'مدیریت نوار لوگوهای همکاران و حامیان' : 'Partner & Sponsor Logo Ribbon'}</span>
            </h2>
            <p className="text-xs text-[#9BB0CB]">
              {isFa
                ? 'فایل لوگوی شرکت‌ها (ترجیحاً PNG با پس‌زمینه شفاف یا WebP) را آپلود کنید، ترتیب نمایش را تغییر دهید یا لوگوهای جدید اضافه کنید.'
                : 'Upload company logo files (transparent PNG or WebP recommended), reorder items, or add new partner logos.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {hiddenSeedIds.length > 0 && (
              <button
                type="button"
                disabled={restoring}
                onClick={() => void handleRestoreDefaults()}
                className="glass-pill min-h-[40px] inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs text-[#C6D2E3] hover:border-[#6F9BFF] disabled:opacity-50"
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
              className="glass-cta-emerald min-h-[40px] inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isFa ? 'افزودن لوگوی جدید' : 'Add Partner Logo'}</span>
            </button>
          </div>
        </div>

        {/* Live Single-Line Ribbon Preview */}
        <div className="space-y-2">
          <span className="text-[11px] font-medium text-[#8B9DB7]">
            {isFa ? 'پیش‌نمایش زنده نوار تک‌خطی سایت:' : 'Live single-line ribbon preview:'}
          </span>
          <div className="rounded-xl overflow-hidden border border-white/10">
            <PartnerLogos locale={locale} partners={partners} />
          </div>
        </div>
      </div>

      {/* Add / Edit Partner Logo Form */}
      {editing && (
        <form
          onSubmit={handleSave}
          noValidate
          className="glass-surface rounded-2xl border-[#6F9BFF]/35 p-5 sm:p-6 space-y-5"
        >
          <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
            <h3 className="text-sm sm:text-base font-semibold text-[#F5F8FC]">
              {editing.id
                ? isFa
                  ? 'ویرایش لوگوی همکار'
                  : 'Edit Partner Logo'
                : isFa
                  ? 'افزودن لوگوی همکار جدید'
                  : 'Add New Partner Logo'}
            </h3>
            <button
              type="button"
              onClick={() => setEditing(null)}
              aria-label={isFa ? 'بستن فرم' : 'Close form'}
              className="p-1.5 rounded-lg text-[#8B9DB7] hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <ImageUploaderField
            locale={locale}
            label={
              isFa
                ? 'تصویر لوگو (PNG شفاف / WebP / JPG)'
                : 'Logo Image (Transparent PNG / WebP / JPG)'
            }
            value={editing.logoUrl}
            preset="logo"
            aspectClass="aspect-[16/7]"
            objectFit="contain"
            hint={
              isFa
                ? 'شفافیت پس‌زمینه PNG و WebP حفظ می‌شود. در صورت آپلود، فقط تصویر لوگوی شما در نوار نمایش داده می‌شود.'
                : 'PNG/WebP alpha transparency is preserved. When uploaded, only your logo image is rendered in the ribbon.'
            }
            error={errors.logoUrl}
            onChange={(nextUrl) => setEditing((prev) => (prev ? { ...prev, logoUrl: nextUrl } : prev))}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="partner-name-fa" className="block text-xs font-medium text-[#DCE6F5]">
                {isFa ? 'نام مجموعه (فارسی) *' : 'Partner Name (Persian) *'}
              </label>
              <input
                id="partner-name-fa"
                type="text"
                value={editing.nameFa}
                onChange={(e) => setEditing((prev) => (prev ? { ...prev, nameFa: e.target.value } : prev))}
                placeholder={isFa ? 'مثلاً گروه ساختمانی ایزولتکو' : 'Persian name'}
                className="glass-input w-full rounded-xl px-3.5 py-2.5 text-sm text-[#F5F8FC]"
              />
              {errors.nameFa && <p className="text-[11px] text-amber-300">{errors.nameFa}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="partner-name-en" className="block text-xs font-medium text-[#DCE6F5]">
                {isFa ? 'نام مجموعه (انگلیسی) *' : 'Partner Name (English) *'}
              </label>
              <input
                id="partner-name-en"
                type="text"
                dir="ltr"
                value={editing.nameEn}
                onChange={(e) => setEditing((prev) => (prev ? { ...prev, nameEn: e.target.value } : prev))}
                placeholder="e.g. ISOLETCO"
                className="glass-input w-full rounded-xl px-3.5 py-2.5 text-sm text-[#F5F8FC]"
              />
              {errors.nameEn && <p className="text-[11px] text-amber-300">{errors.nameEn}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="partner-desc-fa" className="block text-xs font-medium text-[#DCE6F5]">
                {isFa ? 'توضیح مختصر درباره شرکت (فارسی)' : 'Short Company Description (Persian)'}
              </label>
              <input
                id="partner-desc-fa"
                type="text"
                dir="rtl"
                maxLength={240}
                value={editing.descriptionFa}
                onChange={(e) =>
                  setEditing((prev) => (prev ? { ...prev, descriptionFa: e.target.value } : prev))
                }
                placeholder={isFa ? 'یک جمله کوتاه درباره حوزه فعالیت و همکاری با گروه ISB' : 'Brief Persian description'}
                className="glass-input w-full rounded-xl px-3.5 py-2.5 text-sm text-[#F5F8FC]"
              />
              {errors.descriptionFa && <p className="text-[11px] text-amber-300">{errors.descriptionFa}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="partner-desc-en" className="block text-xs font-medium text-[#DCE6F5]">
                {isFa ? 'توضیح مختصر درباره شرکت (انگلیسی)' : 'Short Company Description (English)'}
              </label>
              <input
                id="partner-desc-en"
                type="text"
                dir="ltr"
                maxLength={240}
                value={editing.descriptionEn}
                onChange={(e) =>
                  setEditing((prev) => (prev ? { ...prev, descriptionEn: e.target.value } : prev))
                }
                placeholder="Concise summary of the partner's specialization"
                className="glass-input w-full rounded-xl px-3.5 py-2.5 text-sm text-[#F5F8FC]"
              />
              {errors.descriptionEn && <p className="text-[11px] text-amber-300">{errors.descriptionEn}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="partner-website" className="block text-xs font-medium text-[#DCE6F5]">
                {isFa ? 'لینک وب‌سایت همکار (اختیاری)' : 'Website URL (Optional)'}
              </label>
              <input
                id="partner-website"
                type="url"
                dir="ltr"
                value={editing.websiteUrl}
                onChange={(e) =>
                  setEditing((prev) => (prev ? { ...prev, websiteUrl: e.target.value } : prev))
                }
                placeholder="https://example.com"
                className="glass-input w-full rounded-xl px-3.5 py-2.5 text-sm text-[#F5F8FC]"
              />
              {errors.websiteUrl && <p className="text-[11px] text-amber-300">{errors.websiteUrl}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="partner-order" className="block text-xs font-medium text-[#DCE6F5]">
                  {isFa ? 'ترتیب نمایش' : 'Display Order'}
                </label>
                <input
                  id="partner-order"
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
                {errors.order && <p className="text-[11px] text-amber-300">{errors.order}</p>}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="partner-status" className="block text-xs font-medium text-[#DCE6F5]">
                  {isFa ? 'وضعیت نمایش' : 'Visibility'}
                </label>
                <select
                  id="partner-status"
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
                  <option value="published">{isFa ? 'منتشرشده در نوار' : 'Published'}</option>
                  <option value="draft">{isFa ? 'پیش‌نویس (مخفی)' : 'Draft (Hidden)'}</option>
                </select>
              </div>
            </div>
          </div>

          {!editing.logoUrl.trim() && (
            <div className="space-y-1.5">
              <label htmlFor="partner-preset-mark" className="block text-xs font-medium text-[#DCE6F5]">
                {isFa
                  ? 'نشان هندسی جایگزین (وقتی تصویر لوگو آپلود نشده باشد)'
                  : 'Fallback Vector Emblem (when no logo image is uploaded)'}
              </label>
              <select
                id="partner-preset-mark"
                value={editing.presetMarkId}
                onChange={(e) =>
                  setEditing((prev) => (prev ? { ...prev, presetMarkId: e.target.value } : prev))
                }
                className="w-full sm:max-w-sm rounded-xl border border-[#6F9BFF]/25 bg-[#0E1626] px-3 py-2.5 text-xs text-[#F5F8FC]"
              >
                <option value="">{isFa ? 'نشان استاندارد پیش‌فرض' : 'Default Geometric Emblem'}</option>
                {PRESET_PARTNER_MARK_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {isFa ? opt.labelFa : opt.labelEn}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="glass-cta-emerald min-h-[42px] inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-semibold disabled:opacity-60"
            >
              <Save className="w-3.5 h-3.5" />
              <span>
                {saving
                  ? isFa
                    ? 'در حال ذخیره...'
                    : 'Saving...'
                  : isFa
                    ? 'ذخیره لوگوی همکار'
                    : 'Save Partner Logo'}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="glass-pill min-h-[42px] rounded-full px-5 py-2 text-xs text-[#C6D2E3]"
            >
              {isFa ? 'انصراف' : 'Cancel'}
            </button>
          </div>
        </form>
      )}

      {/* Partner Logos Grid */}
      {partners.length === 0 ? (
        <div className="glass-surface rounded-2xl p-10 text-center text-sm text-[#8B9DB7]">
          {isFa
            ? 'هیچ لوگویی برای نمایش وجود ندارد. از دکمه «افزودن لوگوی جدید» استفاده کنید.'
            : 'No partner logos configured yet. Click Add Partner Logo to upload one.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {partners.map((partner) => {
            const isConfirming = confirmDeleteId === partner.id;
            const hasUploaded = Boolean(partner.logoUrl?.trim());
            return (
              <div
                key={partner.id}
                className="glass-card rounded-2xl p-4 flex flex-col justify-between gap-3.5"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-numeric text-[11px] text-[#8B9DB7]">
                      #{String(partner.order).padStart(2, '0')}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {hasUploaded && (
                        <span className="rounded-md bg-[#223A87]/40 border border-[#6F9BFF]/35 px-1.5 py-0.5 text-[10px] text-[#9AC0FF]">
                          {isFa ? 'لوگوی آپلودی' : 'Uploaded'}
                        </span>
                      )}
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
                          partner.status === 'published'
                            ? 'bg-[#00A651]/18 text-[#28CF77] border border-[#28CF77]/30'
                            : 'bg-white/8 text-[#9BB0CB] border border-white/10'
                        }`}
                      >
                        {partner.status === 'published'
                          ? isFa
                            ? 'فعال'
                            : 'Live'
                          : isFa
                            ? 'مخفی'
                            : 'Draft'}
                      </span>
                    </div>
                  </div>

                  {/* Logo Preview Box */}
                  <div className="h-16 rounded-xl border border-white/10 bg-[#070D19] px-3 flex items-center justify-center overflow-hidden">
                    {hasUploaded ? (
                      <SafeImage
                        src={partner.logoUrl!}
                        alt={isFa ? partner.nameFa : partner.nameEn}
                        className="max-h-10 max-w-full object-contain"
                      />
                    ) : (
                      <div className="inline-flex items-center gap-2 text-[#C6D2E3]">
                        {renderPartnerPresetMark(partner.presetMarkId ?? partner.id, 'w-5 h-5 shrink-0')}
                        <span className="text-xs font-medium truncate max-w-[140px]">
                          {isFa ? partner.nameFa : partner.nameEn}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <p className="text-xs font-semibold text-[#F5F8FC] truncate">
                      {partner.nameFa}
                    </p>
                    <p className="text-[11px] text-[#8B9DB7] truncate ltr-inline">
                      {partner.nameEn}
                    </p>
                    {(isFa ? partner.descriptionFa : partner.descriptionEn) && (
                      <p className="text-[11px] text-[#A8BAD4] line-clamp-2 leading-relaxed">
                        {isFa ? partner.descriptionFa : partner.descriptionEn}
                      </p>
                    )}
                    {partner.websiteUrl && (
                      <a
                        href={partner.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10.5px] text-[#6F9BFF] hover:underline truncate max-w-full"
                      >
                        <ExternalLink className="w-3 h-3 shrink-0" />
                        <span className="truncate ltr-inline">{partner.websiteUrl}</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Card Controls */}
                {isConfirming ? (
                  <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-3">
                    <span className="text-[11px] text-rose-300">
                      {isFa ? 'حذف شود؟' : 'Remove?'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={deletingId === partner.id}
                        onClick={() => void handleDelete(partner)}
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
                  <div className="flex items-center justify-between gap-1.5 border-t border-white/10 pt-3">
                    <button
                      type="button"
                      onClick={() => startEdit(partner)}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#6F9BFF]/30 bg-[#223A87]/25 px-2.5 py-1.5 text-[11px] font-medium text-[#DCE6F5] hover:border-[#6F9BFF]"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>{isFa ? 'ویرایش / آپلود' : 'Edit / Upload'}</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => void handleToggleStatus(partner)}
                        title={
                          partner.status === 'published'
                            ? isFa
                              ? 'مخفی کردن'
                              : 'Hide'
                            : isFa
                              ? 'انتشار'
                              : 'Publish'
                        }
                        aria-label={
                          partner.status === 'published'
                            ? isFa
                              ? `مخفی کردن ${partner.nameFa}`
                              : `Hide ${partner.nameEn}`
                            : isFa
                              ? `انتشار ${partner.nameFa}`
                              : `Publish ${partner.nameEn}`
                        }
                        className="p-1.5 rounded-lg border border-white/10 text-[#9BB0CB] hover:text-white hover:border-white/25 transition-colors"
                      >
                        {partner.status === 'published' ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(partner.id)}
                        title={isFa ? 'حذف' : 'Delete'}
                        aria-label={
                          isFa ? `حذف ${partner.nameFa}` : `Delete ${partner.nameEn}`
                        }
                        className="p-1.5 rounded-lg border border-white/10 text-rose-300/80 hover:text-rose-200 hover:border-rose-400/40 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
