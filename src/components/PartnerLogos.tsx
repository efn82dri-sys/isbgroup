import React from 'react';
import { SEED_PARTNER_LOGOS } from '../data/seedContent';
import type { Locale, PartnerLogo } from '../types/content';
import { isSafeExternalUrl } from '../utils/validation';
import { SafeImage } from './BrandMark';

export interface PresetMarkOption {
  id: string;
  labelFa: string;
  labelEn: string;
}

export const PRESET_PARTNER_MARK_OPTIONS: PresetMarkOption[] = [
  { id: 'isoletco', labelFa: 'لایه‌های عایق (ایزولتکو)', labelEn: 'Insulation Grid' },
  { id: 'parin-beton', labelFa: 'شش‌ضلعی سازه‌ای (پرین بتن)', labelEn: 'Hexagon Core' },
  { id: 'toos-khorasan', labelFa: 'طاق معماری (طوس خراسان)', labelEn: 'Architectural Arch' },
  { id: 'bonyadin', labelFa: 'بلوک‌های مدولار (بنیادین)', labelEn: 'Modular Blocks' },
  { id: 'iran-etics', labelFa: 'خطوط پوسته (ایران اتیکس)', labelEn: 'Envelope Lines' },
  { id: 'multics', labelFa: 'مونوگرام هندسی (مالتیکس)', labelEn: 'Geometric Monogram' },
  { id: 'bhrc', labelFa: 'دایره و مثلث پژوهشی (BHRC)', labelEn: 'Research Emblem' },
  { id: 'nlho', labelFa: 'شبکه شهری (زمین و مسکن)', labelEn: 'Urban Grid' },
  { id: 'bst', labelFa: 'سنجشگر انرژی (بهینه‌سازان)', labelEn: 'Energy Dial' },
  { id: 'farapanel', labelFa: 'پنل‌های موازی (فراپانل)', labelEn: 'Parallel Panels' },
  { id: 'notash-naghsh', labelFa: 'قاب معماری (نوتاش نقش)', labelEn: 'Architectural Frame' },
  { id: 'zistavin', labelFa: 'مسیر پایدار (زیستاوین)', labelEn: 'Sustainable Path' },
  { id: 'sarvestan', labelFa: 'سرو هندسی (سروستان)', labelEn: 'Geometric Cypress' },
  { id: 'emarat-hashtom', labelFa: 'هشت‌ضلعی (عمارت هشتم)', labelEn: 'Octagon Plan' },
  { id: 'charsoo', labelFa: 'چهارمربع (چارسو)', labelEn: 'Quad Courtyard' },
  { id: 'shomal-shargh', labelFa: 'سقف سه‌ضلعی (شمال شرق)', labelEn: 'Gable Silhouette' },
];

export function renderPartnerPresetMark(
  markId: string | undefined,
  className = 'w-5 h-5 shrink-0'
): React.ReactNode {
  switch (markId) {
    case 'isoletco':
      return (
        <svg viewBox="0 0 36 36" className={className} fill="none" aria-hidden="true">
          <rect x="4" y="6" width="28" height="24" stroke="currentColor" strokeWidth="1.6" />
          <line x1="11" y1="6" x2="11" y2="30" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.65" />
          <line x1="18" y1="6" x2="18" y2="30" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2 2" />
          <line x1="25" y1="6" x2="25" y2="30" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.65" />
        </svg>
      );
    case 'parin-beton':
      return (
        <svg viewBox="0 0 36 36" className={className} fill="none" aria-hidden="true">
          <polygon points="18,4 31,11.5 31,24.5 18,32 5,24.5 5,11.5" stroke="currentColor" strokeWidth="1.6" />
          <path d="M5 11.5 L18 19 L31 11.5 M18 19 L18 32" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.7" />
        </svg>
      );
    case 'toos-khorasan':
      return (
        <svg viewBox="0 0 36 36" className={className} fill="none" aria-hidden="true">
          <path d="M6 28 L6 14 L18 6 L30 14 L30 28 Z" stroke="currentColor" strokeWidth="1.6" />
          <path d="M13 28 V17 H23 V28" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.7" />
        </svg>
      );
    case 'bonyadin':
      return (
        <svg viewBox="0 0 36 36" className={className} fill="none" aria-hidden="true">
          <rect x="5" y="19" width="12" height="10" stroke="currentColor" strokeWidth="1.6" />
          <rect x="19" y="19" width="12" height="10" stroke="currentColor" strokeWidth="1.6" />
          <rect x="12" y="7" width="12" height="10" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      );
    case 'iran-etics':
      return (
        <svg viewBox="0 0 36 36" className={className} fill="none" aria-hidden="true">
          <path d="M6 10 H30 M6 18 H26 M6 26 H30" stroke="currentColor" strokeWidth="1.8" />
          <rect x="25" y="14.5" width="5" height="7" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      );
    case 'multics':
      return (
        <svg viewBox="0 0 36 36" className={className} fill="none" aria-hidden="true">
          <path d="M6 27 V9 L14 21 L22 9 V27" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="miter" />
          <path d="M26 11 L31 25" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.7" />
        </svg>
      );
    case 'bhrc':
      return (
        <svg viewBox="0 0 36 36" className={className} fill="none" aria-hidden="true">
          <circle cx="18" cy="18" r="13" stroke="currentColor" strokeWidth="1.5" />
          <path d="M10 23 L18 9 L26 23 Z" stroke="currentColor" strokeWidth="1.5" />
          <line x1="14" y1="19" x2="22" y2="19" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      );
    case 'nlho':
      return (
        <svg viewBox="0 0 36 36" className={className} fill="none" aria-hidden="true">
          <rect x="6" y="6" width="24" height="24" stroke="currentColor" strokeWidth="1.5" />
          <path d="M6 18 H30 M18 6 V30" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.6" />
          <rect x="13" y="13" width="10" height="10" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case 'bst':
      return (
        <svg viewBox="0 0 36 36" className={className} fill="none" aria-hidden="true">
          <circle cx="18" cy="18" r="12" stroke="currentColor" strokeWidth="1.5" />
          <path d="M18 10 V18 L24 22" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="18" cy="18" r="2" fill="currentColor" />
        </svg>
      );
    case 'farapanel':
      return (
        <svg viewBox="0 0 36 36" className={className} fill="none" aria-hidden="true">
          <polygon points="8,7 22,7 16,29 2,29" stroke="currentColor" strokeWidth="1.5" />
          <polygon points="20,7 34,7 28,29 14,29" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.65" />
        </svg>
      );
    case 'notash-naghsh':
      return (
        <svg viewBox="0 0 36 36" className={className} fill="none" aria-hidden="true">
          <path d="M8 28 V8 L28 28 V8" stroke="currentColor" strokeWidth="1.7" />
          <rect x="15" y="15" width="6" height="6" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.65" />
        </svg>
      );
    case 'zistavin':
      return (
        <svg viewBox="0 0 36 36" className={className} fill="none" aria-hidden="true">
          <path d="M8 10 H28 L8 26 H28" stroke="currentColor" strokeWidth="1.7" />
          <circle cx="18" cy="18" r="3" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      );
    case 'sarvestan':
      return (
        <svg viewBox="0 0 36 36" className={className} fill="none" aria-hidden="true">
          <path d="M18 5 L27 25 H9 Z" stroke="currentColor" strokeWidth="1.6" />
          <line x1="18" y1="13" x2="18" y2="31" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case 'emarat-hashtom':
      return (
        <svg viewBox="0 0 36 36" className={className} fill="none" aria-hidden="true">
          <polygon
            points="13,5 23,5 31,13 31,23 23,31 13,31 5,23 5,13"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <rect x="13" y="13" width="10" height="10" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.65" />
        </svg>
      );
    case 'charsoo':
      return (
        <svg viewBox="0 0 36 36" className={className} fill="none" aria-hidden="true">
          <rect x="6" y="6" width="10" height="10" stroke="currentColor" strokeWidth="1.5" />
          <rect x="20" y="6" width="10" height="10" stroke="currentColor" strokeWidth="1.5" />
          <rect x="6" y="20" width="10" height="10" stroke="currentColor" strokeWidth="1.5" />
          <rect x="20" y="20" width="10" height="10" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case 'shomal-shargh':
      return (
        <svg viewBox="0 0 36 36" className={className} fill="none" aria-hidden="true">
          <path d="M7 29 L18 7 L29 29" stroke="currentColor" strokeWidth="1.6" />
          <path d="M12 29 L18 17 L24 29" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.65" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 36 36" className={className} fill="none" aria-hidden="true">
          <rect x="6" y="6" width="24" height="24" rx="4" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="18" cy="18" r="5" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      );
  }
}

interface PartnerLogosProps {
  locale: Locale;
  partners?: PartnerLogo[];
}

function PartnerLogoItemView({
  partner,
  locale,
  duplicate = false,
}: {
  partner: PartnerLogo;
  locale: Locale;
  duplicate?: boolean;
}) {
  const isFa = locale === 'fa';
  const label = isFa ? partner.nameFa : partner.nameEn;
  const hasUploadedImage = Boolean(partner.logoUrl?.trim());
  const safeHref =
    partner.websiteUrl?.trim() && isSafeExternalUrl(partner.websiteUrl)
      ? partner.websiteUrl.trim()
      : null;

  const content = hasUploadedImage ? (
    <SafeImage
      src={partner.logoUrl!}
      alt={duplicate ? '' : label}
      className="h-5 sm:h-8 w-auto max-w-[110px] sm:max-w-[136px] object-contain opacity-80 grayscale brightness-125 group-hover:opacity-100 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-300"
    />
  ) : (
    <span className="inline-flex items-center gap-1.5 sm:gap-2.5 text-[#9AB0CE] group-hover:text-white transition-colors duration-200 whitespace-nowrap">
      {renderPartnerPresetMark(partner.presetMarkId ?? partner.id, 'w-4 h-4 sm:w-5 sm:h-5 shrink-0 opacity-85 group-hover:opacity-100')}
      <span
        dir={isFa ? 'rtl' : 'ltr'}
        className="text-[11px] sm:text-[12.5px] font-medium tracking-wide rtl:tracking-normal whitespace-nowrap"
      >
        {label}
      </span>
    </span>
  );

  const itemClass =
    'group shrink-0 inline-flex items-center justify-center px-3.5 sm:px-7 py-0.5 sm:py-1 select-none focus-visible:outline-offset-4';

  if (safeHref && !duplicate) {
    return (
      <a
        href={safeHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        title={label}
        className={itemClass}
      >
        {content}
      </a>
    );
  }

  return (
    <div
      aria-label={duplicate ? undefined : label}
      aria-hidden={duplicate ? true : undefined}
      title={duplicate ? undefined : label}
      className={itemClass}
    >
      {content}
    </div>
  );
}

/**
 * Conference-style narrow single-line partner & sponsor logo ribbon.
 * Renders ONLY logos with zero headings, titles, or extra copy.
 */
export function PartnerLogos({ locale, partners }: PartnerLogosProps) {
  const source = partners ?? SEED_PARTNER_LOGOS;
  const items = source
    .filter((p) => p.status === 'published')
    .sort((a, b) => a.order - b.order);

  if (items.length === 0) return null;

  const useMarquee = items.length >= 4;

  return (
    <div
      data-testid="partner-logos-ribbon"
      className="w-full border-y border-white/10 bg-[#070D19]/70 py-2.5 sm:py-4 overflow-hidden"
    >
      {useMarquee ? (
        <div dir="ltr" className="isb-logo-marquee-viewport overflow-hidden">
          <div className="isb-logo-marquee-track">
            <div className="flex items-center shrink-0 divide-x divide-white/8">
              {items.map((partner) => (
                <PartnerLogoItemView key={partner.id} partner={partner} locale={locale} />
              ))}
            </div>
            <div aria-hidden="true" className="flex items-center shrink-0 divide-x divide-white/8">
              {items.map((partner) => (
                <PartnerLogoItemView
                  key={`dup-${partner.id}`}
                  partner={partner}
                  locale={locale}
                  duplicate
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div
          dir="ltr"
          className="flex items-center justify-center flex-nowrap overflow-x-auto divide-x divide-white/8"
        >
          {items.map((partner) => (
            <PartnerLogoItemView key={partner.id} partner={partner} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
