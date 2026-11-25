/**
 * Pure mathematical helpers and signature easing curves for ISB Group's
 * 3D architectural motion language. Kept framework-free for deterministic unit testing.
 */

export const ARCHITECTURAL_EASE = [0.22, 1, 0.36, 1] as const;
export const HEAVY_SETTLE_EASE = [0.16, 1, 0.3, 1] as const;

export const SEISMIC_SPRING = {
  type: 'spring' as const,
  mass: 1.35,
  stiffness: 120,
  damping: 24,
};

export const TILT_SPRING = {
  stiffness: 170,
  damping: 24,
  mass: 0.7,
};

export const MAGNETIC_SPRING = {
  stiffness: 210,
  damping: 22,
  mass: 0.6,
};

export function clampUnit(value: number, min = -1, max = 1): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(max, Math.max(min, value));
}

/**
 * Computes conservative 3D perspective tilt angles (in degrees) from normalized
 * pointer coordinates in [-1, 1] relative to a card's center.
 * Positive relX tilts right edge away slightly (rotateY > 0);
 * Positive relY tilts bottom edge away slightly (rotateX < 0).
 */
export function computeTiltAngles(
  relX: number,
  relY: number,
  maxTiltDeg = 5.5
): { rotateX: number; rotateY: number } {
  const x = clampUnit(relX, -1, 1);
  const y = clampUnit(relY, -1, 1);
  const clampedMax = Math.max(0, Math.min(12, maxTiltDeg));
  const rotateX = Number((-y * clampedMax).toFixed(3));
  const rotateY = Number((x * clampedMax).toFixed(3));
  return {
    rotateX: Object.is(rotateX, -0) ? 0 : rotateX,
    rotateY: Object.is(rotateY, -0) ? 0 : rotateY,
  };
}

/**
 * Computes the percentage focal coordinates (0..100) for a glass surface's
 * specular reflection highlight based on normalized pointer position in [-1, 1].
 */
export function computeSpecularPosition(
  relX: number,
  relY: number
): { xPct: number; yPct: number } {
  const x = clampUnit(relX, -1, 1);
  const y = clampUnit(relY, -1, 1);
  return {
    xPct: Number(((x + 1) * 50).toFixed(2)),
    yPct: Number(((y + 1) * 50).toFixed(2)),
  };
}

/**
 * Computes a subtle, restrained magnetic translation offset (in px) for
 * tactile glass buttons from normalized pointer offsets in [-1, 1].
 */
export function computeMagneticOffset(
  relX: number,
  relY: number,
  maxOffsetPx = 5
): { x: number; y: number } {
  const x = clampUnit(relX, -1, 1);
  const y = clampUnit(relY, -1, 1);
  const limit = Math.max(0, Math.min(14, maxOffsetPx));
  const outX = Number((x * limit).toFixed(2));
  const outY = Number((y * limit).toFixed(2));
  return {
    x: Object.is(outX, -0) ? 0 : outX,
    y: Object.is(outY, -0) ? 0 : outY,
  };
}
