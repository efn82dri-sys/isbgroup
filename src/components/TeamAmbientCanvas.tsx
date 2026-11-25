import React, { useEffect, useRef } from 'react';
import type { DisciplineSlug } from '../types/content';

interface TeamAmbientCanvasProps {
  activeSlug: DisciplineSlug | null;
  className?: string;
}

interface NodeParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  phase: number;
  isEmerald: boolean;
}

function getAccentRgb(slug: DisciplineSlug | null): [number, number, number] {
  if (slug === 'energy-mep') return [0, 196, 102];
  if (slug === 'structure-seismic') return [134, 180, 255];
  if (slug === 'architecture-urbanism') return [82, 134, 255];
  return [48, 122, 224];
}

/**
 * Living parametric architectural backdrop for the Team Constellation stage.
 * Renders layered fluid silk-contour elevation ribbons, volumetric ambient lighting,
 * and subtle constellation nodes that react softly to pointer motion.
 * Automatically pauses when offscreen and renders a crisp static frame under reduced motion.
 */
export function TeamAmbientCanvas({ activeSlug, className = '' }: TeamAmbientCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeSlugRef = useRef<DisciplineSlug | null>(activeSlug);
  const pointerRef = useRef<{ x: number; y: number; active: boolean }>({
    x: 0.5,
    y: 0.35,
    active: false,
  });

  useEffect(() => {
    activeSlugRef.current = activeSlug;
  }, [activeSlug]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = 1200;
    let height = 760;
    let dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let rafId: number | null = null;
    let isVisible = true;

    const smoothRgb: [number, number, number] = [48, 122, 224];
    const smoothPointer = { x: 0.5, y: 0.35 };

    // Deterministic architectural node constellation
    const nodes: NodeParticle[] = Array.from({ length: 28 }, (_, i) => {
      const seed = (i + 1) * 1.6180339;
      return {
        x: ((seed * 37.3) % 1),
        y: ((seed * 61.7) % 1),
        vx: (Math.sin(seed * 11) * 0.00018),
        vy: (Math.cos(seed * 17) * 0.00014),
        radius: 1.1 + (i % 3) * 0.65,
        phase: seed * Math.PI * 2,
        isEmerald: i % 3 === 1,
      };
    });

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const drawFrame = (timeMs: number) => {
      const t = timeMs * 0.00042;
      const targetRgb = getAccentRgb(activeSlugRef.current);
      smoothRgb[0] += (targetRgb[0] - smoothRgb[0]) * 0.045;
      smoothRgb[1] += (targetRgb[1] - smoothRgb[1]) * 0.045;
      smoothRgb[2] += (targetRgb[2] - smoothRgb[2]) * 0.045;

      const targetPx = pointerRef.current.active ? pointerRef.current.x : 0.5 + Math.sin(t * 0.7) * 0.08;
      const targetPy = pointerRef.current.active ? pointerRef.current.y : 0.32 + Math.cos(t * 0.55) * 0.05;
      smoothPointer.x += (targetPx - smoothPointer.x) * 0.05;
      smoothPointer.y += (targetPy - smoothPointer.y) * 0.05;

      ctx.clearRect(0, 0, width, height);

      // 1. Deep Volumetric Architectural Aurora Blooms
      const [ar, ag, ab] = smoothRgb.map((c) => Math.round(c));

      const apexGlow = ctx.createRadialGradient(
        width * 0.5,
        height * 0.24,
        10,
        width * 0.5,
        height * 0.24,
        Math.max(width * 0.46, 360)
      );
      apexGlow.addColorStop(0, `rgba(${ar}, ${ag}, ${ab}, 0.24)`);
      apexGlow.addColorStop(0.42, 'rgba(34, 58, 135, 0.13)');
      apexGlow.addColorStop(1, 'rgba(6, 11, 22, 0)');
      ctx.fillStyle = apexGlow;
      ctx.fillRect(0, 0, width, height);

      const emeraldAura = ctx.createRadialGradient(
        width * smoothPointer.x,
        height * smoothPointer.y,
        0,
        width * smoothPointer.x,
        height * smoothPointer.y,
        Math.max(width * 0.34, 280)
      );
      emeraldAura.addColorStop(0, 'rgba(0, 166, 81, 0.14)');
      emeraldAura.addColorStop(0.5, 'rgba(40, 207, 119, 0.04)');
      emeraldAura.addColorStop(1, 'rgba(6, 11, 22, 0)');
      ctx.fillStyle = emeraldAura;
      ctx.fillRect(0, 0, width, height);

      // 2. Layered Fluid Parametric Topographic Silk Ribbons
      const ribbonCount = 13;
      const stepX = Math.max(24, Math.floor(width / 44));
      for (let r = 0; r < ribbonCount; r++) {
        const ratio = r / (ribbonCount - 1);
        const baseY = height * (0.14 + ratio * 0.78);
        const ampA = 16 + Math.sin(ratio * Math.PI) * 28;
        const ampB = 9 + (r % 3) * 6;
        const freqA = 0.0028 + ratio * 0.0014;
        const freqB = 0.0062 - ratio * 0.0011;
        const phase = r * 0.52;

        ctx.beginPath();
        for (let x = -20; x <= width + 20; x += stepX) {
          const normX = x / Math.max(width, 1);
          const pointerDist = Math.abs(normX - smoothPointer.x);
          const pointerLift = Math.exp(-pointerDist * pointerDist * 10) * (smoothPointer.y - 0.5) * 24;

          const y =
            baseY +
            Math.sin(x * freqA + t * (1.1 + ratio * 0.35) + phase) * ampA +
            Math.cos(x * freqB - t * 0.85 + phase * 1.4) * ampB +
            pointerLift;

          if (x === -20) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        const strokeGrad = ctx.createLinearGradient(0, baseY, width, baseY);
        const isEmeraldRibbon = r % 3 === 1;
        const alpha = isEmeraldRibbon ? 0.25 : 0.21;
        strokeGrad.addColorStop(0, 'rgba(34, 58, 135, 0)');
        strokeGrad.addColorStop(
          0.22,
          isEmeraldRibbon
            ? `rgba(40, 207, 119, ${alpha})`
            : `rgba(${ar}, ${ag}, ${ab}, ${alpha})`
        );
        strokeGrad.addColorStop(
          0.5,
          isEmeraldRibbon
            ? `rgba(128, 245, 182, ${alpha + 0.14})`
            : `rgba(164, 202, 255, ${alpha + 0.11})`
        );
        strokeGrad.addColorStop(
          0.78,
          isEmeraldRibbon
            ? `rgba(0, 166, 81, ${alpha})`
            : `rgba(91, 135, 238, ${alpha})`
        );
        strokeGrad.addColorStop(1, 'rgba(34, 58, 135, 0)');

        ctx.strokeStyle = strokeGrad;
        ctx.lineWidth = r === 4 || r === 6 || r === 8 ? 1.6 : 0.95;
        ctx.stroke();
      }

      // 3. Subtle Floating Constellation Nodes & Hairline Filaments
      const pxCoords = nodes.map((n) => {
        if (!prefersReduced) {
          n.x += n.vx;
          n.y += n.vy;
          if (n.x < 0.02 || n.x > 0.98) n.vx *= -1;
          if (n.y < 0.04 || n.y > 0.96) n.vy *= -1;
        }
        return {
          x: n.x * width,
          y: n.y * height,
          r: n.radius,
          phase: n.phase,
          isEmerald: n.isEmerald,
        };
      });

      const linkDist = Math.min(width * 0.15, 175);
      for (let i = 0; i < pxCoords.length; i++) {
        const a = pxCoords[i];
        for (let j = i + 1; j < pxCoords.length; j++) {
          const b = pxCoords[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < linkDist) {
            const strength = (1 - dist / linkDist) * 0.2;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle =
              a.isEmerald || b.isEmerald
                ? `rgba(40, 207, 119, ${strength.toFixed(3)})`
                : `rgba(147, 188, 255, ${strength.toFixed(3)})`;
            ctx.lineWidth = 0.75;
            ctx.stroke();
          }
        }
      }

      for (const node of pxCoords) {
        const shimmer = 0.5 + 0.38 * Math.sin(t * 2.2 + node.phase);
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
        ctx.fillStyle = node.isEmerald
          ? `rgba(40, 207, 119, ${shimmer.toFixed(3)})`
          : `rgba(162, 198, 255, ${shimmer.toFixed(3)})`;
        ctx.fill();
      }
    };

    resize();

    const resizeObserver = new ResizeObserver(() => {
      resize();
      if (prefersReduced) {
        drawFrame(2400);
      }
    });
    resizeObserver.observe(canvas);

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0]?.isIntersecting ?? true;
        if (isVisible && !prefersReduced && rafId === null) {
          rafId = window.requestAnimationFrame(loop);
        }
      },
      { threshold: 0.02 }
    );
    intersectionObserver.observe(canvas);

    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      pointerRef.current = {
        x: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
        y: Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)),
        active: true,
      };
    };

    const handlePointerLeave = () => {
      pointerRef.current.active = false;
    };

    const parent = canvas.parentElement;
    parent?.addEventListener('pointermove', handlePointerMove, { passive: true });
    parent?.addEventListener('pointerleave', handlePointerLeave, { passive: true });

    let lastRender = 0;
    const loop = (now: number) => {
      if (!isVisible) {
        rafId = null;
        return;
      }
      if (now - lastRender >= 34) {
        lastRender = now;
        drawFrame(now);
      }
      rafId = window.requestAnimationFrame(loop);
    };

    if (prefersReduced) {
      drawFrame(2400);
    } else {
      rafId = window.requestAnimationFrame(loop);
    }

    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      parent?.removeEventListener('pointermove', handlePointerMove);
      parent?.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      data-testid="team-ambient-canvas"
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 w-full h-full ${className}`}
    />
  );
}
