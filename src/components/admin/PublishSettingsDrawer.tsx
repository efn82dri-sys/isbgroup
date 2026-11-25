import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Sliders, X } from '../icons/IsbIcons';
import type { InsightTopic, Locale } from '../../types/content';
import type { FieldErrors, InsightFormInput } from '../../utils/validation';
import { slugifyEnglish } from '../../utils/validation';
import type { TelegraphLangMode } from './TelegraphBlockCanvas';

export interface PublishSettingsState {
  existingId?: string;
  slug: string;
  titleEn: string;
  subtitleEn: string;
  excerptFa: string;
  excerptEn: string;
  authorRoleFa: string;
  authorRoleEn: string;
  authorEn: string;
  tagsFaText: string;
  tagsEnText: string;
  topic: InsightTopic;
  publishedDate: string;
  featured: boolean;
}

interface PublishSettingsDrawerProps {
  open: boolean;
  locale: Locale;
  langMode: TelegraphLangMode;
  onChangeLangMode: (mode: TelegraphLangMode) => void;
  values: PublishSettingsState;
  errors: FieldErrors<InsightFormInput>;
  onChange: (patch: Partial<PublishSettingsState>) => void;
  onClose: () => void;
}

export function PublishSettingsDrawer({
  open,
  locale,
  langMode,
  onChangeLangMode,
  values,
  errors,
  onChange,
  onClose,
}: PublishSettingsDrawerProps) {
  const isFa = locale === 'fa';

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isFa ? 'تنظیمات انتشار و ترجمه مقاله' : 'Article Publish Settings & Translation'}
      dir={isFa ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-[9990] flex justify-end bg-black/65 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md h-full bg-[#09101E] border-s border-white/12 shadow-2xl flex flex-col overflow-hidden">
        {/* Drawer Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#28CF77]" />
            <h3 className="text-sm font-semibold text-[#F5F8FC]">
              {isFa ? 'تنظیمات انتشار، سئو و ترجمه' : 'Publish Settings, SEO & Translation'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={isFa ? 'بستن تنظیمات' : 'Close settings'}
            className="w-8 h-8 rounded-lg border border-white/10 text-[#9BB0CC] hover:text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          <p className="text-xs text-[#8FA4C2] leading-relaxed">
            {isFa
              ? 'تمامی این موارد اختیاری هستند؛ در صورت خالی ماندن، چکیده و نشانی URL به صورت خودکار از متن مقاله ساخته می‌شوند.'
              : 'All fields here are optional. Excerpt and URL slug are generated automatically if left blank.'}
          </p>

          {/* 1. Core Publish Controls */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-semibold text-[#DCE6F5]">
              {isFa ? 'تنظیمات انتشار و نمایش' : 'Publishing & Visibility'}
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] text-[#9BB0CC]">
                  {isFa ? 'دپارتمان' : 'Department'}
                </label>
                <select
                  value={values.topic}
                  onChange={(e) => onChange({ topic: e.target.value as InsightTopic })}
                  className="w-full rounded-xl border border-white/12 bg-[#0E172A] px-3 py-2 text-xs text-[#F5F8FC]"
                >
                  <option value="sustainability-lab">
                    {isFa ? 'آزمایشگاه پایداری' : 'Sustainability Lab'}
                  </option>
                  <option value="architecture">
                    {isFa ? 'معماری و شهرسازی' : 'Architecture & Urbanism'}
                  </option>
                  <option value="energy-mep">
                    {isFa ? 'انرژی و تأسیسات' : 'Energy & MEP'}
                  </option>
                  <option value="structure-seismic">
                    {isFa ? 'سازه و مهندسی زلزله' : 'Structure & Seismic'}
                  </option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-[#9BB0CC]">
                  {isFa ? 'تاریخ انتشار' : 'Published Date'}
                </label>
                <input
                  type="date"
                  dir="ltr"
                  value={values.publishedDate}
                  onChange={(e) => onChange({ publishedDate: e.target.value })}
                  className="w-full rounded-xl border border-white/12 bg-black/35 px-3 py-2 text-xs text-[#F5F8FC]"
                />
              </div>
            </div>

            <label className="flex items-center justify-between gap-3 rounded-xl border border-white/12 bg-white/[0.02] px-3.5 py-2.5 text-xs text-[#DCE6F5] cursor-pointer">
              <span>{isFa ? 'نمایش به عنوان مقاله شاخص صفحه اول' : 'Feature as Lead Story'}</span>
              <input
                type="checkbox"
                checked={values.featured}
                onChange={(e) => onChange({ featured: e.target.checked })}
                className="w-4 h-4 accent-[#28CF77]"
              />
            </label>

            <div className="space-y-1">
              <label className="text-[11px] text-[#9BB0CC]">
                {isFa ? 'نشانی URL مقاله (اختیاری — خودکار ساخته می‌شود)' : 'URL Slug (auto-generated)'}
              </label>
              <input
                type="text"
                dir="ltr"
                value={values.slug}
                onChange={(e) => onChange({ slug: e.target.value })}
                placeholder="daylight-code19-mashhad"
                className="w-full rounded-xl border border-white/12 bg-black/35 px-3 py-2 text-xs text-[#F5F8FC]"
              />
              {errors.slug && <p className="text-[11px] text-amber-300">{errors.slug}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-[#9BB0CC]">
                {isFa ? 'چکیده کارت و سئو (فارسی — اختیاری)' : 'SEO Excerpt (Persian — optional)'}
              </label>
              <textarea
                rows={2}
                dir="rtl"
                value={values.excerptFa}
                onChange={(e) => onChange({ excerptFa: e.target.value })}
                placeholder="در صورت خالی بودن، خودکار از پاراگراف اول استخراج می‌شود..."
                className="w-full rounded-xl border border-white/12 bg-black/35 px-3 py-2 text-xs text-[#F5F8FC]"
              />
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              <div className="space-y-1">
                <label className="text-[11px] text-[#9BB0CC]">
                  {isFa ? 'سمت / دپارتمان نویسنده' : 'Author Role'}
                </label>
                <input
                  type="text"
                  dir="rtl"
                  value={values.authorRoleFa}
                  onChange={(e) => onChange({ authorRoleFa: e.target.value })}
                  placeholder="مثال: آزمایشگاه پایداری و طراحی معماری"
                  className="w-full rounded-xl border border-white/12 bg-black/35 px-3 py-2 text-xs text-[#F5F8FC]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-[#9BB0CC]">
                  {isFa ? 'کلیدواژه‌ها (با ویرگول جدا کنید)' : 'Tags (comma-separated)'}
                </label>
                <input
                  type="text"
                  dir="rtl"
                  value={values.tagsFaText}
                  onChange={(e) => onChange({ tagsFaText: e.target.value })}
                  placeholder="مبحث ۱۹، سرو طلایی، نور روز، مشهد"
                  className="w-full rounded-xl border border-white/12 bg-black/35 px-3 py-2 text-xs text-[#F5F8FC]"
                />
              </div>
            </div>
          </div>

          {/* 2. Optional English Translation */}
          <div className="pt-5 border-t border-white/10 space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-xs font-semibold text-[#DCE6F5]">
                {isFa ? 'نسخه انگلیسی (اختیاری)' : 'English Localization (Optional)'}
              </h4>
              <div className="inline-flex items-center rounded-lg bg-black/40 p-0.5 border border-white/10 text-[11px]">
                {(
                  [
                    { id: 'fa', label: 'فارسی' },
                    { id: 'both', label: isFa ? 'دوزبانه' : 'Both' },
                    { id: 'en', label: 'EN' },
                  ] as { id: TelegraphLangMode; label: string }[]
                ).map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => onChangeLangMode(mode.id)}
                    className={`rounded-md px-2 py-0.5 transition-colors ${
                      langMode === mode.id
                        ? 'bg-[#00A651]/25 text-[#DFFCEB] font-medium'
                        : 'text-[#8FA4C2] hover:text-white'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2.5">
              <input
                type="text"
                dir="ltr"
                value={values.titleEn}
                onChange={(e) => {
                  const nextEn = e.target.value;
                  onChange({
                    titleEn: nextEn,
                    slug: !values.existingId && !values.slug ? slugifyEnglish(nextEn) : values.slug,
                  });
                }}
                placeholder="English article title (optional)"
                className="w-full rounded-xl border border-white/12 bg-black/35 px-3 py-2 text-xs text-[#F5F8FC]"
              />
              <input
                type="text"
                dir="ltr"
                value={values.subtitleEn}
                onChange={(e) => onChange({ subtitleEn: e.target.value })}
                placeholder="English subtitle (optional)"
                className="w-full rounded-xl border border-white/12 bg-black/35 px-3 py-2 text-xs text-[#DCE6F5]"
              />
              <textarea
                rows={2}
                dir="ltr"
                value={values.excerptEn}
                onChange={(e) => onChange({ excerptEn: e.target.value })}
                placeholder="English SEO excerpt (optional)"
                className="w-full rounded-xl border border-white/12 bg-black/35 px-3 py-2 text-xs text-[#F5F8FC]"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  dir="ltr"
                  value={values.authorEn}
                  onChange={(e) => onChange({ authorEn: e.target.value })}
                  placeholder="Author name (EN)"
                  className="rounded-xl border border-white/12 bg-black/35 px-3 py-2 text-xs text-[#F5F8FC]"
                />
                <input
                  type="text"
                  dir="ltr"
                  value={values.authorRoleEn}
                  onChange={(e) => onChange({ authorRoleEn: e.target.value })}
                  placeholder="Author role (EN)"
                  className="rounded-xl border border-white/12 bg-black/35 px-3 py-2 text-xs text-[#C6D2E3]"
                />
              </div>
              <input
                type="text"
                dir="ltr"
                value={values.tagsEnText}
                onChange={(e) => onChange({ tagsEnText: e.target.value })}
                placeholder="English tags (Code 19, Daylight)"
                className="w-full rounded-xl border border-white/12 bg-black/35 px-3 py-2 text-xs text-[#C6D2E3]"
              />
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="px-5 py-3.5 border-t border-white/10 bg-[#070C17]">
          <button
            type="button"
            onClick={onClose}
            className="w-full min-h-[40px] rounded-xl bg-[#223A87] hover:bg-[#2B48A6] text-xs font-semibold text-white transition-colors"
          >
            {isFa ? 'تأیید و بازگشت به صفحه نگارش' : 'Done — Back to Canvas'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
