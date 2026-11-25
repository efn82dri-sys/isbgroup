import React from 'react';
import type { DisciplineSlug } from '../types/content';

/**
 * Heavy bespoke architectural astrolabe & calibrated compass halo framing the CEO apex portrait.
 * Counter-rotating degree arcs, radial tick dial, and volumetric emerald-cobalt aura.
 */
export function CeoAstrolabeHalo() {
  const ticks = Array.from({ length: 36 }, (_, i) => i * 10);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 flex items-center justify-center select-none"
    >
      {/* Volumetric radial bloom behind portrait */}
      <div
        className="isb-halo-breathe absolute w-[276px] h-[276px] sm:w-[324px] sm:h-[324px] rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(0,166,81,0.34) 0%, rgba(34,58,135,0.28) 44%, rgba(8,13,22,0) 74%)',
        }}
      />

      <svg
        viewBox="0 0 320 320"
        fill="none"
        className="w-[248px] h-[248px] sm:w-[282px] sm:h-[282px] overflow-visible"
      >
        <defs>
          <linearGradient id="ceo-ring-outer" x1="20" y1="20" x2="300" y2="300" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#28CF77" stopOpacity="0.92" />
            <stop offset="50%" stopColor="#6F9BFF" stopOpacity="0.38" />
            <stop offset="100%" stopColor="#28CF77" stopOpacity="0.82" />
          </linearGradient>
          <linearGradient id="ceo-ring-inner" x1="300" y1="40" x2="40" y2="280" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#93BCFF" stopOpacity="0.84" />
            <stop offset="50%" stopColor="#00A651" stopOpacity="0.24" />
            <stop offset="100%" stopColor="#6F9BFF" stopOpacity="0.78" />
          </linearGradient>
        </defs>

        {/* Fine static datum hairlines */}
        <circle cx="160" cy="160" r="150" stroke="rgba(147,188,255,0.16)" strokeWidth="0.75" />
        <circle cx="160" cy="160" r="122" stroke="rgba(40,207,119,0.22)" strokeWidth="0.85" />

        {/* Slow Clockwise Calibrated Outer Arc Ring */}
        <g className="isb-orbit-cw">
          <circle
            cx="160"
            cy="160"
            r="141"
            stroke="url(#ceo-ring-outer)"
            strokeWidth="1.6"
            strokeDasharray="82 34 24 42 114 40"
            strokeLinecap="round"
          />
          <circle cx="160" cy="19" r="3.6" fill="#28CF77" />
          <circle cx="301" cy="160" r="3" fill="#6F9BFF" />
          <circle cx="160" cy="301" r="2.6" fill="#28CF77" fillOpacity="0.8" />
        </g>

        {/* Slow Counter-Clockwise Precision Inner Compass Ring */}
        <g className="isb-orbit-ccw">
          <circle
            cx="160"
            cy="160"
            r="129"
            stroke="url(#ceo-ring-inner)"
            strokeWidth="1.1"
            strokeDasharray="20 14 56 22"
            strokeLinecap="round"
          />
          {ticks.map((deg) => {
            const rad = (deg * Math.PI) / 180;
            const isMajor = deg % 90 === 0;
            const r1 = isMajor ? 116 : 121;
            const r2 = 127;
            const x1 = 160 + Math.cos(rad) * r1;
            const y1 = 160 + Math.sin(rad) * r1;
            const x2 = 160 + Math.cos(rad) * r2;
            const y2 = 160 + Math.sin(rad) * r2;
            return (
              <line
                key={deg}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={isMajor ? '#28CF77' : 'rgba(147,188,255,0.42)'}
                strokeWidth={isMajor ? 1.6 : 0.8}
              />
            );
          })}
        </g>
      </svg>
    </div>
  );
}

/**
 * Fluid, organic multi-strand cubic-Bézier light rivers flowing downward from the CEO Apex
 * into the 3 sculpted Department Anchor Portals. Includes both desktop 3-way river fan
 * and mobile sculpted vertical luminous conduit.
 */
export function FluidBezierRiverManifold({
  isRtl,
  activeSlug,
}: {
  isRtl: boolean;
  activeSlug: DisciplineSlug | null;
}) {
  const leftSlug: DisciplineSlug = isRtl ? 'structure-seismic' : 'architecture-urbanism';
  const centerSlug: DisciplineSlug = 'energy-mep';
  const rightSlug: DisciplineSlug = isRtl ? 'architecture-urbanism' : 'structure-seismic';

  const colorFor = (slug: DisciplineSlug) =>
    slug === 'energy-mep'
      ? '#28CF77'
      : slug === 'structure-seismic'
        ? '#93BCFF'
        : '#6F9BFF';

  const leftColor = colorFor(leftSlug);
  const centerColor = colorFor(centerSlug);
  const rightColor = colorFor(rightSlug);

  const opacityFor = (slug: DisciplineSlug) =>
    activeSlug === null ? 0.88 : activeSlug === slug ? 1 : 0.24;

  const glowOpacityFor = (slug: DisciplineSlug) =>
    activeSlug === null ? 0.44 : activeSlug === slug ? 0.78 : 0.1;

  const widthFor = (slug: DisciplineSlug) => (activeSlug === slug ? 2.8 : 2);

  // All 3 rivers emerge cleanly from the sculpted Crown Nexus at (600, 28)
  const stemPath = 'M 600 0 L 600 28';

  const leftPath = 'M 600 28 C 510 74, 200 52, 200 150';
  const leftCompanionA = 'M 594 28 C 504 68, 190 54, 190 150';
  const leftCompanionB = 'M 606 30 C 518 82, 210 60, 210 150';

  const centerPath = 'M 600 28 L 600 150';
  const centerCompanionA = 'M 593 28 C 589 66, 589 108, 593 150';
  const centerCompanionB = 'M 607 28 C 611 66, 611 108, 607 150';

  const rightPath = 'M 600 28 C 690 74, 1000 52, 1000 150';
  const rightCompanionA = 'M 606 28 C 696 68, 1010 54, 1010 150';
  const rightCompanionB = 'M 594 30 C 682 82, 990 60, 990 150';

  return (
    <div
      data-testid="team-flow-manifold"
      dir="ltr"
      className="relative w-full select-none"
      aria-hidden="true"
    >
      {/* Mobile / Tablet Vertical Sculpted Luminous Conduit */}
      <div className="flex lg:hidden justify-center h-[58px] -my-1">
        <svg viewBox="0 0 120 58" fill="none" className="w-28 h-full overflow-visible">
          <defs>
            <linearGradient id="mobile-conduit-grad" x1="60" y1="0" x2="60" y2="58" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#28CF77" />
              <stop offset="100%" stopColor="#6F9BFF" />
            </linearGradient>
          </defs>
          <path d="M 60 0 L 60 58" stroke="#28CF77" strokeOpacity="0.16" strokeWidth="10" />
          <path d="M 52 0 C 48 22, 48 36, 52 58" stroke="#6F9BFF" strokeOpacity="0.28" strokeWidth="0.8" />
          <path d="M 68 0 C 72 22, 72 36, 68 58" stroke="#28CF77" strokeOpacity="0.28" strokeWidth="0.8" />
          <path d="M 60 0 L 60 58" stroke="url(#mobile-conduit-grad)" strokeWidth="2.2" />
          <path
            d="M 60 0 L 60 58"
            stroke="#E8FFF2"
            strokeWidth="2.2"
            strokeDasharray="16 80"
            className="isb-stream-pulse"
          />
          <circle cx="60" cy="29" r="9" fill="#060C18" stroke="#28CF77" strokeOpacity="0.65" strokeWidth="1" />
          <polygon points="60,24 65,29 60,34 55,29" fill="#28CF77" />
        </svg>
      </div>

      {/* Desktop Sweeping Multi-Strand Cubic-Bézier Energy Rivers */}
      <div className="hidden lg:block relative w-full h-[156px] -my-1">
        <svg
          viewBox="0 0 1200 156"
          fill="none"
          preserveAspectRatio="none"
          className="w-full h-full overflow-visible"
        >
          <defs>
            <linearGradient id="river-grad-left" x1="600" y1="28" x2="200" y2="150" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#28CF77" stopOpacity="0.95" />
              <stop offset="48%" stopColor="#6F9BFF" stopOpacity="0.92" />
              <stop offset="100%" stopColor={leftColor} stopOpacity="1" />
            </linearGradient>

            <linearGradient id="river-grad-center" x1="600" y1="28" x2="600" y2="150" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#6F9BFF" stopOpacity="0.92" />
              <stop offset="50%" stopColor="#00A651" stopOpacity="0.98" />
              <stop offset="100%" stopColor={centerColor} stopOpacity="1" />
            </linearGradient>

            <linearGradient id="river-grad-right" x1="600" y1="28" x2="1000" y2="150" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#28CF77" stopOpacity="0.95" />
              <stop offset="48%" stopColor="#6F9BFF" stopOpacity="0.92" />
              <stop offset="100%" stopColor={rightColor} stopOpacity="1" />
            </linearGradient>
          </defs>

          {/* Subtle sweeping architectural orbital arc */}
          <path
            d="M 60 124 Q 600 22 1140 124"
            stroke="rgba(147,188,255,0.16)"
            strokeWidth="1"
            strokeDasharray="3 6"
          />

          {/* Vertical Master Stem from CEO Apex into Crown Nexus */}
          <path d={stemPath} stroke="#28CF77" strokeOpacity="0.16" strokeWidth="14" />
          <path d={stemPath} stroke="#28CF77" strokeOpacity="0.34" strokeWidth="6" />
          <path d={stemPath} stroke="#28CF77" strokeWidth="2.4" />

          {/* LEFT STREAM — Pure multi-layer volumetric glow + companion strands + pulse */}
          <g style={{ opacity: opacityFor(leftSlug), transition: 'opacity 320ms ease' }}>
            <path d={leftPath} stroke={leftColor} strokeWidth="22" strokeOpacity={glowOpacityFor(leftSlug) * 0.16} strokeLinecap="round" />
            <path d={leftPath} stroke={leftColor} strokeWidth="11" strokeOpacity={glowOpacityFor(leftSlug) * 0.3} strokeLinecap="round" />
            <path d={leftPath} stroke={leftColor} strokeWidth="5.5" strokeOpacity={glowOpacityFor(leftSlug) * 0.45} strokeLinecap="round" />
            <path d={leftCompanionA} stroke={leftColor} strokeWidth="0.75" strokeOpacity="0.32" />
            <path d={leftCompanionB} stroke={leftColor} strokeWidth="0.75" strokeOpacity="0.26" />
            <path
              d={leftPath}
              stroke="url(#river-grad-left)"
              strokeWidth={widthFor(leftSlug)}
              strokeLinecap="round"
            />
            <path
              d={leftPath}
              stroke="#EAF4FF"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeDasharray="28 192"
              className="isb-stream-pulse"
            />
          </g>

          {/* CENTER STREAM */}
          <g style={{ opacity: opacityFor(centerSlug), transition: 'opacity 320ms ease' }}>
            <path d={centerPath} stroke={centerColor} strokeWidth="22" strokeOpacity={glowOpacityFor(centerSlug) * 0.16} strokeLinecap="round" />
            <path d={centerPath} stroke={centerColor} strokeWidth="11" strokeOpacity={glowOpacityFor(centerSlug) * 0.3} strokeLinecap="round" />
            <path d={centerPath} stroke={centerColor} strokeWidth="5.5" strokeOpacity={glowOpacityFor(centerSlug) * 0.45} strokeLinecap="round" />
            <path d={centerCompanionA} stroke={centerColor} strokeWidth="0.75" strokeOpacity="0.34" />
            <path d={centerCompanionB} stroke={centerColor} strokeWidth="0.75" strokeOpacity="0.34" />
            <path
              d={centerPath}
              stroke="url(#river-grad-center)"
              strokeWidth={widthFor(centerSlug)}
              strokeLinecap="round"
            />
            <path
              d={centerPath}
              stroke="#DEFFED"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeDasharray="26 194"
              className="isb-stream-pulse-slow"
            />
          </g>

          {/* RIGHT STREAM */}
          <g style={{ opacity: opacityFor(rightSlug), transition: 'opacity 320ms ease' }}>
            <path d={rightPath} stroke={rightColor} strokeWidth="22" strokeOpacity={glowOpacityFor(rightSlug) * 0.16} strokeLinecap="round" />
            <path d={rightPath} stroke={rightColor} strokeWidth="11" strokeOpacity={glowOpacityFor(rightSlug) * 0.3} strokeLinecap="round" />
            <path d={rightPath} stroke={rightColor} strokeWidth="5.5" strokeOpacity={glowOpacityFor(rightSlug) * 0.45} strokeLinecap="round" />
            <path d={rightCompanionA} stroke={rightColor} strokeWidth="0.75" strokeOpacity="0.32" />
            <path d={rightCompanionB} stroke={rightColor} strokeWidth="0.75" strokeOpacity="0.26" />
            <path
              d={rightPath}
              stroke="url(#river-grad-right)"
              strokeWidth={widthFor(rightSlug)}
              strokeLinecap="round"
            />
            <path
              d={rightPath}
              stroke="#EAF4FF"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeDasharray="28 192"
              className="isb-stream-pulse"
            />
          </g>

          {/* Sculpted Refractive Crown Nexus */}
          <circle cx="600" cy="28" r="19" fill="#060C18" fillOpacity="0.92" stroke="rgba(40,207,119,0.68)" strokeWidth="1.2" />
          <circle cx="600" cy="28" r="12" stroke="rgba(111,155,255,0.72)" strokeWidth="0.9" strokeDasharray="4 3" />
          <polygon points="600,20 608,28 600,36 592,28" fill="#28CF77" />

          {/* Docking Refractive Terminals */}
          {[
            { x: 200, color: leftColor, slug: leftSlug },
            { x: 600, color: centerColor, slug: centerSlug },
            { x: 1000, color: rightColor, slug: rightSlug },
          ].map((node) => (
            <g
              key={node.x}
              style={{ opacity: opacityFor(node.slug), transition: 'opacity 300ms ease' }}
            >
              <circle cx={node.x} cy="150" r="11" fill="#060C18" stroke={node.color} strokeWidth="1.3" strokeOpacity="0.75" />
              <circle cx={node.x} cy="150" r="4" fill={node.color} />
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

/**
 * Full-bleed seamless parametric architectural vector backdrop unique to each department pavilion.
 * Uses transparent canvas + full 1200x480 coordinate space so there are ZERO hard rectangular seams.
 */
export function DisciplineParametricBackdrop({
  slug,
  className = '',
}: {
  slug: DisciplineSlug;
  className?: string;
}) {
  if (slug === 'energy-mep') {
    return (
      <svg
        viewBox="0 0 1200 480"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
        className={`pointer-events-none select-none ${className}`}
      >
        <defs>
          <radialGradient id="energy-wing-bloom" cx="18%" cy="18%" r="58%">
            <stop offset="0%" stopColor="#28CF77" stopOpacity="0.22" />
            <stop offset="48%" stopColor="#00A651" stopOpacity="0.07" />
            <stop offset="100%" stopColor="#00A651" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="energy-stream-fade" x1="0" y1="0" x2="1200" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#28CF77" stopOpacity="0.45" />
            <stop offset="55%" stopColor="#00A651" stopOpacity="0.24" />
            <stop offset="100%" stopColor="#28CF77" stopOpacity="0" />
          </linearGradient>
        </defs>
        <circle cx="220" cy="96" r="360" fill="url(#energy-wing-bloom)" />
        {[82, 136, 194, 256, 322].map((r, idx) => (
          <circle
            key={r}
            cx="210"
            cy="92"
            r={r}
            stroke="#28CF77"
            strokeOpacity={0.28 - idx * 0.042}
            strokeWidth={idx === 1 ? 1.4 : 0.85}
            strokeDasharray={idx % 2 === 1 ? '7 9' : undefined}
          />
        ))}
        {[0, 1, 2, 3, 4, 5, 6].map((i) => {
          const y = 64 + i * 56;
          return (
            <path
              key={i}
              d={`M -40 ${y + 38} C 220 ${y - 44}, 480 ${y + 68}, 760 ${y - 18} S 1050 ${y + 28}, 1240 ${y - 26}`}
              stroke="url(#energy-stream-fade)"
              strokeOpacity={0.55 - i * 0.055}
              strokeWidth={i === 2 ? 1.5 : 0.9}
            />
          );
        })}
        <circle cx="210" cy="92" r="5.5" fill="#28CF77" fillOpacity="0.82" />
      </svg>
    );
  }

  if (slug === 'structure-seismic') {
    return (
      <svg
        viewBox="0 0 1200 480"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
        className={`pointer-events-none select-none ${className}`}
      >
        <defs>
          <radialGradient id="struct-wing-bloom" cx="22%" cy="32%" r="55%">
            <stop offset="0%" stopColor="#93BCFF" stopOpacity="0.22" />
            <stop offset="50%" stopColor="#3B68D6" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#223A87" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="struct-line-fade" x1="0" y1="0" x2="1200" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#93BCFF" stopOpacity="0.38" />
            <stop offset="60%" stopColor="#6F9BFF" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#6F9BFF" stopOpacity="0" />
          </linearGradient>
        </defs>
        <circle cx="260" cy="148" r="340" fill="url(#struct-wing-bloom)" />
        {[0, 1, 2, 3, 4, 5, 6, 7].map((col) => {
          const x = 40 + col * 116;
          return (
            <g key={col} stroke="url(#struct-line-fade)" strokeWidth="0.9">
              <line x1={x} y1="20" x2={x + 116} y2="210" />
              <line x1={x + 116} y1="20" x2={x} y2="210" />
              <line x1={x} y1="210" x2={x + 116} y2="410" />
              <line x1={x + 116} y1="210" x2={x} y2="410" />
              <circle cx={x} cy="210" r="2.6" fill="#93BCFF" fillOpacity="0.5" />
            </g>
          );
        })}
        <path
          d="M 0 286 C 170 158, 290 392, 460 258 S 710 182, 880 274 S 1060 248, 1220 264"
          stroke="#93BCFF"
          strokeOpacity="0.36"
          strokeWidth="1.6"
        />
        <path
          d="M 0 302 C 178 190, 298 372, 468 270 S 718 202, 888 282 S 1068 258, 1220 270"
          stroke="#6F9BFF"
          strokeOpacity="0.2"
          strokeWidth="1"
          strokeDasharray="5 7"
        />
      </svg>
    );
  }

  // architecture-urbanism
  return (
    <svg
      viewBox="0 0 1200 480"
      fill="none"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className={`pointer-events-none select-none ${className}`}
    >
      <defs>
        <radialGradient id="arch-wing-bloom" cx="20%" cy="22%" r="58%">
          <stop offset="0%" stopColor="#6F9BFF" stopOpacity="0.24" />
          <stop offset="48%" stopColor="#223A87" stopOpacity="0.09" />
          <stop offset="100%" stopColor="#223A87" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="arch-vault-grad" x1="0" y1="0" x2="960" y2="420" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#93BCFF" stopOpacity="0.46" />
          <stop offset="55%" stopColor="#6F9BFF" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#223A87" stopOpacity="0" />
        </linearGradient>
      </defs>
      <circle cx="240" cy="110" r="370" fill="url(#arch-wing-bloom)" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <path
          key={i}
          d={`M ${-20 + i * 38} 470 C ${110 + i * 26} ${75 + i * 26}, ${520 - i * 18} ${32 + i * 30}, ${880 - i * 24} 470`}
          stroke="url(#arch-vault-grad)"
          strokeOpacity={0.72 - i * 0.09}
          strokeWidth={i === 0 ? 1.65 : 0.95}
        />
      ))}
      {[84, 168, 258, 350].map((y, idx) => (
        <line
          key={y}
          x1={20}
          y1={y}
          x2={860 - idx * 90}
          y2={y}
          stroke="#93BCFF"
          strokeOpacity={0.18 - idx * 0.028}
          strokeWidth="0.85"
          strokeDasharray={idx % 2 === 0 ? undefined : '5 8'}
        />
      ))}
      <circle cx="318" cy="168" r="4.8" fill="#6F9BFF" fillOpacity="0.82" />
      <circle cx="318" cy="168" r="16" stroke="#6F9BFF" strokeOpacity="0.38" strokeWidth="0.9" />
    </svg>
  );
}
