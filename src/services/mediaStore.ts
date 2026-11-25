import { deleteDoc, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { isSafeImageSrc } from '../utils/validation';
import { db, handleFirestoreError, OperationType } from './firebase';

export type ImageUploadPreset = 'cover' | 'gallery' | 'portrait' | 'team-banner' | 'logo';

const PRESET_CONFIG: Record<
  ImageUploadPreset,
  { maxDimension: number; initialQuality: number; maxBytes: number }
> = {
  cover: { maxDimension: 1400, initialQuality: 0.8, maxBytes: 420000 },
  'team-banner': { maxDimension: 1600, initialQuality: 0.8, maxBytes: 440000 },
  gallery: { maxDimension: 1200, initialQuality: 0.78, maxBytes: 380000 },
  portrait: { maxDimension: 720, initialQuality: 0.82, maxBytes: 240000 },
  logo: { maxDimension: 520, initialQuality: 0.9, maxBytes: 180000 },
};

const ALLOWED_INPUT_MIMES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);

const mediaCache = new Map<string, string>();
const inFlightRequests = new Map<string, Promise<string | null>>();

export function isMediaRef(src: string | undefined): src is string {
  return typeof src === 'string' && src.startsWith('media://');
}

export function extractMediaId(src: string): string | null {
  if (!isMediaRef(src)) return null;
  const id = src.slice('media://'.length).trim();
  return /^[a-zA-Z0-9_-]{1,128}$/.test(id) ? id : null;
}

function generateMediaId(): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `med_${Date.now()}_${rand}`;
}

function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('INVALID_IMAGE'));
    };
    img.src = url;
  });
}

export async function compressImageFile(
  file: File,
  preset: ImageUploadPreset
): Promise<{
  dataUrl: string;
  contentType: 'image/webp' | 'image/jpeg' | 'image/png';
  width: number;
  height: number;
  sizeBytes: number;
}> {
  if (file.type && !ALLOWED_INPUT_MIMES.has(file.type.toLowerCase())) {
    throw new Error('UNSUPPORTED_FORMAT');
  }
  if (file.size > 18 * 1024 * 1024) {
    throw new Error('FILE_TOO_LARGE');
  }

  const config = PRESET_CONFIG[preset];
  const img = await loadImageElement(file);

  let scale = Math.min(1, config.maxDimension / Math.max(img.naturalWidth, img.naturalHeight, 1));
  let width = Math.max(1, Math.round(img.naturalWidth * scale));
  let height = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('CANVAS_UNAVAILABLE');
  }

  let quality = config.initialQuality;
  let dataUrl = '';
  let contentType: 'image/webp' | 'image/jpeg' | 'image/png' = 'image/webp';

  for (let attempt = 0; attempt < 6; attempt += 1) {
    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    dataUrl = canvas.toDataURL('image/webp', quality);
    if (dataUrl.startsWith('data:image/webp;base64,')) {
      contentType = 'image/webp';
    } else if (preset === 'logo') {
      dataUrl = canvas.toDataURL('image/png');
      contentType = 'image/png';
    } else {
      dataUrl = canvas.toDataURL('image/jpeg', quality);
      contentType = 'image/jpeg';
    }

    if (dataUrl.length <= config.maxBytes) {
      break;
    }

    quality = Math.max(0.42, quality - 0.12);
    if (attempt >= 2) {
      scale *= 0.8;
      width = Math.max(240, Math.round(img.naturalWidth * scale));
      height = Math.max(240, Math.round(img.naturalHeight * scale));
    }
  }

  if (dataUrl.length > 475000 || !/^data:image\/(webp|jpeg|png);base64,[A-Za-z0-9+/=]+$/.test(dataUrl)) {
    throw new Error('IMAGE_EXCEEDS_LIMIT');
  }

  return {
    dataUrl,
    contentType,
    width,
    height,
    sizeBytes: dataUrl.length,
  };
}

export async function uploadStudioImage(
  file: File,
  preset: ImageUploadPreset
): Promise<{ mediaRef: string; previewDataUrl: string; sizeBytes: number }> {
  const compressed = await compressImageFile(file, preset);
  const id = generateMediaId();
  const path = `mediaAssets/${id}`;

  try {
    await setDoc(doc(db, 'mediaAssets', id), {
      dataUrl: compressed.dataUrl,
      contentType: compressed.contentType,
      sizeBytes: compressed.sizeBytes,
      width: compressed.width,
      height: compressed.height,
      createdAt: serverTimestamp(),
    });
    const mediaRef = `media://${id}`;
    mediaCache.set(id, compressed.dataUrl);
    return {
      mediaRef,
      previewDataUrl: compressed.dataUrl,
      sizeBytes: compressed.sizeBytes,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function resolveMediaUrl(src: string): Promise<string | null> {
  if (!src) return null;
  if (!isMediaRef(src)) {
    return isSafeImageSrc(src) ? src : null;
  }

  const id = extractMediaId(src);
  if (!id) return null;

  const cached = mediaCache.get(id);
  if (cached) return cached;

  const existingPromise = inFlightRequests.get(id);
  if (existingPromise) return existingPromise;

  const promise = (async () => {
    try {
      const snap = await getDoc(doc(db, 'mediaAssets', id));
      if (!snap.exists()) return null;
      const dataUrl = snap.data()?.dataUrl;
      if (
        typeof dataUrl === 'string' &&
        /^data:image\/(webp|jpeg|png);base64,[A-Za-z0-9+/=]+$/.test(dataUrl)
      ) {
        mediaCache.set(id, dataUrl);
        return dataUrl;
      }
      return null;
    } catch {
      return null;
    } finally {
      inFlightRequests.delete(id);
    }
  })();

  inFlightRequests.set(id, promise);
  return promise;
}

export async function deleteStudioImage(mediaRef: string): Promise<void> {
  const id = extractMediaId(mediaRef);
  if (!id) return;
  try {
    await deleteDoc(doc(db, 'mediaAssets', id));
    mediaCache.delete(id);
  } catch {
    // Non-fatal cleanup
  }
}
