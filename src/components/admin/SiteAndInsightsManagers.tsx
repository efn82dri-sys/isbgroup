import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Save,
  Sliders,
} from '../icons/IsbIcons';
import { saveSiteSettings } from '../../services/contentStore';
import type { Insight, Locale, SiteSettings } from '../../types/content';
import { InsightBlockComposer } from './InsightBlockComposer';

interface InsightsManagerProps {
  locale: Locale;
  insights: Insight[];
  settings?: SiteSettings;
  onRefresh: () => Promise<void>;
  onBanner: (text: string, tone?: 'info' | 'success' | 'error') => void;
}

export function InsightsManager(props: InsightsManagerProps) {
  return <InsightBlockComposer {...props} />;
}

interface SiteCustomizationManagerProps {
  locale: Locale;
  settings: SiteSettings;
  hasPasswordProvider: boolean;
  newStudioPassword: string;
  confirmStudioPassword: string;
  showNewPassword: boolean;
  savingPassword: boolean;
  passwordMessage: { tone: 'success' | 'error'; text: string } | null;
  onChangeNewPassword: (v: string) => void;
  onChangeConfirmPassword: (v: string) => void;
  onToggleShowNewPassword: () => void;
  onSubmitPassword: (e: React.FormEvent) => void;
  onRefresh: () => Promise<void>;
  onBanner: (text: string, tone?: 'info' | 'success' | 'error') => void;
}

export function SiteCustomizationManager({
  locale,
  settings,
  hasPasswordProvider,
  newStudioPassword,
  confirmStudioPassword,
  showNewPassword,
  savingPassword,
  passwordMessage,
  onChangeNewPassword,
  onChangeConfirmPassword,
  onToggleShowNewPassword,
  onSubmitPassword,
  onRefresh,
  onBanner,
}: SiteCustomizationManagerProps) {
  const isFa = locale === 'fa';
  const [form, setForm] = useState<SiteSettings>(settings);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveSiteSettings(form);
      await onRefresh();
      onBanner(
        isFa ? 'تنظیمات و شخصی‌سازی سایت با موفقیت ذخیره شد.' : 'Site customization saved.',
        'success'
      );
    } catch {
      onBanner(isFa ? 'خطا در ذخیره تنظیمات.' : 'Could not save settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <form onSubmit={handleSave} className="glass-surface lg:col-span-8 rounded-3xl p-6 sm:p-7 space-y-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#223A87]/28 border border-[#6F9BFF]/38 flex items-center justify-center shrink-0">
            <Sliders className="w-5 h-5 text-[#6F9BFF]" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[#F7F5F0]">
              {isFa ? 'شخصی‌سازی برند، متون صفحه اول و اطلاعات تماس' : 'Brand, Hero Copy & Contact Channels'}
            </h2>
            <p className="text-xs text-[#A4A9A5] mt-0.5">
              {isFa
                ? 'تمامی تغییرات پس از ذخیره بلافاصله در هدر، هیرو، صفحه درباره ما، تماس و فوتر سایت اعمال می‌شوند.'
                : 'Changes apply immediately across the header, hero, about page, contact page, and footer.'}
            </p>
          </div>
        </div>

        {/* Brand & Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="space-y-1.5 text-xs text-[#D0D0C8]">
            <span>{isFa ? 'نام برند (فارسی)' : 'Brand Name (FA)'}</span>
            <input
              type="text"
              dir="rtl"
              value={form.brandNameFa}
              onChange={(e) => setForm({ ...form, brandNameFa: e.target.value })}
              className="w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2.5 text-sm text-[#F5F3EE]"
            />
          </label>
          <label className="space-y-1.5 text-xs text-[#D0D0C8]">
            <span>{isFa ? 'نام برند (انگلیسی)' : 'Brand Name (EN)'}</span>
            <input
              type="text"
              dir="ltr"
              value={form.brandNameEn}
              onChange={(e) => setForm({ ...form, brandNameEn: e.target.value })}
              className="w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2.5 text-sm text-[#F5F3EE]"
            />
          </label>
          <label className="space-y-1.5 text-xs text-[#D0D0C8]">
            <span>{isFa ? 'شهر و نشانی دفتر (فارسی)' : 'Studio Location (FA)'}</span>
            <input
              type="text"
              dir="rtl"
              value={form.studioCityFa ?? ''}
              onChange={(e) => setForm({ ...form, studioCityFa: e.target.value })}
              className="w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2.5 text-sm text-[#F5F3EE]"
            />
          </label>
          <label className="space-y-1.5 text-xs text-[#D0D0C8]">
            <span>{isFa ? 'شهر و نشانی دفتر (انگلیسی)' : 'Studio Location (EN)'}</span>
            <input
              type="text"
              dir="ltr"
              value={form.studioCityEn ?? ''}
              onChange={(e) => setForm({ ...form, studioCityEn: e.target.value })}
              className="w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2.5 text-sm text-[#F5F3EE]"
            />
          </label>
        </div>

        {/* Contact & Social Channels */}
        <div className="pt-4 border-t border-white/10 space-y-3">
          <h3 className="text-xs font-semibold text-[#6F9BFF]">
            {isFa ? 'راه‌های ارتباطی و شبکه‌های اجتماعی' : 'Contact & Social Links'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="space-y-1.5 text-xs text-[#D0D0C8]">
              <span>{isFa ? 'ایمیل عمومی سایت' : 'Public Email'}</span>
              <input
                type="email"
                dir="ltr"
                value={form.publicEmail ?? ''}
                onChange={(e) => setForm({ ...form, publicEmail: e.target.value })}
                placeholder="info@isbgroup.ir"
                className="w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2.5 text-sm text-[#F5F3EE]"
              />
            </label>
            <label className="space-y-1.5 text-xs text-[#D0D0C8]">
              <span>{isFa ? 'شماره تماس عمومی' : 'Public Phone'}</span>
              <input
                type="text"
                dir="ltr"
                value={form.publicPhone ?? ''}
                onChange={(e) => setForm({ ...form, publicPhone: e.target.value })}
                placeholder="+98 51 3..."
                className="w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2.5 text-sm text-[#F5F3EE]"
              />
            </label>
            <label className="space-y-1.5 text-xs text-[#D0D0C8]">
              <span>Instagram URL</span>
              <input
                type="url"
                dir="ltr"
                value={form.instagramUrl}
                onChange={(e) => setForm({ ...form, instagramUrl: e.target.value })}
                className="w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2.5 text-sm text-[#F5F3EE]"
              />
            </label>
            <label className="space-y-1.5 text-xs text-[#D0D0C8]">
              <span>LinkedIn URL</span>
              <input
                type="url"
                dir="ltr"
                value={form.linkedinUrl ?? ''}
                onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })}
                placeholder="https://www.linkedin.com/company/isb-sustainable/"
                className="w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2.5 text-sm text-[#F5F3EE]"
              />
            </label>
            <label className="space-y-1.5 text-xs text-[#D0D0C8]">
              <span>Telegram URL</span>
              <input
                type="url"
                dir="ltr"
                value={form.telegramUrl ?? ''}
                onChange={(e) => setForm({ ...form, telegramUrl: e.target.value })}
                placeholder="https://t.me/..."
                className="w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2.5 text-sm text-[#F5F3EE]"
              />
            </label>
            <label className="space-y-1.5 text-xs text-[#D0D0C8]">
              <span>WhatsApp URL</span>
              <input
                type="url"
                dir="ltr"
                value={form.whatsappUrl ?? ''}
                onChange={(e) => setForm({ ...form, whatsappUrl: e.target.value })}
                placeholder="https://wa.me/98..."
                className="w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2.5 text-sm text-[#F5F3EE]"
              />
            </label>
            <label className="space-y-1.5 text-xs text-[#D0D0C8] sm:col-span-2">
              <span>YouTube URL</span>
              <input
                type="url"
                dir="ltr"
                value={form.youtubeUrl ?? ''}
                onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })}
                placeholder="https://www.youtube.com/..."
                className="w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2.5 text-sm text-[#F5F3EE]"
              />
            </label>
          </div>
        </div>

        {/* Hero & About Copy Overrides */}
        <div className="pt-4 border-t border-white/10 space-y-3">
          <div>
            <h3 className="text-xs font-semibold text-[#6F9BFF]">
              {isFa ? 'شخصی‌سازی تیتر صفحه اصلی و معرفی «درباره ما» (اختیاری)' : 'Custom Hero & About Copy (Optional)'}
            </h3>
            <p className="text-[11px] text-[#9EA39F] mt-0.5">
              {isFa
                ? 'در صورت خالی گذاشتن هر فیلد، متن پیش‌فرض حرفه‌ای سایت نمایش داده می‌شود.'
                : 'Leave any field blank to keep the default site copy.'}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="space-y-1.5 text-xs text-[#D0D0C8]">
              <span>{isFa ? 'تیتر اصلی هیرو (فارسی)' : 'Hero Headline (FA)'}</span>
              <input
                type="text"
                dir="rtl"
                value={form.heroTitleFa ?? ''}
                onChange={(e) => setForm({ ...form, heroTitleFa: e.target.value })}
                className="w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2.5 text-sm text-[#F5F3EE]"
              />
            </label>
            <label className="space-y-1.5 text-xs text-[#D0D0C8]">
              <span>{isFa ? 'تیتر اصلی هیرو (انگلیسی)' : 'Hero Headline (EN)'}</span>
              <input
                type="text"
                dir="ltr"
                value={form.heroTitleEn ?? ''}
                onChange={(e) => setForm({ ...form, heroTitleEn: e.target.value })}
                className="w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2.5 text-sm text-[#F5F3EE]"
              />
            </label>
            <label className="space-y-1.5 text-xs text-[#D0D0C8]">
              <span>{isFa ? 'زیرتیتر هیرو (فارسی)' : 'Hero Subtitle (FA)'}</span>
              <textarea
                rows={2}
                dir="rtl"
                value={form.heroSubtitleFa ?? ''}
                onChange={(e) => setForm({ ...form, heroSubtitleFa: e.target.value })}
                className="w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2.5 text-sm text-[#F5F3EE]"
              />
            </label>
            <label className="space-y-1.5 text-xs text-[#D0D0C8]">
              <span>{isFa ? 'زیرتیتر هیرو (انگلیسی)' : 'Hero Subtitle (EN)'}</span>
              <textarea
                rows={2}
                dir="ltr"
                value={form.heroSubtitleEn ?? ''}
                onChange={(e) => setForm({ ...form, heroSubtitleEn: e.target.value })}
                className="w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2.5 text-sm text-[#F5F3EE]"
              />
            </label>
            <label className="space-y-1.5 text-xs text-[#D0D0C8]">
              <span>{isFa ? 'متن معرفی صفحه درباره ما (فارسی)' : 'About Page Intro (FA)'}</span>
              <textarea
                rows={3}
                dir="rtl"
                value={form.aboutLeadFa ?? ''}
                onChange={(e) => setForm({ ...form, aboutLeadFa: e.target.value })}
                className="w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2.5 text-sm text-[#F5F3EE]"
              />
            </label>
            <label className="space-y-1.5 text-xs text-[#D0D0C8]">
              <span>{isFa ? 'متن معرفی صفحه درباره ما (انگلیسی)' : 'About Page Intro (EN)'}</span>
              <textarea
                rows={3}
                dir="ltr"
                value={form.aboutLeadEn ?? ''}
                onChange={(e) => setForm({ ...form, aboutLeadEn: e.target.value })}
                className="w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2.5 text-sm text-[#F5F3EE]"
              />
            </label>
          </div>
        </div>

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
                ? 'ذخیره تنظیمات سایت'
                : 'Save Site Customization'}
          </span>
        </button>
      </form>

      {/* Studio Password Management Card */}
      <form
        onSubmit={onSubmitPassword}
        className="glass-surface lg:col-span-4 rounded-3xl p-6 space-y-4"
      >
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#00A651]/18 border border-[#28CF77]/38 flex items-center justify-center shrink-0">
            <KeyRound className="w-4 h-4 text-[#28CF77]" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[#F7F5F0]">
              {hasPasswordProvider
                ? isFa
                  ? 'تغییر رمز عبور پنل'
                  : 'Change Studio Password'
                : isFa
                  ? 'تنظیم رمز عبور اختصاصی پنل'
                  : 'Set Dedicated Studio Password'}
            </h2>
            <p className="text-xs text-[#A8ADA9] mt-1 leading-relaxed">
              {hasPasswordProvider
                ? isFa
                  ? 'رمز عبور جدید را برای ورود مستقیم بدون نیاز به گوگل وارد کنید.'
                  : 'Set a new password for direct password-only studio login.'
                : isFa
                  ? 'پس از فعال‌سازی Email/Password در Firebase Console، اینجا رمز دلخواهتان را ثبت کنید.'
                  : 'Once Email/Password is enabled in Firebase Console, set your password here.'}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <label className="block space-y-1.5 text-xs text-[#D0D0C8]">
            <span>{isFa ? 'رمز عبور جدید (حداقل ۸ کاراکتر)' : 'New Password (min 8 chars)'}</span>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                dir="ltr"
                autoComplete="new-password"
                value={newStudioPassword}
                onChange={(e) => onChangeNewPassword(e.target.value)}
                className={`w-full rounded-xl border border-white/15 bg-black/35 py-2.5 text-sm text-[#F5F3EE] ${
                  isFa ? 'pl-10 pr-3' : 'pl-3 pr-10'
                }`}
              />
              <button
                type="button"
                onClick={onToggleShowNewPassword}
                aria-label={
                  showNewPassword
                    ? isFa
                      ? 'پنهان کردن رمز جدید'
                      : 'Hide new password'
                    : isFa
                      ? 'نمایش رمز جدید'
                      : 'Show new password'
                }
                className={`absolute top-1/2 -translate-y-1/2 p-1.5 text-[#A8ADA9] hover:text-[#F5F3EE] ${
                  isFa ? 'left-1.5' : 'right-1.5'
                }`}
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </label>

          <label className="block space-y-1.5 text-xs text-[#D0D0C8]">
            <span>{isFa ? 'تکرار رمز عبور جدید' : 'Confirm New Password'}</span>
            <input
              type={showNewPassword ? 'text' : 'password'}
              dir="ltr"
              autoComplete="new-password"
              value={confirmStudioPassword}
              onChange={(e) => onChangeConfirmPassword(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2.5 text-sm text-[#F5F3EE]"
            />
          </label>
        </div>

        {passwordMessage && (
          <div
            role="alert"
            className={`rounded-xl border px-3.5 py-2.5 text-xs leading-relaxed flex items-start gap-2 ${
              passwordMessage.tone === 'success'
                ? 'border-[#28CF77]/45 bg-[#00A651]/16 text-[#DFFCEB]'
                : 'border-amber-400/35 bg-amber-500/10 text-amber-200'
            }`}
          >
            {passwordMessage.tone === 'success' && (
              <CheckCircle2 className="w-4 h-4 text-[#28CF77] shrink-0 mt-0.5" />
            )}
            <span>{passwordMessage.text}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={savingPassword}
          className="glass-pill min-h-[44px] w-full inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold text-[#F5F8FC] hover:border-[#28CF77]/65 transition-all disabled:opacity-60"
        >
          <KeyRound className="w-3.5 h-3.5 text-[#28CF77]" />
          <span>
            {savingPassword
              ? isFa
                ? 'در حال ذخیره رمز...'
                : 'Saving password...'
              : hasPasswordProvider
                ? isFa
                  ? 'به‌روزرسانی رمز عبور'
                  : 'Update Password'
                : isFa
                  ? 'ثبت رمز عبور پنل'
                  : 'Save Studio Password'}
          </span>
        </button>
      </form>
    </div>
  );
}
