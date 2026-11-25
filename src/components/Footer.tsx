import React from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { DEFAULT_SITE_SETTINGS } from '../data/seedContent';
import { getCopy } from '../data/translations';
import type { Locale, PageRoute, SiteSettings } from '../types/content';
import { isStudioAdminUser } from '../utils/accountLogic';
import { buildPath } from '../utils/routing';
import { isSafeExternalUrl } from '../utils/validation';
import { BrandWordmark, IsbPatternOverlay } from './BrandMark';
import {
  InstagramIcon,
  LinkedinIcon,
  ShieldCheck,
  TelegramIcon,
  WhatsAppIcon,
  YoutubeIcon,
} from './icons/IsbIcons';

interface FooterProps {
  locale: Locale;
  settings: SiteSettings;
  authUser?: FirebaseUser | null;
  onNavigate: (route: PageRoute) => void;
}

export function Footer({ locale, settings, authUser, onNavigate }: FooterProps) {
  const copy = getCopy(locale);
  const isFa = locale === 'fa';
  const showStudioAdminLink = isStudioAdminUser(authUser);

  const navItems: { label: string; route: PageRoute }[] = [
    { label: copy.nav.about, route: { page: 'about' } },
    { label: copy.nav.expertise, route: { page: 'expertise' } },
    { label: copy.nav.projects, route: { page: 'projects' } },
    { label: copy.nav.lab, route: { page: 'sustainability-lab' } },
    { label: copy.nav.insights, route: { page: 'insights' } },
    { label: copy.nav.courses, route: { page: 'courses' } },
    { label: copy.nav.contact, route: { page: 'contact' } },
  ];

  const resolvedLinkedin =
    settings.linkedinUrl?.trim() || DEFAULT_SITE_SETTINGS.linkedinUrl || '';
  const resolvedInstagram =
    settings.instagramUrl?.trim() || DEFAULT_SITE_SETTINGS.instagramUrl || '';
  const resolvedTelegram = settings.telegramUrl?.trim() || '';
  const resolvedWhatsapp = settings.whatsappUrl?.trim() || '';
  const resolvedYoutube = settings.youtubeUrl?.trim() || '';

  const coreSocials: {
    id: string;
    url: string;
    label: string;
    title: string;
    tone: 'cobalt' | 'emerald';
    icon: React.ReactNode;
  }[] = [
    {
      id: 'instagram',
      url: resolvedInstagram,
      label: copy.footer.instagramAria,
      title: copy.footer.instagramAria,
      tone: 'cobalt',
      icon: <InstagramIcon className="w-3.5 h-3.5 lg:w-[18px] lg:h-[18px]" />,
    },
    {
      id: 'linkedin',
      url: resolvedLinkedin,
      label: copy.footer.linkedinAria,
      title: copy.footer.linkedinAria,
      tone: 'cobalt',
      icon: <LinkedinIcon className="w-3.5 h-3.5 lg:w-[18px] lg:h-[18px]" />,
    },
    {
      id: 'telegram',
      url: resolvedTelegram,
      label: copy.footer.telegramAria,
      title: resolvedTelegram
        ? copy.footer.telegramAria
        : isFa
          ? 'تلگرام گروه ISB — ارتباط مستقیم'
          : 'ISB Group Telegram — Contact',
      tone: 'cobalt',
      icon: <TelegramIcon className="w-3.5 h-3.5 lg:w-[18px] lg:h-[18px]" />,
    },
    {
      id: 'whatsapp',
      url: resolvedWhatsapp,
      label: copy.footer.whatsappAria,
      title: resolvedWhatsapp
        ? copy.footer.whatsappAria
        : isFa
          ? 'واتساپ گروه ISB — ارتباط مستقیم'
          : 'ISB Group WhatsApp — Contact',
      tone: 'emerald',
      icon: <WhatsAppIcon className="w-3.5 h-3.5 lg:w-[18px] lg:h-[18px]" />,
    },
  ];

  if (resolvedYoutube && isSafeExternalUrl(resolvedYoutube)) {
    coreSocials.push({
      id: 'youtube',
      url: resolvedYoutube,
      label: copy.footer.youtubeAria,
      title: copy.footer.youtubeAria,
      tone: 'cobalt',
      icon: <YoutubeIcon className="w-3.5 h-3.5 lg:w-[18px] lg:h-[18px]" />,
    });
  }

  const renderSocialLinks = (sizeClass: string) =>
    coreSocials.map((social) => {
      const hasDirectUrl = Boolean(social.url && isSafeExternalUrl(social.url));
      const hoverToneClass =
        social.tone === 'emerald'
          ? 'hover:border-[#28CF77]/75 hover:text-[#28CF77] hover:bg-[#00A651]/20'
          : 'hover:border-[#6F9BFF]/75 hover:text-[#93BCFF] hover:bg-[#223A87]/35';

      if (hasDirectUrl) {
        return (
          <a
            key={social.id}
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={social.label}
            title={social.title}
            className={`glass-pill relative ${sizeClass} rounded-full flex items-center justify-center text-[#C6D2E3] active:scale-95 transition-all duration-200 before:content-[''] before:absolute before:-inset-2 lg:before:inset-0 ${hoverToneClass}`}
          >
            {social.icon}
          </a>
        );
      }

      return (
        <a
          key={social.id}
          href={buildPath(locale, { page: 'contact' })}
          onClick={(e) => {
            e.preventDefault();
            onNavigate({ page: 'contact' });
          }}
          aria-label={social.label}
          title={social.title}
          className={`glass-pill relative ${sizeClass} rounded-full flex items-center justify-center text-[#C6D2E3] active:scale-95 transition-all duration-200 before:content-[''] before:absolute before:-inset-2 lg:before:inset-0 ${hoverToneClass}`}
        >
          {social.icon}
        </a>
      );
    });

  return (
    <footer
      data-testid="site-footer"
      className="relative z-10 overflow-hidden border-t border-[#6F9BFF]/18 bg-[#080D16]/88 backdrop-blur-2xl pt-4 pb-3.5 lg:pt-9 lg:pb-7"
    >
      {/* Crisp signature ISB catalog brand accent ribbon */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-[#223A87] via-[#00A651] to-[#223A87]"
      />
      {/* Official ISB catalog parallelogram pattern */}
      <IsbPatternOverlay
        color="#4F7AE8"
        opacity={0.09}
        scale={0.9}
        maskStyle="radial-gradient(ellipse 68% 95% at 88% 95%, black 0%, transparent 76%)"
      />
      {/* Subtle architectural contour lines near bottom */}
      <svg
        viewBox="0 0 1440 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-x-0 bottom-0 w-full h-16 lg:h-28 opacity-[0.11]"
      >
        <path
          d="M0 130C220 75 430 148 720 105C1010 62 1220 138 1440 90"
          stroke="#6F9BFF"
          strokeWidth="1"
        />
        <path
          d="M0 148C260 95 490 156 760 120C1040 84 1235 148 1440 112"
          stroke="#00A651"
          strokeWidth="1"
        />
        <path
          d="M0 110C190 55 460 128 700 88C980 42 1200 118 1440 72"
          stroke="#F5F8FC"
          strokeWidth="0.8"
        />
      </svg>

      <div className="relative max-w-[1380px] mx-auto px-3.5 sm:px-6 lg:px-10">
        {/* Main Band: Ultra-compact refined header + touch-friendly nav on mobile; 3-zone horizontal row on desktop */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 lg:gap-8 pb-2.5 lg:pb-7 border-b border-[#6F9BFF]/14">
          {/* Brand + (on mobile) Social Channels paired cleanly on one horizontal line */}
          <div className="space-y-1 lg:space-y-2">
            <div className="flex items-center justify-between gap-3">
              <a
                href={buildPath(locale, { page: 'home' })}
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate({ page: 'home' });
                }}
                className="inline-flex items-center min-h-[36px] shrink-0"
              >
                <BrandWordmark
                  locale={locale}
                  settings={settings}
                  size="sm"
                  className="[&_img]:h-[18px] [&_img]:sm:h-6 [&_img]:lg:h-[34px]"
                />
              </a>

              {/* Mobile / Tablet Social Row — visually delicate 28px pills with 44px touch hitboxes */}
              <div className="flex lg:hidden items-center gap-2 shrink-0">
                {renderSocialLinks('w-7 h-7')}
              </div>
            </div>

            <p className="text-[10.5px] lg:text-xs text-[#8B9DB7]/88 leading-snug tracking-wide rtl:tracking-normal">
              {copy.footer.disciplinesLine}
            </p>
          </div>

          {/* Primary Navigation Links: sleek compact 2-row touch-friendly layout on mobile, single row on desktop */}
          <nav
            aria-label={isFa ? 'لینک‌های فوتر' : 'Footer navigation'}
            className="flex flex-col gap-y-0 pt-1.5 border-t border-white/8 lg:border-t-0 lg:pt-0 lg:flex-row lg:flex-wrap lg:items-center lg:gap-x-6 lg:gap-y-2"
          >
            {[navItems.slice(0, 4), navItems.slice(4)].map((row, rowIdx) => (
              <div
                key={rowIdx}
                className="flex flex-wrap items-center gap-x-1.5 gap-y-0 lg:contents"
              >
                {row.map((item, idx) => (
                  <React.Fragment key={item.label}>
                    <a
                      href={buildPath(locale, item.route)}
                      onClick={(e) => {
                        e.preventDefault();
                        onNavigate(item.route);
                      }}
                      className="min-h-[36px] lg:min-h-0 px-1 lg:px-0 py-1 lg:py-0.5 inline-flex items-center text-[11px] lg:text-[13px] text-[#C6D2E3] hover:text-[#6F9BFF] active:text-white transition-colors whitespace-nowrap"
                    >
                      {item.label}
                    </a>
                    {idx < row.length - 1 && (
                      <span
                        aria-hidden="true"
                        className="lg:hidden text-[9px] text-[#6F9BFF]/32 select-none"
                      >
                        ·
                      </span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            ))}
          </nav>

          {/* Desktop Social Channels */}
          <div className="hidden lg:flex items-center gap-2.5 shrink-0">
            {renderSocialLinks('w-10 h-10')}
          </div>
        </div>

        {/* Bottom Copyright & Admin-Only Shortcut */}
        <div className="pt-2.5 lg:pt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[10px] lg:text-xs text-[#8B9DB7]/82">
          <p className="leading-snug">
            {isFa ? copy.footer.copyright : `© ${new Date().getFullYear()} ${copy.footer.copyright}`}
          </p>
          {showStudioAdminLink && (
            <a
              href={buildPath(locale, { page: 'studio' })}
              data-testid="footer-studio-admin-link"
              onClick={(e) => {
                e.preventDefault();
                onNavigate({ page: 'studio' });
              }}
              className="inline-flex items-center gap-1.5 min-h-[36px] lg:min-h-0 text-[#28CF77] hover:text-[#6FF3AC] font-medium transition-colors whitespace-nowrap"
            >
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>{copy.nav.staffPortal}</span>
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}
