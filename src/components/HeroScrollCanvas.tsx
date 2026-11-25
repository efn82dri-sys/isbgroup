import React, { useEffect, useRef } from 'react';
import { ASSETS } from '../data/assets';
import {
  buildHeroFrameUrl,
  computeCoverDrawRect,
  computeScrollProgress,
  findNearestLoadedFrame,
  progressToFrameIndex,
  stepDampedValue,
} from '../utils/scrollScrub';

interface HeroScrollCanvasProps {
  sectionRef: React.RefObject<HTMLElement | null>;
  progressBarRef?: React.RefObject<HTMLDivElement | null>;
  totalFrames?: number;
  focalX?: number;
  focalY?: number;
}

export function HeroScrollCanvas({
  sectionRef,
  progressBarRef,
  totalFrames = ASSETS.heroFrameCount,
  focalX = 0.56,
  focalY = 0.5,
}: HeroScrollCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const section = sectionRef.current;
    if (!canvas || !section) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const images: (HTMLImageElement | null)[] = new Array(totalFrames).fill(null);
    const loadedMask: boolean[] = new Array(totalFrames).fill(false);

    let targetProgress = 0;
    let currentProgress = 0;
    let lastDrawnFrame = -1;
    let pointerTargetX = 0;
    let pointerTargetY = 0;
    let pointerX = 0;
    let pointerY = 0;
    let rafId: number | null = null;
    let disposed = false;
    let isHeroInView = true;

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const isCompactViewport = window.innerWidth < 768;
      const dpr = Math.min(window.devicePixelRatio || 1, isCompactViewport ? 1.5 : 2);
      const width = Math.max(1, Math.floor(parent.clientWidth));
      const height = Math.max(1, Math.floor(parent.clientHeight));
      const nextW = Math.floor(width * dpr);
      const nextH = Math.floor(height * dpr);
      if (canvas.width !== nextW || canvas.height !== nextH) {
        canvas.width = nextW;
        canvas.height = nextH;
        lastDrawnFrame = -1;
        drawFrame(progressToFrameIndex(currentProgress, totalFrames), true);
      }
    };

    const drawFrame = (frameIndex: number, force = false) => {
      const resolvedIndex = findNearestLoadedFrame(frameIndex, loadedMask);
      if (resolvedIndex < 0) return;
      if (!force && resolvedIndex === lastDrawnFrame) return;

      const img = images[resolvedIndex];
      if (!img || !img.complete || img.naturalWidth === 0) return;

      const { dx, dy, dw, dh } = computeCoverDrawRect(
        img.naturalWidth,
        img.naturalHeight,
        canvas.width,
        canvas.height,
        focalX,
        focalY
      );
      ctx.drawImage(img, dx, dy, dw, dh);
      lastDrawnFrame = resolvedIndex;

      if (stageRef.current) {
        stageRef.current.dataset.frameIndex = String(resolvedIndex);
      }
    };

    const updateVisualTransforms = () => {
      if (stageRef.current) {
        stageRef.current.dataset.scrollProgress = currentProgress.toFixed(3);
        if (!prefersReducedMotion) {
          const depthScale = 1.03 + Math.sin(currentProgress * Math.PI) * 0.035;
          stageRef.current.style.transform = `translate3d(${pointerX.toFixed(2)}px, ${pointerY.toFixed(2)}px, 0) scale(${depthScale.toFixed(4)})`;
        }
      }
      if (progressBarRef?.current) {
        progressBarRef.current.style.transform = `scaleX(${Math.max(0.02, currentProgress).toFixed(4)})`;
      }
    };

    const tick = () => {
      if (disposed || !isHeroInView) {
        rafId = null;
        return;
      }

      const nextProgress = prefersReducedMotion
        ? targetProgress
        : stepDampedValue(currentProgress, targetProgress, 0.14, 0.0004);
      const nextPtrX = prefersReducedMotion
        ? 0
        : stepDampedValue(pointerX, pointerTargetX, 0.08, 0.04);
      const nextPtrY = prefersReducedMotion
        ? 0
        : stepDampedValue(pointerY, pointerTargetY, 0.08, 0.04);

      const moved =
        nextProgress !== currentProgress ||
        nextPtrX !== pointerX ||
        nextPtrY !== pointerY;

      currentProgress = nextProgress;
      pointerX = nextPtrX;
      pointerY = nextPtrY;

      const frameIdx = progressToFrameIndex(currentProgress, totalFrames);
      drawFrame(frameIdx);
      updateVisualTransforms();

      const stillSettling =
        Math.abs(targetProgress - currentProgress) > 0.0004 ||
        Math.abs(pointerTargetX - pointerX) > 0.04 ||
        Math.abs(pointerTargetY - pointerY) > 0.04;

      if (stillSettling || moved) {
        rafId = window.requestAnimationFrame(tick);
      } else {
        rafId = null;
      }
    };

    const scheduleTick = () => {
      if (rafId === null && !disposed && isHeroInView) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    const syncScroll = () => {
      if (!isHeroInView) return;
      const rect = section.getBoundingClientRect();
      targetProgress = computeScrollProgress(rect.top, rect.height, window.innerHeight);
      scheduleTick();
    };

    const onPointerMove = (e: PointerEvent) => {
      if (prefersReducedMotion || !isHeroInView || e.pointerType !== 'mouse') return;
      const nx = e.clientX / Math.max(1, window.innerWidth) - 0.5;
      const ny = e.clientY / Math.max(1, window.innerHeight) - 0.5;
      pointerTargetX = -nx * 14;
      pointerTargetY = -ny * 9;
      scheduleTick();
    };

    const loadFrame = (index: number) => {
      if (index < 0 || index >= totalFrames || images[index]) return;
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        if (disposed) return;
        loadedMask[index] = true;
        const desired = progressToFrameIndex(currentProgress, totalFrames);
        if (
          lastDrawnFrame === -1 ||
          Math.abs(index - desired) < Math.abs(lastDrawnFrame - desired)
        ) {
          drawFrame(desired, true);
        }
      };
      img.src = buildHeroFrameUrl(index);
      images[index] = img;
    };

    const observer =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(
            (entries) => {
              const entry = entries[0];
              isHeroInView = entry ? entry.isIntersecting : true;
              if (isHeroInView) {
                syncScroll();
              } else if (rafId !== null) {
                window.cancelAnimationFrame(rafId);
                rafId = null;
              }
            },
            { rootMargin: '140px 0px' }
          )
        : null;
    observer?.observe(section);

    resizeCanvas();
    syncScroll();

    // Always load opening frame immediately so the 3D scene is crisp behind the curtain
    loadFrame(0);

    let batchTimer: number | null = null;
    let fallbackTimer: number | null = null;
    let prefetchStarted = false;

    const startFramePrefetch = () => {
      if (disposed || prefetchStarted) return;
      prefetchStarted = true;
      if (fallbackTimer !== null) {
        window.clearTimeout(fallbackTimer);
        fallbackTimer = null;
      }

      const isCompact = window.innerWidth < 768;
      // Stage 1: Load coarse keyframes first for instant smooth scrubbing
      for (let i = 6; i < totalFrames; i += 6) {
        loadFrame(i);
      }
      loadFrame(totalFrames - 1);

      // Stage 2: Load remaining intermediate frames in gentle progressive chunks
      // On mobile screens, every 2nd frame gives indistinguishable smooth scrub at 50% less bandwidth & RAM
      const step = isCompact ? 2 : 1;
      const batchSize = isCompact ? 4 : 6;
      const intervalMs = isCompact ? 95 : 70;
      let nextToQueue = step;

      batchTimer = window.setInterval(() => {
        if (disposed) {
          if (batchTimer !== null) window.clearInterval(batchTimer);
          return;
        }
        if (!isHeroInView) return;
        let loadedInBatch = 0;
        while (nextToQueue < totalFrames && loadedInBatch < batchSize) {
          if (!images[nextToQueue]) {
            loadFrame(nextToQueue);
            loadedInBatch++;
          }
          nextToQueue += step;
        }
        if (nextToQueue >= totalFrames && batchTimer !== null) {
          window.clearInterval(batchTimer);
          batchTimer = null;
        }
      }, intervalMs);
    };

    // Wait for initial preloader curtain to lift before queuing remaining WebP frames
    const preloaderActive = Boolean(document.querySelector('[data-preloader-state="active"]'));
    if (!preloaderActive) {
      fallbackTimer = window.setTimeout(startFramePrefetch, 220);
    } else {
      window.addEventListener('isb:preloader-complete', startFramePrefetch, { once: true });
      fallbackTimer = window.setTimeout(startFramePrefetch, 4500);
    }

    window.addEventListener('scroll', syncScroll, { passive: true });
    window.addEventListener('resize', resizeCanvas, { passive: true });
    window.addEventListener('resize', syncScroll, { passive: true });
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    return () => {
      disposed = true;
      observer?.disconnect();
      window.removeEventListener('isb:preloader-complete', startFramePrefetch);
      if (batchTimer !== null) window.clearInterval(batchTimer);
      if (fallbackTimer !== null) window.clearTimeout(fallbackTimer);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', syncScroll);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('resize', syncScroll);
      window.removeEventListener('pointermove', onPointerMove);
    };
  }, [sectionRef, progressBarRef, totalFrames, focalX, focalY]);

  return (
    <div
      ref={stageRef}
      data-testid="hero-3d-scroll-stage"
      data-scroll-progress="0.000"
      data-frame-index="0"
      className="absolute inset-0 will-change-transform origin-center"
    >
      {/* Instant zero-latency first frame before canvas finishes hydrating */}
      <img
        src={buildHeroFrameUrl(0)}
        alt=""
        aria-hidden="true"
        fetchPriority="high"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 w-full h-full block"
      />
    </div>
  );
}
