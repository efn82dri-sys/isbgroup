import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { User as FirebaseUser } from 'firebase/auth';
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ExternalLink,
  MapPin,
  Search,
  User,
  X,
} from './icons/IsbIcons';
import { motion } from 'motion/react';
import { DISCIPLINES } from '../data/seedContent';
import { getCopy } from '../data/translations';
import type { Locale, PageRoute, SiteSettings } from '../types/content';
import { MATERIALS_DEPARTMENT_META } from '../utils/materialsCatalog';
import { ARCHITECTURAL_EASE } from '../utils/motionMath';
import { buildPath } from '../utils/routing';
import { isSafeExternalUrl } from '../utils/validation';
import { BrandWordmark } from './BrandMark';

export interface MobileNavEntry {
  key: 'about' | 'expertise' | 'projects' | 'sustainability-lab' | 'insights' | 'courses';
  label: string;
  route: PageRoute;
  accent: string;
  hasSubmenu?: boolean;
}

interface MobileMenuTriggerProps {
  open: boolean;
  isRtl: boolean;
  label: string;
  onClick: () => void;
  buttonRef?: React.RefObject<HTMLButtonElement | null>;
}

/**
 * Refined ISB Mobile Hamburger Trigger.
 * Delicate architectural hairline bars inside a crisp tactile button that
 * morph fluidly into a slender geometric close cross when active.
 */
export function MobileMenuTrigger({
  open,
  isRtl,
  label,
  onClick,
  buttonRef,
}: MobileMenuTriggerProps) {
  return (
    <button
      ref={buttonRef}
      type="button"
      aria-expanded={open}
      aria-controls="isb-mobile-drawer"
      aria-label={label}
      data-testid="mobile-menu-trigger"
      onClick={onClick}
      className={`lg:hidden relative w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300 active:scale-95 cursor-pointer before:content-[''] before:absolute before:-inset-1.5 sm:before:inset-0 ${
        open
          ? 'bg-[#162749]/85 border border-[#6F9BFF]/55 text-white'
          : 'glass-pill text-[#F5F8FC] hover:border-[#6F9BFF]/55'
      }`}
    >
      <span className="relative w-[14px] h-[10px] sm:w-[16px] sm:h-[11px] flex flex-col justify-between items-stretch">
        <motion.span
          animate={
            open
              ? { y: 4.3, rotate: 45, width: '100%', backgroundColor: '#F5F8FC' }
              : { y: 0, rotate: 0, width: '68%', backgroundColor: '#93BCFF' }
          }
          transition={{ duration: 0.28, ease: ARCHITECTURAL_EASE }}
          className={`block h-[1.35px] rounded-full origin-center ${isRtl ? 'ms-auto' : 'me-auto'}`}
        />
        <motion.span
          animate={open ? { opacity: 0, scaleX: 0.25 } : { opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.2, ease: ARCHITECTURAL_EASE }}
          className="block h-[1.35px] w-full rounded-full bg-[#F5F8FC] origin-center"
        />
        <motion.span
          animate={
            open
              ? { y: -4.3, rotate: -45, width: '100%', backgroundColor: '#28CF77' }
              : { y: 0, rotate: 0, width: '78%', backgroundColor: '#28CF77' }
          }
          transition={{ duration: 0.28, ease: ARCHITECTURAL_EASE }}
          className={`block h-[1.35px] rounded-full origin-center ${isRtl ? 'me-auto' : 'ms-auto'}`}
        />
      </span>
    </button>
  );
}

interface MobileMenuDrawerProps {
  open: boolean;
  locale: Locale;
  route: PageRoute;
  activeNavKey: string | null;
  settings: SiteSettings;
  authUser?: FirebaseUser | null;
  onClose: () => void;
  onNavigate: (route: PageRoute) => void;
  onSwitchLocale: (next: Locale) => void;
  onOpenSearch: () => void;
  returnFocusRef?: React.RefObject<HTMLButtonElement | null>;
}

/**
 * Floating Architectural Slide-Over Mobile Sheet:
 * - Soft dimmed backdrop + tactile floating rounded obsidian-glass sheet anchored to the trigger edge
 * - Swipe-to-dismiss gesture support (drag horizontally toward exit edge)
 * - Disciplined micro-typography (13.5–14px) and understated micro-icons (14px), zero chunky labels or numbers
 * - Smooth indented discipline accordion + streamlined utility footer
 */
export function MobileMenuDrawer({
  open,
  locale,
  activeNavKey,
  settings,
  authUser,
  onClose,
  onNavigate,
  onSwitchLocale,
  onOpenSearch,
  returnFocusRef,
}: MobileMenuDrawerProps) {
  const copy = getCopy(locale);
  const isRtl = locale === 'fa';
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;
  const [expertiseExpanded, setExpertiseExpanded] = useState(activeNavKey === 'expertise');

  // Deterministic mount/visible lifecycle (avoids React 19 + motion/react AnimatePresence-in-portal
  // exit freeze on repeated open/close cycles while keeping silky 60fps GPU transitions).
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      let raf2 = 0;
      const raf1 = window.requestAnimationFrame(() => {
        raf2 = window.requestAnimationFrame(() => setVisible(true));
      });
      return () => {
        window.cancelAnimationFrame(raf1);
        window.cancelAnimationFrame(raf2);
      };
    }
    setVisible(false);
    const timer = window.setTimeout(() => setMounted(false), 260);
    return () => window.clearTimeout(timer);
  }, [open]);

  // Lock page scroll while drawer is open and handle Escape cleanly
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        window.setTimeout(() => returnFocusRef?.current?.focus(), 40);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.documentElement.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose, returnFocusRef]);

  useEffect(() => {
    if (open && activeNavKey === 'expertise') {
      setExpertiseExpanded(true);
    }
  }, [open, activeNavKey]);

  const navItems: MobileNavEntry[] = [
    { key: 'about', label: copy.nav.about, route: { page: 'about' }, accent: '#6F9BFF' },
    {
      key: 'expertise',
      label: copy.nav.expertise,
      route: { page: 'expertise' },
      accent: '#93B1FF',
      hasSubmenu: true,
    },
    { key: 'projects', label: copy.nav.projects, route: { page: 'projects' }, accent: '#68C4F8' },
    {
      key: 'sustainability-lab',
      label: copy.nav.lab,
      route: { page: 'sustainability-lab' },
      accent: '#28CF77',
    },
    { key: 'insights', label: copy.nav.insights, route: { page: 'insights' }, accent: '#9AC4F8' },
    { key: 'courses', label: copy.nav.courses, route: { page: 'courses' }, accent: '#28CF77' },
  ];

  const handleNav = (e: React.MouseEvent, target: PageRoute) => {
    e.preventDefault();
    onClose();
    onNavigate(target);
  };

  const handleCloseWithFocus = () => {
    onClose();
    window.setTimeout(() => returnFocusRef?.current?.focus(), 40);
  };

  // Trigger button sits on the end side (left in RTL, right in LTR), so sheet slides from that edge.
  const exitOffsetX = isRtl ? -360 : 360;

  // Native touch swipe-to-dismiss: tracks intentional horizontal touch drag toward exit edge.
  const touchStartRef = React.useRef<{ x: number; y: number; time: number } | null>(null);
  const [swipeDeltaX, setSwipeDeltaX] = useState(0);

  useEffect(() => {
    if (!open) setSwipeDeltaX(0);
  }, [open]);

  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    if (!t) return;
    touchStartRef.current = { x: t.clientX, y: t.clientY, time: Date.now() };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const start = touchStartRef.current;
    const t = e.touches[0];
    if (!start || !t) return;
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) < 10 || Math.abs(dx) <= Math.abs(dy)) return;
    if (isRtl && dx < 0) {
      setSwipeDeltaX(Math.max(dx, -260));
    } else if (!isRtl && dx > 0) {
      setSwipeDeltaX(Math.min(dx, 260));
    }
  };

  const handleTouchEnd = () => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start) return;
    const elapsed = Math.max(1, Date.now() - start.time);
    const velocity = Math.abs(swipeDeltaX) / elapsed;
    const swipedOut = isRtl
      ? swipeDeltaX < -64 || (swipeDeltaX < -24 && velocity > 0.45)
      : swipeDeltaX > 64 || (swipeDeltaX > 24 && velocity > 0.45);
    setSwipeDeltaX(0);
    if (swipedOut) {
      handleCloseWithFocus();
    }
  };

  const safeInstagram =
    settings.instagramUrl && isSafeExternalUrl(settings.instagramUrl)
      ? settings.instagramUrl
      : null;

  const studioCity = (isRtl ? settings.studioCityFa : settings.studioCityEn)?.trim();

  if (typeof document === 'undefined' || !mounted) return null;

  const isSwiping = swipeDeltaX !== 0;
  const sheetTranslateX = visible ? swipeDeltaX : exitOffsetX;

  return createPortal(
    <>
      {/* Soft Frosted Backdrop — tap anywhere outside to dismiss */}
      <div
        aria-hidden="true"
        data-testid="mobile-menu-backdrop"
        onClick={handleCloseWithFocus}
        style={{
          opacity: visible ? 1 : 0,
          transition: 'opacity 220ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
        className={`lg:hidden fixed inset-0 z-[85] bg-[#040812]/66 backdrop-blur-md cursor-pointer ${
          visible ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
      />

      {/* Sculpted Floating Obsidian-Glass Slide-Over Sheet */}
      <aside
        id="isb-mobile-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={isRtl ? 'منوی ناوبری گروه ISB' : 'ISB Group navigation menu'}
        data-testid="mobile-menu-sheet"
        dir={isRtl ? 'rtl' : 'ltr'}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        style={{
          transform: `translate3d(${sheetTranslateX}px, 0, 0)`,
          opacity: visible ? 1 : 0.72,
          transition: isSwiping
            ? 'none'
            : visible
              ? 'transform 340ms cubic-bezier(0.22, 1, 0.36, 1), opacity 220ms ease-out'
              : 'transform 240ms cubic-bezier(0.22, 1, 0.36, 1), opacity 200ms ease-in',
        }}
        className={`lg:hidden fixed top-2 bottom-2 sm:top-3 sm:bottom-3 z-[86] ${
          isRtl ? 'left-2 sm:left-3' : 'right-2 sm:right-3'
        } ${
          visible ? 'pointer-events-auto' : 'pointer-events-none'
        } w-[min(82vw,304px)] rounded-[22px] border border-white/[0.11] bg-gradient-to-b from-[#0C1629]/95 via-[#091121]/97 to-[#060C18]/98 backdrop-blur-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_28px_72px_-16px_rgba(0,0,0,0.92)] flex flex-col overflow-hidden will-change-transform`}
      >
        {/* Subtle Architectural Top Specular Edge */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 inset-x-8 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
        />

        {/* Compact Header Bar: Delicate Brand Mark + Sleek FA/EN Switch + Subtle Close */}
        <div className="flex items-center justify-between gap-2 px-3.5 h-12 border-b border-white/[0.07] shrink-0">
          <a
            href={buildPath(locale, { page: 'home' })}
            onClick={(e) => handleNav(e, { page: 'home' })}
            className="inline-flex items-center min-h-[40px] rounded-lg focus-visible:outline-offset-4"
          >
            <BrandWordmark locale={locale} settings={settings} size="sm" />
          </a>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Featherweight Segmented Language Switcher */}
            <div
              role="group"
              aria-label={isRtl ? 'انتخاب زبان' : 'Language selector'}
              className="inline-flex items-center rounded-lg border border-white/[0.09] bg-white/[0.03] p-0.5"
            >
              <button
                type="button"
                aria-pressed={locale === 'fa'}
                onClick={() => onSwitchLocale('fa')}
                className={`relative h-7 px-2.5 rounded-[6px] text-[11px] font-medium transition-all duration-200 cursor-pointer ${
                  locale === 'fa'
                    ? 'text-white bg-[#1E3573] border border-[#6F9BFF]/35'
                    : 'text-[#8DA2C0] border border-transparent hover:text-white'
                }`}
              >
                <span>فا</span>
              </button>
              <button
                type="button"
                aria-pressed={locale === 'en'}
                onClick={() => onSwitchLocale('en')}
                className={`relative h-7 px-2.5 rounded-[6px] text-[11px] font-medium ltr-inline transition-all duration-200 cursor-pointer ${
                  locale === 'en'
                    ? 'text-white bg-[#1E3573] border border-[#6F9BFF]/35'
                    : 'text-[#8DA2C0] border border-transparent hover:text-white'
                }`}
              >
                <span>EN</span>
              </button>
            </div>

            {/* Understated Close Button with Expanded 44px Touch Zone */}
            <button
              type="button"
              onClick={handleCloseWithFocus}
              aria-label={copy.nav.closeLabel}
              data-testid="mobile-menu-close"
              className="relative w-8 h-8 rounded-lg border border-white/[0.09] bg-white/[0.04] text-[#C6D4E8] hover:text-white hover:bg-white/[0.08] active:scale-95 flex items-center justify-center transition-all cursor-pointer before:content-[''] before:absolute before:-inset-1.5"
            >
              <X className="w-3.5 h-3.5" strokeWidth={1.75} />
            </button>
          </div>
        </div>

        {/* Slim Quick-Search Trigger Row */}
        <div className="px-3.5 pt-2.5 pb-1 shrink-0">
          <button
            type="button"
            data-testid="mobile-menu-search"
            onClick={() => {
              onClose();
              window.setTimeout(() => onOpenSearch(), 70);
            }}
            className="w-full min-h-[40px] rounded-xl border border-white/[0.08] bg-white/[0.025] hover:bg-white/[0.05] hover:border-white/[0.14] px-3 flex items-center gap-2 text-[11.5px] text-[#8DA2C0] hover:text-[#DCE8FA] active:scale-[0.99] transition-all cursor-pointer"
          >
            <Search className="w-3.5 h-3.5 text-[#6F9BFF] shrink-0" strokeWidth={1.65} />
            <span className="truncate">
              {isRtl ? 'جستجو در پروژه‌ها، مقالات و دوره‌ها...' : 'Search projects, insights, courses...'}
            </span>
          </button>
        </div>

        {/* Clean Architectural Navigation List (Refined 13.5–14px Scale, Zero Oversized Text or Numbers) */}
        <div className="flex-1 overflow-y-auto px-3 py-2.5">
          <nav
            aria-label={isRtl ? 'منوی اصلی موبایل' : 'Mobile primary navigation'}
            className="space-y-0.5"
          >
            {navItems.map((item, idx) => {
              const isActive = activeNavKey === item.key;
              const itemTransitionStyle: React.CSSProperties = {
                opacity: visible ? 1 : 0,
                transform: visible ? 'translate3d(0, 0, 0)' : 'translate3d(0, 6px, 0)',
                transition: `opacity 240ms cubic-bezier(0.22, 1, 0.36, 1) ${40 + idx * 24}ms, transform 260ms cubic-bezier(0.22, 1, 0.36, 1) ${40 + idx * 24}ms`,
              };

              if (item.hasSubmenu) {
                return (
                  <div
                    key={item.key}
                    style={itemTransitionStyle}
                    className={`rounded-xl transition-colors ${
                      expertiseExpanded || isActive ? 'bg-white/[0.035]' : ''
                    }`}
                  >
                    <div className="relative flex items-center justify-between gap-1 min-h-[44px] px-2.5">
                      {isActive && (
                        <span
                          aria-hidden="true"
                          className="absolute start-0 top-1/2 -translate-y-1/2 w-[2px] h-4 rounded-full"
                          style={{ backgroundColor: item.accent }}
                        />
                      )}

                      <a
                        href={buildPath(locale, item.route)}
                        onClick={(e) => handleNav(e, item.route)}
                        className="flex-1 flex items-center gap-2.5 py-2.5 min-w-0"
                      >
                        <span
                          aria-hidden="true"
                          className="w-1.5 h-1.5 rotate-45 shrink-0 transition-colors"
                          style={{
                            backgroundColor: isActive || expertiseExpanded ? item.accent : 'rgba(148,179,224,0.34)',
                          }}
                        />
                        <span
                          className={`text-[13px] rtl:text-[13.5px] tracking-normal truncate transition-colors ${
                            isActive
                              ? 'font-semibold text-white'
                              : 'font-medium text-[#D6E2F3] hover:text-white'
                          }`}
                        >
                          {item.label}
                        </span>
                      </a>

                      <button
                        type="button"
                        aria-expanded={expertiseExpanded}
                        aria-label={
                          isRtl ? 'باز و بسته کردن زیرمنوی تخصص‌ها' : 'Toggle expertise disciplines'
                        }
                        data-testid="mobile-expertise-toggle"
                        onClick={() => setExpertiseExpanded((prev) => !prev)}
                        className="w-9 h-9 -me-1.5 rounded-lg flex items-center justify-center text-[#90A6C5] hover:text-white hover:bg-white/[0.06] transition-colors shrink-0 cursor-pointer"
                      >
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform duration-200 ${
                            expertiseExpanded ? 'rotate-180 text-[#7FA8FF]' : ''
                          }`}
                          strokeWidth={1.7}
                        />
                      </button>
                    </div>

                    <div
                      data-testid="mobile-expertise-submenu"
                      className="grid"
                      style={{
                        gridTemplateRows: expertiseExpanded ? '1fr' : '0fr',
                        opacity: expertiseExpanded ? 1 : 0,
                        transition:
                          'grid-template-rows 240ms cubic-bezier(0.22, 1, 0.36, 1), opacity 200ms ease',
                      }}
                    >
                      <div className="min-h-0 overflow-hidden">
                        <div className="ms-3.5 me-2 mb-1.5 ps-2.5 border-s border-white/[0.1] space-y-0.5 pt-0.5">
                          {DISCIPLINES.map((disc) => (
                            <a
                              key={disc.slug}
                              href={buildPath(locale, { page: 'discipline', slug: disc.slug })}
                              onClick={(e) =>
                                handleNav(e, { page: 'discipline', slug: disc.slug })
                              }
                              tabIndex={expertiseExpanded ? 0 : -1}
                              className="min-h-[40px] flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-[12px] text-[#AEBFD9] hover:text-white hover:bg-white/[0.045] transition-colors"
                            >
                              <span className="truncate">{disc.title[locale]}</span>
                              <ArrowIcon
                                className="w-3 h-3 text-[#6E84A4] shrink-0"
                                strokeWidth={1.6}
                              />
                            </a>
                          ))}
                          <div className="my-1.5 border-t border-white/[0.09]" />
                          <a
                            href={buildPath(locale, { page: 'materials-technologies' })}
                            onClick={(e) => handleNav(e, { page: 'materials-technologies' })}
                            tabIndex={expertiseExpanded ? 0 : -1}
                            className="min-h-[42px] flex items-center justify-between gap-2 rounded-lg border border-[#DFBA78]/25 bg-[#DFBA78]/[0.06] hover:bg-[#DFBA78]/[0.14] px-2.5 py-2 text-[12px] font-medium text-[#F3DCA6] transition-colors"
                          >
                            <span className="truncate">
                              {MATERIALS_DEPARTMENT_META.title[locale]}
                            </span>
                            <ArrowIcon
                              className="w-3 h-3 text-[#DFBA78] shrink-0"
                              strokeWidth={1.6}
                            />
                          </a>
                          <a
                            href={buildPath(locale, { page: 'expertise' })}
                            onClick={(e) => handleNav(e, { page: 'expertise' })}
                            tabIndex={expertiseExpanded ? 0 : -1}
                            className="min-h-[38px] flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-[11.5px] font-medium text-[#7FA8FF] hover:bg-white/[0.045] transition-colors"
                          >
                            <span>{copy.nav.allServices}</span>
                            <ArrowIcon className="w-3 h-3 shrink-0" strokeWidth={1.6} />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <a
                  key={item.key}
                  href={buildPath(locale, item.route)}
                  onClick={(e) => handleNav(e, item.route)}
                  style={itemTransitionStyle}
                  className={`group relative min-h-[44px] rounded-xl px-2.5 py-2.5 flex items-center justify-between gap-2.5 transition-colors active:scale-[0.99] ${
                    isActive
                      ? 'bg-white/[0.065] text-white'
                      : 'text-[#D6E2F3] hover:bg-white/[0.035] hover:text-white'
                  }`}
                >
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute start-0 top-1/2 -translate-y-1/2 w-[2px] h-4 rounded-full"
                      style={{ backgroundColor: item.accent }}
                    />
                  )}

                  <span className="flex items-center gap-2.5 min-w-0">
                    <span
                      aria-hidden="true"
                      className="w-1.5 h-1.5 rotate-45 shrink-0 transition-colors"
                      style={{
                        backgroundColor: isActive ? item.accent : 'rgba(148,179,224,0.34)',
                      }}
                    />
                    <span
                      className={`text-[13px] rtl:text-[13.5px] truncate ${
                        isActive ? 'font-semibold' : 'font-medium'
                      }`}
                    >
                      {item.label}
                    </span>
                  </span>

                  <ArrowIcon
                    className="w-3.5 h-3.5 shrink-0 transition-all duration-200 opacity-35 group-hover:opacity-80"
                    style={isActive ? { color: item.accent, opacity: 0.9 } : undefined}
                    strokeWidth={1.6}
                  />
                </a>
              );
            })}
          </nav>
        </div>

        {/* Sleek Compact Footer Dock — Balanced Twin Actions + Quiet Studio Meta */}
        <div className="shrink-0 border-t border-white/[0.07] bg-[#060C18]/75 px-3.5 pt-2.5 pb-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <a
              href={buildPath(locale, { page: 'account' })}
              onClick={(e) => handleNav(e, { page: 'account' })}
              className="min-h-[42px] rounded-xl border border-white/[0.1] bg-white/[0.035] hover:bg-white/[0.07] hover:border-white/[0.18] px-2.5 inline-flex items-center justify-center gap-1.5 text-[11.5px] font-medium text-[#E4EEFB] active:scale-[0.98] transition-all min-w-0"
            >
              {authUser?.photoURL ? (
                <img
                  src={authUser.photoURL}
                  alt={authUser.displayName || 'Account'}
                  referrerPolicy="no-referrer"
                  className="w-4 h-4 rounded-full object-cover border border-[#28CF77]/60 shrink-0"
                />
              ) : (
                <User className="w-3.5 h-3.5 text-[#28CF77] shrink-0" strokeWidth={1.7} />
              )}
              <span className="truncate">
                {authUser
                  ? authUser.displayName?.split(' ')[0] || (isRtl ? 'پنل من' : 'Account')
                  : isRtl
                    ? 'پنل کاربری'
                    : 'Sign In'}
              </span>
            </a>

            <a
              href={buildPath(locale, { page: 'contact' })}
              onClick={(e) => handleNav(e, { page: 'contact' })}
              className="min-h-[42px] rounded-xl border border-[#6F9BFF]/38 bg-[#1B316E]/85 hover:bg-[#223D88] px-2.5 inline-flex items-center justify-center gap-1.5 text-[11.5px] font-semibold text-white active:scale-[0.98] transition-all min-w-0"
            >
              <span className="truncate">{copy.nav.contact}</span>
              <ArrowIcon className="w-3 h-3 shrink-0 text-[#93BCFF]" strokeWidth={1.75} />
            </a>
          </div>

          {(studioCity || safeInstagram) && (
            <div className="flex items-center justify-between gap-2 pt-0.5 text-[11px] text-[#7D92B2]">
              {studioCity ? (
                <span className="inline-flex items-center gap-1 min-w-0 truncate">
                  <MapPin className="w-3 h-3 text-[#6F9BFF]/80 shrink-0" strokeWidth={1.6} />
                  <span className="truncate">{studioCity}</span>
                </span>
              ) : (
                <span />
              )}

              {safeInstagram && (
                <a
                  href={safeInstagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="inline-flex items-center gap-1 text-[#8EA4C5] hover:text-[#28CF77] transition-colors shrink-0 ltr-inline"
                >
                  <span>@isb.group</span>
                  <ExternalLink className="w-2.5 h-2.5" strokeWidth={1.6} />
                </a>
              )}
            </div>
          )}
        </div>
      </aside>
    </>,
    document.body
  );
}
