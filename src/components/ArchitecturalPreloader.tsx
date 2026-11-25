import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ASSETS } from '../data/assets';
import type { Locale } from '../types/content';
import { ARCHITECTURAL_EASE, HEAVY_SETTLE_EASE } from '../utils/motionMath';
import { IsbPatternOverlay } from './BrandMark';
import {
  computeActiveStageIndex,
  computeLogoTopInsetPct,
  computeStageLocalProgress,
  computeTimelineProgress,
  DEFAULT_LOADER_TIMING,
  PRELOADER_MILESTONES,
  type PreloaderPhase,
  shouldBypassPreloader,
} from '../utils/preloaderMath';

export const PRELOADER_SESSION_KEY = 'isb_intro_seen';

interface ArchitecturalPreloaderProps {
  locale: Locale;
  onRevealReady?: () => void;
  onComplete?: () => void;
}

interface DisciplineLabelCopy {
  title: string;
  caption: string;
}

const STAGE_COPY: Record<Locale, [DisciplineLabelCopy, DisciplineLabelCopy, DisciplineLabelCopy]> = {
  fa: [
    {
      title: 'معماری و شهرسازی',
      caption: 'فرم، فضا و مقیاس انسانی',
    },
    {
      title: 'انرژی و تأسیسات',
      caption: 'نور روز، اقلیم و بهینه‌سازی',
    },
    {
      title: 'سازه و مهندسی زلزله',
      caption: 'ایمنی، پایداری و تاب‌آوری',
    },
  ],
  en: [
    {
      title: 'Architecture & Urbanism',
      caption: 'Form, space & human scale',
    },
    {
      title: 'Energy & MEP',
      caption: 'Daylight, climate & efficiency',
    },
    {
      title: 'Structure & Seismic',
      caption: 'Safety, stability & resilience',
    },
  ],
};

/**
 * Bespoke 3D Isometric Architectural Sculpture Icon 01:
 * Multi-layered champagne & glass stepped pavilion with shaded isometric faces and warm facade louvers.
 */
function IsometricArchitectureIcon({
  state,
  fillRatio,
}: {
  state: 'idle' | 'active' | 'complete';
  fillRatio: number;
}) {
  const lit = state !== 'idle';
  const strokeMain = lit ? '#A4C3FF' : 'rgba(245,248,252,0.26)';

  return (
    <motion.svg
      viewBox="0 0 80 80"
      fill="none"
      aria-hidden="true"
      animate={{
        y: state === 'active' ? -4 : 0,
        scale: state === 'active' ? 1.05 : 1,
      }}
      transition={{ duration: 0.45, ease: ARCHITECTURAL_EASE }}
      className="w-14 h-14 sm:w-[70px] sm:h-[70px] overflow-visible"
    >
      <defs>
        <linearGradient id="archTop" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={lit ? '#DCE8FF' : '#FFFFFF'} stopOpacity={lit ? 0.78 : 0.08} />
          <stop offset="100%" stopColor={lit ? '#6F9BFF' : '#FFFFFF'} stopOpacity={lit ? 0.44 : 0.03} />
        </linearGradient>
        <linearGradient id="archLeft" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lit ? '#3B68D6' : '#FFFFFF'} stopOpacity={lit ? 0.56 : 0.05} />
          <stop offset="100%" stopColor={lit ? '#192E70' : '#FFFFFF'} stopOpacity={lit ? 0.28 : 0.015} />
        </linearGradient>
        <linearGradient id="archRight" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={lit ? '#00A651' : '#FFFFFF'} stopOpacity={lit ? 0.28 : 0.035} />
          <stop offset="100%" stopColor={lit ? '#0D172B' : '#000000'} stopOpacity={lit ? 0.45 : 0.1} />
        </linearGradient>
      </defs>

      {/* Volumetric plinth shadow */}
      <ellipse
        cx="40"
        cy="68"
        rx="24"
        ry="5.5"
        fill={lit ? 'rgba(59,104,214,0.28)' : 'rgba(0,0,0,0.34)'}
      />

      {/* Base podium volume */}
      <polygon points="40,42 64,54 40,66 16,54" fill="url(#archTop)" stroke={strokeMain} strokeWidth="1.2" strokeLinejoin="round" />
      <polygon points="16,54 40,66 40,72 16,60" fill="url(#archLeft)" stroke={strokeMain} strokeWidth="1.15" strokeLinejoin="round" />
      <polygon points="64,54 40,66 40,72 64,60" fill="url(#archRight)" stroke={strokeMain} strokeWidth="1.15" strokeLinejoin="round" />

      {/* Mid cantilevered studio floor */}
      <motion.g
        animate={{ y: lit ? -(fillRatio * 3.5) : 2.5 }}
        transition={{ duration: 0.4, ease: ARCHITECTURAL_EASE }}
      >
        <polygon points="40,25 58,34 40,43 22,34" fill="url(#archTop)" stroke={strokeMain} strokeWidth="1.25" strokeLinejoin="round" />
        <polygon points="22,34 40,43 40,58 22,49" fill="url(#archLeft)" stroke={strokeMain} strokeWidth="1.2" strokeLinejoin="round" />
        <polygon points="58,34 40,43 40,58 58,49" fill="url(#archRight)" stroke={strokeMain} strokeWidth="1.2" strokeLinejoin="round" />
        {lit && (
          <g stroke="#E6F0FF" strokeWidth="1.35" strokeLinecap="round" opacity="0.9">
            <line x1="27" y1="40.5" x2="27" y2="48.5" />
            <line x1="32.5" y1="43.2" x2="32.5" y2="51.2" />
            <line x1="47.5" y1="43.2" x2="47.5" y2="51.2" opacity="0.6" />
          </g>
        )}
      </motion.g>

      {/* Sculptural roof pavilion crown */}
      <motion.g
        animate={{ y: lit ? -(fillRatio * 6) : 5 }}
        transition={{ duration: 0.48, ease: ARCHITECTURAL_EASE }}
      >
        <polygon points="40,12 52,18 40,24 28,18" fill="url(#archTop)" stroke={lit ? '#FFFFFF' : strokeMain} strokeWidth="1.3" strokeLinejoin="round" />
        <polygon points="28,18 40,24 40,34 28,28" fill="url(#archLeft)" stroke={strokeMain} strokeWidth="1.2" strokeLinejoin="round" />
        <polygon points="52,18 40,24 40,34 52,28" fill="url(#archRight)" stroke={strokeMain} strokeWidth="1.2" strokeLinejoin="round" />
      </motion.g>
    </motion.svg>
  );
}

/**
 * Bespoke 3D Isometric Energy & Solar Prism Icon 02:
 * Faceted olive-gold solar crystal suspended inside dual tilted 3D airflow/daylight rings.
 */
function IsometricEnergyIcon({
  state,
  fillRatio,
}: {
  state: 'idle' | 'active' | 'complete';
  fillRatio: number;
}) {
  const lit = state !== 'idle';
  const strokeMain = lit ? '#46E492' : 'rgba(245,248,252,0.26)';

  return (
    <motion.svg
      viewBox="0 0 80 80"
      fill="none"
      aria-hidden="true"
      animate={{
        y: state === 'active' ? -4 : 0,
        scale: state === 'active' ? 1.05 : 1,
      }}
      transition={{ duration: 0.45, ease: ARCHITECTURAL_EASE }}
      className="w-14 h-14 sm:w-[70px] sm:h-[70px] overflow-visible"
    >
      <defs>
        <linearGradient id="energyBright" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={lit ? '#B8FCD6' : '#FFFFFF'} stopOpacity={lit ? 0.72 : 0.08} />
          <stop offset="100%" stopColor={lit ? '#00A651' : '#FFFFFF'} stopOpacity={lit ? 0.36 : 0.025} />
        </linearGradient>
        <linearGradient id="energyWarm" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={lit ? '#6F9BFF' : '#FFFFFF'} stopOpacity={lit ? 0.48 : 0.06} />
          <stop offset="100%" stopColor={lit ? '#00A651' : '#FFFFFF'} stopOpacity={lit ? 0.28 : 0.02} />
        </linearGradient>
        <linearGradient id="energyDeep" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lit ? '#008E45' : '#FFFFFF'} stopOpacity={lit ? 0.42 : 0.04} />
          <stop offset="100%" stopColor={lit ? '#0A1E15' : '#000000'} stopOpacity={lit ? 0.45 : 0.12} />
        </linearGradient>
      </defs>

      {/* Luminous emerald ground halo */}
      <ellipse
        cx="40"
        cy="68"
        rx="21"
        ry="5"
        fill={lit ? 'rgba(0,166,81,0.28)' : 'rgba(0,0,0,0.34)'}
      />

      {/* Primary tilted 3D thermal/daylight orbital contour */}
      <ellipse
        cx="40"
        cy="41"
        rx="29"
        ry="11.5"
        transform="rotate(-24 40 41)"
        stroke={lit ? 'rgba(40,207,119,0.75)' : 'rgba(255,255,255,0.12)'}
        strokeWidth="1.25"
        strokeDasharray="138"
        strokeDashoffset={lit ? 138 * (1 - Math.max(0.28, fillRatio)) : 138}
        style={{ transition: 'stroke-dashoffset 180ms linear' }}
      />

      {/* Secondary fine solar inclination arc */}
      <ellipse
        cx="40"
        cy="41"
        rx="23"
        ry="8.5"
        transform="rotate(20 40 41)"
        stroke={lit ? 'rgba(111,155,255,0.45)' : 'rgba(255,255,255,0.07)'}
        strokeWidth="0.95"
        strokeDasharray="3 4"
      />

      {/* Floating 3D Faceted Octahedron Solar Prism */}
      <motion.g
        animate={{ y: lit ? -(fillRatio * 4.5) : 1.5 }}
        transition={{ duration: 0.45, ease: ARCHITECTURAL_EASE }}
      >
        <polygon points="40,12 23,38 40,46" fill="url(#energyBright)" stroke={strokeMain} strokeWidth="1.25" strokeLinejoin="round" />
        <polygon points="40,12 57,38 40,46" fill="url(#energyWarm)" stroke={strokeMain} strokeWidth="1.25" strokeLinejoin="round" />
        <polygon points="23,38 40,46 40,64" fill="url(#energyDeep)" stroke={strokeMain} strokeWidth="1.2" strokeLinejoin="round" />
        <polygon points="57,38 40,46 40,64" fill={lit ? 'rgba(0,166,81,0.26)' : 'rgba(255,255,255,0.015)'} stroke={strokeMain} strokeWidth="1.2" strokeLinejoin="round" />
        <line
          x1="40"
          y1="15"
          x2="40"
          y2="61"
          stroke={lit ? '#D6FFE9' : 'rgba(255,255,255,0.16)'}
          strokeWidth="1.15"
          opacity={lit ? 0.9 : 0.35}
        />
      </motion.g>
    </motion.svg>
  );
}

/**
 * Bespoke 3D Isometric Structural & Seismic Diagrid Icon 03:
 * Precision cobalt-ice structural truss cube with internal bracing and luminous seismic nodes.
 */
function IsometricStructureIcon({
  state,
  fillRatio,
}: {
  state: 'idle' | 'active' | 'complete';
  fillRatio: number;
}) {
  const lit = state !== 'idle';
  const strokeMain = lit ? '#93BCFF' : 'rgba(245,248,252,0.26)';
  const strokeBracing = lit ? 'rgba(202,222,255,0.80)' : 'rgba(255,255,255,0.14)';

  return (
    <motion.svg
      viewBox="0 0 80 80"
      fill="none"
      aria-hidden="true"
      animate={{
        y: state === 'active' ? -4 : 0,
        scale: state === 'active' ? 1.05 : 1,
      }}
      transition={{ duration: 0.45, ease: ARCHITECTURAL_EASE }}
      className="w-14 h-14 sm:w-[70px] sm:h-[70px] overflow-visible"
    >
      <defs>
        <linearGradient id="structTop" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={lit ? '#D6E6FF' : '#FFFFFF'} stopOpacity={lit ? 0.60 : 0.07} />
          <stop offset="100%" stopColor={lit ? '#3B68D6' : '#FFFFFF'} stopOpacity={lit ? 0.34 : 0.025} />
        </linearGradient>
        <linearGradient id="structLeft" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lit ? '#2E52C4' : '#FFFFFF'} stopOpacity={lit ? 0.42 : 0.045} />
          <stop offset="100%" stopColor={lit ? '#152458' : '#FFFFFF'} stopOpacity={lit ? 0.24 : 0.015} />
        </linearGradient>
        <linearGradient id="structRight" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={lit ? '#6F9BFF' : '#FFFFFF'} stopOpacity={lit ? 0.26 : 0.03} />
          <stop offset="100%" stopColor={lit ? '#0B1326' : '#000000'} stopOpacity={lit ? 0.45 : 0.12} />
        </linearGradient>
      </defs>

      <ellipse
        cx="40"
        cy="68"
        rx="22"
        ry="5.2"
        fill={lit ? 'rgba(59,104,214,0.26)' : 'rgba(0,0,0,0.34)'}
      />

      {/* Primary Isometric Structural Core */}
      <polygon points="40,14 62,26.5 40,39 18,26.5" fill="url(#structTop)" stroke={strokeMain} strokeWidth="1.3" strokeLinejoin="round" />
      <polygon points="18,26.5 40,39 40,63 18,50.5" fill="url(#structLeft)" stroke={strokeMain} strokeWidth="1.3" strokeLinejoin="round" />
      <polygon points="62,26.5 40,39 40,63 62,50.5" fill="url(#structRight)" stroke={strokeMain} strokeWidth="1.3" strokeLinejoin="round" />

      {/* Internal Diagrid Seismic Cross-Bracing */}
      <g opacity={lit ? 0.45 + fillRatio * 0.55 : 0.24}>
        <line x1="18" y1="26.5" x2="40" y2="63" stroke={strokeBracing} strokeWidth="1.15" />
        <line x1="40" y1="39" x2="18" y2="50.5" stroke={strokeBracing} strokeWidth="1.15" />
        <line x1="62" y1="26.5" x2="40" y2="63" stroke={strokeBracing} strokeWidth="1.15" />
        <line x1="40" y1="39" x2="62" y2="50.5" stroke={strokeBracing} strokeWidth="1.15" />
        <line x1="40" y1="14" x2="40" y2="39" stroke={strokeBracing} strokeWidth="1" strokeDasharray="2.5 2.5" />
      </g>

      {/* Calibrated Structural Nodal Joints */}
      {[
        [40, 14],
        [62, 26.5],
        [18, 26.5],
        [40, 39],
        [18, 50.5],
        [62, 50.5],
        [40, 63],
      ].map(([cx, cy], idx) => (
        <circle
          key={idx}
          cx={cx}
          cy={cy}
          r={lit ? 2.5 : 1.7}
          fill={lit ? '#FFFFFF' : 'rgba(255,255,255,0.28)'}
        />
      ))}
    </motion.svg>
  );
}

export function ArchitecturalPreloader({
  locale,
  onRevealReady,
  onComplete,
}: ArchitecturalPreloaderProps) {
  const prefersReducedMotion = Boolean(useReducedMotion());
  const [phase, setPhase] = useState<PreloaderPhase>(() => {
    if (typeof window !== 'undefined') {
      if (shouldBypassPreloader(window.location.search)) return 'done';
      try {
        if (window.sessionStorage.getItem(PRELOADER_SESSION_KEY) === '1') return 'done';
      } catch {
        // Ignore private browsing sessionStorage restrictions
      }
    }
    return 'loading';
  });
  const [progress, setProgress] = useState(0);
  const completedRef = useRef(false);
  const revealedRef = useRef(false);

  const notifyRevealReady = () => {
    if (!revealedRef.current) {
      revealedRef.current = true;
      onRevealReady?.();
    }
  };

  useEffect(() => {
    if (phase === 'settling' || phase === 'exiting' || phase === 'done') {
      notifyRevealReady();
    }
  }, [phase]);

  const isRtl = locale === 'fa';
  const stageLabels = STAGE_COPY[locale];

  // Lock page scroll strictly while preloader covers the viewport
  useEffect(() => {
    if (phase === 'done' || phase === 'exiting') {
      document.documentElement.style.overflow = '';
      window.dispatchEvent(new CustomEvent('isb:preloader-complete'));
      return;
    }
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = '';
    };
  }, [phase]);

  // Real asset prewarming + delta-clamped smooth architectural timeline stepper
  useEffect(() => {
    if (phase !== 'loading') return;

    let cancelled = false;
    let assetsReady = false;
    let rafId = 0;

    const timing = prefersReducedMotion
      ? { minDurationMs: 550, maxWaitMs: 900, holdCapBeforeReady: 0.9 }
      : { ...DEFAULT_LOADER_TIMING, minDurationMs: 1650, maxWaitMs: 3200 };

    const preloadImage = (src: string) =>
      new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = src;
      });

    Promise.all([
      document.fonts ? document.fonts.ready.catch(() => undefined) : Promise.resolve(),
      preloadImage(ASSETS.brandLogoHorizontal),
      preloadImage('/assets/aistudio/hero-frames/frame_001.webp'),
    ]).then(() => {
      assetsReady = true;
    });

    let startTimestamp: number | null = null;
    let lastCommitted = -1;

    const tick = (now: number) => {
      if (cancelled) return;
      // Anchor start clock on the first painted rAF frame so initial JS hydration
      // never causes a jump past Stage 01/02, while keeping duration true to wall-clock time.
      if (startTimestamp === null) {
        startTimestamp = now;
      }
      const elapsed = now - startTimestamp;

      const next = computeTimelineProgress(elapsed, assetsReady, timing);
      if (next >= 0.999) {
        setProgress(1);
        setPhase('settling');
        return;
      }

      if (Math.abs(next - lastCommitted) >= 0.005) {
        lastCommitted = next;
        setProgress(next);
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(rafId);
    };
  }, [phase, prefersReducedMotion]);

  // Brief poised equilibrium lock at 100%, then lift the architectural curtain
  useEffect(() => {
    if (phase !== 'settling') return;
    const settleDelay = prefersReducedMotion ? 100 : 180;
    const timer = window.setTimeout(() => {
      setPhase('exiting');
    }, settleDelay);
    return () => window.clearTimeout(timer);
  }, [phase, prefersReducedMotion]);

  const markIntroSeen = () => {
    try {
      window.sessionStorage.setItem(PRELOADER_SESSION_KEY, '1');
    } catch {
      // Ignore storage restrictions
    }
  };

  const handleDismiss = () => {
    if (phase === 'done' || phase === 'exiting') return;
    markIntroSeen();
    setProgress(1);
    setPhase('exiting');
  };

  const handleExitComplete = () => {
    markIntroSeen();
    setPhase('done');
    if (!completedRef.current) {
      completedRef.current = true;
      onComplete?.();
    }
  };

  const activeStageIndex = computeActiveStageIndex(progress);
  const logoTopInsetPct = computeLogoTopInsetPct(progress);
  const pctNumber = Math.min(100, Math.round(progress * 100));
  const formattedPct = useMemo(() => String(pctNumber).padStart(2, '0'), [pctNumber]);

  const isVisible = phase === 'loading' || phase === 'settling';

  return (
    <AnimatePresence onExitComplete={handleExitComplete}>
      {isVisible && (
        <motion.div
          key="isb-architectural-preloader"
          data-testid="architectural-preloader"
          data-phase={phase}
          data-stage={activeStageIndex}
          data-progress={pctNumber}
          role="dialog"
          aria-modal="true"
          aria-label={isRtl ? 'بارگذاری وب‌سایت گروه ISB' : 'Loading ISB Group website'}
          initial={{ y: '0%', opacity: 1 }}
          exit={
            prefersReducedMotion
              ? { opacity: 0, transition: { duration: 0.24 } }
              : {
                  y: '-100%',
                  transition: { duration: 0.58, ease: HEAVY_SETTLE_EASE },
                }
          }
          className="fixed inset-0 z-[100] bg-[#070B14] text-[#F5F8FC] overflow-hidden flex flex-col justify-between select-none isolate"
        >
          {/* Architectural Blueprint Axes, Official ISB Catalog Pattern & Rich Cobalt/Emerald Wash */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
            <IsbPatternOverlay
              color="#5A86F5"
              opacity={0.095}
              scale={1.05}
              maskStyle="radial-gradient(ellipse 85% 75% at 50% 50%, black 0%, transparent 78%)"
            />
            <div
              className="absolute -top-32 -start-24 w-[44rem] h-[44rem] rounded-full"
              style={{
                background:
                  'radial-gradient(circle, rgba(34,58,135,0.36) 0%, rgba(34,58,135,0.09) 45%, transparent 74%)',
              }}
            />
            <div
              className="absolute -bottom-36 -end-24 w-[44rem] h-[44rem] rounded-full"
              style={{
                background:
                  'radial-gradient(circle, rgba(0,166,81,0.20) 0%, rgba(0,166,81,0.045) 44%, transparent 74%)',
              }}
            />

            {/* Drafting frame hairlines */}
            <div className="absolute top-3 right-3 bottom-3 left-3 sm:top-6 sm:right-6 sm:bottom-6 sm:left-6 lg:top-9 lg:right-9 lg:bottom-9 lg:left-9 rounded-[28px] border border-[#6F9BFF]/[0.14]" />
            <div className="absolute inset-y-9 left-1/2 w-px bg-gradient-to-b from-transparent via-[#6F9BFF]/[0.08] to-transparent" />
            <div className="absolute inset-x-9 top-1/2 h-px bg-gradient-to-r from-transparent via-[#6F9BFF]/[0.08] to-transparent" />
          </div>

          {/* Top Bar: Quiet Architectural Identity & Accessible Skip Button */}
          <div className="relative z-20 max-w-[1380px] w-full mx-auto px-6 sm:px-11 lg:px-14 pt-6 sm:pt-10 flex items-center justify-between gap-4">
            <p className="text-xs rtl:text-[13.5px] font-medium text-[#A4C3FF]/90 flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className="w-5 h-[1.5px] rounded-full bg-gradient-to-r from-[#28CF77] to-[#6F9BFF] shrink-0"
              />
              <span>
                {isRtl
                  ? 'گروه ساختمانی پایدار ایران زمین'
                  : 'Iran Zamin Sustainable Building Group'}
              </span>
            </p>

            <button
              type="button"
              data-testid="preloader-skip-btn"
              onClick={handleDismiss}
              className="inline-flex items-center justify-center min-h-[44px] px-4 sm:px-5 rounded-full text-xs rtl:text-[13px] font-medium text-[#C6D2E3] hover:text-[#FFFFFF] border border-[#6F9BFF]/25 hover:border-[#6F9BFF]/65 bg-[#223A87]/20 transition-colors cursor-pointer"
            >
              {isRtl ? 'ورود مستقیم' : 'Skip Intro'}
            </button>
          </div>

          {/* Center Stage: Volumetric ISB Logo Elevation Reveal + Calibrated 3D Timeline */}
          <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-5 sm:px-10 py-4 gap-8 sm:gap-11">
            {/* Volumetric Frosted Glass Logo Pedestal */}
            <div className="relative flex flex-col items-center gap-4">
              {/* Cobalt-Emerald architectural back-bloom responding to timeline progress */}
              <div
                aria-hidden="true"
                style={{
                  opacity: 0.28 + progress * 0.56,
                  background:
                    'radial-gradient(ellipse at center, rgba(34,58,135,0.42) 0%, rgba(0,166,81,0.14) 48%, transparent 74%)',
                }}
                className="pointer-events-none absolute -inset-12 rounded-full"
              />

              <div className="relative px-9 sm:px-14 py-7 sm:py-9 rounded-[28px] bg-gradient-to-b from-[#101C36]/95 to-[#080E1C]/95 border border-[#6F9BFF]/25 shadow-[inset_0_1px_0_rgba(214,230,255,0.22),0_26px_64px_-24px_rgba(2,8,24,0.9)] overflow-hidden">
                {/* Architectural precision corner brackets */}
                <span aria-hidden="true" className="absolute top-3 start-3 w-3.5 h-3.5 border-t border-s border-[#6F9BFF]/70 rounded-tl-[3px]" />
                <span aria-hidden="true" className="absolute top-3 end-3 w-3.5 h-3.5 border-t border-e border-[#6F9BFF]/70 rounded-tr-[3px]" />
                <span aria-hidden="true" className="absolute bottom-3 start-3 w-3.5 h-3.5 border-b border-s border-[#28CF77]/70 rounded-bl-[3px]" />
                <span aria-hidden="true" className="absolute bottom-3 end-3 w-3.5 h-3.5 border-b border-e border-[#28CF77]/70 rounded-br-[3px]" />

                {/* Dual-Layer Volumetric Logo Elevation Fill (mix-blend-screen eliminates any dark box edge) */}
                <div className="relative w-[170px] sm:w-[228px] lg:w-[258px] aspect-[3.4/1] flex items-center justify-center">
                  {/* Layer 1: Quiet architectural blueprint silhouette */}
                  <img
                    src={ASSETS.brandLogoHorizontal}
                    alt=""
                    aria-hidden="true"
                    draggable={false}
                    className="w-full h-full object-contain opacity-[0.18] mix-blend-screen select-none"
                  />

                  {/* Layer 2: Illuminated ISB logo rising smoothly from foundation to crown */}
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{
                      clipPath: `inset(${logoTopInsetPct}% 0% 0% 0%)`,
                      WebkitClipPath: `inset(${logoTopInsetPct}% 0% 0% 0%)`,
                    }}
                  >
                    <img
                      src={ASSETS.brandLogoHorizontal}
                      alt={isRtl ? 'گروه ISB' : 'ISB Group'}
                      draggable={false}
                      className="w-full h-full object-contain mix-blend-screen select-none brightness-110"
                    />
                  </div>

                  {/* Luminous Cobalt-Emerald Elevation Datum Line sweeping upward across the mark */}
                  {progress > 0.02 && progress < 0.99 && (
                    <div
                      aria-hidden="true"
                      style={{ top: `${logoTopInsetPct}%` }}
                      className="pointer-events-none absolute inset-x-[-18px] h-[1.5px] bg-gradient-to-r from-transparent via-[#6F9BFF] to-transparent shadow-[0_0_18px_rgba(111,155,255,0.95)]"
                    />
                  )}
                </div>
              </div>

              {/* Clean Subtitle synced seamlessly to Active Stage (zero empty gap) */}
              <div className="relative h-6 w-full flex items-center justify-center">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.p
                    key={activeStageIndex}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.22, ease: ARCHITECTURAL_EASE }}
                    className="text-sm sm:text-[15px] rtl:font-light text-[#E4E2DA] text-center whitespace-nowrap"
                  >
                    {stageLabels[activeStageIndex].caption}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>

            {/* Calibrated Architectural Timeline & 3 Bespoke 3D Isometric Discipline Cards */}
            <div className="w-full max-w-[760px] space-y-5 sm:space-y-6">
              {/* Timeline Header: Stage Title & Tabular Percentage */}
              <div className="flex items-end justify-between gap-4 px-1">
                <div className="space-y-1">
                  <span className="block text-[11px] rtl:text-xs font-medium text-[#A2A7A3]">
                    {isRtl ? 'آماده‌سازی تجربه فضایی' : 'Preparing spatial experience'}
                  </span>
                  <div className="relative h-7 flex items-center">
                    <AnimatePresence mode="popLayout" initial={false}>
                      <motion.span
                        key={activeStageIndex}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.22, ease: ARCHITECTURAL_EASE }}
                        className="text-sm sm:text-base font-semibold rtl:font-bold text-[#F7F5F0] whitespace-nowrap"
                      >
                        {stageLabels[activeStageIndex].title}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                </div>

                {/* Precision Tabular Percentage Counter */}
                <div
                  className="ltr-inline flex items-baseline gap-0.5 font-mono font-numeric"
                  aria-live="polite"
                >
                  <span
                    className={`text-3xl sm:text-[40px] leading-none font-semibold tracking-tight transition-colors duration-300 ${
                      pctNumber === 100 ? 'text-[#28CF77]' : 'text-[#F5F8FC]'
                    }`}
                  >
                    {formattedPct}
                  </span>
                  <span className="text-xs sm:text-sm text-[#8B9DB7]">%</span>
                </div>
              </div>

              {/* Calibrated Master Progress Rail */}
              <div className="relative pt-1 pb-1">
                <div
                  role="progressbar"
                  aria-valuenow={pctNumber}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={isRtl ? 'درصد بارگذاری سایت' : 'Website loading progress'}
                  className="relative h-[3px] w-full rounded-full bg-white/[0.11] overflow-hidden"
                >
                  <div
                    className={`h-full w-full rounded-full will-change-transform ${
                      isRtl
                        ? 'origin-right bg-gradient-to-l from-[#3B68D6] via-[#00A651] to-[#6F9BFF]'
                        : 'origin-left bg-gradient-to-r from-[#3B68D6] via-[#00A651] to-[#6F9BFF]'
                    }`}
                    style={{ transform: `scaleX(${Math.max(0.015, progress)})` }}
                  />
                </div>

                {/* Drafting Elevation Ruler Ticks */}
                <div
                  aria-hidden="true"
                  className="mt-2.5 flex items-center justify-between px-0.5 opacity-45"
                >
                  {Array.from({ length: 25 }).map((_, idx) => (
                    <span
                      key={idx}
                      className={`w-px rounded-full ${
                        idx % 6 === 0 ? 'h-2 bg-[#6F9BFF]' : 'h-1 bg-white/55'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Three Bespoke 3D Isometric Milestone Medallions */}
              <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
                {PRELOADER_MILESTONES.map((milestone, idx) => {
                  const localFill = computeStageLocalProgress(progress, milestone.index);
                  const state: 'idle' | 'active' | 'complete' =
                    localFill >= 1 ? 'complete' : localFill > 0 ? 'active' : 'idle';
                  const copy = stageLabels[milestone.index];

                  return (
                    <div
                      key={milestone.slug}
                      data-milestone={milestone.slug}
                      data-state={state}
                      className={`relative rounded-2xl p-3 sm:p-4 flex flex-col items-center text-center gap-2 sm:gap-2.5 transition-all duration-300 border overflow-hidden ${
                        state === 'active'
                          ? 'bg-gradient-to-br from-[#223A87]/[0.38] via-[#00A651]/[0.12] to-[#0B1222]/92 border-[#6F9BFF]/55 shadow-[inset_0_1px_0_rgba(214,230,255,0.28),0_20px_48px_-18px_rgba(12,26,74,0.85)] -translate-y-0.5'
                          : state === 'complete'
                            ? 'bg-gradient-to-b from-[#223A87]/[0.20] to-white/[0.025] border-[#28CF77]/42 shadow-[inset_0_1px_0_rgba(214,230,255,0.20),0_16px_38px_-20px_rgba(2,8,24,0.8)]'
                            : 'bg-white/[0.02] border-white/[0.08] opacity-55'
                      }`}
                    >
                      {/* Subtle discipline spotlight glow inside active/complete card */}
                      {state !== 'idle' && (
                        <div
                          aria-hidden="true"
                          style={{
                            background: `radial-gradient(circle at 50% 48%, ${milestone.accentHex}24 0%, transparent 72%)`,
                          }}
                          className="pointer-events-none absolute inset-0"
                        />
                      )}

                      {/* Top index + localized fill hairline */}
                      <div className="relative z-10 w-full flex items-center justify-between gap-2">
                        <span
                          className="ltr-inline text-[10px] sm:text-[11px] font-mono font-numeric font-medium"
                          style={{
                            color: state === 'idle' ? '#A2A7A3' : milestone.accentHex,
                          }}
                        >
                          {milestone.code}
                        </span>
                        <div className="flex-1 h-[2px] rounded-full bg-white/10 overflow-hidden">
                          <div
                            className={`h-full w-full will-change-transform ${
                              isRtl ? 'origin-right' : 'origin-left'
                            }`}
                            style={{
                              backgroundColor: milestone.accentHex,
                              transform: `scaleX(${localFill})`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Bespoke 3D Isometric Sculpture */}
                      <div className="relative z-10 py-1 flex items-center justify-center">
                        {idx === 0 && (
                          <IsometricArchitectureIcon state={state} fillRatio={localFill} />
                        )}
                        {idx === 1 && (
                          <IsometricEnergyIcon state={state} fillRatio={localFill} />
                        )}
                        {idx === 2 && (
                          <IsometricStructureIcon state={state} fillRatio={localFill} />
                        )}
                      </div>

                      {/* Discipline Title */}
                      <span
                        className={`relative z-10 text-[11px] sm:text-[13px] font-medium rtl:font-semibold leading-snug transition-colors duration-300 ${
                          state === 'idle' ? 'text-[#A2A7A3]' : 'text-[#F7F5F0]'
                        }`}
                      >
                        {copy.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quiet Editorial Footer Anchor */}
          <div className="relative z-10 max-w-[1380px] w-full mx-auto px-6 sm:px-11 lg:px-14 pb-6 sm:pb-9 flex items-center justify-center">
            <p className="text-[11px] rtl:text-xs text-[#A2A7A3]/85 text-center">
              {isRtl
                ? 'خلق بناهای ماندگار؛ در تلاقی معماری، اقلیم و مهندسی پایدار'
                : 'Crafting Enduring Architecture Where Climate Meets Sustainable Engineering'}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
