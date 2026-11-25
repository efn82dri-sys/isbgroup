import React, { useEffect, useId, useState } from 'react';
import { Building2 } from './icons/IsbIcons';
import { ASSETS } from '../data/assets';
import type { Locale, SiteSettings } from '../types/content';
import { isSafeImageSrc } from '../utils/validation';

function isMediaRef(value?: string | null): boolean {
  return typeof value === 'string' && value.startsWith('media://');
}

export function IsbSymbol({
  className = 'w-8 h-8',
  alt = '',
}: {
  className?: string;
  alt?: string;
}) {
  return (
    <img
      src={ASSETS.brandSymbol}
      alt={alt}
      aria-hidden={alt === '' ? true : undefined}
      draggable={false}
      decoding="async"
      className={`object-contain select-none ${className}`}
    />
  );
}

/**
 * Official ISB Catalog Brand Pattern (staggered chamfered vertical parallelogram lattice).
 * Rendered at ultra-delicate opacity with edge fading so it acts as a refined architectural
 * watermark without visually competing with typography or 3D renders.
 */
export function IsbPatternOverlay({
  color = '#223A87',
  opacity = 0.12,
  scale = 1,
  className = '',
  maskStyle = 'radial-gradient(ellipse 80% 80% at 85% 50%, black 0%, transparent 78%)',
}: {
  color?: string;
  opacity?: number;
  scale?: number;
  className?: string;
  maskStyle?: string;
}) {
  const uid = useId().replace(/:/g, '');
  const patternId = `isb-catalog-pattern-${uid}`;
  const tileW = 22 * scale;
  const tileH = 38 * scale;

  return (
    <svg
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 w-full h-full ${className}`}
      style={{
        opacity,
        maskImage: maskStyle,
        WebkitMaskImage: maskStyle,
      }}
    >
      <defs>
        <pattern
          id={patternId}
          width={tileW}
          height={tileH}
          patternUnits="userSpaceOnUse"
        >
          {/* Row A slanted parallelogram slat */}
          <polygon
            points={`${4 * scale},${3.2 * scale} ${8.2 * scale},${1 * scale} ${8.2 * scale},${13.2 * scale} ${4 * scale},${15.4 * scale}`}
            fill={color}
          />
          {/* Row B staggered slanted parallelogram slat */}
          <polygon
            points={`${15 * scale},${22.2 * scale} ${19.2 * scale},${20 * scale} ${19.2 * scale},${32.2 * scale} ${15 * scale},${34.4 * scale}`}
            fill={color}
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  );
}

export function BrandWordmark({
  locale,
  settings,
  className = '',
  size = 'md',
}: {
  locale: Locale;
  settings: SiteSettings;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const [failed, setFailed] = useState(false);
  const brandName = locale === 'fa' ? settings.brandNameFa : settings.brandNameEn;

  const heightClass =
    size === 'sm'
      ? 'h-[20px] sm:h-7'
      : size === 'lg'
        ? 'h-8 sm:h-10 lg:h-11'
        : 'h-[22px] sm:h-8 lg:h-[38px]';

  if (failed) {
    return (
      <span className={`inline-flex items-center gap-2 whitespace-nowrap shrink-0 ${className}`}>
        <span className="text-[15px] sm:text-[18px] font-semibold tracking-tight text-[#F5F8FC]">
          {brandName}
        </span>
      </span>
    );
  }

  return (
    <span className={`ltr-inline inline-flex items-center shrink-0 ${className}`}>
      <img
        src={ASSETS.brandLogoHorizontal}
        alt={brandName}
        loading="eager"
        decoding="async"
        draggable={false}
        onError={() => setFailed(true)}
        className={`${heightClass} w-auto object-contain select-none drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)] transition-opacity duration-200 hover:opacity-90`}
      />
    </span>
  );
}

interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
  loading?: 'eager' | 'lazy';
  fetchPriority?: 'high' | 'low' | 'auto';
  fallbackTitle?: string;
}

export function SafeImage({
  src,
  alt,
  className = '',
  loading = 'lazy',
  fetchPriority,
  fallbackTitle,
}: SafeImageProps) {
  const [failed, setFailed] = useState(false);
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(() =>
    src && !isMediaRef(src) && isSafeImageSrc(src) ? src : null
  );
  const [resolving, setResolving] = useState<boolean>(() => isMediaRef(src));

  useEffect(() => {
    let active = true;
    setFailed(false);

    if (!src || !isSafeImageSrc(src)) {
      setResolvedSrc(null);
      setResolving(false);
      return;
    }

    if (!isMediaRef(src)) {
      setResolvedSrc(src);
      setResolving(false);
      return;
    }

    setResolving(true);
    void import('../services/mediaStore')
      .then(({ resolveMediaUrl }) => resolveMediaUrl(src))
      .then((url) => {
        if (!active) return;
        setResolvedSrc(url);
        setResolving(false);
        if (!url) setFailed(true);
      })
      .catch(() => {
        if (!active) return;
        setResolvedSrc(null);
        setResolving(false);
        setFailed(true);
      });

    return () => {
      active = false;
    };
  }, [src]);

  if (resolving) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`animate-pulse bg-gradient-to-br from-[#121D33] via-[#0C1424] to-[#0E1A2A] ${className}`}
      />
    );
  }

  if (failed || !resolvedSrc) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#111B30] via-[#0B1220] to-[#0D1E1E] text-[#C6D2E3] ${className}`}
      >
        <Building2 className="w-8 h-8 text-[#6F9BFF]/75" strokeWidth={1.5} />
        {fallbackTitle && (
          <span className="text-xs tracking-wide px-4 text-center opacity-80">{fallbackTitle}</span>
        )}
      </div>
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      loading={loading}
      decoding="async"
      fetchPriority={fetchPriority}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('Application error boundary caught:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#080D16] text-[#F5F8FC] flex items-center justify-center p-6">
          <div className="glass-surface-strong max-w-md w-full rounded-2xl p-8 text-center space-y-4">
            <IsbSymbol className="w-12 h-12 mx-auto" />
            <h1 className="text-xl font-semibold">Something went wrong</h1>
            <p className="text-sm text-[#C6D2E3]">
              An unexpected error interrupted this view. Please reload to continue browsing ISB Group.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="glass-cta inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-semibold transition-all"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
