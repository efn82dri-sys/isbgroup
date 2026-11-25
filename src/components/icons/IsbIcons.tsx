import React from 'react';

export interface IsbIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  strokeWidth?: number | string;
}

/**
 * ISB Mono-Architectural Icon System
 * Crafted on a strict 24×24 optical grid (2px live-area margin, 1.35px hairline stroke,
 * subtle architectural fill/datum accents) to unify navigation, discipline storytelling,
 * Sustainability Lab telemetry, social channels, and Studio Admin controls.
 */
function IconFrame({
  size,
  strokeWidth = 1.35,
  className,
  children,
  ...rest
}: IsbIconProps & { children: React.ReactNode }) {
  const normalizedStroke =
    typeof strokeWidth === 'number'
      ? Math.min(Math.max(strokeWidth * 0.86, 1.2), 1.65)
      : strokeWidth;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size ?? 24}
      height={size ?? 24}
      fill="none"
      stroke="currentColor"
      strokeWidth={normalizedStroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...rest}
    >
      {children}
    </svg>
  );
}

/* ============================================================================
 * 1. NAVIGATION & DIRECTIONAL WAYFINDING (Swiss Architectural Hairline Arrows)
 * ========================================================================== */

export function ArrowRight(props: IsbIconProps) {
  return (
    <IconFrame {...props}>
      <path d="M4.5 12h14.5" />
      <path d="m14.25 7.25 4.75 4.75-4.75 4.75" />
    </IconFrame>
  );
}

export function ArrowLeft(props: IsbIconProps) {
  return (
    <IconFrame {...props}>
      <path d="M19.5 12H5" />
      <path d="M9.75 7.25 5 12l4.75 4.75" />
    </IconFrame>
  );
}

export function ArrowUpRight(props: IsbIconProps) {
  return (
    <IconFrame {...props}>
      <path d="M6.75 17.25 17.25 6.75" />
      <path d="M9.5 6.75h7.75v7.75" />
    </IconFrame>
  );
}

export function ChevronDown(props: IsbIconProps) {
  return (
    <IconFrame {...props}>
      <path d="m6.75 9.75 5.25 5 5.25-5" />
    </IconFrame>
  );
}

export function ChevronLeft(props: IsbIconProps) {
  return (
    <IconFrame {...props}>
      <path d="m14.25 6.75-5 5.25 5 5.25" />
    </IconFrame>
  );
}

export function ChevronRight(props: IsbIconProps) {
  return (
    <IconFrame {...props}>
      <path d="m9.75 6.75 5 5.25-5 5.25" />
    </IconFrame>
  );
}

export function ExternalLink(props: IsbIconProps) {
  return (
    <IconFrame {...props}>
      <path d="M14.25 4.5h5.25v5.25" />
      <path d="M10.5 13.5 19.5 4.5" />
      <path d="M18.25 13.75v3.5a2 2 0 0 1-2 2H6.75a2 2 0 0 1-2-2V7.75a2 2 0 0 1 2-2h3.5" />
    </IconFrame>
  );
}

export function Maximize2(props: IsbIconProps) {
  return (
    <IconFrame {...props}>
      <path d="M14.75 4.5h4.75v4.75" />
      <path d="M19.5 4.5 13.75 10.25" />
      <path d="M9.25 19.5H4.5v-4.75" />
      <path d="m4.5 19.5 5.75-5.75" />
    </IconFrame>
  );
}

export function X(props: IsbIconProps) {
  return (
    <IconFrame {...props}>
      <path d="M6.25 6.25 17.75 17.75" />
      <path d="M17.75 6.25 6.25 17.75" />
    </IconFrame>
  );
}

/* ============================================================================
 * 2. ISB CORE DISCIPLINES & ARCHITECTURAL DOMAIN MARKS
 * ========================================================================== */

/** Stepped twin-mass architectural elevation with subtle glazing tint & ground datum */
export function Building2(props: IsbIconProps) {
  return (
    <IconFrame {...props}>
      <path
        d="M5.5 20V5.75A1.75 1.75 0 0 1 7.25 4h5.5a1.75 1.75 0 0 1 1.75 1.75V20"
        fill="currentColor"
        fillOpacity="0.1"
      />
      <path d="M14.5 10.25h3.25A1.75 1.75 0 0 1 19.5 12v8" />
      <path d="M3 20h18" strokeOpacity="0.7" />
      <path d="M8.75 8h2.5" strokeOpacity="0.75" />
      <path d="M8.75 11.75h2.5" strokeOpacity="0.75" />
      <path d="M8.75 15.5h2.5" strokeOpacity="0.55" />
      <path d="M16.75 14v1.75" strokeOpacity="0.65" />
    </IconFrame>
  );
}

/** ISB Cypress-inspired architectural sustainability leaf with central spine */
export function Leaf(props: IsbIconProps) {
  return (
    <IconFrame {...props}>
      <path
        d="M12 3.25C7.6 6.25 5.75 10.1 6.75 14.35a5.55 5.55 0 0 0 10.5 0c1-4.25-.85-8.1-5.25-11.1Z"
        fill="currentColor"
        fillOpacity="0.12"
      />
      <path d="M12 8.25v12.5" />
      <path d="M12 13.75 14.75 11.5" strokeOpacity="0.65" />
      <path d="M12 16 9.25 13.75" strokeOpacity="0.65" />
    </IconFrame>
  );
}

/** Axonometric structural wireframe cube with subtle internal CAD axis */
export function Box(props: IsbIconProps) {
  return (
    <IconFrame {...props}>
      <path
        d="M12 3.5 19.25 7.6v8.8L12 20.5 4.75 16.4V7.6L12 3.5Z"
        fill="currentColor"
        fillOpacity="0.08"
      />
      <path d="M4.75 7.6 12 11.75l7.25-4.15" />
      <path d="M12 11.75V20.5" />
      <path d="M12 3.5v4.2" strokeOpacity="0.35" strokeDasharray="1.5 2" />
    </IconFrame>
  );
}

/** Stacked seismic/structural floor plates with elevated top-plate tint */
export function Layers(props: IsbIconProps) {
  return (
    <IconFrame {...props}>
      <path
        d="M12 4.25 19.5 8.5 12 12.75 4.5 8.5 12 4.25Z"
        fill="currentColor"
        fillOpacity="0.12"
      />
      <path d="M4.5 12.5 12 16.75l7.5-4.25" />
      <path d="M4.5 16.25 12 20.25l7.5-4" strokeOpacity="0.65" />
    </IconFrame>
  );
}

/** Precision Erlenmeyer sustainability vessel with volumetric graduation ticks */
export function FlaskConical(props: IsbIconProps) {
  return (
    <IconFrame {...props}>
      <path d="M9.25 3.75h5.5" />
      <path d="M10.25 3.75v4.65L5.4 16.8a2.35 2.35 0 0 0 2.04 3.5h9.12a2.35 2.35 0 0 0 2.04-3.5l-4.85-8.4V3.75" />
      <path
        d="M7.15 14.5c1.55-.85 3.1-.85 4.85 0s3.3.85 4.85 0l1.45 2.5a1.85 1.85 0 0 1-1.6 2.75H7.3a1.85 1.85 0 0 1-1.6-2.75l1.45-2.5Z"
        fill="currentColor"
        fillOpacity="0.14"
        stroke="none"
      />
      <path d="M7.5 14.35c1.5-.75 3-.75 4.5 0s3 .75 4.5 0" strokeOpacity="0.7" />
    </IconFrame>
  );
}

/** Solar daylight autonomy ring with precision astronomical drafting ticks */
export function Sun(props: IsbIconProps) {
  return (
    <IconFrame {...props}>
      <circle cx="12" cy="12" r="4.1" fill="currentColor" fillOpacity="0.12" />
      <path d="M12 3.25v2" />
      <path d="M12 18.75v2" />
      <path d="M3.25 12h2" />
      <path d="M18.75 12h2" />
      <path d="m5.85 5.85 1.4 1.4" strokeOpacity="0.65" />
      <path d="m16.75 16.75 1.4 1.4" strokeOpacity="0.65" />
      <path d="m18.15 5.85-1.4 1.4" strokeOpacity="0.65" />
      <path d="m7.25 16.75-1.4 1.4" strokeOpacity="0.65" />
    </IconFrame>
  );
}

/** Sharp architectural energy-efficiency volt contour */
export function Zap(props: IsbIconProps) {
  return (
    <IconFrame {...props}>
      <path
        d="M13.25 3.25 5.75 13h5.75l-1 7.75 7.75-9.75h-5.75l.75-7.75Z"
        fill="currentColor"
        fillOpacity="0.12"
      />
    </IconFrame>
  );
}

/** Clean geometric atmospheric carbon cloud with subtle datum horizon */
export function Cloud(props: IsbIconProps) {
  return (
    <IconFrame {...props}>
      <path
        d="M7.25 17.25h9.5a3.75 3.75 0 0 0 .45-7.47 5.25 5.25 0 0 0-10.1-1.38A3.6 3.6 0 0 0 7.25 17.25Z"
        fill="currentColor"
        fillOpacity="0.1"
      />
      <path d="M8.5 20h7" strokeOpacity="0.45" />
    </IconFrame>
  );
}

/** Architectural performance elevation columns with datum baseline */
export function BarChart3(props: IsbIconProps) {
  return (
    <IconFrame {...props}>
      <path d="M3.5 19.5h17" strokeOpacity="0.6" />
      <rect x="5.25" y="12.5" width="3" height="7" rx="1" fill="currentColor" fillOpacity="0.1" />
      <rect x="10.5" y="8.25" width="3" height="11.25" rx="1" fill="currentColor" fillOpacity="0.16" />
      <rect x="15.75" y="4.75" width="3" height="14.75" rx="1" fill="currentColor" fillOpacity="0.1" />
    </IconFrame>
  );
}

/** Precision architectural scale ruler */
export function Ruler(props: IsbIconProps) {
  return (
    <IconFrame {...props}>
      <path
        d="M16.25 3.75 20.25 7.75 7.75 20.25 3.75 16.25 16.25 3.75Z"
        fill="currentColor"
        fillOpacity="0.09"
      />
      <path d="m13.5 6.5 1.75 1.75" strokeOpacity="0.7" />
      <path d="m10.5 9.5 1.75 1.75" strokeOpacity="0.7" />
      <path d="m7.5 12.5 1.75 1.75" strokeOpacity="0.7" />
    </IconFrame>
  );
}

/* ============================================================================
 * 3. HEADER, SEARCH, LOCATION & PEOPLE
 * ========================================================================== */

/** Minimal compass-loupe search with detached optical stem */
export function Search(props: IsbIconProps) {
  return (
    <IconFrame {...props}>
      <circle cx="10.75" cy="10.75" r="6.5" />
      <path d="m16.2 16.2 3.8 3.8" />
    </IconFrame>
  );
}

/** Airy editorial meridian globe */
export function Globe(props: IsbIconProps) {
  return (
    <IconFrame {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <ellipse cx="12" cy="12" rx="3.75" ry="8.5" strokeOpacity="0.75" />
      <path d="M3.75 12h16.5" strokeOpacity="0.75" />
    </IconFrame>
  );
}

/** Minimal architectural waypoint pin with precision core dot */
export function MapPin(props: IsbIconProps) {
  return (
    <IconFrame {...props}>
      <path
        d="M12 20.5s6.5-5.15 6.5-10.25a6.5 6.5 0 1 0-13 0C5.5 15.35 12 20.5 12 20.5Z"
        fill="currentColor"
        fillOpacity="0.1"
      />
      <circle cx="12" cy="10.25" r="2.15" />
    </IconFrame>
  );
}

/** Refined modernist studio team silhouettes */
export function Users(props: IsbIconProps) {
  return (
    <IconFrame {...props}>
      <circle cx="9.25" cy="8.25" r="3" fill="currentColor" fillOpacity="0.1" />
      <path d="M3.75 19.25a5.5 5.5 0 0 1 11 0" />
      <circle cx="16.5" cy="9.25" r="2.25" strokeOpacity="0.7" />
      <path d="M16.75 14.5a4.25 4.25 0 0 1 3.75 4.25" strokeOpacity="0.7" />
    </IconFrame>
  );
}

/** Verified lead / department director profile mark */
export function UserCheck(props: IsbIconProps) {
  return (
    <IconFrame {...props}>
      <circle cx="9.75" cy="8" r="3.25" fill="currentColor" fillOpacity="0.1" />
      <path d="M3.75 19.25a6 6 0 0 1 11.25-2.8" />
      <path d="m15.25 16.5 1.85 1.85 3.65-3.85" />
    </IconFrame>
  );
}

export function User(props: IsbIconProps) {
  return (
    <IconFrame {...props}>
      <circle cx="12" cy="8.25" r="3.5" fill="currentColor" fillOpacity="0.1" />
      <path d="M5.25 19.25a6.75 6.75 0 0 1 13.5 0" />
    </IconFrame>
  );
}

export function UserPlus(props: IsbIconProps) {
  return (
    <IconFrame {...props}>
      <circle cx="9.75" cy="8" r="3.25" fill="currentColor" fillOpacity="0.1" />
      <path d="M3.75 19.25a6 6 0 0 1 11.25-2.8" />
      <path d="M18 13.75v5" />
      <path d="M15.5 16.25h5" />
    </IconFrame>
  );
}

/* ============================================================================
 * 4. COMMUNICATION, DOCUMENTS & EDITORIAL
 * ========================================================================== */

export function Mail(props: IsbIconProps) {
  return (
    <IconFrame {...props}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" fill="currentColor" fillOpacity="0.08" />
      <path d="m4.5 7 7.5 5.5L19.5 7" />
    </IconFrame>
  );
}

export function Phone(props: IsbIconProps) {
  return (
    <IconFrame {...props}>
      <path
        d="M6.25 4.25h2.9c.55 0 1.02.38 1.15.92l.72 2.95a1.2 1.2 0 0 1-.48 1.25l-1.55 1.1a11.3 11.3 0 0 0 4.54 4.54l1.1-1.55a1.2 1.2 0 0 1 1.25-.48l2.95.72c.54.13.92.6.92 1.15v2.9a1.5 1.5 0 0 1-1.64 1.49C10.55 18.6 5.4 13.45 4.76 5.89A1.5 1.5 0 0 1 6.25 4.25Z"
        fill="currentColor"
        fillOpacity="0.09"
      />
    </IconFrame>
  );
}

export function Calendar(props: IsbIconProps) {
  return (
    <IconFrame {...props}>
      <rect x="3.75" y="5.5" width="16.5" height="14.75" rx="2.5" fill="currentColor" fillOpacity="0.08" />
      <path d="M8 3.5v3.5" />
      <path d="M16 3.5v3.5" />
      <path d="M3.75 10.25h16.5" strokeOpacity="0.7" />
      <circle cx="9" cy="14.5" r="0.85" fill="currentColor" stroke="none" />
      <circle cx="12" cy="14.5" r="0.85" fill="currentColor" stroke="none" opacity="0.6" />
      <circle cx="15" cy="14.5" r="0.85" fill="currentColor" stroke="none" opacity="0.4" />
    </IconFrame>
  );
}

export function BookOpen(props: IsbIconProps) {
  return (
    <IconFrame {...props}>
      <path
        d="M12 6.5c-2.2-1.65-5.25-1.95-8-1.25v12.5c2.75-.7 5.8-.4 8 1.25 2.2-1.65 5.25-1.95 8-1.25V5.25c-2.75-.7-5.8-.4-8 1.25Z"
        fill="currentColor"
        fillOpacity="0.09"
      />
      <path d="M12 6.5V19" strokeOpacity="0.7" />
    </IconFrame>
  );
}

export function FileText(props: IsbIconProps) {
  return (
    <IconFrame {...props}>
      <path
        d="M6.5 3.75h7.25L18.5 8.5v11.75a1.5 1.5 0 0 1-1.5 1.5H6.5a1.5 1.5 0 0 1-1.5-1.5V5.25a1.5 1.5 0 0 1 1.5-1.5Z"
        fill="currentColor"
        fillOpacity="0.08"
      />
      <path d="M13.5 3.75v4.75h5" />
      <path d="M8.75 12.75h6.5" strokeOpacity="0.75" />
      <path d="M8.75 16.25h4.25" strokeOpacity="0.6" />
    </IconFrame>
  );
}

export function FilePlus2(props: IsbIconProps) {
  return (
    <IconFrame {...props}>
      <path
        d="M6.5 3.75h7.25L18.5 8.5v11.25a1.5 1.5 0 0 1-1.5 1.5H6.5a1.5 1.5 0 0 1-1.5-1.5V5.25a1.5 1.5 0 0 1 1.5-1.5Z"
        fill="currentColor"
        fillOpacity="0.08"
      />
      <path d="M13.5 3.75v4.75h5" />
      <path d="M11.75 12.25v5" />
      <path d="M9.25 14.75h5" />
    </IconFrame>
  );
}

export function Images(props: IsbIconProps) {
  return (
    <IconFrame {...props}>
      <rect x="6.5" y="4.5" width="13.5" height="12.25" rx="2.25" fill="currentColor" fillOpacity="0.08" />
      <path d="M16.5 19.75H6.25a2.25 2.25 0 0 1-2.25-2.25V8.5" strokeOpacity="0.65" />
      <circle cx="10.5" cy="8.75" r="1.15" />
      <path d="m7.25 15.25 3.75-3.4 2.5 2.15 2.75-2.6 3.25 3.1" strokeOpacity="0.8" />
    </IconFrame>
  );
}

export function ImagePlus(props: IsbIconProps) {
  return (
    <IconFrame {...props}>
      <path
        d="M19.5 12.5v5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 17.5V7A2.25 2.25 0 0 1 6.75 4.75h5.75"
        fill="currentColor"
        fillOpacity="0.08"
      />
      <circle cx="9.25" cy="9.5" r="1.25" />
      <path d="m5 17.25 4.5-4.25 3 2.5 3.25-3.25 3.5 3.5" strokeOpacity="0.8" />
      <path d="M18 4.25v4.5" />
      <path d="M15.75 6.5h4.5" />
    </IconFrame>
  );
}

/* ============================================================================
 * 5. STATUS, ACTIONS, SECURITY & STUDIO CMS CONTROLS
 * ========================================================================== */

export function Check(props: IsbIconProps) {
  return (
    <IconFrame {...props}>
      <path d="m5.25 12.5 4.5 4.5 9-9.5" />
    </IconFrame>
  );
}

export function CheckCircle2(props: IsbIconProps) {
  return (
    <IconFrame {...props}>
      <circle cx="12" cy="12" r="8.5" fill="currentColor" fillOpacity="0.1" />
      <path d="m8.5 12.25 2.4 2.4 4.75-5" />
    </IconFrame>
  );
}

export function AlertCircle(props: IsbIconProps) {
  return (
    <IconFrame {...props}>
      <circle cx="12" cy="12" r="8.5" fill="currentColor" fillOpacity="0.1" />
      <path d="M12 8.25v4.5" />
      <circle cx="12" cy="15.85" r="0.8" fill="currentColor" stroke="none" />
    </IconFrame>
  );
}

export function ShieldCheck(props: IsbIconProps) {
  return (
    <IconFrame {...props}>
      <path
        d="M12 3.5 5 6.35v5.35c0 4.5 3 7.65 7 9.05 4-1.4 7-4.55 7-9.05V6.35L12 3.5Z"
        fill="currentColor"
        fillOpacity="0.1"
      />
      <path d="m9 12.1 2.15 2.15 4.1-4.35" />
    </IconFrame>
  );
}

export function Lock(props: IsbIconProps) {
  return (
    <IconFrame {...props}>
      <rect x="5" y="10.75" width="14" height="9.25" rx="2.5" fill="currentColor" fillOpacity="0.1" />
      <path d="M8.25 10.75V7.75a3.75 3.75 0 0 1 7.5 0v3" />
      <path d="M12 14.5v2" />
    </IconFrame>
  );
}

export function KeyRound(props: IsbIconProps) {
  return (
    <IconFrame {...props}>
      <circle cx="8.25" cy="15.25" r="4" fill="currentColor" fillOpacity="0.1" />
      <path d="m11.2 12.3 7.8-7.8" />
      <path d="m16.25 7.25 2.5 2.5" />
      <path d="m13.75 9.75 2 2" strokeOpacity="0.7" />
    </IconFrame>
  );
}

export function Eye(props: IsbIconProps) {
  return (
    <IconFrame {...props}>
      <path
        d="M2.75 12S6.25 6.25 12 6.25 21.25 12 21.25 12 17.75 17.75 12 17.75 2.75 12 2.75 12Z"
        fill="currentColor"
        fillOpacity="0.08"
      />
      <circle cx="12" cy="12" r="2.65" />
    </IconFrame>
  );
}

export function EyeOff(props: IsbIconProps) {
  return (
    <IconFrame {...props}>
      <path d="M4 4 20 20" />
      <path d="M10.4 6.45A10.1 10.1 0 0 1 12 6.25C17.75 6.25 21.25 12 21.25 12a16.8 16.8 0 0 1-3.45 3.95" />
      <path d="M6.45 8.2A16.5 16.5 0 0 0 2.75 12S6.25 17.75 12 17.75c1.15 0 2.25-.2 3.25-.55" />
    </IconFrame>
  );
}

export function Edit3(props: IsbIconProps) {
  return (
    <IconFrame {...props}>
      <path d="M13.5 5.25 18.75 10.5 8.5 20.25H3.75v-4.75L13.5 5.25Z" fill="currentColor" fillOpacity="0.09" />
      <path d="M12.75 20.25h7.5" strokeOpacity="0.6" />
    </IconFrame>
  );
}

export function Save(props: IsbIconProps) {
  return (
    <IconFrame {...props}>
      <path
        d="M5.75 4.25h10.5L19.75 7.75V18.25a1.5 1.5 0 0 1-1.5 1.5H5.75a1.5 1.5 0 0 1-1.5-1.5V5.75a1.5 1.5 0 0 1 1.5-1.5Z"
        fill="currentColor"
        fillOpacity="0.08"
      />
      <path d="M8 4.25v4.5h7V4.25" />
      <rect x="7.75" y="13.25" width="8.5" height="6.5" rx="1" strokeOpacity="0.75" />
    </IconFrame>
  );
}

export function Trash2(props: IsbIconProps) {
  return (
    <IconFrame {...props}>
      <path d="M4.5 6.75h15" />
      <path d="M9.25 6.75V5a1.25 1.25 0 0 1 1.25-1.25h3A1.25 1.25 0 0 1 14.75 5v1.75" />
      <path
        d="M6.75 6.75 7.6 18.4a1.75 1.75 0 0 0 1.75 1.6h5.3a1.75 1.75 0 0 0 1.75-1.6l.85-11.65"
        fill="currentColor"
        fillOpacity="0.07"
      />
      <path d="M10.25 10.75v5" strokeOpacity="0.7" />
      <path d="M13.75 10.75v5" strokeOpacity="0.7" />
    </IconFrame>
  );
}

export function Copy(props: IsbIconProps) {
  return (
    <IconFrame {...props}>
      <rect x="8.75" y="8.75" width="11" height="11" rx="2.25" fill="currentColor" fillOpacity="0.08" />
      <path d="M15.25 8.75V6.5a2.25 2.25 0 0 0-2.25-2.25H6.5A2.25 2.25 0 0 0 4.25 6.5V13a2.25 2.25 0 0 0 2.25 2.25h2.25" />
    </IconFrame>
  );
}

export function Send(props: IsbIconProps) {
  return (
    <IconFrame {...props}>
      <path
        d="M20.25 3.75 10.25 13.75"
        strokeOpacity="0.7"
      />
      <path
        d="M20.25 3.75 14 20.25l-3.75-6.5-6.5-3.75 16.5-6.25Z"
        fill="currentColor"
        fillOpacity="0.1"
      />
    </IconFrame>
  );
}

export function Upload(props: IsbIconProps) {
  return (
    <IconFrame {...props}>
      <path d="M12 15.25V4.75" />
      <path d="m7.75 9 4.25-4.25L16.25 9" />
      <path d="M4.5 16v2a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-2" />
    </IconFrame>
  );
}

export function Link2(props: IsbIconProps) {
  return (
    <IconFrame {...props}>
      <path d="M9.5 15.75H7.25a3.75 3.75 0 0 1 0-7.5H9.5" />
      <path d="M14.5 8.25h2.25a3.75 3.75 0 0 1 0 7.5H14.5" />
      <path d="M8.5 12h7" strokeOpacity="0.75" />
    </IconFrame>
  );
}

export function Loader2(props: IsbIconProps) {
  return (
    <IconFrame {...props}>
      <circle cx="12" cy="12" r="8.25" strokeOpacity="0.22" />
      <path d="M12 3.75a8.25 8.25 0 0 1 8.25 8.25" />
    </IconFrame>
  );
}

export function FolderKanban(props: IsbIconProps) {
  return (
    <IconFrame {...props}>
      <path
        d="M3.75 7.25A2 2 0 0 1 5.75 5.25h4.1l1.85 2h6.55a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5.75a2 2 0 0 1-2-2v-10Z"
        fill="currentColor"
        fillOpacity="0.08"
      />
      <path d="M8.5 11.25v4.5" strokeOpacity="0.75" />
      <path d="M12 11.25v2.75" strokeOpacity="0.75" />
      <path d="M15.5 11.25v4" strokeOpacity="0.75" />
    </IconFrame>
  );
}

export function FolderPlus(props: IsbIconProps) {
  return (
    <IconFrame {...props}>
      <path
        d="M3.75 7.25A2 2 0 0 1 5.75 5.25h4.1l1.85 2h6.55a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5.75a2 2 0 0 1-2-2v-10Z"
        fill="currentColor"
        fillOpacity="0.08"
      />
      <path d="M12 11.25v4.5" />
      <path d="M9.75 13.5h4.5" />
    </IconFrame>
  );
}

export function Inbox(props: IsbIconProps) {
  return (
    <IconFrame {...props}>
      <path
        d="M4.25 13.25 6.1 6.1a1.75 1.75 0 0 1 1.7-1.35h8.4a1.75 1.75 0 0 1 1.7 1.35l1.85 7.15v4.25a2 2 0 0 1-2 2H6.25a2 2 0 0 1-2-2v-4.25Z"
        fill="currentColor"
        fillOpacity="0.08"
      />
      <path d="M4.25 13.25h4.5l1.35 2h3.8l1.35-2h4.5" />
    </IconFrame>
  );
}

export function LogOut(props: IsbIconProps) {
  return (
    <IconFrame {...props}>
      <path d="M10 4.75H6.5a2 2 0 0 0-2 2v10.5a2 2 0 0 0 2 2H10" />
      <path d="M15.75 8.5 19.5 12l-3.75 3.5" />
      <path d="M19.5 12H9.5" />
    </IconFrame>
  );
}

export function MessageSquareReply(props: IsbIconProps) {
  return (
    <IconFrame {...props}>
      <path
        d="M4.25 6.75a2.25 2.25 0 0 1 2.25-2.25h11a2.25 2.25 0 0 1 2.25 2.25v7.5a2.25 2.25 0 0 1-2.25 2.25H9.5l-4.5 3.25a.5.5 0 0 1-.75-.42V6.75Z"
        fill="currentColor"
        fillOpacity="0.08"
      />
      <path d="m11 8.5-2.75 2.25L11 13" />
      <path d="M8.5 10.75h5.25a2 2 0 0 1 2 2v.5" />
    </IconFrame>
  );
}

export function RefreshCw(props: IsbIconProps) {
  return (
    <IconFrame {...props}>
      <path d="M19.25 11.25A7.25 7.25 0 0 0 6.8 6.85L4.75 8.9" />
      <path d="M4.75 5.25v3.65h3.65" />
      <path d="M4.75 12.75a7.25 7.25 0 0 0 12.45 4.4l2.05-2.05" />
      <path d="M19.25 18.75V15.1H15.6" />
    </IconFrame>
  );
}

export function RotateCcw(props: IsbIconProps) {
  return (
    <IconFrame {...props}>
      <path d="M4.75 9.25A7.5 7.5 0 1 1 6.9 17.4" />
      <path d="M4.75 5.25v4h4" />
    </IconFrame>
  );
}

export function Sliders(props: IsbIconProps) {
  return (
    <IconFrame {...props}>
      <path d="M4.5 7h15" strokeOpacity="0.55" />
      <path d="M4.5 12h15" strokeOpacity="0.55" />
      <path d="M4.5 17h15" strokeOpacity="0.55" />
      <circle cx="9.25" cy="7" r="2" fill="currentColor" fillOpacity="0.16" />
      <circle cx="15.25" cy="12" r="2" fill="currentColor" fillOpacity="0.16" />
      <circle cx="10.75" cy="17" r="2" fill="currentColor" fillOpacity="0.16" />
    </IconFrame>
  );
}

export function Ticket(props: IsbIconProps) {
  return (
    <IconFrame {...props}>
      <path
        d="M4 8.25a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1.85a1.9 1.9 0 0 0 0 3.8v1.85a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V13.9a1.9 1.9 0 0 0 0-3.8V8.25Z"
        fill="currentColor"
        fillOpacity="0.09"
      />
      <path d="M14.25 6.5v11" strokeDasharray="2 2" strokeOpacity="0.65" />
    </IconFrame>
  );
}

export function ShoppingBag(props: IsbIconProps) {
  return (
    <IconFrame {...props}>
      <path
        d="M5.5 8.25h13l1 10a2 2 0 0 1-2 2.25H6.5a2 2 0 0 1-2-2.25l1-10Z"
        fill="currentColor"
        fillOpacity="0.09"
      />
      <path d="M8.75 8.25V6.75a3.25 3.25 0 0 1 6.5 0v1.5" />
    </IconFrame>
  );
}

export function CreditCard(props: IsbIconProps) {
  return (
    <IconFrame {...props}>
      <rect x="3.5" y="5.75" width="17" height="12.5" rx="2.25" fill="currentColor" fillOpacity="0.08" />
      <path d="M3.5 10h17" strokeOpacity="0.7" />
      <path d="M7 14.5h4" strokeOpacity="0.75" />
    </IconFrame>
  );
}

export function Plus(props: IsbIconProps) {
  return (
    <IconFrame {...props}>
      <path d="M12 5.25v13.5" />
      <path d="M5.25 12h13.5" />
    </IconFrame>
  );
}

export function Clock(props: IsbIconProps) {
  return (
    <IconFrame {...props}>
      <circle cx="12" cy="12" r="8.5" fill="currentColor" fillOpacity="0.08" />
      <path d="M12 7.5v4.75l3.25 1.75" />
    </IconFrame>
  );
}

/* ============================================================================
 * 6. BESPOKE MINIMAL SOCIAL BRAND MARKS (Unified 1.35px Hairline Geometry)
 * ========================================================================== */

export function InstagramIcon(props: IsbIconProps) {
  return (
    <IconFrame {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="currentColor" fillOpacity="0.06" />
      <circle cx="12" cy="12" r="3.75" />
      <circle cx="16.95" cy="7.05" r="0.85" fill="currentColor" stroke="none" />
    </IconFrame>
  );
}

export function LinkedinIcon(props: IsbIconProps) {
  return (
    <IconFrame {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.25" fill="currentColor" fillOpacity="0.06" />
      <path d="M8.25 10.75v5.5" />
      <circle cx="8.25" cy="7.85" r="0.8" fill="currentColor" stroke="none" />
      <path d="M11.75 16.25v-5.5" />
      <path d="M11.75 12.6a2.35 2.35 0 0 1 4.5.85v2.8" />
    </IconFrame>
  );
}

export function TelegramIcon(props: IsbIconProps) {
  return (
    <IconFrame {...props}>
      <path
        d="M20.25 4.75 3.5 11.35l5.55 2.15 2.15 5.75 2.75-3.1 4.1 2.9 2.2-14.3Z"
        fill="currentColor"
        fillOpacity="0.08"
      />
      <path d="m9.05 13.5 7.7-5.6" strokeOpacity="0.7" />
    </IconFrame>
  );
}

export function WhatsAppIcon(props: IsbIconProps) {
  return (
    <IconFrame {...props}>
      <path
        d="M19.85 11.75a7.85 7.85 0 0 1-11.6 6.9L4.15 19.85l1.2-3.9a7.85 7.85 0 1 1 14.5-4.2Z"
        fill="currentColor"
        fillOpacity="0.08"
      />
      <path
        d="M9.6 8.85c.25-.25.55-.2.75.1l.7 1.1c.15.25.1.55-.1.75l-.4.4a5.45 5.45 0 0 0 2.4 2.4l.4-.4c.2-.2.5-.25.75-.1l1.1.7c.3.2.35.5.1.75l-.35.35c-.55.55-1.5.6-2.4.15a8.4 8.4 0 0 1-3.45-3.45c-.45-.9-.4-1.85.15-2.4l.35-.35Z"
      />
    </IconFrame>
  );
}

export function YoutubeIcon(props: IsbIconProps) {
  return (
    <IconFrame {...props}>
      <rect x="3" y="5.5" width="18" height="13" rx="4" fill="currentColor" fillOpacity="0.07" />
      <path d="m10.5 9.65 4.5 2.35-4.5 2.35V9.65Z" fill="currentColor" fillOpacity="0.2" />
    </IconFrame>
  );
}

/** Exported registry for automated completeness & design-system verification */
export const ISB_ICON_REGISTRY = {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Box,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Cloud,
  Copy,
  CreditCard,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  FilePlus2,
  FileText,
  FlaskConical,
  FolderKanban,
  FolderPlus,
  Globe,
  ImagePlus,
  Images,
  Inbox,
  KeyRound,
  Layers,
  Leaf,
  Link2,
  Loader2,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Maximize2,
  MessageSquareReply,
  Phone,
  Plus,
  RefreshCw,
  RotateCcw,
  Ruler,
  Save,
  Search,
  Send,
  ShieldCheck,
  ShoppingBag,
  Sliders,
  Sun,
  Ticket,
  Trash2,
  Upload,
  User,
  UserCheck,
  UserPlus,
  Users,
  X,
  Zap,
  InstagramIcon,
  LinkedinIcon,
  TelegramIcon,
  WhatsAppIcon,
  YoutubeIcon,
} as const;
