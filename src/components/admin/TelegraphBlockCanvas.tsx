import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  Copy,
  ImagePlus,
  Images,
  Layers,
  Link2,
  Loader2,
  Plus,
  Trash2,
  Upload,
  X,
} from '../icons/IsbIcons';
import { deleteStudioImage, isMediaRef, uploadStudioImage } from '../../services/mediaStore';
import type {
  InsightBlock,
  InsightBlockMediaItem,
  InsightBlockType,
  InsightCalloutTone,
  InsightMediaLayout,
  InsightMediaPosition,
  Locale,
} from '../../types/content';
import {
  computeTelegramMosaicLayout,
  MAX_MEDIA_PER_BLOCK,
  MAX_METRICS_PER_BLOCK,
} from '../../utils/insightBlocks';
import { isSafeImageSrc } from '../../utils/validation';
import { SafeImage } from '../BrandMark';

export type TelegraphLangMode = 'fa' | 'en' | 'both';

/* ============================================================================
 * AUTO-GROWING BORDERLESS TEXTAREA (True Telegraph feel — zero inner scrollbars)
 * ========================================================================== */
export function AutoGrowTextarea({
  value,
  onChange,
  placeholder,
  dir,
  className,
  minRows = 1,
  textareaRef,
  onFocus,
  onKeyDown,
  onPaste,
  ariaLabel,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  dir?: 'rtl' | 'ltr';
  className?: string;
  minRows?: number;
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
  onFocus?: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onPaste?: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  ariaLabel?: string;
}) {
  const internalRef = useRef<HTMLTextAreaElement | null>(null);
  const resolvedRef = textareaRef ?? internalRef;

  useLayoutEffect(() => {
    const el = resolvedRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(el.scrollHeight, minRows * 28)}px`;
  }, [value, minRows, resolvedRef]);

  return (
    <textarea
      ref={resolvedRef}
      rows={minRows}
      dir={dir}
      aria-label={ariaLabel}
      value={value}
      placeholder={placeholder}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
      onPaste={onPaste}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full resize-none overflow-hidden bg-transparent outline-none placeholder:text-[#5F7392] ${className ?? ''}`}
    />
  );
}

/* ============================================================================
 * INLINE FORMATTING HELPER (B / I / Bullet / Lead)
 * ========================================================================== */
function applyWrap(
  current: string,
  textarea: HTMLTextAreaElement | null,
  prefix: string,
  suffix = ''
): string {
  if (!textarea) {
    return current ? `${current}\n${prefix}${suffix}` : `${prefix}${suffix}`;
  }
  const start = textarea.selectionStart ?? current.length;
  const end = textarea.selectionEnd ?? current.length;
  const selected = current.slice(start, end) || (suffix ? 'متن کلیدی' : 'نکته');
  const next = `${current.slice(0, start)}${prefix}${selected}${suffix}${current.slice(end)}`;
  requestAnimationFrame(() => {
    textarea.focus();
    const pos = start + prefix.length + selected.length + suffix.length;
    textarea.setSelectionRange(pos, pos);
  });
  return next;
}

function QuietFormatBar({
  isFa,
  textareaRef,
  value,
  onChange,
  leadStyle,
  onToggleLead,
}: {
  isFa: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  value: string;
  onChange: (next: string) => void;
  leadStyle?: boolean;
  onToggleLead?: () => void;
}) {
  return (
    <div className="inline-flex flex-wrap items-center gap-1 rounded-lg border border-white/10 bg-[#0D1628]/95 px-1.5 py-1 text-[11px]">
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onChange(applyWrap(value, textareaRef.current, '**', '**'))}
        aria-label={isFa ? 'بولد کردن متن انتخابی' : 'Bold selected text'}
        className="min-w-[28px] h-7 rounded px-2 font-bold text-[#F5F8FC] hover:bg-white/10 transition-colors"
      >
        B
      </button>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onChange(applyWrap(value, textareaRef.current, '*', '*'))}
        aria-label={isFa ? 'ایتالیک کردن متن انتخابی' : 'Italicize selected text'}
        className="min-w-[28px] h-7 rounded px-2 italic text-[#DCE6F5] hover:bg-white/10 transition-colors"
      >
        I
      </button>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          const prefix = value && !value.endsWith('\n') ? '\n- ' : '- ';
          onChange(applyWrap(value, textareaRef.current, prefix, ''));
        }}
        aria-label={isFa ? 'افزودن مورد لیست' : 'Insert bullet item'}
        className="h-7 rounded px-2 text-[#C6D2E3] hover:bg-white/10 transition-colors whitespace-nowrap"
      >
        {isFa ? '• لیست' : '• List'}
      </button>
      {onToggleLead && (
        <>
          <span className="h-3.5 w-px bg-white/12 mx-0.5" aria-hidden="true" />
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onToggleLead}
            className={`h-7 rounded px-2 transition-colors whitespace-nowrap ${
              leadStyle
                ? 'bg-[#00A651]/25 text-[#DFFCEB] font-medium'
                : 'text-[#9BB0CC] hover:text-white hover:bg-white/10'
            }`}
          >
            {isFa ? 'متن درشت' : 'Lead'}
          </button>
        </>
      )}
    </div>
  );
}

/* ============================================================================
 * TELEGRAPH INLINE "+" INSERTER (Signature Telegraph quick-add bar)
 * ========================================================================== */
const TELEGRAPH_ACTIONS: {
  type: InsightBlockType;
  fa: string;
  en: string;
  primary?: boolean;
}[] = [
  { type: 'telegram-media-post', fa: 'عکس / آلبوم', en: 'Photo / Album', primary: true },
  { type: 'rich-text', fa: 'متن', en: 'Paragraph' },
  { type: 'section-heading', fa: 'سرتیتر', en: 'Heading' },
  { type: 'text-image-split', fa: 'اسلاید', en: 'Split Slide' },
  { type: 'quote', fa: 'نقل‌قول', en: 'Quote' },
  { type: 'key-metrics', fa: 'شاخص عددی', en: 'Metrics' },
  { type: 'callout', fa: 'کادر نکته', en: 'Callout' },
];

export function InlineTelegraphInserter({
  locale,
  disabled,
  alwaysOpen = false,
  onInsert,
}: {
  locale: Locale;
  disabled?: boolean;
  alwaysOpen?: boolean;
  onInsert: (type: InsightBlockType) => void;
}) {
  const isFa = locale === 'fa';
  const [open, setOpen] = useState(alwaysOpen);

  if (disabled) return null;

  if (alwaysOpen) {
    return (
      <div className="pt-4">
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-dashed border-white/14 bg-white/[0.018] px-3.5 py-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#8FA4C2] pe-1 whitespace-nowrap">
            <Plus className="w-3.5 h-3.5 text-[#28CF77]" />
            <span>{isFa ? 'افزودن به مقاله:' : 'Add block:'}</span>
          </span>
          {TELEGRAPH_ACTIONS.map((item) => (
            <button
              key={item.type}
              type="button"
              onClick={() => onInsert(item.type)}
              className={`min-h-[36px] inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                item.primary
                  ? 'bg-[#00A651]/20 border border-[#28CF77]/45 text-[#E8FFF2] hover:bg-[#00A651]/30'
                  : 'border border-white/10 bg-white/[0.03] text-[#DCE6F5] hover:border-[#6F9BFF]/50 hover:bg-white/[0.07]'
              }`}
            >
              {item.type === 'telegram-media-post' && <Images className="w-3.5 h-3.5 text-[#28CF77]" />}
              {item.type === 'text-image-split' && <Layers className="w-3.5 h-3.5 text-[#6F9BFF]" />}
              <span>{isFa ? item.fa : item.en}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="group/ins relative py-1.5 flex items-center justify-center">
      <div
        className={`w-full h-px transition-colors ${
          open ? 'bg-white/14' : 'bg-transparent group-hover/ins:bg-white/10'
        }`}
      />
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={isFa ? 'افزودن بخش جدید در این محل' : 'Insert block here'}
          className="absolute inline-flex items-center justify-center w-7 h-7 rounded-full border border-white/14 bg-[#0B1221] text-[#8FA4C2] hover:text-white hover:border-[#28CF77]/60 opacity-45 sm:opacity-0 sm:group-hover/ins:opacity-100 focus-visible:opacity-100 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      ) : (
        <div className="absolute z-20 flex flex-wrap items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-[#0C1527] px-2.5 py-1.5 shadow-xl">
          {TELEGRAPH_ACTIONS.map((item) => (
            <button
              key={item.type}
              type="button"
              onClick={() => {
                onInsert(item.type);
                setOpen(false);
              }}
              className={`min-h-[32px] rounded-lg px-2.5 py-1 text-[11.5px] font-medium transition-colors whitespace-nowrap shrink-0 ${
                item.primary
                  ? 'bg-[#00A651]/22 text-[#E6FFF0] hover:bg-[#00A651]/32'
                  : 'text-[#DCE6F5] hover:bg-white/10'
              }`}
            >
              {isFa ? item.fa : item.en}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={isFa ? 'بستن نوار افزودن' : 'Close insert bar'}
            className="w-7 h-7 rounded-lg text-[#8FA4C2] hover:text-white flex items-center justify-center"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

/* ============================================================================
 * LIVE WYSIWYG TELEGRAM MULTI-PHOTO ALBUM BLOCK
 * ========================================================================== */
function TelegraphAlbumBlock({
  block,
  locale,
  langMode,
  onChange,
}: {
  block: InsightBlock;
  locale: Locale;
  langMode: TelegraphLangMode;
  onChange: (next: InsightBlock) => void;
}) {
  const isFa = locale === 'fa';
  const showFa = langMode === 'fa' || langMode === 'both';
  const showEn = langMode === 'en' || langMode === 'both';
  const media = block.media ?? [];
  const textPosition: InsightMediaPosition = block.textPosition ?? 'below';
  const mediaLayout: InsightMediaLayout = block.mediaLayout ?? 'mosaic';

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bodyFaRef = useRef<HTMLTextAreaElement>(null);
  const bodyEnRef = useRef<HTMLTextAreaElement>(null);

  const [uploadingCount, setUploadingCount] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlDraft, setUrlDraft] = useState('');
  const [selectedPhotoIdx, setSelectedPhotoIdx] = useState<number | null>(null);
  const [captionFocused, setCaptionFocused] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedPhotoIdx !== null && selectedPhotoIdx >= media.length) {
      setSelectedPhotoIdx(null);
    }
  }, [media.length, selectedPhotoIdx]);

  const uploadFiles = async (files: FileList | File[] | null) => {
    if (!files || files.length === 0) return;
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    const remaining = MAX_MEDIA_PER_BLOCK - media.length;
    if (remaining <= 0) {
      setUploadError(
        isFa
          ? `حداکثر ${MAX_MEDIA_PER_BLOCK} عکس در هر آلبوم مجاز است.`
          : `Maximum ${MAX_MEDIA_PER_BLOCK} photos per album.`
      );
      return;
    }

    const batch = imageFiles.slice(0, remaining);
    setUploadingCount(batch.length);
    setUploadError(null);

    const added: InsightBlockMediaItem[] = [];
    for (const file of batch) {
      try {
        const res = await uploadStudioImage(file, 'gallery');
        added.push({ url: res.mediaRef, captionFa: '', captionEn: '' });
      } catch {
        setUploadError(
          isFa
            ? 'آپلود یکی از عکس‌ها انجام نشد (فرمت مجاز: JPG/PNG/WebP).'
            : 'Upload failed for one image (JPG/PNG/WebP only).'
        );
      } finally {
        setUploadingCount((c) => Math.max(0, c - 1));
      }
    }

    if (added.length > 0) {
      onChange({ ...block, media: [...media, ...added] });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddUrl = () => {
    const clean = urlDraft.trim();
    if (!clean) return;
    if (!isSafeImageSrc(clean)) {
      setUploadError(isFa ? 'لینک تصویر معتبر نیست.' : 'Invalid image URL.');
      return;
    }
    if (media.length >= MAX_MEDIA_PER_BLOCK) return;
    onChange({ ...block, media: [...media, { url: clean, captionFa: '', captionEn: '' }] });
    setUrlDraft('');
    setShowUrlInput(false);
    setUploadError(null);
  };

  const movePhoto = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= media.length) return;
    const next = [...media];
    const [item] = next.splice(idx, 1);
    next.splice(target, 0, item);
    onChange({ ...block, media: next });
    setSelectedPhotoIdx(target);
  };

  const removePhoto = async (idx: number) => {
    const item = media[idx];
    if (item && isMediaRef(item.url)) {
      await deleteStudioImage(item.url);
    }
    onChange({ ...block, media: media.filter((_, i) => i !== idx) });
    setSelectedPhotoIdx(null);
  };

  const updatePhotoCaption = (idx: number, field: 'captionFa' | 'captionEn', val: string) => {
    onChange({
      ...block,
      media: media.map((m, i) => (i === idx ? { ...m, [field]: val } : m)),
    });
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const files: File[] = [];
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const f = item.getAsFile();
        if (f) files.push(f);
      }
    }
    if (files.length > 0) {
      e.preventDefault();
      void uploadFiles(files);
    }
  };

  const mosaicSpec = computeTelegramMosaicLayout(Math.max(1, media.length), mediaLayout);

  const captionSection = (
    <div
      className="px-4 sm:px-5 py-4 space-y-2.5"
      onFocus={() => setCaptionFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setCaptionFocused(false);
        }
      }}
    >
      <div className={langMode === 'both' ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : 'space-y-2'}>
        {showFa && (
          <div className="space-y-1.5">
            <input
              type="text"
              dir="rtl"
              placeholder={isFa ? 'عنوان کوتاه آلبوم (اختیاری)...' : 'Album heading (FA, optional)...'}
              value={block.headingFa ?? ''}
              onChange={(e) => onChange({ ...block, headingFa: e.target.value })}
              className="w-full bg-transparent outline-none text-base font-bold text-[#F5F8FC] placeholder:text-[#5F7392]"
            />
            {captionFocused && (
              <QuietFormatBar
                isFa={isFa}
                textareaRef={bodyFaRef}
                value={block.bodyFa ?? ''}
                onChange={(next) => onChange({ ...block, bodyFa: next })}
              />
            )}
            <AutoGrowTextarea
              textareaRef={bodyFaRef}
              dir="rtl"
              minRows={2}
              value={block.bodyFa ?? ''}
              onChange={(next) => onChange({ ...block, bodyFa: next })}
              placeholder={
                isFa
                  ? 'توضیح یا کپشن همراه تصاویر (درست مثل پست تلگرام پرمیوم)...'
                  : 'Persian caption attached to the photo album...'
              }
              className="text-sm sm:text-[15px] leading-8 text-[#DCE6F5]"
            />
          </div>
        )}
        {showEn && (
          <div className="space-y-1.5">
            <input
              type="text"
              dir="ltr"
              placeholder="Album heading (EN, optional)..."
              value={block.headingEn ?? ''}
              onChange={(e) => onChange({ ...block, headingEn: e.target.value })}
              className="w-full bg-transparent outline-none text-base font-bold text-[#F5F8FC] placeholder:text-[#5F7392]"
            />
            {captionFocused && (
              <QuietFormatBar
                isFa={isFa}
                textareaRef={bodyEnRef}
                value={block.bodyEn ?? ''}
                onChange={(next) => onChange({ ...block, bodyEn: next })}
              />
            )}
            <AutoGrowTextarea
              textareaRef={bodyEnRef}
              dir="ltr"
              minRows={2}
              value={block.bodyEn ?? ''}
              onChange={(next) => onChange({ ...block, bodyEn: next })}
              placeholder="Caption or editorial note attached to these photos..."
              className="text-sm sm:text-[15px] leading-8 text-[#DCE6F5]"
            />
          </div>
        )}
      </div>
    </div>
  );

  const mediaSection = (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        void uploadFiles(e.dataTransfer.files);
      }}
      className={`p-2.5 sm:p-3 transition-colors ${dragOver ? 'bg-[#00A651]/10' : ''}`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={(e) => void uploadFiles(e.target.files)}
        className="sr-only"
      />

      {media.length === 0 ? (
        <div
          className={`rounded-xl border border-dashed py-8 px-4 text-center space-y-3 transition-colors ${
            dragOver
              ? 'border-[#28CF77] bg-[#00A651]/10'
              : 'border-white/15 bg-black/20 hover:border-white/25'
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-white/[0.04] border border-white/10 mx-auto flex items-center justify-center text-[#28CF77]">
            {uploadingCount > 0 ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <ImagePlus className="w-5 h-5" />
            )}
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-[#F5F8FC]">
              {uploadingCount > 0
                ? isFa
                  ? `در حال آپلود ${uploadingCount} تصویر...`
                  : `Uploading ${uploadingCount} photo(s)...`
                : isFa
                  ? '۱ تا ۶ عکس انتخاب کنید یا همینجا بکشید و رها کنید'
                  : 'Select or drop 1–6 photos here'}
            </p>
            <p className="text-xs text-[#8FA4C2]">
              {isFa
                ? 'چند عکس به صورت خودکار مثل تلگرام پرمیوم به شکل موزاییک چیده می‌شوند (پیست با Ctrl+V هم فعال است)'
                : 'Multiple photos automatically arrange into an adaptive Telegram mosaic (Ctrl+V paste supported)'}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <button
              type="button"
              disabled={uploadingCount > 0}
              onClick={() => fileInputRef.current?.click()}
              className="min-h-[38px] inline-flex items-center gap-2 rounded-lg bg-[#00A651]/25 border border-[#28CF77]/50 hover:bg-[#00A651]/35 px-4 py-1.5 text-xs font-semibold text-[#E8FFF2] transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{isFa ? 'انتخاب عکس از سیستم' : 'Choose Photos'}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowUrlInput((v) => !v)}
              className="min-h-[38px] inline-flex items-center gap-1.5 rounded-lg border border-white/12 bg-white/[0.03] hover:bg-white/[0.08] px-3 py-1.5 text-xs text-[#C6D2E3] transition-colors"
            >
              <Link2 className="w-3.5 h-3.5 text-[#6F9BFF]" />
              <span>{isFa ? 'لینک عکس' : 'Paste URL'}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {/* Live WYSIWYG Telegram Mosaic Preview directly on the canvas */}
          <div className={mosaicSpec.containerClass}>
            {media.map((item, idx) => {
              const isSelected = selectedPhotoIdx === idx;
              return (
                <div
                  key={`${item.url}-${idx}`}
                  className={`group/tile relative overflow-hidden rounded-xl bg-[#070C17] border transition-all ${
                    isSelected
                      ? 'border-[#28CF77] ring-2 ring-[#28CF77]/30'
                      : 'border-white/10 hover:border-white/25'
                  } ${mosaicSpec.itemClasses[idx] ?? 'aspect-[4/3]'}`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedPhotoIdx(isSelected ? null : idx)}
                    aria-label={
                      isFa
                        ? `ویرایش زیرنویس تصویر ${idx + 1}`
                        : `Edit caption for photo ${idx + 1}`
                    }
                    className="w-full h-full block text-start focus-visible:outline-none"
                  >
                    <SafeImage
                      src={item.url}
                      alt={item.captionFa || item.captionEn || `Photo ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>

                  {/* Top corner quiet photo controls */}
                  <div className="absolute top-2 end-2 flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover/tile:opacity-100 sm:focus-within:opacity-100 transition-opacity">
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={() => movePhoto(idx, -1)}
                        aria-label={isFa ? 'جابه‌جایی به قبل' : 'Move earlier'}
                        className="w-7 h-7 rounded-lg bg-black/75 border border-white/15 text-white text-xs flex items-center justify-center hover:border-[#6F9BFF]"
                      >
                        {isFa ? '→' : '←'}
                      </button>
                    )}
                    {idx < media.length - 1 && (
                      <button
                        type="button"
                        onClick={() => movePhoto(idx, 1)}
                        aria-label={isFa ? 'جابه‌جایی به بعد' : 'Move later'}
                        className="w-7 h-7 rounded-lg bg-black/75 border border-white/15 text-white text-xs flex items-center justify-center hover:border-[#6F9BFF]"
                      >
                        {isFa ? '←' : '→'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => void removePhoto(idx)}
                      aria-label={isFa ? `حذف تصویر ${idx + 1}` : `Delete photo ${idx + 1}`}
                      className="w-7 h-7 rounded-lg bg-black/80 border border-rose-400/35 text-rose-300 hover:bg-rose-500 hover:text-white flex items-center justify-center"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Subtle caption indicator on bottom if present */}
                  {(item.captionFa || item.captionEn) && (
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-2.5 pt-5 pb-2">
                      <p className="text-[11px] text-white/90 truncate">
                        {isFa ? item.captionFa || item.captionEn : item.captionEn || item.captionFa}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Inline selected photo caption editor (clean, non-intrusive) */}
          {selectedPhotoIdx !== null && media[selectedPhotoIdx] && (
            <div className="rounded-xl border border-[#28CF77]/35 bg-[#08101E] px-3.5 py-2.5 space-y-2">
              <div className="flex items-center justify-between gap-2 text-[11px] text-[#9BB0CC]">
                <span>
                  {isFa
                    ? `زیرنویس تصویر شماره ${selectedPhotoIdx + 1} (در لایت‌باکس نمایش داده می‌شود)`
                    : `Photo #${selectedPhotoIdx + 1} caption (shown in fullscreen lightbox)`}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedPhotoIdx(null)}
                  aria-label={isFa ? 'بستن ویرایش زیرنویس' : 'Close caption editor'}
                  className="text-[#8FA4C2] hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className={langMode === 'both' ? 'grid grid-cols-1 sm:grid-cols-2 gap-2' : ''}>
                {showFa && (
                  <input
                    type="text"
                    dir="rtl"
                    value={media[selectedPhotoIdx].captionFa ?? ''}
                    onChange={(e) => updatePhotoCaption(selectedPhotoIdx, 'captionFa', e.target.value)}
                    placeholder="زیرنویس فارسی این تصویر (اختیاری)..."
                    className="w-full rounded-lg border border-white/12 bg-black/35 px-3 py-1.5 text-xs text-[#F5F8FC] outline-none focus:border-[#28CF77]/50"
                  />
                )}
                {showEn && (
                  <input
                    type="text"
                    dir="ltr"
                    value={media[selectedPhotoIdx].captionEn ?? ''}
                    onChange={(e) => updatePhotoCaption(selectedPhotoIdx, 'captionEn', e.target.value)}
                    placeholder="English photo caption (optional)..."
                    className="w-full rounded-lg border border-white/12 bg-black/35 px-3 py-1.5 text-xs text-[#F5F8FC] outline-none focus:border-[#28CF77]/50"
                  />
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {showUrlInput && (
        <div className="mt-2.5 flex items-center gap-2">
          <input
            type="text"
            dir="ltr"
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddUrl();
              }
            }}
            placeholder="https://... or /assets/..."
            className="flex-1 rounded-lg border border-white/15 bg-black/40 px-3 py-1.5 text-xs text-[#F5F8FC] outline-none focus:border-[#6F9BFF]"
          />
          <button
            type="button"
            onClick={handleAddUrl}
            className="min-h-[34px] rounded-lg bg-[#223A87] px-3 py-1 text-xs font-medium text-white"
          >
            {isFa ? 'افزودن' : 'Add'}
          </button>
          <button
            type="button"
            onClick={() => setShowUrlInput(false)}
            aria-label={isFa ? 'لغو' : 'Cancel'}
            className="p-1.5 text-[#8FA4C2] hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {uploadError && <p className="mt-2 text-xs text-amber-300">{uploadError}</p>}
    </div>
  );

  return (
    <div
      onPaste={handlePaste}
      className="rounded-2xl border border-white/12 bg-[#0B1221]/90 overflow-hidden"
    >
      {/* Compact 1-Line Telegraph Album Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 border-b border-white/8 bg-white/[0.02] text-[11px]">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            disabled={uploadingCount > 0 || media.length >= MAX_MEDIA_PER_BLOCK}
            onClick={() => fileInputRef.current?.click()}
            className="min-h-[30px] inline-flex items-center gap-1.5 rounded-lg bg-[#00A651]/18 border border-[#28CF77]/40 hover:bg-[#00A651]/28 px-2.5 py-1 font-medium text-[#DFFCEB] disabled:opacity-45 whitespace-nowrap"
          >
            {uploadingCount > 0 ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Plus className="w-3 h-3" />
            )}
            <span>
              {isFa
                ? `افزودن عکس (${media.length}/${MAX_MEDIA_PER_BLOCK})`
                : `Add Photo (${media.length}/${MAX_MEDIA_PER_BLOCK})`}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setShowUrlInput((v) => !v)}
            className="min-h-[30px] inline-flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-[#9BB0CC] hover:text-white whitespace-nowrap"
          >
            <Link2 className="w-3 h-3" />
            <span>{isFa ? 'لینک' : 'URL'}</span>
          </button>
        </div>

        {/* Live Text-Position & Layout Switches */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center rounded-lg bg-black/35 p-0.5 border border-white/8">
            {(
              [
                { id: 'below', fa: 'متن زیر عکس', en: 'Text Below' },
                { id: 'above', fa: 'متن بالای عکس', en: 'Text Above' },
              ] as { id: InsightMediaPosition; fa: string; en: string }[]
            ).map((pos) => (
              <button
                key={pos.id}
                type="button"
                onClick={() => onChange({ ...block, textPosition: pos.id })}
                className={`rounded-md px-2 py-1 text-[11px] transition-colors whitespace-nowrap ${
                  textPosition === pos.id
                    ? 'bg-[#223A87] text-white font-medium'
                    : 'text-[#8FA4C2] hover:text-white'
                }`}
              >
                {isFa ? pos.fa : pos.en}
              </button>
            ))}
          </div>

          {media.length >= 2 && (
            <div className="inline-flex items-center rounded-lg bg-black/35 p-0.5 border border-white/8">
              {(
                [
                  { id: 'mosaic', fa: 'موزاییک', en: 'Mosaic' },
                  { id: 'feature-split', fa: 'شاخص', en: 'Hero' },
                  { id: 'filmstrip', fa: 'نوار', en: 'Strip' },
                ] as { id: InsightMediaLayout; fa: string; en: string }[]
              ).map((lay) => (
                <button
                  key={lay.id}
                  type="button"
                  onClick={() => onChange({ ...block, mediaLayout: lay.id })}
                  className={`rounded-md px-2 py-1 text-[11px] transition-colors whitespace-nowrap ${
                    mediaLayout === lay.id
                      ? 'bg-white/12 text-white font-medium'
                      : 'text-[#8FA4C2] hover:text-white'
                  }`}
                >
                  {isFa ? lay.fa : lay.en}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Live Visual Order: Text Above OR Text Below Media */}
      {textPosition === 'above' ? (
        <>
          <div className="border-b border-white/8">{captionSection}</div>
          {mediaSection}
        </>
      ) : (
        <>
          {mediaSection}
          <div className="border-t border-white/8">{captionSection}</div>
        </>
      )}
    </div>
  );
}

/* ============================================================================
 * LIVE WYSIWYG SPLIT SLIDE BLOCK (PowerPoint-style 2-column directly on canvas)
 * ========================================================================== */
function TelegraphSplitBlock({
  block,
  locale,
  langMode,
  onChange,
}: {
  block: InsightBlock;
  locale: Locale;
  langMode: TelegraphLangMode;
  onChange: (next: InsightBlock) => void;
}) {
  const isFa = locale === 'fa';
  const showFa = langMode === 'fa' || langMode === 'both';
  const showEn = langMode === 'en' || langMode === 'both';
  const imageEnd = block.splitSide === 'end';
  const photo = block.media?.[0];

  const fileRef = useRef<HTMLInputElement>(null);
  const bodyFaRef = useRef<HTMLTextAreaElement>(null);
  const bodyEnRef = useRef<HTMLTextAreaElement>(null);
  const [uploading, setUploading] = useState(false);
  const [focused, setFocused] = useState(false);

  const handleUpload = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadStudioImage(file, 'gallery');
      onChange({
        ...block,
        media: [{ ...(photo ?? { url: res.mediaRef }), url: res.mediaRef }],
      });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="rounded-2xl border border-white/12 bg-[#0B1221]/80 p-4 sm:p-5 space-y-3">
      <div className="flex items-center justify-between gap-2 text-[11px] text-[#8FA4C2]">
        <span>{isFa ? 'اسلاید دو ستونه (متن + تصویر)' : 'Two-Column Split Slide'}</span>
        <button
          type="button"
          onClick={() =>
            onChange({ ...block, splitSide: imageEnd ? 'start' : 'end' })
          }
          className="rounded-lg border border-white/12 bg-white/[0.03] hover:bg-white/[0.08] px-2.5 py-1 text-[#DCE6F5] transition-colors whitespace-nowrap"
        >
          {isFa ? '↔ جابه‌جایی جهت تصویر' : '↔ Flip Image Side'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        {/* Image Side */}
        <div className={`md:col-span-5 space-y-2 ${imageEnd ? 'md:order-2' : 'md:order-1'}`}>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => void handleUpload(e.target.files?.[0])}
            className="sr-only"
          />
          {photo?.url ? (
            <div className="group/img relative aspect-[4/3] rounded-xl overflow-hidden border border-white/10 bg-[#070C17]">
              <SafeImage
                src={photo.url}
                alt={photo.captionFa || 'Slide visual'}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 end-2 flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover/img:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="rounded-lg bg-black/75 border border-white/15 px-2.5 py-1 text-[11px] text-white"
                >
                  {isFa ? 'تغییر' : 'Change'}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (isMediaRef(photo.url)) await deleteStudioImage(photo.url);
                    onChange({ ...block, media: [] });
                  }}
                  aria-label={isFa ? 'حذف تصویر اسلاید' : 'Remove slide image'}
                  className="w-7 h-7 rounded-lg bg-black/80 border border-rose-400/35 text-rose-300 flex items-center justify-center"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="w-full aspect-[4/3] rounded-xl border border-dashed border-white/18 bg-black/25 hover:border-[#6F9BFF]/60 flex flex-col items-center justify-center gap-2 text-xs text-[#9BB0CC] transition-colors"
            >
              {uploading ? (
                <Loader2 className="w-5 h-5 animate-spin text-[#28CF77]" />
              ) : (
                <ImagePlus className="w-5 h-5 text-[#6F9BFF]" />
              )}
              <span>{isFa ? 'آپلود تصویر اسلاید' : 'Upload Slide Visual'}</span>
            </button>
          )}
          {photo?.url && (
            <input
              type="text"
              dir={isFa ? 'rtl' : 'ltr'}
              value={(isFa ? photo.captionFa : photo.captionEn) ?? ''}
              onChange={(e) =>
                onChange({
                  ...block,
                  media: [
                    {
                      ...photo,
                      ...(isFa ? { captionFa: e.target.value } : { captionEn: e.target.value }),
                    },
                  ],
                })
              }
              placeholder={isFa ? 'زیرنویس تصویر (اختیاری)...' : 'Image caption (optional)...'}
              className="w-full bg-transparent outline-none text-[11.5px] text-[#8FA4C2] placeholder:text-[#556886]"
            />
          )}
        </div>

        {/* Text Side */}
        <div
          className={`md:col-span-7 space-y-2 ${imageEnd ? 'md:order-1' : 'md:order-2'}`}
          onFocus={() => setFocused(true)}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
          }}
        >
          {showFa && (
            <div className="space-y-1.5">
              <input
                type="text"
                dir="rtl"
                value={block.headingFa ?? ''}
                onChange={(e) => onChange({ ...block, headingFa: e.target.value })}
                placeholder="عنوان اسلاید..."
                className="w-full bg-transparent outline-none text-lg font-bold text-[#F5F8FC] placeholder:text-[#5F7392]"
              />
              {focused && (
                <QuietFormatBar
                  isFa={isFa}
                  textareaRef={bodyFaRef}
                  value={block.bodyFa ?? ''}
                  onChange={(next) => onChange({ ...block, bodyFa: next })}
                />
              )}
              <AutoGrowTextarea
                textareaRef={bodyFaRef}
                dir="rtl"
                minRows={3}
                value={block.bodyFa ?? ''}
                onChange={(next) => onChange({ ...block, bodyFa: next })}
                placeholder="متن یا بولت‌پوینت‌های اسلاید..."
                className="text-sm leading-8 text-[#DCE6F5]"
              />
            </div>
          )}
          {showEn && (
            <div className="space-y-1.5 pt-2">
              <input
                type="text"
                dir="ltr"
                value={block.headingEn ?? ''}
                onChange={(e) => onChange({ ...block, headingEn: e.target.value })}
                placeholder="Slide heading (EN)..."
                className="w-full bg-transparent outline-none text-base font-bold text-[#F5F8FC] placeholder:text-[#5F7392]"
              />
              <AutoGrowTextarea
                textareaRef={bodyEnRef}
                dir="ltr"
                minRows={3}
                value={block.bodyEn ?? ''}
                onChange={(next) => onChange({ ...block, bodyEn: next })}
                placeholder="Slide text or bullet points (EN)..."
                className="text-sm leading-7 text-[#C6D2E3]"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
 * INDIVIDUAL TELEGRAPH BLOCK WRAPPER (Clean typography + whisper-quiet actions)
 * ========================================================================== */
export function TelegraphBlockItem({
  block,
  index,
  total,
  locale,
  langMode,
  onChange,
  onMove,
  onDuplicate,
  onRemove,
  onEnterNewParagraph,
}: {
  block: InsightBlock;
  index: number;
  total: number;
  locale: Locale;
  langMode: TelegraphLangMode;
  onChange: (next: InsightBlock) => void;
  onMove: (delta: -1 | 1) => void;
  onDuplicate: () => void;
  onRemove: () => void;
  onEnterNewParagraph?: () => void;
}) {
  const isFa = locale === 'fa';
  const showFa = langMode === 'fa' || langMode === 'both';
  const showEn = langMode === 'en' || langMode === 'both';
  const bodyFaRef = useRef<HTMLTextAreaElement>(null);
  const bodyEnRef = useRef<HTMLTextAreaElement>(null);
  const [focused, setFocused] = useState(false);

  const calloutToneBg: Record<InsightCalloutTone, string> = {
    insight: 'border-[#28CF77]/28 bg-[#00A651]/[0.06]',
    standard: 'border-[#6F9BFF]/28 bg-[#223A87]/[0.12]',
    highlight: 'border-white/15 bg-white/[0.035]',
  };

  return (
    <div
      className="group/blk relative rounded-2xl transition-colors"
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
      }}
    >
      {/* Whisper-Quiet Floating Block Toolbar (Top End — appears on hover/focus) */}
      <div
        className={`flex items-center justify-end gap-1 mb-1.5 transition-opacity ${
          focused
            ? 'opacity-100'
            : 'opacity-80 sm:opacity-0 sm:group-hover/blk:opacity-100'
        }`}
      >
        <div className="inline-flex items-center gap-0.5 rounded-lg border border-white/10 bg-[#0B1221]/95 px-1 py-0.5">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => onMove(-1)}
            aria-label={isFa ? 'انتقال بلوک به بالا' : 'Move block up'}
            className="w-7 h-7 rounded-md text-xs text-[#A6B6CE] hover:text-white hover:bg-white/10 disabled:opacity-30 flex items-center justify-center"
          >
            ↑
          </button>
          <button
            type="button"
            disabled={index === total - 1}
            onClick={() => onMove(1)}
            aria-label={isFa ? 'انتقال بلوک به پایین' : 'Move block down'}
            className="w-7 h-7 rounded-md text-xs text-[#A6B6CE] hover:text-white hover:bg-white/10 disabled:opacity-30 flex items-center justify-center"
          >
            ↓
          </button>
          <button
            type="button"
            onClick={onDuplicate}
            aria-label={isFa ? 'تکثیر بلوک' : 'Duplicate block'}
            className="w-7 h-7 rounded-md text-[#A6B6CE] hover:text-white hover:bg-white/10 flex items-center justify-center"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            aria-label={isFa ? 'حذف بلوک' : 'Delete block'}
            className="w-7 h-7 rounded-md text-rose-300/75 hover:text-rose-200 hover:bg-rose-500/15 flex items-center justify-center"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 1. RICH TEXT — Pure Borderless Telegraph Paragraph */}
      {block.type === 'rich-text' && (
        <div className="space-y-2 py-1">
          {focused && (
            <QuietFormatBar
              isFa={isFa}
              textareaRef={langMode === 'en' ? bodyEnRef : bodyFaRef}
              value={(langMode === 'en' ? block.bodyEn : block.bodyFa) ?? ''}
              onChange={(next) =>
                onChange(langMode === 'en' ? { ...block, bodyEn: next } : { ...block, bodyFa: next })
              }
              leadStyle={block.leadStyle}
              onToggleLead={() => onChange({ ...block, leadStyle: !block.leadStyle })}
            />
          )}
          <div className={langMode === 'both' ? 'grid grid-cols-1 sm:grid-cols-2 gap-5' : 'space-y-2'}>
            {showFa && (
              <AutoGrowTextarea
                textareaRef={bodyFaRef}
                dir="rtl"
                minRows={2}
                ariaLabel={isFa ? 'متن پاراگراف' : 'Persian paragraph'}
                value={block.bodyFa ?? ''}
                onChange={(next) => onChange({ ...block, bodyFa: next })}
                placeholder={
                  index === 0
                    ? 'متن مقاله را همینجا بنویسید... (برای بولد کردن متن را انتخاب کنید یا **متن** بنویسید)'
                    : 'ادامه متن...'
                }
                className={
                  block.leadStyle
                    ? 'text-lg sm:text-[19px] leading-9 font-medium text-[#F5F8FC]'
                    : 'text-[15.5px] sm:text-base leading-8 text-[#DCE6F5]'
                }
              />
            )}
            {showEn && (
              <AutoGrowTextarea
                textareaRef={bodyEnRef}
                dir="ltr"
                minRows={2}
                ariaLabel="English paragraph"
                value={block.bodyEn ?? ''}
                onChange={(next) => onChange({ ...block, bodyEn: next })}
                placeholder="Write your paragraph here..."
                className={
                  block.leadStyle
                    ? 'text-lg leading-8 font-medium text-[#F5F8FC]'
                    : 'text-[15px] leading-8 text-[#C6D2E3]'
                }
              />
            )}
          </div>
        </div>
      )}

      {/* 2. SECTION HEADING — Borderless Telegraph H2 */}
      {block.type === 'section-heading' && (
        <div className="pt-4 pb-1 space-y-1.5 border-t border-white/8">
          <div className={langMode === 'both' ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : 'space-y-1'}>
            {showFa && (
              <div className="space-y-1">
                <input
                  type="text"
                  dir="rtl"
                  value={block.kickerFa ?? ''}
                  onChange={(e) => onChange({ ...block, kickerFa: e.target.value })}
                  placeholder="برچسب کوچک فصل (اختیاری — مثال: بخش اول)"
                  className="w-full bg-transparent outline-none text-xs font-medium text-[#6F9BFF] placeholder:text-[#4F6280]"
                />
                <input
                  type="text"
                  dir="rtl"
                  value={block.headingFa ?? ''}
                  onChange={(e) => onChange({ ...block, headingFa: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && onEnterNewParagraph) {
                      e.preventDefault();
                      onEnterNewParagraph();
                    }
                  }}
                  placeholder="سرتیتر فصل یا بخش جدید..."
                  className="w-full bg-transparent outline-none text-xl sm:text-2xl font-bold text-[#F5F8FC] placeholder:text-[#5F7392]"
                />
              </div>
            )}
            {showEn && (
              <div className="space-y-1">
                <input
                  type="text"
                  dir="ltr"
                  value={block.kickerEn ?? ''}
                  onChange={(e) => onChange({ ...block, kickerEn: e.target.value })}
                  placeholder="Chapter kicker (optional)"
                  className="w-full bg-transparent outline-none text-xs font-medium text-[#6F9BFF] placeholder:text-[#4F6280]"
                />
                <input
                  type="text"
                  dir="ltr"
                  value={block.headingEn ?? ''}
                  onChange={(e) => onChange({ ...block, headingEn: e.target.value })}
                  placeholder="Chapter heading (EN)..."
                  className="w-full bg-transparent outline-none text-xl font-bold text-[#F5F8FC] placeholder:text-[#5F7392]"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. TELEGRAM MULTI-PHOTO ALBUM + CAPTION */}
      {block.type === 'telegram-media-post' && (
        <TelegraphAlbumBlock
          block={block}
          locale={locale}
          langMode={langMode}
          onChange={onChange}
        />
      )}

      {/* 4. POWERPOINT SPLIT SLIDE */}
      {block.type === 'text-image-split' && (
        <TelegraphSplitBlock
          block={block}
          locale={locale}
          langMode={langMode}
          onChange={onChange}
        />
      )}

      {/* 5. KEY METRICS STRIP — Clean Inline KPI Grid */}
      {block.type === 'key-metrics' && (
        <div className="rounded-2xl border border-white/10 bg-[#0B1221]/75 p-4 sm:p-5 space-y-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <input
              type="text"
              dir={langMode === 'en' ? 'ltr' : 'rtl'}
              value={(langMode === 'en' ? block.headingEn : block.headingFa) ?? ''}
              onChange={(e) =>
                onChange(
                  langMode === 'en'
                    ? { ...block, headingEn: e.target.value }
                    : { ...block, headingFa: e.target.value }
                )
              }
              placeholder={isFa ? 'عنوان شاخص‌های عملکرد (اختیاری)...' : 'Metrics title (optional)...'}
              className="flex-1 min-w-[200px] bg-transparent outline-none text-sm font-semibold text-[#F5F8FC] placeholder:text-[#5F7392]"
            />
            {(block.metrics?.length ?? 0) < MAX_METRICS_PER_BLOCK && (
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...block,
                    metrics: [
                      ...(block.metrics ?? []),
                      { value: '', unit: '', labelFa: '', labelEn: '' },
                    ],
                  })
                }
                className="text-xs font-medium text-[#28CF77] hover:underline whitespace-nowrap"
              >
                + {isFa ? 'شاخص جدید' : 'Add Metric'}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {(block.metrics ?? []).map((m, mIdx) => (
              <div
                key={mIdx}
                className="relative rounded-xl border border-white/10 bg-black/30 p-3 space-y-1.5"
              >
                {(block.metrics?.length ?? 0) > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      onChange({
                        ...block,
                        metrics: (block.metrics ?? []).filter((_, i) => i !== mIdx),
                      })
                    }
                    aria-label={isFa ? 'حذف شاخص' : 'Remove metric'}
                    className="absolute top-2 end-2 text-[#7F94B3] hover:text-rose-300"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <div className="flex items-baseline gap-1.5 pe-4">
                  <input
                    type="text"
                    value={m.value}
                    onChange={(e) => {
                      const next = [...(block.metrics ?? [])];
                      next[mIdx] = { ...m, value: e.target.value };
                      onChange({ ...block, metrics: next });
                    }}
                    placeholder={isFa ? '۶۲٪' : '62%'}
                    className="w-20 bg-transparent outline-none text-xl font-bold font-numeric tabular-nums text-[#28CF77] placeholder:text-[#3F5568]"
                  />
                  <input
                    type="text"
                    value={m.unit ?? ''}
                    onChange={(e) => {
                      const next = [...(block.metrics ?? [])];
                      next[mIdx] = { ...m, unit: e.target.value };
                      onChange({ ...block, metrics: next });
                    }}
                    placeholder={isFa ? 'واحد' : 'unit'}
                    className="flex-1 min-w-0 bg-transparent outline-none text-xs text-[#8FA4C2] placeholder:text-[#4D607D]"
                  />
                </div>
                {showFa && (
                  <input
                    type="text"
                    dir="rtl"
                    value={m.labelFa}
                    onChange={(e) => {
                      const next = [...(block.metrics ?? [])];
                      next[mIdx] = { ...m, labelFa: e.target.value };
                      onChange({ ...block, metrics: next });
                    }}
                    placeholder="توضیح شاخص (مثال: کاهش مصرف انرژی)"
                    className="w-full bg-transparent outline-none text-xs text-[#DCE6F5] placeholder:text-[#5F7392]"
                  />
                )}
                {showEn && (
                  <input
                    type="text"
                    dir="ltr"
                    value={m.labelEn}
                    onChange={(e) => {
                      const next = [...(block.metrics ?? [])];
                      next[mIdx] = { ...m, labelEn: e.target.value };
                      onChange({ ...block, metrics: next });
                    }}
                    placeholder="Metric label (EN)"
                    className="w-full bg-transparent outline-none text-xs text-[#9BB0CC] placeholder:text-[#556886]"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. CALLOUT — Clean Tinted Note (No thick left border) */}
      {block.type === 'callout' && (
        <div
          className={`rounded-2xl border p-4 sm:p-5 space-y-2.5 ${
            calloutToneBg[block.tone ?? 'insight']
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <input
              type="text"
              dir={langMode === 'en' ? 'ltr' : 'rtl'}
              value={(langMode === 'en' ? block.headingEn : block.headingFa) ?? ''}
              onChange={(e) =>
                onChange(
                  langMode === 'en'
                    ? { ...block, headingEn: e.target.value }
                    : { ...block, headingFa: e.target.value }
                )
              }
              placeholder={isFa ? 'عنوان نکته فنی / استاندارد...' : 'Technical callout title...'}
              className="flex-1 bg-transparent outline-none text-sm font-bold text-[#F5F8FC] placeholder:text-[#6B81A1]"
            />
            <div className="inline-flex items-center gap-1 text-[11px]">
              {(
                [
                  { id: 'insight', fa: 'زمردی', en: 'Emerald' },
                  { id: 'standard', fa: 'آبی', en: 'Blue' },
                  { id: 'highlight', fa: 'خنثی', en: 'Neutral' },
                ] as { id: InsightCalloutTone; fa: string; en: string }[]
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onChange({ ...block, tone: t.id })}
                  className={`rounded-md px-2 py-0.5 transition-colors ${
                    (block.tone ?? 'insight') === t.id
                      ? 'bg-white/15 text-white font-medium'
                      : 'text-[#8FA4C2] hover:text-white'
                  }`}
                >
                  {isFa ? t.fa : t.en}
                </button>
              ))}
            </div>
          </div>
          {showFa && (
            <AutoGrowTextarea
              dir="rtl"
              minRows={2}
              value={block.bodyFa ?? ''}
              onChange={(next) => onChange({ ...block, bodyFa: next })}
              placeholder="متن نکته تخصصی یا الزام مبحث ۱۹..."
              className="text-sm leading-7 text-[#DCE6F5]"
            />
          )}
          {showEn && (
            <AutoGrowTextarea
              dir="ltr"
              minRows={2}
              value={block.bodyEn ?? ''}
              onChange={(next) => onChange({ ...block, bodyEn: next })}
              placeholder="Callout text (EN)..."
              className="text-sm leading-7 text-[#C6D2E3]"
            />
          )}
        </div>
      )}

      {/* 7. QUOTE — Iconic Telegraph Centered Editorial Pull-Quote */}
      {block.type === 'quote' && (
        <div className="my-2 py-6 px-4 border-y border-white/10 text-center space-y-2.5">
          {showFa && (
            <AutoGrowTextarea
              dir="rtl"
              minRows={1}
              value={block.bodyFa ?? ''}
              onChange={(next) => onChange({ ...block, bodyFa: next })}
              placeholder="«نقل‌قول شاخص یا جمله کلیدی مقاله را اینجا بنویسید...»"
              className="text-center text-lg sm:text-xl font-medium leading-9 text-[#F5F8FC]"
            />
          )}
          {showEn && (
            <AutoGrowTextarea
              dir="ltr"
              minRows={1}
              value={block.bodyEn ?? ''}
              onChange={(next) => onChange({ ...block, bodyEn: next })}
              placeholder="“Editorial pull-quote (EN)...”"
              className="text-center text-base italic leading-8 text-[#C6D2E3]"
            />
          )}
          <div className={langMode === 'both' ? 'grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg mx-auto' : 'max-w-sm mx-auto'}>
            {showFa && (
              <input
                type="text"
                dir="rtl"
                value={block.attributionFa ?? ''}
                onChange={(e) => onChange({ ...block, attributionFa: e.target.value })}
                placeholder="— نام گوینده یا منبع (اختیاری)"
                className="w-full bg-transparent outline-none text-center text-xs text-[#8FA4C2] placeholder:text-[#556886]"
              />
            )}
            {showEn && (
              <input
                type="text"
                dir="ltr"
                value={block.attributionEn ?? ''}
                onChange={(e) => onChange({ ...block, attributionEn: e.target.value })}
                placeholder="— Attribution (EN, optional)"
                className="w-full bg-transparent outline-none text-center text-xs text-[#8FA4C2] placeholder:text-[#556886]"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
