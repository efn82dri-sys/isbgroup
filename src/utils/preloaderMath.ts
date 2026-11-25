export type PreloaderPhase = 'loading' | 'settling' | 'exiting' | 'done';

export interface PreloaderMilestone {
  index: 0 | 1 | 2;
  code: '01' | '02' | '03';
  slug: 'architecture-urbanism' | 'energy-mep' | 'structure-seismic';
  start: number;
  end: number;
  accentHex: string;
}

export const PRELOADER_MILESTONES: readonly PreloaderMilestone[] = [
  {
    index: 0,
    code: '01',
    slug: 'architecture-urbanism',
    start: 0,
    end: 0.34,
    accentHex: '#6F9BFF',
  },
  {
    index: 1,
    code: '02',
    slug: 'energy-mep',
    start: 0.34,
    end: 0.68,
    accentHex: '#28CF77',
  },
  {
    index: 2,
    code: '03',
    slug: 'structure-seismic',
    start: 0.68,
    end: 1,
    accentHex: '#93BCFF',
  },
] as const;

export interface LoaderTimingConfig {
  minDurationMs: number;
  maxWaitMs: number;
  holdCapBeforeReady: number;
}

export const DEFAULT_LOADER_TIMING: LoaderTimingConfig = {
  minDurationMs: 2600,
  maxWaitMs: 4200,
  holdCapBeforeReady: 0.88,
};

export function clampUnit(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/**
 * Advances virtual timeline clock with a per-frame delta cap so initial hydration
 * or asset-decode main-thread stalls never jump past visible timeline milestones.
 */
export function stepVirtualElapsed(
  prevElapsedMs: number,
  deltaMs: number,
  maxStepMs = 110
): number {
  const safePrev = Math.max(0, Number.isFinite(prevElapsedMs) ? prevElapsedMs : 0);
  const safeDelta = Number.isFinite(deltaMs) ? Math.max(0, deltaMs) : 0;
  return safePrev + Math.min(safeDelta, maxStepMs);
}

/**
 * Architectural S-curve easing for calibrated timeline fill:
 * deliberate start, poised momentum through the middle, weighted settle near 100%.
 */
export function architecturalProgressEase(t: number): number {
  const x = clampUnit(t);
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
}

/**
 * Computes normalized progress [0..1] based on elapsed time and whether real
 * fonts/hero assets are ready, smoothly holding at `holdCapBeforeReady` until
 * assets arrive (or `maxWaitMs` failsafe elapses).
 */
export function computeTimelineProgress(
  elapsedMs: number,
  assetsReady: boolean,
  config: LoaderTimingConfig = DEFAULT_LOADER_TIMING
): number {
  const safeElapsed = Math.max(0, elapsedMs);
  const rawTimeProgress = clampUnit(safeElapsed / Math.max(1, config.minDurationMs));
  const eased = architecturalProgressEase(rawTimeProgress);

  if (assetsReady || safeElapsed >= config.maxWaitMs) {
    return eased;
  }

  return Math.min(eased, config.holdCapBeforeReady);
}

/**
 * Returns the active discipline milestone index (0, 1, or 2) for a given progress [0..1].
 */
export function computeActiveStageIndex(progress: number): 0 | 1 | 2 {
  const p = clampUnit(progress);
  if (p < PRELOADER_MILESTONES[1].start) return 0;
  if (p < PRELOADER_MILESTONES[2].start) return 1;
  return 2;
}

/**
 * Computes how filled [0..1] a specific milestone segment is at the overall timeline progress.
 */
export function computeStageLocalProgress(progress: number, stageIndex: 0 | 1 | 2): number {
  const p = clampUnit(progress);
  const milestone = PRELOADER_MILESTONES[stageIndex];
  if (p <= milestone.start) return 0;
  if (p >= milestone.end) return 1;
  return (p - milestone.start) / (milestone.end - milestone.start);
}

/**
 * Returns the top clip-path inset percentage [100 -> 0] for bottom-to-top
 * architectural elevation filling of the ISB brand mark.
 */
export function computeLogoTopInsetPct(progress: number): number {
  const p = clampUnit(progress);
  return Math.round((1 - p) * 1000) / 10;
}

/**
 * Allows automated tests or explicit deep-link parameters (?autostart=1 / ?skipLoader=1)
 * to bypass the intro preloader immediately.
 */
export function shouldBypassPreloader(search: string): boolean {
  if (!search) return false;
  const params = new URLSearchParams(search);
  return params.get('autostart') === '1' || params.get('skipLoader') === '1';
}
