import React, { useRef, useState } from 'react';
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'motion/react';
import {
  ARCHITECTURAL_EASE,
  HEAVY_SETTLE_EASE,
  MAGNETIC_SPRING,
  SEISMIC_SPRING,
  TILT_SPRING,
  computeMagneticOffset,
  computeSpecularPosition,
  computeTiltAngles,
} from '../utils/motionMath';

export type RevealVariant =
  | 'elevation'
  | 'thermal'
  | 'seismic'
  | 'aperture'
  | 'slide-start'
  | 'float';

interface ArchitecturalRevealProps {
  children: React.ReactNode;
  variant?: RevealVariant;
  delay?: number;
  isRtl?: boolean;
  className?: string;
}

/**
 * Subject-tailored architectural entrance choreography:
 * - elevation: rises smoothly upright with subtle 3D perspective pitch (Architecture & Urbanism)
 * - thermal: diagonal light-glide entrance with gentle scale expansion (Energy & MEP)
 * - seismic: high-mass damped structural settle with zero bounce (Structure & Seismic)
 * - aperture: editorial vertical frame unveil (Selected Projects)
 * - slide-start: weighted lateral arrival respecting LTR/RTL reading direction (Team / Intro)
 * - float: calm vertical glass float (Lab / Contact)
 */
export function ArchitecturalReveal({
  children,
  variant = 'float',
  delay = 0,
  isRtl = false,
  className = '',
}: ArchitecturalRevealProps) {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  const startX = isRtl ? 36 : -36;

  const variantsMap: Record<
    RevealVariant,
    {
      initial: Record<string, string | number>;
      whileInView: Record<string, string | number>;
      transition: Record<string, unknown>;
    }
  > = {
    elevation: {
      initial: { opacity: 0, y: 42, rotateX: 8, scale: 0.975 },
      whileInView: { opacity: 1, y: 0, rotateX: 0, scale: 1 },
      transition: { duration: 0.9, delay, ease: ARCHITECTURAL_EASE },
    },
    thermal: {
      initial: { opacity: 0, y: 28, scale: 0.97 },
      whileInView: { opacity: 1, y: 0, scale: 1 },
      transition: { duration: 0.78, delay, ease: HEAVY_SETTLE_EASE },
    },
    seismic: {
      initial: { opacity: 0, y: 48, scale: 0.97 },
      whileInView: { opacity: 1, y: 0, scale: 1 },
      transition: { ...SEISMIC_SPRING, delay },
    },
    aperture: {
      initial: {
        opacity: 0,
        y: 32,
        clipPath: 'inset(10% 0% 0% 0% round 24px)',
      },
      whileInView: {
        opacity: 1,
        y: 0,
        clipPath: 'inset(0% 0% 0% 0% round 24px)',
      },
      transition: { duration: 0.92, delay, ease: HEAVY_SETTLE_EASE },
    },
    'slide-start': {
      initial: { opacity: 0, x: startX, y: 12 },
      whileInView: { opacity: 1, x: 0, y: 0 },
      transition: { duration: 0.88, delay, ease: ARCHITECTURAL_EASE },
    },
    float: {
      initial: { opacity: 0, y: 30, scale: 0.985 },
      whileInView: { opacity: 1, y: 0, scale: 1 },
      transition: { duration: 0.82, delay, ease: ARCHITECTURAL_EASE },
    },
  };

  const config = variantsMap[variant];

  return (
    <motion.div
      initial={config.initial}
      whileInView={config.whileInView}
      viewport={{ once: true, amount: 0.18 }}
      transition={config.transition}
      style={variant === 'elevation' ? { transformPerspective: 1100 } : undefined}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export type TiltTheme = 'architecture' | 'energy' | 'structure' | 'project';

interface ArchitecturalTiltCardProps {
  children: React.ReactNode;
  theme?: TiltTheme;
  maxTilt?: number;
  className?: string;
}

/**
 * Tactile 3D glass surface with spring-damped perspective tilt, live specular light refraction,
 * and subject-specific architectural micro-accents:
 * - architecture: warm champagne specular sweep + subtle elevation shadow depth
 * - energy: olive-gold thermal luminescence gradient reacting to pointer coordinates
 * - structure: crisp structural drafting corner brackets illuminating on hover
 * - project: refined gallery rim gleam
 */
export function ArchitecturalTiltCard({
  children,
  theme = 'project',
  maxTilt = 5,
  className = '',
}: ArchitecturalTiltCardProps) {
  const prefersReduced = useReducedMotion();
  const isTouchPrimary =
    typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches;
  const containerRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  const rawRotateX = useMotionValue(0);
  const rawRotateY = useMotionValue(0);
  const rawSpecX = useMotionValue(50);
  const rawSpecY = useMotionValue(30);

  const rotateX = useSpring(rawRotateX, TILT_SPRING);
  const rotateY = useSpring(rawRotateY, TILT_SPRING);
  const specX = useSpring(rawSpecX, { stiffness: 180, damping: 28 });
  const specY = useSpring(rawSpecY, { stiffness: 180, damping: 28 });

  const sheenColor =
    theme === 'energy'
      ? 'rgba(0, 166, 81, 0.24)'
      : theme === 'structure'
        ? 'rgba(111, 155, 255, 0.24)'
        : 'rgba(66, 114, 232, 0.22)';

  const specularBg = useMotionTemplate`radial-gradient(360px circle at ${specX}% ${specY}%, ${sheenColor}, transparent 68%)`;

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (prefersReduced || e.pointerType === 'touch') return;
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const relX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const relY = ((e.clientY - rect.top) / rect.height) * 2 - 1;

    const { rotateX: rx, rotateY: ry } = computeTiltAngles(relX, relY, maxTilt);
    const { xPct, yPct } = computeSpecularPosition(relX, relY);

    rawRotateX.set(rx);
    rawRotateY.set(ry);
    rawSpecX.set(xPct);
    rawSpecY.set(yPct);
  };

  const handlePointerLeave = () => {
    setHovered(false);
    rawRotateX.set(0);
    rawRotateY.set(0);
    rawSpecX.set(50);
    rawSpecY.set(30);
  };

  if (prefersReduced || isTouchPrimary) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={containerRef}
      onPointerEnter={() => setHovered(true)}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={{
        transformPerspective: 1100,
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      className={`relative will-change-transform ${className}`}
    >
      {children}

      {/* Live Frosted Glass Specular Reflection Layer */}
      <motion.div
        aria-hidden="true"
        style={{ background: specularBg }}
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.35, ease: ARCHITECTURAL_EASE }}
        className="pointer-events-none absolute inset-0 z-20 rounded-[inherit] mix-blend-screen"
      />

      {/* Subject-specific structural drafting brackets for Structure & Seismic */}
      {theme === 'structure' && (
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-2.5 z-20 transition-opacity duration-300 ${
            hovered ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <span className="absolute top-0 start-0 w-3.5 h-3.5 border-t border-s border-[#7DA3FF]/75 rounded-tl-sm" />
          <span className="absolute top-0 end-0 w-3.5 h-3.5 border-t border-e border-[#7DA3FF]/75 rounded-tr-sm" />
          <span className="absolute bottom-0 start-0 w-3.5 h-3.5 border-b border-s border-[#7DA3FF]/75 rounded-bl-sm" />
          <span className="absolute bottom-0 end-0 w-3.5 h-3.5 border-b border-e border-[#7DA3FF]/75 rounded-br-sm" />
        </div>
      )}
    </motion.div>
  );
}

interface MagneticWrapperProps {
  children: React.ReactNode;
  maxOffset?: number;
  className?: string;
}

/**
 * Restrained tactile magnetic pull for primary luxury CTAs.
 */
export function MagneticWrapper({
  children,
  maxOffset = 4.5,
  className = 'inline-block',
}: MagneticWrapperProps) {
  const prefersReduced = useReducedMotion();
  const isTouchPrimary =
    typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches;
  const ref = useRef<HTMLDivElement>(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, MAGNETIC_SPRING);
  const y = useSpring(rawY, MAGNETIC_SPRING);

  if (prefersReduced || isTouchPrimary) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      style={{ x, y }}
      onPointerMove={(e) => {
        if (e.pointerType === 'touch') return;
        const rect = ref.current?.getBoundingClientRect();
        if (!rect || rect.width === 0 || rect.height === 0) return;
        const relX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const relY = ((e.clientY - rect.top) / rect.height) * 2 - 1;
        const offset = computeMagneticOffset(relX, relY, maxOffset);
        rawX.set(offset.x);
        rawY.set(offset.y);
      }}
      onPointerLeave={() => {
        rawX.set(0);
        rawY.set(0);
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Precision engineering progress bar that calibrates smoothly into view for
 * ISB Sustainability Lab metrics.
 */
export function CalibratedProgressBar({
  pct,
  delay = 0,
}: {
  pct: number;
  delay?: number;
}) {
  const prefersReduced = useReducedMotion();
  const targetWidth = `${Math.max(0, Math.min(100, pct))}%`;

  if (prefersReduced) {
    return (
      <div className="h-1.5 w-full rounded-full bg-white/12 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#223A87] via-[#00A651] to-[#28CF77]"
          style={{ width: targetWidth }}
        />
      </div>
    );
  }

  return (
    <div className="h-1.5 w-full rounded-full bg-white/12 overflow-hidden">
      <motion.div
        initial={{ width: '0%' }}
        whileInView={{ width: targetWidth }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 1.15, delay, ease: HEAVY_SETTLE_EASE }}
        className="h-full rounded-full bg-gradient-to-r from-[#223A87] via-[#00A651] to-[#28CF77]"
      />
    </div>
  );
}

/**
 * Subtle one-shot solar/thermal blueprint sweep over the Sustainability Lab axonometric render.
 */
export function AxonometricScanOverlay() {
  const prefersReduced = useReducedMotion();
  if (prefersReduced) return null;

  return (
    <motion.div
      aria-hidden="true"
      initial={{ x: '-120%', opacity: 0 }}
      whileInView={{ x: '130%', opacity: [0, 0.85, 0.85, 0] }}
      viewport={{ once: true, amount: 0.45 }}
      transition={{ duration: 1.5, delay: 0.3, ease: ARCHITECTURAL_EASE }}
      className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-[#00A651]/30 to-transparent skew-x-[-18deg]"
    />
  );
}

/**
 * Scroll-linked 3D window parallax container for full-bleed architectural photography
 * (e.g. Our Team studio backdrop).
 */
export function StudioParallaxBackdrop({
  backdrop,
  children,
  className = '',
}: {
  backdrop: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const prefersReduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], ['-7%', '7%']);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1.1, 1.06, 1.1]);

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      {prefersReduced ? (
        <div className="absolute inset-0">{backdrop}</div>
      ) : (
        <motion.div
          style={{ y, scale }}
          className="absolute -inset-y-10 inset-x-0 will-change-transform"
        >
          {backdrop}
        </motion.div>
      )}
      {children}
    </div>
  );
}

/**
 * Subtle scroll-linked ambient refraction canvas so glass panels refract slowly shifting
 * warm champagne & olive studio light as the viewer moves through the 3D site.
 */
export function AmbientLightField() {
  const prefersReduced = useReducedMotion();
  const isCompactViewport =
    typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;
  const staticOrbs = prefersReduced || isCompactViewport;
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 70, damping: 24, mass: 0.8 });

  const topOrbY = useTransform(smoothProgress, [0, 1], [0, -140]);
  const midOrbY = useTransform(smoothProgress, [0, 1], [0, 120]);
  const botOrbY = useTransform(smoothProgress, [0, 1], [0, -90]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden contain-strict"
    >
      <motion.div
        style={{
          ...(staticOrbs ? {} : { y: topOrbY }),
          background:
            'radial-gradient(circle, rgba(34,58,135,0.28) 0%, rgba(34,58,135,0.07) 44%, transparent 74%)',
        }}
        className="absolute -top-40 start-[-10%] w-[54rem] h-[54rem] rounded-full will-change-transform"
      />
      <motion.div
        style={{
          ...(staticOrbs ? {} : { y: midOrbY }),
          background:
            'radial-gradient(circle, rgba(0,166,81,0.14) 0%, rgba(0,166,81,0.035) 45%, transparent 74%)',
        }}
        className="absolute top-[38%] end-[-12%] w-[50rem] h-[50rem] rounded-full will-change-transform"
      />
      <motion.div
        style={{
          ...(staticOrbs ? {} : { y: botOrbY }),
          background:
            'radial-gradient(circle, rgba(34,58,135,0.26) 0%, rgba(34,58,135,0.06) 46%, transparent 74%)',
        }}
        className="absolute bottom-[-18%] start-[22%] w-[48rem] h-[48rem] rounded-full will-change-transform"
      />
    </div>
  );
}

/**
 * Razor-thin weighted scroll-depth rail fixed at the very top edge of the viewport,
 * giving continuous spatial feedback as you glide through the 3D experience.
 */
export function ScrollDepthRail({ isRtl }: { isRtl: boolean }) {
  const prefersReduced = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 90, damping: 26, restDelta: 0.001 });

  if (prefersReduced) return null;

  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX }}
      className={`pointer-events-none fixed top-0 inset-x-0 z-50 h-[2px] will-change-transform ${
        isRtl
          ? 'origin-right bg-gradient-to-l from-[#3B68D6] via-[#00A651] to-[#6F9BFF]'
          : 'origin-left bg-gradient-to-r from-[#3B68D6] via-[#00A651] to-[#6F9BFF]'
      }`}
    />
  );
}
