export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function computeScrollProgress(
  sectionTop: number,
  sectionHeight: number,
  viewportHeight: number
): number {
  const scrollableDistance = sectionHeight - viewportHeight;
  if (scrollableDistance <= 0) return 0;
  return clamp(-sectionTop / scrollableDistance, 0, 1);
}

export function progressToFrameIndex(progress: number, totalFrames: number): number {
  if (totalFrames <= 1) return 0;
  return clamp(Math.round(clamp(progress, 0, 1) * (totalFrames - 1)), 0, totalFrames - 1);
}

export function stepDampedValue(
  current: number,
  target: number,
  factor = 0.16,
  epsilon = 0.0005
): number {
  const diff = target - current;
  if (Math.abs(diff) <= epsilon) return target;
  return current + diff * clamp(factor, 0.01, 1);
}

export function findNearestLoadedFrame(targetIndex: number, loadedMask: boolean[]): number {
  if (loadedMask.length === 0) return -1;
  const clampedTarget = clamp(targetIndex, 0, loadedMask.length - 1);
  if (loadedMask[clampedTarget]) return clampedTarget;

  for (let offset = 1; offset < loadedMask.length; offset++) {
    const prev = clampedTarget - offset;
    if (prev >= 0 && loadedMask[prev]) return prev;
    const next = clampedTarget + offset;
    if (next < loadedMask.length && loadedMask[next]) return next;
  }
  return -1;
}

export function buildHeroFrameUrl(indexZeroBased: number): string {
  const num = String(indexZeroBased + 1).padStart(3, '0');
  return `/assets/aistudio/hero-frames/frame_${num}.webp`;
}

export interface CoverDrawRect {
  dx: number;
  dy: number;
  dw: number;
  dh: number;
}

export function computeCoverDrawRect(
  mediaWidth: number,
  mediaHeight: number,
  canvasWidth: number,
  canvasHeight: number,
  focalX = 0.5,
  focalY = 0.5
): CoverDrawRect {
  if (mediaWidth <= 0 || mediaHeight <= 0 || canvasWidth <= 0 || canvasHeight <= 0) {
    return { dx: 0, dy: 0, dw: canvasWidth, dh: canvasHeight };
  }

  const mediaRatio = mediaWidth / mediaHeight;
  const canvasRatio = canvasWidth / canvasHeight;

  let dw = canvasWidth;
  let dh = canvasHeight;

  if (canvasRatio > mediaRatio) {
    dw = canvasWidth;
    dh = canvasWidth / mediaRatio;
  } else {
    dh = canvasHeight;
    dw = canvasHeight * mediaRatio;
  }

  const dx = (canvasWidth - dw) * clamp(focalX, 0, 1);
  const dy = (canvasHeight - dh) * clamp(focalY, 0, 1);
  return { dx, dy, dw, dh };
}
