import React, { useEffect, useRef, useState } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { ChevronDown, Globe, Search, User } from './icons/IsbIcons';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { DISCIPLINES } from '../data/seedContent';
import { getCopy } from '../data/translations';
import type { Locale, PageRoute, SiteSettings } from '../types/content';
import { MATERIALS_DEPARTMENT_META } from '../utils/materialsCatalog';
import { ARCHITECTURAL_EASE } from '../utils/motionMath';
import { buildPath } from '../utils/routing';
import { BrandWordmark } from './BrandMark';
import { MobileMenuDrawer, MobileMenuTrigger } from './MobileMenuDrawer';

type NavItemKey =
  | 'about'
  | 'expertise'
  | 'projects'
  | 'sustainability-lab'
  | 'insights'
  | 'courses';

interface NavPillTheme {
  gradient: string;
  border: string;
  shadow: string;
  text: string;
  dot: string;
}

/**
 * Distinct, cool-analogous architectural glass pill palettes rooted in ISB's official
 * Cobalt (#223A87) and Sustainability Emerald (#00A651) catalog identity.
 */
const NAV_PILL_THEMES: Record<NavItemKey, NavPillTheme> = {
  about: {
    gradient:
      'linear-gradient(135deg, rgba(34, 58, 135, 0.64) 0%, rgba(56, 98, 214, 0.26) 100%)',
    border: 'rgba(116, 160, 255, 0.62)',
    shadow:
      'inset 0 1px 0 rgba(220, 234, 255, 0.36), 0 6px 24px -6px rgba(34, 58, 135, 0.68)',
    text: '#E4EEFF',
    dot: '#6F9BFF',
  },
  expertise: {
    gradient:
      'linear-gradient(135deg, rgba(48, 72, 166, 0.56) 0%, rgba(84, 114, 224, 0.22) 100%)',
    border: 'rgba(146, 174, 255, 0.58)',
    shadow:
      'inset 0 1px 0 rgba(226, 235, 255, 0.34), 0 6px 22px -6px rgba(58, 86, 192, 0.56)',
    text: '#E8EEFF',
    dot: '#93B1FF',
  },
  projects: {
    gradient:
      'linear-gradient(135deg, rgba(18, 102, 168, 0.52) 0%, rgba(44, 148, 214, 0.20) 100%)',
    border: 'rgba(104, 196, 248, 0.58)',
    shadow:
      'inset 0 1px 0 rgba(218, 244, 255, 0.34), 0 6px 22px -6px rgba(20, 112, 180, 0.55)',
    text: '#DAF3FF',
    dot: '#68C4F8',
  },
  'sustainability-lab': {
    gradient:
      'linear-gradient(135deg, rgba(0, 166, 81, 0.46) 0%, rgba(16, 186, 98, 0.18) 100%)',
    border: 'rgba(52, 216, 132, 0.60)',
    shadow:
      'inset 0 1px 0 rgba(214, 255, 232, 0.36), 0 6px 22px -6px rgba(0, 166, 81, 0.55)',
    text: '#D1FDE5',
    dot: '#28CF77',
  },
  insights: {
    gradient:
      'linear-gradient(135deg, rgba(64, 114, 184, 0.48) 0%, rgba(112, 162, 226, 0.18) 100%)',
    border: 'rgba(154, 196, 248, 0.56)',
    shadow:
      'inset 0 1px 0 rgba(226, 240, 255, 0.34), 0 6px 22px -6px rgba(64, 114, 184, 0.50)',
    text: '#E4F0FF',
    dot: '#9AC4F8',
  },
  courses: {
    gradient:
      'linear-gradient(135deg, rgba(0, 152, 92, 0.52) 0%, rgba(34, 58, 135, 0.34) 100%)',
    border: 'rgba(64, 218, 148, 0.62)',
    shadow:
      'inset 0 1px 0 rgba(214, 255, 236, 0.36), 0 6px 22px -6px rgba(0, 166, 81, 0.52)',
    text: '#D8FFEE',
    dot: '#28CF77',
  },
};

function getActiveNavKey(route: PageRoute): NavItemKey | null {
  switch (route.page) {
    case 'about':
      return 'about';
    case 'expertise':
    case 'discipline':
    case 'materials-technologies':
      return 'expertise';
    case 'projects':
    case 'project-detail':
      return 'projects';
    case 'sustainability-lab':
      return 'sustainability-lab';
    case 'insights':
    case 'insight-detail':
      return 'insights';
    case 'courses':
      return 'courses';
    default:
      return null;
  }
}

interface HeaderProps {
  locale: Locale;
  route: PageRoute;
  settings: SiteSettings;
  authUser?: FirebaseUser | null;
  onNavigate: (route: PageRoute) => void;
  onSwitchLocale: (next: Locale) => void;
  onOpenSearch: () => void;
  searchTriggerRef: React.RefObject<HTMLButtonElement | null>;
}

export function Header({
  locale,
  route,
  settings,
  authUser,
  onNavigate,
  onSwitchLocale,
  onOpenSearch,
  searchTriggerRef,
}: HeaderProps) {
  const copy = getCopy(locale);
  const [scrolled, setScrolled] = useState(false);
  const [expertiseOpen, setExpertiseOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hoveredNav, setHoveredNav] = useState<NavItemKey | null>(null);

  const expertiseRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const mobileMenuTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setExpertiseOpen(false);
        setLangMenuOpen(false);
        setMobileMenuOpen(false);
      }
    };
    const onClickOutside = (e: MouseEvent) => {
      if (expertiseRef.current && !expertiseRef.current.contains(e.target as Node)) {
        setExpertiseOpen(false);
      }
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onClickOutside);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onClickOutside);
    };
  }, []);

  const isHome = route.page === 'home';
  const solidHeader = !isHome || scrolled || mobileMenuOpen;

  const handleLinkClick = (e: React.MouseEvent, target: PageRoute) => {
    e.preventDefault();
    setExpertiseOpen(false);
    setMobileMenuOpen(false);
    onNavigate(target);
  };

  const activeNavKey = getActiveNavKey(route);
  const highlightedKey: NavItemKey | null =
    hoveredNav ?? (expertiseOpen ? 'expertise' : activeNavKey);

  const navLinkClass = (itemKey: NavItemKey) => {
    const isHighlighted = highlightedKey === itemKey;
    return `relative z-10 inline-flex items-center justify-center rounded-full px-2.5 xl:px-3.5 py-1.5 text-[12.5px] xl:text-[13px] rtl:text-[13px] xl:rtl:text-[13.5px] font-medium whitespace-nowrap shrink-0 transition-colors duration-250 ${
      isHighlighted ? '' : 'text-[#F5F3EE]/88 hover:text-[#F7F5F0]'
    }`;
  };

  const renderSlidingPill = (itemKey: NavItemKey) => {
    const isHighlighted = highlightedKey === itemKey;
    const isCurrentRoute = activeNavKey === itemKey;
    const theme = NAV_PILL_THEMES[itemKey];

    return (
      <>
        {isHighlighted && (
          <motion.span
            layoutId="header-nav-pill"
            aria-hidden="true"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{
              opacity: 1,
              scale: 1,
              background: theme.gradient,
              borderColor: theme.border,
              boxShadow: theme.shadow,
            }}
            transition={{
              layout: { type: 'spring', stiffness: 270, damping: 28, mass: 0.85 },
              background: { duration: 0.32, ease: ARCHITECTURAL_EASE },
              borderColor: { duration: 0.32, ease: ARCHITECTURAL_EASE },
              boxShadow: { duration: 0.32, ease: ARCHITECTURAL_EASE },
              opacity: { duration: 0.2 },
            }}
            className="pointer-events-none absolute inset-0 -z-10 rounded-full border"
          />
        )}
        {isCurrentRoute && !isHighlighted && (
          <span
            aria-hidden="true"
            style={{ backgroundColor: theme.dot }}
            className="pointer-events-none absolute bottom-0.5 inset-x-4 h-[1.5px] rounded-full opacity-75"
          />
        )}
      </>
    );
  };

  return (
    <header
      className={`fixed top-0 inset-x-0 z-40 transition-all duration-200 ${
        solidHeader
          ? 'bg-[#080D16]/72 backdrop-blur-2xl border-b border-[#6F9BFF]/18 shadow-[0_12px_40px_-20px_rgba(2,8,24,0.85)]'
          : 'bg-gradient-to-b from-[#080D16]/75 via-[#080D16]/32 to-transparent'
      }`}
    >
      <div className="max-w-[1380px] mx-auto px-3.5 sm:px-6 lg:px-10 h-[52px] sm:h-[60px] lg:h-[78px] flex items-center justify-between gap-2.5 sm:gap-4">
        {/* Brand Zone */}
        <a
          href={buildPath(locale, { page: 'home' })}
          onClick={(e) => handleLinkClick(e, { page: 'home' })}
          className="inline-flex items-center min-h-[44px] py-1 rounded-lg focus-visible:outline-offset-4"
        >
          <BrandWordmark locale={locale} settings={settings} />
        </a>

        {/* Center Frosted Glass Navigation Capsule with Color-Morphing Sliding Pill */}
        <LayoutGroup id="header-desktop-nav">
          <nav
            aria-label={locale === 'fa' ? 'ناوبری اصلی' : 'Primary navigation'}
            onMouseLeave={() => setHoveredNav(null)}
            className="glass-pill hidden lg:flex items-center gap-0.5 xl:gap-1 rounded-full p-1.5"
          >
            <a
              href={buildPath(locale, { page: 'about' })}
              onClick={(e) => handleLinkClick(e, { page: 'about' })}
              onMouseEnter={() => setHoveredNav('about')}
              onFocus={() => setHoveredNav('about')}
              onBlur={() => setHoveredNav(null)}
              style={
                highlightedKey === 'about'
                  ? { color: NAV_PILL_THEMES.about.text }
                  : undefined
              }
              className={navLinkClass('about')}
            >
              {renderSlidingPill('about')}
              <span>{copy.nav.about}</span>
            </a>

            {/* Keyboard-accessible Expertise Dropdown */}
            <div ref={expertiseRef} className="relative">
              <button
                type="button"
                aria-expanded={expertiseOpen}
                aria-haspopup="menu"
                onClick={() => setExpertiseOpen((prev) => !prev)}
                onMouseEnter={() => setHoveredNav('expertise')}
                onFocus={() => setHoveredNav('expertise')}
                onBlur={() => setHoveredNav(null)}
                style={
                  highlightedKey === 'expertise'
                    ? { color: NAV_PILL_THEMES.expertise.text }
                    : undefined
                }
                className={`gap-1 ${navLinkClass('expertise')}`}
              >
                {renderSlidingPill('expertise')}
                <span>{copy.nav.expertise}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-300 ${
                    expertiseOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <AnimatePresence>
                {expertiseOpen && (
                  <motion.div
                    role="menu"
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.28, ease: ARCHITECTURAL_EASE }}
                    className="glass-surface-strong absolute top-full mt-3 start-0 w-72 rounded-2xl p-2 origin-top"
                  >
                    {DISCIPLINES.map((disc) => (
                      <a
                        key={disc.slug}
                        role="menuitem"
                        href={buildPath(locale, { page: 'discipline', slug: disc.slug })}
                        onClick={(e) =>
                          handleLinkClick(e, { page: 'discipline', slug: disc.slug })
                        }
                        className="block rounded-xl px-3.5 py-2.5 hover:bg-white/8 transition-colors"
                      >
                        <div className="text-sm font-medium text-[#F7F5F0]">
                          {disc.title[locale]}
                        </div>
                        <div className="text-xs text-[#A2A7A3] mt-0.5">
                          {disc.shortSubtitle[locale]}
                        </div>
                      </a>
                    ))}

                    {/* Separated Special Division: Modern Materials & Technologies */}
                    <div className="my-2 border-t border-white/12" />
                    <a
                      role="menuitem"
                      href={buildPath(locale, { page: 'materials-technologies' })}
                      onClick={(e) =>
                        handleLinkClick(e, { page: 'materials-technologies' })
                      }
                      className="block rounded-xl border border-[#DFBA78]/25 bg-[#DFBA78]/[0.06] hover:bg-[#DFBA78]/[0.14] px-3.5 py-2.5 transition-colors"
                    >
                      <div className="text-[10.5px] font-medium text-[#DFBA78]">
                        {locale === 'fa' ? 'دپارتمان ویژه · آرشیو مصالح' : 'Special Division · Material Library'}
                      </div>
                      <div className="text-sm font-semibold text-[#F7E5BE] mt-0.5">
                        {MATERIALS_DEPARTMENT_META.title[locale]}
                      </div>
                      <div className="text-[11.5px] text-[#C6D2E3] mt-0.5">
                        {MATERIALS_DEPARTMENT_META.shortSubtitle[locale]}
                      </div>
                    </a>

                    <div className="my-1.5 border-t border-white/12" />
                    <a
                      role="menuitem"
                      href={buildPath(locale, { page: 'expertise' })}
                      onClick={(e) => handleLinkClick(e, { page: 'expertise' })}
                      className="block rounded-xl px-3.5 py-2 text-xs font-medium text-[#6F9BFF] hover:bg-white/8 transition-colors"
                    >
                      {copy.nav.allServices}
                    </a>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <a
              href={buildPath(locale, { page: 'projects' })}
              onClick={(e) => handleLinkClick(e, { page: 'projects' })}
              onMouseEnter={() => setHoveredNav('projects')}
              onFocus={() => setHoveredNav('projects')}
              onBlur={() => setHoveredNav(null)}
              style={
                highlightedKey === 'projects'
                  ? { color: NAV_PILL_THEMES.projects.text }
                  : undefined
              }
              className={navLinkClass('projects')}
            >
              {renderSlidingPill('projects')}
              <span>{copy.nav.projects}</span>
            </a>

            <a
              href={buildPath(locale, { page: 'sustainability-lab' })}
              onClick={(e) => handleLinkClick(e, { page: 'sustainability-lab' })}
              onMouseEnter={() => setHoveredNav('sustainability-lab')}
              onFocus={() => setHoveredNav('sustainability-lab')}
              onBlur={() => setHoveredNav(null)}
              style={
                highlightedKey === 'sustainability-lab'
                  ? { color: NAV_PILL_THEMES['sustainability-lab'].text }
                  : undefined
              }
              className={navLinkClass('sustainability-lab')}
            >
              {renderSlidingPill('sustainability-lab')}
              <span>{copy.nav.lab}</span>
            </a>

            <a
              href={buildPath(locale, { page: 'insights' })}
              onClick={(e) => handleLinkClick(e, { page: 'insights' })}
              onMouseEnter={() => setHoveredNav('insights')}
              onFocus={() => setHoveredNav('insights')}
              onBlur={() => setHoveredNav(null)}
              style={
                highlightedKey === 'insights'
                  ? { color: NAV_PILL_THEMES.insights.text }
                  : undefined
              }
              className={navLinkClass('insights')}
            >
              {renderSlidingPill('insights')}
              <span>{copy.nav.insights}</span>
            </a>

            <a
              href={buildPath(locale, { page: 'courses' })}
              data-testid="header-courses-link"
              onClick={(e) => handleLinkClick(e, { page: 'courses' })}
              onMouseEnter={() => setHoveredNav('courses')}
              onFocus={() => setHoveredNav('courses')}
              onBlur={() => setHoveredNav(null)}
              style={
                highlightedKey === 'courses'
                  ? { color: NAV_PILL_THEMES.courses.text }
                  : undefined
              }
              className={navLinkClass('courses')}
            >
              {renderSlidingPill('courses')}
              <span>{copy.nav.courses}</span>
            </a>
          </nav>
        </LayoutGroup>

        {/* Right Controls: Mobile stays ultra-slim visually with generous 44px touch hitboxes; Desktop keeps Search + Language + CTA */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <button
            ref={searchTriggerRef}
            type="button"
            onClick={onOpenSearch}
            aria-label={copy.nav.searchLabel}
            className="glass-pill relative w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-[#F5F8FC] hover:border-[#6F9BFF]/65 hover:text-[#6F9BFF] active:scale-95 transition-all before:content-[''] before:absolute before:-inset-1.5 sm:before:inset-0"
          >
            <Search className="w-3.5 h-3.5 sm:w-[15px] sm:h-[15px]" strokeWidth={1.7} />
          </button>

          {/* Compact Member Gateway / Account Portal Entry (Mobile icon + Desktop pill) */}
          <a
            href={buildPath(locale, { page: 'account' })}
            onClick={(e) => handleLinkClick(e, { page: 'account' })}
            data-testid="header-account-btn"
            aria-label={
              authUser
                ? locale === 'fa'
                  ? 'پنل کاربری من'
                  : 'My Member Portal'
                : locale === 'fa'
                  ? 'ورود / پنل کاربری'
                  : 'Sign In / Member Portal'
            }
            className={`glass-pill relative h-8 w-8 sm:h-10 sm:w-10 lg:w-auto lg:h-10 lg:px-3.5 rounded-full inline-flex items-center justify-center gap-2 text-xs font-medium whitespace-nowrap shrink-0 transition-all active:scale-95 before:content-[''] before:absolute before:-inset-1.5 sm:before:inset-0 ${
              route.page === 'account'
                ? 'border-[#28CF77]/65 bg-[#00A651]/22 text-[#E8FFF2]'
                : authUser
                  ? 'border-[#28CF77]/45 text-[#F5F8FC] hover:border-[#28CF77]'
                  : 'text-[#F5F8FC] hover:border-[#6F9BFF]/65 hover:text-[#DCE8FF]'
            }`}
          >
            {authUser?.photoURL ? (
              <img
                src={authUser.photoURL}
                alt={authUser.displayName || 'Account'}
                referrerPolicy="no-referrer"
                className="w-4 h-4 sm:w-5 sm:h-5 rounded-full object-cover border border-[#28CF77]/60 shrink-0"
              />
            ) : (
              <User
                className={`w-3.5 h-3.5 sm:w-[15px] sm:h-[15px] shrink-0 ${authUser ? 'text-[#28CF77]' : 'text-[#8AB0FF]'}`}
                strokeWidth={1.7}
              />
            )}
            <span className="hidden lg:inline max-w-[96px] truncate">
              {authUser
                ? authUser.displayName?.split(' ')[0] || (locale === 'fa' ? 'پنل من' : 'Account')
                : locale === 'fa'
                  ? 'ورود'
                  : 'Sign In'}
            </span>
          </a>

          {/* Desktop Language Selector (Mobile language toggle lives cleanly inside the bespoke menu drawer) */}
          <div ref={langRef} className="relative hidden lg:block">
            <button
              type="button"
              aria-expanded={langMenuOpen}
              aria-haspopup="menu"
              aria-label={locale === 'fa' ? 'تغییر زبان (فارسی / انگلیسی)' : 'Switch language (EN / FA)'}
              onClick={() => setLangMenuOpen((prev) => !prev)}
              className="glass-pill h-10 px-3 sm:px-3.5 rounded-full inline-flex items-center gap-1.5 text-xs font-medium text-[#F5F8FC] hover:border-[#6F9BFF]/65 transition-colors whitespace-nowrap shrink-0"
            >
              <Globe className="w-3.5 h-3.5 text-[#8AB0FF]" strokeWidth={1.75} />
              <span className="ltr-inline">{locale === 'en' ? 'EN' : 'FA'}</span>
              <ChevronDown className="w-3 h-3 text-[#8B9DB7]" />
            </button>

            <AnimatePresence>
              {langMenuOpen && (
                <motion.div
                  role="menu"
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.25, ease: ARCHITECTURAL_EASE }}
                  className="glass-surface-strong absolute top-full mt-2 end-0 w-36 rounded-xl p-1.5 origin-top"
                >
                  <button
                    type="button"
                    role="menuitemradio"
                    aria-checked={locale === 'en'}
                    onClick={() => {
                      setLangMenuOpen(false);
                      onSwitchLocale('en');
                    }}
                    className={`w-full text-start px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                      locale === 'en'
                        ? 'bg-[#223A87]/45 text-[#E4EEFF]'
                        : 'text-[#F5F8FC] hover:bg-white/8'
                    }`}
                  >
                    <span>English</span>
                    <span className="ltr-inline opacity-70">EN</span>
                  </button>
                  <button
                    type="button"
                    role="menuitemradio"
                    aria-checked={locale === 'fa'}
                    onClick={() => {
                      setLangMenuOpen(false);
                      onSwitchLocale('fa');
                    }}
                    className={`w-full text-start px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                      locale === 'fa'
                        ? 'bg-[#223A87]/45 text-[#E4EEFF]'
                        : 'text-[#F5F8FC] hover:bg-white/8'
                    }`}
                  >
                    <span>فارسی</span>
                    <span className="ltr-inline opacity-70">FA</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <a
            href={buildPath(locale, { page: 'contact' })}
            onClick={(e) => handleLinkClick(e, { page: 'contact' })}
            className="glass-cta hidden lg:inline-flex items-center justify-center h-10 px-5 rounded-full text-[13px] rtl:text-[13.5px] font-semibold rtl:font-bold transition-all whitespace-nowrap shrink-0"
          >
            {copy.nav.contact}
          </a>

          {/* Bespoke ISB Architectural Mobile Hamburger Trigger */}
          <MobileMenuTrigger
            open={mobileMenuOpen}
            isRtl={locale === 'fa'}
            label={copy.nav.menuLabel}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            buttonRef={mobileMenuTriggerRef}
          />
        </div>
      </div>

      {/* Bespoke Full-Screen Architectural Mobile Menu Drawer */}
      <MobileMenuDrawer
        open={mobileMenuOpen}
        locale={locale}
        route={route}
        activeNavKey={activeNavKey}
        settings={settings}
        authUser={authUser}
        onClose={() => setMobileMenuOpen(false)}
        onNavigate={onNavigate}
        onSwitchLocale={onSwitchLocale}
        onOpenSearch={onOpenSearch}
        returnFocusRef={mobileMenuTriggerRef}
      />
    </header>
  );
}
