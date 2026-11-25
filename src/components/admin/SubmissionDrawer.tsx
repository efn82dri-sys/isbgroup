import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Copy,
  Layers,
  Mail,
  MapPin,
  MessageSquareReply,
  Phone,
  Ruler,
  Send,
  Trash2,
  X,
} from '../icons/IsbIcons';
import { DISCIPLINES } from '../../data/seedContent';
import type { AssessmentRecord, InquiryRecord, Locale } from '../../types/content';
import { buildMailtoReplyHref } from '../../utils/validation';

export type SelectedSubmission =
  | { kind: 'inquiry'; record: InquiryRecord }
  | { kind: 'assessment'; record: AssessmentRecord };

const STAGE_LABELS: Record<AssessmentRecord['projectStage'], { fa: string; en: string }> = {
  concept: { fa: 'ایده و کانسپت اولیه', en: 'Concept' },
  schematic: { fa: 'طراحی مقدماتی (فاز ۱)', en: 'Schematic (Phase 1)' },
  detailed: { fa: 'طراحی اجرایی (فاز ۲)', en: 'Detailed (Phase 2)' },
  construction: { fa: 'در حال اجرا', en: 'Under Construction' },
  existing: { fa: 'ساختمان موجود', en: 'Existing Building' },
};

const GOAL_LABELS: Record<string, { fa: string; en: string }> = {
  daylight: { fa: 'تحلیل نور روز (sDA)', en: 'Daylight (sDA)' },
  'energy-eui': { fa: 'مدل‌سازی انرژی (EUI)', en: 'Energy Modeling (EUI)' },
  'thermal-comfort': { fa: 'آسایش حرارتی', en: 'Thermal Comfort' },
  'carbon-reduction': { fa: 'کاهش انتشار کربن', en: 'Carbon Reduction' },
  'saro-sabz': { fa: 'ارزیابی سرو سبز', en: 'Saro Sabz Rating' },
  'seismic-retrofit': { fa: 'ارزیابی لرزه‌ای / مقاوم‌سازی', en: 'Seismic / Retrofit' },
};

const INQUIRY_STATUS_OPTIONS: { value: InquiryRecord['internalStatus']; fa: string; en: string }[] = [
  { value: 'new', fa: 'جدید', en: 'New' },
  { value: 'reviewing', fa: 'در حال بررسی', en: 'Reviewing' },
  { value: 'contacted', fa: 'پاسخ داده شده / تماس گرفته شد', en: 'Contacted / Replied' },
  { value: 'archived', fa: 'بایگانی‌شده', en: 'Archived' },
];

const ASSESSMENT_STATUS_OPTIONS: {
  value: AssessmentRecord['internalStatus'];
  fa: string;
  en: string;
}[] = [
  { value: 'new', fa: 'جدید', en: 'New' },
  { value: 'reviewing', fa: 'در حال بررسی', en: 'Reviewing' },
  { value: 'scheduled', fa: 'جلسه زمان‌بندی‌شده', en: 'Scheduled' },
  { value: 'completed', fa: 'تکمیل‌شده', en: 'Completed' },
  { value: 'archived', fa: 'بایگانی‌شده', en: 'Archived' },
];

function formatDateTime(iso: string | undefined, locale: Locale): string {
  if (!iso) return locale === 'fa' ? 'ثبت‌شده' : 'Recorded';
  try {
    return new Intl.DateTimeFormat(locale === 'fa' ? 'fa-IR' : 'en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 16).replace('T', ' ');
  }
}

interface SubmissionDrawerProps {
  locale: Locale;
  item: SelectedSubmission | null;
  onClose: () => void;
  onSaveResponse: (payload: {
    kind: 'inquiry' | 'assessment';
    id: string;
    internalStatus: string;
    adminReply: string;
    adminNotes: string;
    markReplied: boolean;
  }) => Promise<void>;
  onDelete: (kind: 'inquiry' | 'assessment', id: string) => Promise<void>;
}

export function SubmissionDrawer({
  locale,
  item,
  onClose,
  onSaveResponse,
  onDelete,
}: SubmissionDrawerProps) {
  const isFa = locale === 'fa';
  const [status, setStatus] = useState<string>('new');
  const [replyText, setReplyText] = useState('');
  const [notesText, setNotesText] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!item) return;
    setStatus(item.record.internalStatus);
    setReplyText(item.record.adminReply ?? '');
    setNotesText(item.record.adminNotes ?? '');
    setSavedNotice(null);
    setConfirmDelete(false);
  }, [item]);

  useEffect(() => {
    if (!item) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [item, onClose]);

  if (!item) return null;

  const { kind, record } = item;

  const copyText = async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(label);
      window.setTimeout(() => setCopiedField(null), 1800);
    } catch {
      // Clipboard blocked in non-HTTPS contexts
    }
  };

  const handleSave = async (autoMarkContacted: boolean) => {
    setSaving(true);
    setSavedNotice(null);
    const nextStatus =
      autoMarkContacted && status === 'new'
        ? kind === 'inquiry'
          ? 'contacted'
          : 'scheduled'
        : status;
    try {
      await onSaveResponse({
        kind,
        id: record.id,
        internalStatus: nextStatus,
        adminReply: replyText,
        adminNotes: notesText,
        markReplied: Boolean(replyText.trim()),
      });
      setStatus(nextStatus);
      setSavedNotice(
        isFa
          ? 'پاسخ و وضعیت درخواست با موفقیت در دیتابیس ذخیره شد.'
          : 'Reply and status saved successfully.'
      );
    } catch {
      setSavedNotice(
        isFa ? 'خطا در ذخیره پاسخ. لطفاً دوباره تلاش کنید.' : 'Could not save response.'
      );
    } finally {
      setSaving(false);
    }
  };

  const emailSubject =
    kind === 'inquiry'
      ? isFa
        ? `پاسخ گروه ISB به درخواست پروژه: ${record.projectType}`
        : `ISB Group Reply — Project Inquiry: ${record.projectType}`
      : isFa
        ? `پاسخ آزمایشگاه پایداری ISB: ${record.projectType} (${record.city})`
        : `ISB Sustainability Lab Reply — ${record.projectType} (${record.city})`;

  const defaultReplyGreeting = isFa
    ? `سلام ${record.fullName} عزیز،\n\nبا سپاس از ارسال درخواست شما به گروه ISB.\n\n`
    : `Hello ${record.fullName},\n\nThank you for contacting ISB Group.\n\n`;

  const mailtoHref = buildMailtoReplyHref({
    recipientEmail: record.email,
    recipientName: record.fullName,
    subject: emailSubject,
    replyBody: replyText.trim() || defaultReplyGreeting,
  });

  const disciplineLabels =
    kind === 'inquiry'
      ? record.disciplines.map((slug) => {
          const found = DISCIPLINES.find((d) => d.slug === slug);
          return found ? found.title[locale] : slug;
        })
      : [];

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex justify-end bg-black/75 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label={isFa ? 'جزئیات و پاسخ به درخواست' : 'Request Details & Reply'}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="glass-surface-strong w-full max-w-2xl h-full overflow-y-auto border-s border-white/15 p-6 sm:p-8 flex flex-col gap-6">
        {/* Top Bar */}
        <div className="flex items-start justify-between gap-4 border-b border-white/12 pb-5">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#28CF77]">
              {kind === 'inquiry'
                ? isFa
                  ? 'درخواست پروژه / همکاری'
                  : 'Project Inquiry'
                : isFa
                  ? 'درخواست ارزیابی آزمایشگاه پایداری'
                  : 'Sustainability Assessment Request'}
            </span>
            <h2 className="text-xl sm:text-2xl font-semibold text-[#F5F8FC]">{record.fullName}</h2>
            <p className="text-xs text-[#8B9DB7] inline-flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#6F9BFF]" />
              <span>{formatDateTime(record.createdAtIso, locale)}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={isFa ? 'بستن پنجره' : 'Close drawer'}
            className="glass-pill w-10 h-10 rounded-full flex items-center justify-center text-[#F5F8FC] hover:border-[#6F9BFF]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contact Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="glass-card rounded-2xl p-4 space-y-1.5">
            <span className="text-[11px] text-[#8B9DB7] flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#6F9BFF]" />
              <span>{isFa ? 'ایمیل متقاضی' : 'Email'}</span>
            </span>
            <div className="flex items-center justify-between gap-2">
              <a
                href={`mailto:${record.email}`}
                className="text-sm text-[#F5F8FC] hover:text-[#93BCFF] truncate ltr-inline"
              >
                {record.email}
              </a>
              <button
                type="button"
                onClick={() => void copyText('email', record.email)}
                aria-label={isFa ? 'کپی ایمیل' : 'Copy email'}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#C6D2E3]"
              >
                {copiedField === 'email' ? (
                  <Check className="w-3.5 h-3.5 text-[#28CF77]" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-4 space-y-1.5">
            <span className="text-[11px] text-[#8B9DB7] flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#28CF77]" />
              <span>{isFa ? 'شماره تماس' : 'Phone'}</span>
            </span>
            <div className="flex items-center justify-between gap-2">
              {record.phone ? (
                <>
                  <a
                    href={`tel:${record.phone}`}
                    className="text-sm text-[#F5F8FC] hover:text-[#93BCFF] ltr-inline font-numeric"
                  >
                    {record.phone}
                  </a>
                  <button
                    type="button"
                    onClick={() => void copyText('phone', record.phone ?? '')}
                    aria-label={isFa ? 'کپی شماره تماس' : 'Copy phone'}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#C6D2E3]"
                  >
                    {copiedField === 'phone' ? (
                      <Check className="w-3.5 h-3.5 text-[#28CF77]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </>
              ) : (
                <span className="text-xs text-[#8B9DB7]">
                  {isFa ? 'ثبت نشده' : 'Not provided'}
                </span>
              )}
            </div>
          </div>

          {record.organization && (
            <div className="glass-card rounded-2xl p-4 space-y-1">
              <span className="text-[11px] text-[#8B9DB7] flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#6F9BFF]" />
                <span>{isFa ? 'سازمان / شرکت' : 'Organization'}</span>
              </span>
              <p className="text-sm text-[#F5F8FC]">{record.organization}</p>
            </div>
          )}

          {record.city && (
            <div className="glass-card rounded-2xl p-4 space-y-1">
              <span className="text-[11px] text-[#8B9DB7] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#28CF77]" />
                <span>{isFa ? 'شهر پروژه' : 'Project City'}</span>
              </span>
              <p className="text-sm text-[#F5F8FC]">{record.city}</p>
            </div>
          )}
        </div>

        {/* Project / Assessment Details */}
        <div className="glass-card rounded-2xl p-5 space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-lg bg-[#223A87]/35 border border-[#6F9BFF]/45 px-2.5 py-1 text-[#93BCFF] font-medium">
              {record.projectType}
            </span>
            {kind === 'assessment' && (
              <>
                <span className="inline-flex items-center gap-1 rounded-lg bg-white/8 px-2.5 py-1 text-[#F5F8FC] font-numeric">
                  <Ruler className="w-3.5 h-3.5 text-[#28CF77]" />
                  {record.approximateFloorAreaSqm.toLocaleString()} m²
                </span>
                <span className="inline-flex items-center gap-1 rounded-lg bg-white/8 px-2.5 py-1 text-[#C6D2E3]">
                  <Layers className="w-3.5 h-3.5 text-[#6F9BFF]" />
                  {STAGE_LABELS[record.projectStage]?.[locale] ?? record.projectStage}
                </span>
              </>
            )}
          </div>

          {kind === 'inquiry' && disciplineLabels.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] text-[#9EA39F]">
                {isFa ? 'حوزه‌های تخصصی انتخاب‌شده' : 'Requested Disciplines'}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {disciplineLabels.map((lbl) => (
                  <span
                    key={lbl}
                    className="rounded-full border border-white/15 bg-white/[0.05] px-3 py-1 text-xs text-[#E8E7E0]"
                  >
                    {lbl}
                  </span>
                ))}
              </div>
            </div>
          )}

          {kind === 'assessment' && record.assessmentGoals.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] text-[#9EA39F]">
                {isFa ? 'اهداف ارزیابی انتخاب‌شده' : 'Assessment Goals'}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {record.assessmentGoals.map((goal) => (
                  <span
                    key={goal}
                    className="rounded-full border border-white/15 bg-white/[0.05] px-3 py-1 text-xs text-[#E8E7E0]"
                  >
                    {GOAL_LABELS[goal]?.[locale] ?? goal}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1.5 pt-2 border-t border-white/10">
            <span className="text-[11px] text-[#9EA39F]">
              {kind === 'inquiry'
                ? isFa
                  ? 'متن کامل پیام و شرح پروژه'
                  : 'Full Inquiry Message'
                : isFa
                  ? 'توضیحات تکمیلی متقاضی'
                  : 'Applicant Additional Notes'}
            </span>
            <p className="text-sm text-[#F5F3EE] leading-relaxed whitespace-pre-wrap bg-black/25 rounded-xl p-4 border border-white/10">
              {kind === 'inquiry'
                ? record.message
                : record.notes || (isFa ? 'توضیح اضافه‌ای ثبت نشده است.' : 'No additional notes.')}
            </p>
          </div>
        </div>

        {/* Status & Reply Composer */}
        <div className="glass-surface rounded-2xl p-5 space-y-4 border border-[#6F9BFF]/28">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <MessageSquareReply className="w-4 h-4 text-[#6F9BFF]" />
              <h3 className="text-sm font-semibold text-[#F5F8FC]">
                {isFa ? 'پاسخ‌دهی و مدیریت وضعیت' : 'Reply & Status Management'}
              </h3>
            </div>
            {record.repliedAtIso && (
              <span className="text-[11px] text-[#28CF77] inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  {isFa ? 'آخرین پاسخ: ' : 'Replied: '}
                  {formatDateTime(record.repliedAtIso, locale)}
                </span>
              </span>
            )}
          </div>

          <label className="block space-y-1.5 text-xs text-[#C6D2E3]">
            <span>{isFa ? 'وضعیت پیگیری درخواست' : 'Tracking Status'}</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-xl border border-[#6F9BFF]/25 bg-[#0E1626] px-3 py-2.5 text-sm text-[#F5F8FC]"
            >
              {(kind === 'inquiry' ? INQUIRY_STATUS_OPTIONS : ASSESSMENT_STATUS_OPTIONS).map(
                (opt) => (
                  <option key={opt.value} value={opt.value}>
                    {isFa ? opt.fa : opt.en}
                  </option>
                )
              )}
            </select>
          </label>

          <label className="block space-y-1.5 text-xs text-[#C6D2E3]">
            <span>{isFa ? 'متن پاسخ به متقاضی' : 'Reply Message to Client'}</span>
            <textarea
              rows={5}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={
                isFa
                  ? 'پاسخ خود را اینجا بنویسید تا هم در سوابق پنل ذخیره شود و هم مستقیم با ایمیل ارسال کنید...'
                  : 'Draft your reply here to log it in studio history and send via email...'
              }
              className="w-full rounded-xl border border-[#6F9BFF]/22 bg-[#080D16]/70 px-3.5 py-3 text-sm text-[#F5F8FC] leading-relaxed"
            />
          </label>

          <label className="block space-y-1.5 text-xs text-[#C6D2E3]">
            <span>{isFa ? 'یادداشت داخلی تیم (محرمانه)' : 'Internal Staff Notes (Private)'}</span>
            <textarea
              rows={2}
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              placeholder={
                isFa
                  ? 'یادداشت پیگیری داخلی، برآورد اولیه یا نام مسئول پیگیری...'
                  : 'Internal follow-up notes, assigned lead, or call summary...'
              }
              className="w-full rounded-xl border border-[#6F9BFF]/22 bg-[#080D16]/70 px-3.5 py-2.5 text-xs text-[#F5F8FC]"
            />
          </label>

          {savedNotice && (
            <div
              role="alert"
              className="rounded-xl border border-[#28CF77]/45 bg-[#00A651]/16 px-3.5 py-2.5 text-xs text-[#F5F8FC]"
            >
              {savedNotice}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSave(true)}
              className="glass-cta min-h-[42px] inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-semibold disabled:opacity-60"
            >
              <Check className="w-3.5 h-3.5" />
              <span>
                {saving
                  ? isFa
                    ? 'در حال ذخیره...'
                    : 'Saving...'
                  : isFa
                    ? 'ذخیره پاسخ و وضعیت'
                    : 'Save Reply & Status'}
              </span>
            </button>

            <a
              href={mailtoHref}
              className="glass-pill min-h-[42px] inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-medium text-[#93BCFF] hover:border-[#6F9BFF]"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isFa ? 'ارسال پاسخ با ایمیل' : 'Send via Email'}</span>
            </a>

            {replyText.trim() && (
              <button
                type="button"
                onClick={() => void copyText('reply', replyText)}
                className="glass-pill min-h-[42px] inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs text-[#C6D2E3]"
              >
                {copiedField === 'reply' ? (
                  <Check className="w-3.5 h-3.5 text-[#28CF77]" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{isFa ? 'کپی پاسخ' : 'Copy Reply'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Delete Zone (Two-step inline confirmation) */}
        <div className="border-t border-white/10 pt-4 flex items-center justify-between gap-3 mt-auto">
          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center gap-1.5 text-xs text-rose-300/80 hover:text-rose-200 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isFa ? 'حذف این درخواست' : 'Delete Request'}</span>
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-2.5 w-full justify-between bg-rose-500/10 border border-rose-400/30 rounded-xl px-4 py-2.5">
              <span className="text-xs text-rose-200">
                {isFa ? 'از حذف دائمی این درخواست مطمئن هستید؟' : 'Permanently delete this record?'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="rounded-full px-3 py-1 text-xs text-[#D5D4CC] hover:text-white"
                >
                  {isFa ? 'انصراف' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await onDelete(kind, record.id);
                    onClose();
                  }}
                  className="rounded-full bg-rose-500/80 hover:bg-rose-500 px-3.5 py-1 text-xs font-semibold text-white"
                >
                  {isFa ? 'بله، حذف شود' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
