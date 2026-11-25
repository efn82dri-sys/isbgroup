import React, { useRef, useState } from 'react';
import { ImagePlus, Link2, Loader2, Trash2, Upload } from '../icons/IsbIcons';
import {
  deleteStudioImage,
  isMediaRef,
  uploadStudioImage,
  type ImageUploadPreset,
} from '../../services/mediaStore';
import type { Locale } from '../../types/content';
import { SafeImage } from '../BrandMark';

function formatUploadError(error: unknown, isFa: boolean): string {
  const msg = error instanceof Error ? error.message : '';
  if (msg === 'UNSUPPORTED_FORMAT') {
    return isFa
      ? 'فرمت تصویر پشتیبانی نمی‌شود. لطفاً فایل JPG، PNG یا WebP انتخاب کنید.'
      : 'Unsupported format. Please select a JPG, PNG, or WebP image.';
  }
  if (msg === 'FILE_TOO_LARGE') {
    return isFa
      ? 'حجم فایل اصلی بیش از ۱۸ مگابایت است. لطفاً تصویر سبک‌تری انتخاب کنید.'
      : 'Image file exceeds 18 MB. Please select a smaller image.';
  }
  if (msg === 'IMAGE_EXCEEDS_LIMIT') {
    return isFa
      ? 'ابعاد یا حجم تصویر پس از فشرده‌سازی همچنان زیاد است. لطفاً تصویر کوچک‌تری انتخاب کنید.'
      : 'Image remains too large after compression. Please try a smaller resolution.';
  }
  return isFa
    ? 'آپلود تصویر با خطا مواجه شد. لطفاً دوباره تلاش کنید.'
    : 'Image upload failed. Please try again.';
}

interface ImageUploaderFieldProps {
  locale: Locale;
  label: string;
  value: string;
  preset: ImageUploadPreset;
  aspectClass?: string;
  objectFit?: 'cover' | 'contain';
  hint?: string;
  error?: string;
  onChange: (nextUrl: string) => void;
}

export function ImageUploaderField({
  locale,
  label,
  value,
  preset,
  aspectClass = 'aspect-[16/9]',
  objectFit = 'cover',
  hint,
  error,
  onChange,
}: ImageUploaderFieldProps) {
  const isFa = locale === 'fa';
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const result = await uploadStudioImage(file, preset);
      onChange(result.mediaRef);
    } catch (err) {
      setUploadError(formatUploadError(err, isFa));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleRemove = async () => {
    if (isMediaRef(value)) {
      await deleteStudioImage(value);
    }
    onChange('');
  };

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-medium text-[#E4E3DC]">{label}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowUrlInput((prev) => !prev)}
            className="inline-flex items-center gap-1 text-[11px] text-[#8B9DB7] hover:text-[#6F9BFF] transition-colors"
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>{isFa ? 'ورود لینک مستقیم' : 'Use direct URL'}</span>
          </button>
          {value && (
            <button
              type="button"
              onClick={handleRemove}
              className="inline-flex items-center gap-1 text-[11px] text-rose-300 hover:text-rose-200 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isFa ? 'حذف تصویر' : 'Remove'}</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-stretch">
        <div
          className={`sm:col-span-5 relative rounded-2xl overflow-hidden border border-white/15 ${
            objectFit === 'contain'
              ? 'bg-[#070D19] p-4 flex items-center justify-center'
              : 'bg-black/35'
          } ${aspectClass}`}
        >
          {value ? (
            <SafeImage
              src={value}
              alt={label}
              className={
                objectFit === 'contain'
                  ? 'max-w-full max-h-full object-contain'
                  : 'w-full h-full object-cover'
              }
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-[#8B9DB7] p-4 text-center">
              <ImagePlus className="w-6 h-6 text-[#6F9BFF]/75" />
              <span className="text-[11px]">
                {isFa ? 'تصویری انتخاب نشده است' : 'No image selected'}
              </span>
            </div>
          )}
        </div>

        <div className="sm:col-span-7 flex flex-col justify-between gap-3 rounded-2xl border border-dashed border-white/20 bg-white/[0.03] p-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-[#F5F3EE]">
              {isFa ? 'آپلود مستقیم از کامپیوتر یا موبایل' : 'Upload directly from your device'}
            </p>
            <p className="text-[11px] text-[#A4A9A5] leading-relaxed">
              {hint ??
                (isFa
                  ? 'تصویر به‌صورت خودکار بهینه‌سازی و فشرده می‌شود (JPG / PNG / WebP).'
                  : 'Images are automatically resized and compressed for fast loading (JPG / PNG / WebP).')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => void handleFile(e.target.files?.[0])}
              className="sr-only"
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className="glass-cta min-h-[40px] inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold disabled:opacity-60"
            >
              {uploading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5" />
              )}
              <span>
                {uploading
                  ? isFa
                    ? 'در حال فشرده‌سازی و آپلود...'
                    : 'Compressing & uploading...'
                  : value
                    ? isFa
                      ? 'تغییر تصویر'
                      : 'Replace Image'
                    : isFa
                      ? 'انتخاب و آپلود تصویر'
                      : 'Choose & Upload Image'}
              </span>
            </button>
          </div>

          {showUrlInput && (
            <input
              type="text"
              dir="ltr"
              placeholder="https://... or /assets/..."
              value={isMediaRef(value) ? '' : value}
              onChange={(e) => onChange(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-xs text-[#F5F3EE] placeholder:text-white/30"
            />
          )}
        </div>
      </div>

      {(uploadError || error) && (
        <p role="alert" className="text-[11px] text-amber-300">
          {uploadError || error}
        </p>
      )}
    </div>
  );
}

interface GalleryUploaderProps {
  locale: Locale;
  images: string[];
  maxImages?: number;
  onChange: (nextImages: string[]) => void;
}

export function GalleryUploader({
  locale,
  images,
  maxImages = 8,
  onChange,
}: GalleryUploaderProps) {
  const isFa = locale === 'fa';
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const remaining = maxImages - images.length;
    if (remaining <= 0) {
      setError(
        isFa ? `حداکثر ${maxImages} تصویر در گالری مجاز است.` : `Maximum ${maxImages} gallery images.`
      );
      return;
    }

    const files = Array.from(fileList).slice(0, remaining);
    setUploadingCount(files.length);
    setError(null);

    const uploaded: string[] = [];
    for (const file of files) {
      try {
        const res = await uploadStudioImage(file, 'gallery');
        uploaded.push(res.mediaRef);
      } catch (err) {
        setError(formatUploadError(err, isFa));
      } finally {
        setUploadingCount((c) => Math.max(0, c - 1));
      }
    }

    if (uploaded.length > 0) {
      onChange([...images, ...uploaded]);
    }
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleRemove = async (index: number) => {
    const target = images[index];
    if (isMediaRef(target)) {
      await deleteStudioImage(target);
    }
    onChange(images.filter((_, idx) => idx !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="text-xs font-medium text-[#E4E3DC]">
            {isFa
              ? `گالری تصاویر پروژه (${images.length} از ${maxImages})`
              : `Project Gallery (${images.length} / ${maxImages})`}
          </span>
          <p className="text-[11px] text-[#9EA39F] mt-0.5">
            {isFa
              ? 'می‌توانید چند تصویر تکمیلی (پلان، نما، داخلی، رندر) برای صفحه جزئیات پروژه آپلود کنید.'
              : 'Upload additional plans, elevations, or photographs shown on the project detail page.'}
          </p>
        </div>
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={(e) => void handleFiles(e.target.files)}
            className="sr-only"
          />
          <button
            type="button"
            disabled={uploadingCount > 0 || images.length >= maxImages}
            onClick={() => inputRef.current?.click()}
            className="glass-pill min-h-[38px] inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium text-[#F5F8FC] hover:border-[#6F9BFF] disabled:opacity-50"
          >
            {uploadingCount > 0 ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#6F9BFF]" />
            ) : (
              <ImagePlus className="w-3.5 h-3.5 text-[#28CF77]" />
            )}
            <span>
              {uploadingCount > 0
                ? isFa
                  ? `در حال آپلود (${uploadingCount})...`
                  : `Uploading (${uploadingCount})...`
                : isFa
                  ? 'افزودن به گالری'
                  : 'Add Gallery Photos'}
            </span>
          </button>
        </div>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {images.map((imgUrl, idx) => (
            <div
              key={`${imgUrl}-${idx}`}
              className="group relative rounded-xl overflow-hidden border border-white/15 aspect-[4/3] bg-black/30"
            >
              <SafeImage src={imgUrl} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => void handleRemove(idx)}
                aria-label={isFa ? `حذف تصویر ${idx + 1}` : `Remove gallery image ${idx + 1}`}
                className="absolute top-2 end-2 w-7 h-7 rounded-full bg-black/75 border border-white/20 text-rose-300 hover:bg-rose-500/80 hover:text-white flex items-center justify-center transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p role="alert" className="text-[11px] text-amber-300">
          {error}
        </p>
      )}
    </div>
  );
}
