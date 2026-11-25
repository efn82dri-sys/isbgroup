import React, { useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Box,
  Building2,
  Layers,
  Leaf,
} from './icons/IsbIcons';
import { AnimatePresence, motion } from 'motion/react';
import { DISCIPLINES } from '../data/seedContent';
import { getCopy } from '../data/translations';
import type { DisciplineSlug, Locale, PageRoute, SiteSettings } from '../types/content';
import { MATERIALS_DEPARTMENT_META } from '../utils/materialsCatalog';
import { ARCHITECTURAL_EASE, HEAVY_SETTLE_EASE, SEISMIC_SPRING } from '../utils/motionMath';
import { buildPath } from '../utils/routing';
import { HeroScrollCanvas } from './HeroScrollCanvas';

interface HeroCampusProps {
  locale: Locale;
  settings?: SiteSettings;
  onNavigate: (route: PageRoute) => void;
}

function DisciplineIcon({ slug, className = 'w-4 h-4' }: { slug: DisciplineSlug; className?: string }) {
  if (slug === 'architecture-urbanism') return <Building2 className={className} strokeWidth={1.5} />;
  if (slug === 'energy-mep') return <Leaf className={className} strokeWidth={1.5} />;
  return <Box className={className} strokeWidth={1.5} />;
}

function Animated3DMouseScroll({ compact = false }: { compact?: boolean }) {
  const uid = compact ? 'm3d-sm' : 'm3d-lg';
  const width = compact ? 19 : 30;
  const height = compact ? 33 : 52;

  return (
    <div
      aria-hidden="true"
      className="relative inline-flex items-center justify-center shrink-0"
      style={{ perspective: '260px', width, height }}
    >
      <motion.svg
        viewBox="6 2 32 60"
        width={width}
        height={height}
        fill="none"
        className="overflow-visible drop-shadow-[0_8px_16px_rgba(255,255,255,0.2)]"
        animate={{ y: [0, -2.5, 0], rotateX: [10, 17, 10], rotateY: [-6, 6, -6] }}
        transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <defs>
          {/* 3D sculpted pearl-white ceramic mouse shell lighting */}
          <linearGradient id={`${uid}-body`} x1="10" y1="4" x2="34" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="46%" stopColor="#E6EDF7" />
            <stop offset="100%" stopColor="#BAC7DA" />
          </linearGradient>
          {/* Bright pure-white rim highlight */}
          <linearGradient id={`${uid}-rim`} x1="8" y1="4" x2="36" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
            <stop offset="55%" stopColor="#F1F5FB" stopOpacity="0.92" />
            <stop offset="100%" stopColor="#94A3B8" stopOpacity="0.7" />
          </linearGradient>
          {/* Glossy curved top-left white specular dome */}
          <radialGradient id={`${uid}-spec`} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(17 12) rotate(58) scale(16 9)">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="60%" stopColor="#FFFFFF" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>
          {/* 3D cylindrical bright white/silver scroll wheel gradient */}
          <linearGradient id={`${uid}-wheel`} x1="19" y1="10" x2="25" y2="22" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="52%" stopColor="#E2E8F0" />
            <stop offset="100%" stopColor="#94A3B8" />
          </linearGradient>
          {/* Ambient soft white contact shadow */}
          <radialGradient id={`${uid}-shadow`} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.35" />
            <stop offset="65%" stopColor="#94A3B8" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#060B14" stopOpacity="0" />
          </radialGradient>
          {/* Clip region for animated scroll wheel ridges */}
          <clipPath id={`${uid}-wheel-clip`}>
            <rect x="19.3" y="10.5" width="5.4" height="10.6" rx="2.7" />
          </clipPath>
        </defs>

        {/* Ground contact soft glow shadow */}
        <motion.ellipse
          cx="22"
          cy="48.5"
          rx="12"
          ry="3"
          fill={`url(#${uid}-shadow)`}
          animate={{ scaleX: [0.92, 1.06, 0.92], opacity: [0.5, 0.85, 0.5] }}
          transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: '22px 48.5px' }}
        />

        {/* 3D Extruded Bottom Rim (physical hardware thickness in cool light-grey) */}
        <rect
          x="8.5"
          y="7"
          width="27"
          height="38"
          rx="13.5"
          fill="#8E9CB2"
          stroke="#FFFFFF"
          strokeOpacity="0.45"
          strokeWidth="0.9"
        />

        {/* Primary 3D Sculpted White Mouse Shell */}
        <rect
          x="8.5"
          y="4"
          width="27"
          height="37.5"
          rx="13.5"
          fill={`url(#${uid}-body)`}
          stroke={`url(#${uid}-rim)`}
          strokeWidth="1.25"
        />

        {/* Curved Specular Reflection on Upper Shell */}
        <path
          d="M11 16C11 10.2 15.8 6 22 6C28.2 6 33 10.2 33 16V20C28.5 18 15.5 18 11 20V16Z"
          fill={`url(#${uid}-spec)`}
        />

        {/* Subtle Left / Right Button Seam & Center Divider */}
        <path
          d="M10.5 20.5C14.5 22 29.5 22 33.5 20.5"
          stroke="#64748B"
          strokeOpacity="0.34"
          strokeWidth="0.9"
          strokeLinecap="round"
        />
        <line
          x1="22"
          y1="5.2"
          x2="22"
          y2="10.2"
          stroke="#64748B"
          strokeOpacity="0.32"
          strokeWidth="0.9"
        />

        {/* Recessed Scroll Wheel Well */}
        <rect
          x="18.3"
          y="9.5"
          width="7.4"
          height="13.2"
          rx="3.7"
          fill="#1E293B"
          stroke="#94A3B8"
          strokeOpacity="0.55"
          strokeWidth="0.8"
        />

        {/* Animated 3D Scroll Wheel moving downward smoothly */}
        <motion.g
          animate={{ y: [0, 2.2, 0] }}
          transition={{ duration: 1.55, repeat: Infinity, ease: 'easeInOut' }}
        >
          <rect
            x="19.3"
            y="10.5"
            width="5.4"
            height="10.6"
            rx="2.7"
            fill={`url(#${uid}-wheel)`}
          />
          {/* Rolling knurled wheel grooves indicating downward scroll */}
          <g clipPath={`url(#${uid}-wheel-clip)`}>
            <motion.g
              animate={{ y: [-4, 4] }}
              transition={{ duration: 1.05, repeat: Infinity, ease: 'linear' }}
            >
              <line x1="19.8" y1="9.5" x2="24.2" y2="9.5" stroke="#475569" strokeOpacity="0.7" strokeWidth="1" />
              <line x1="19.8" y1="12.5" x2="24.2" y2="12.5" stroke="#475569" strokeOpacity="0.7" strokeWidth="1" />
              <line x1="19.8" y1="15.5" x2="24.2" y2="15.5" stroke="#475569" strokeOpacity="0.7" strokeWidth="1" />
              <line x1="19.8" y1="18.5" x2="24.2" y2="18.5" stroke="#475569" strokeOpacity="0.7" strokeWidth="1" />
              <line x1="19.8" y1="21.5" x2="24.2" y2="21.5" stroke="#475569" strokeOpacity="0.7" strokeWidth="1" />
            </motion.g>
          </g>
        </motion.g>

        {/* Cascading Downward Scroll Motion Chevrons in Crisp White */}
        <motion.path
          d="M17.5 51.5L22 55.2L26.5 51.5"
          stroke="#FFFFFF"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          animate={{ opacity: [0.25, 1, 0.25], y: [0, 2.5, 0] }}
          transition={{ duration: 1.55, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.path
          d="M18.8 56.2L22 59L25.2 56.2"
          stroke="#FFFFFF"
          strokeOpacity="0.82"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          animate={{ opacity: [0.15, 0.85, 0.15], y: [0, 2.5, 0] }}
          transition={{ duration: 1.55, delay: 0.28, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.svg>
    </div>
  );
}

export function HeroCampus({ locale, settings, onNavigate }: HeroCampusProps) {
  const copy = getCopy(locale);
  const customHeroTitle = (locale === 'fa' ? settings?.heroTitleFa : settings?.heroTitleEn)?.trim();
  const customHeroSubtitle = (
    locale === 'fa' ? settings?.heroSubtitleFa : settings?.heroSubtitleEn
  )?.trim();
  const [activeIndex, setActiveIndex] = useState(0);

  const scrollSectionRef = useRef<HTMLElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const isRtl = locale === 'fa';
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  return (
    <section
      ref={scrollSectionRef}
      data-mascot-scene="welcome"
      aria-label={
        locale === 'fa'
          ? 'انیمیشن سه‌بعدی تعاملی گروه ساختمانی پایدار ایران زمین'
          : 'Iran Zamin Sustainable Building Group interactive 3D architectural fly-through hero'
      }
      className="relative h-[185vh] sm:h-[260vh] lg:h-[320vh] motion-reduce:h-auto w-full border-b border-white/12"
    >
      <div className="sticky top-0 h-[100svh] min-h-[540px] sm:min-h-[620px] lg:min-h-[760px] motion-reduce:static motion-reduce:h-auto w-full overflow-hidden flex flex-col justify-end lg:justify-between pt-14 sm:pt-16 lg:pt-24 pb-5 sm:pb-7 lg:pb-8">
        {/* Scroll-driven 3D Architectural Fly-Through Canvas */}
        <div className="absolute inset-0 bg-[#080D16]">
          <HeroScrollCanvas
            sectionRef={scrollSectionRef}
            progressBarRef={progressBarRef}
            focalX={isRtl ? 0.46 : 0.54}
            focalY={0.44}
          />

          {/* Mobile bottom-weighted scrim: opens up the top ~50% of the screen for the 3D building */}
          <div
            aria-hidden="true"
            className="lg:hidden absolute inset-0 bg-gradient-to-t from-[#080D16]/96 via-[#080D16]/54 via-[44%] to-[#080D16]/22"
          />
          <div
            aria-hidden="true"
            className="lg:hidden absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#080D16]/70 to-transparent"
          />

          {/* Desktop measured architectural scrim keeping center 3D scene open and typography crystal clear */}
          <div
            aria-hidden="true"
            className={`hidden lg:block absolute inset-0 ${
              isRtl
                ? 'bg-gradient-to-l from-[#080D16]/92 via-[#080D16]/56 via-[42%] to-[#080D16]/24'
                : 'bg-gradient-to-r from-[#080D16]/92 via-[#080D16]/56 via-[42%] to-[#080D16]/24'
            }`}
          />
          <div
            aria-hidden="true"
            className="hidden lg:block absolute inset-0 bg-gradient-to-t from-[#080D16]/88 via-transparent via-24% to-[#080D16]/48"
          />
        </div>

        {/* Uncluttered Editorial Foreground: Pure Monumental Headline + Preserved 3 Frosted Glass Discipline Cards */}
        <div className="relative z-20 max-w-[1380px] w-full mx-auto px-4 sm:px-6 lg:px-10 pt-0 lg:pt-6 lg:flex-1 flex flex-col justify-end lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6 lg:gap-12">
          {/* Leading Column: Official Brand Eyebrow + Monumental Architectural Headline */}
          <div className="max-w-[590px] space-y-2.5 sm:space-y-5 lg:space-y-6 z-20">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.72, delay: 0.05, ease: ARCHITECTURAL_EASE }}
              className="inline-flex items-center gap-2 sm:gap-3"
            >
              <span
                aria-hidden="true"
                className="w-5 sm:w-8 h-[1.5px] rounded-full bg-gradient-to-r from-[#28CF77] to-[#6F9BFF] shrink-0"
              />
              <p className="text-[10.5px] sm:text-[13px] rtl:text-[11.5px] sm:rtl:text-[14.5px] tracking-[0.12em] sm:tracking-[0.14em] rtl:tracking-normal text-[#A4C3FF] font-medium">
                {copy.hero.kicker}
              </p>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.88, delay: 0.12, ease: HEAVY_SETTLE_EASE }}
              className="text-[24px] sm:text-[42px] lg:text-[48px] xl:text-[54px] rtl:text-[25px] sm:rtl:text-[42px] lg:rtl:text-[48px] xl:rtl:text-[54px] font-semibold rtl:font-extrabold tracking-[-0.025em] rtl:tracking-normal leading-[1.16] sm:leading-[1.14] rtl:leading-[1.32] sm:rtl:leading-[1.34] text-[#F5F8FC] text-balance"
            >
              {customHeroTitle ? (
                customHeroTitle
              ) : (
                <>
                  {copy.hero.headlineLead}{' '}
                  <span className="text-[#28CF77]">{copy.hero.headlineAccent}</span>
                </>
              )}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: ARCHITECTURAL_EASE }}
              className="text-[12.5px] sm:text-base rtl:text-[13px] sm:rtl:text-[17px] rtl:font-light text-[#C6D2E3]/95 leading-relaxed rtl:leading-[1.85] sm:rtl:leading-[1.95] max-w-[325px] sm:max-w-[500px] rtl:max-w-[335px] sm:rtl:max-w-[520px]"
            >
              {customHeroSubtitle || copy.hero.subtitle}
            </motion.p>

            {/* Subtle mobile-only tactile scroll cue with animated 3D mouse */}
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              onClick={() => {
                const section = scrollSectionRef.current;
                if (!section) return;
                window.scrollTo({
                  top: section.offsetTop + section.offsetHeight - 40,
                  behavior: 'smooth',
                });
              }}
              aria-label={isRtl ? 'اسکرول به بخش بعدی' : 'Scroll to next section'}
              className="lg:hidden inline-flex items-center gap-1.5 min-h-[44px] -ms-1 px-1 text-[11px] font-medium text-white/95 active:scale-[0.97] transition-transform"
            >
              <Animated3DMouseScroll compact />
              <span>{isRtl ? 'اسکرول کنید' : 'Scroll'}</span>
            </motion.button>
          </div>

          {/* Trailing Column (Desktop): 3 Core Discipline Cards + Separated Materials & Technologies Card */}
          <div
            data-testid="hero-discipline-stack"
            className="hidden lg:flex flex-col gap-2.5 w-[300px] xl:w-[328px] shrink-0 z-20"
          >
            {DISCIPLINES.map((disc, idx) => {
              const isSelected = idx === activeIndex;
              const itemTransition =
                disc.slug === 'structure-seismic'
                  ? { ...SEISMIC_SPRING, delay: 0.22 + idx * 0.08 }
                  : { duration: 0.78, delay: 0.22 + idx * 0.08, ease: ARCHITECTURAL_EASE };

              return (
                <motion.div
                  key={disc.slug}
                  initial={{ opacity: 0, x: isRtl ? -26 : 26, y: 12 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  transition={itemTransition}
                  whileHover={{ y: -2 }}
                  className={`rounded-2xl overflow-hidden transition-colors duration-300 ${
                    isSelected
                      ? 'glass-card-active'
                      : 'glass-surface-strong hover:border-white/30'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setActiveIndex(idx)}
                    aria-pressed={isSelected}
                    className="w-full text-start px-4 py-3.5 flex items-center gap-3.5"
                  >
                    <motion.span
                      animate={
                        isSelected
                          ? disc.slug === 'energy-mep'
                            ? { scale: [1, 1.07, 1], transition: { duration: 0.65, ease: ARCHITECTURAL_EASE } }
                            : disc.slug === 'architecture-urbanism'
                              ? { y: [2, 0], transition: { duration: 0.45, ease: ARCHITECTURAL_EASE } }
                              : { scale: [0.92, 1], transition: SEISMIC_SPRING }
                          : { scale: 1, y: 0 }
                      }
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 transition-colors duration-300 ${
                        isSelected
                          ? disc.slug === 'energy-mep'
                            ? 'border-[#28CF77]/70 bg-[#00A651]/25 text-[#28CF77]'
                            : disc.slug === 'structure-seismic'
                              ? 'border-[#6F9BFF]/70 bg-[#223A87]/45 text-[#9CC0FF]'
                              : 'border-[#6F9BFF]/70 bg-[#223A87]/45 text-[#FFFFFF]'
                          : 'border-white/15 bg-white/[0.06] text-[#F5F8FC]/85'
                      }`}
                    >
                      <DisciplineIcon slug={disc.slug} className="w-4 h-4" />
                    </motion.span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[14px] rtl:text-[14.5px] font-semibold rtl:font-bold text-[#F5F8FC] leading-snug truncate">
                        {disc.title[locale]}
                      </div>
                      <div className="text-xs text-[#C6D2E3]/85 mt-0.5 leading-snug truncate">
                        {disc.shortSubtitle[locale]}
                      </div>
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isSelected && (
                      <motion.div
                        key={`${disc.slug}-body`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.42, ease: ARCHITECTURAL_EASE }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-3.5 pt-2.5 border-t border-[#6F9BFF]/20 space-y-2.5">
                          <p className="text-xs text-[#C6D2E3] leading-relaxed rtl:leading-[1.8]">
                            {disc.heroAnnotation[locale]}
                          </p>
                          <a
                            href={buildPath(locale, { page: 'discipline', slug: disc.slug })}
                            onClick={(e) => {
                              e.preventDefault();
                              onNavigate({ page: 'discipline', slug: disc.slug });
                            }}
                            className="group/link inline-flex items-center gap-1.5 text-xs font-medium text-[#28CF77] hover:underline whitespace-nowrap"
                          >
                            <span>{copy.hero.viewDiscipline}</span>
                            <ArrowIcon className="w-3.5 h-3.5 transition-transform duration-300 group-hover/link:translate-x-0.5 rtl:group-hover/link:-translate-x-0.5" />
                          </a>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}

            {/* Separated Special Division: Modern Materials & Technologies (Subtle Gap + Warm Champagne-Bronze Glass) */}
            <motion.div
              initial={{ opacity: 0, x: isRtl ? -26 : 26, y: 12 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ duration: 0.78, delay: 0.22 + DISCIPLINES.length * 0.08, ease: ARCHITECTURAL_EASE }}
              className="mt-2 pt-3 border-t border-white/14"
            >
              {(() => {
                const isMaterialsSelected = activeIndex === DISCIPLINES.length;
                return (
                  <motion.div
                    data-testid="hero-materials-card"
                    whileHover={{ y: -2 }}
                    className={`rounded-2xl overflow-hidden border backdrop-blur-xl transition-colors duration-300 ${
                      isMaterialsSelected
                        ? 'border-[#DFBA78]/60 shadow-[0_22px_50px_-24px_rgba(223,186,120,0.4)]'
                        : 'border-[#DFBA78]/28 hover:border-[#DFBA78]/52'
                    }`}
                    style={{
                      background: isMaterialsSelected
                        ? 'linear-gradient(135deg, rgba(36, 28, 17, 0.86) 0%, rgba(15, 19, 31, 0.9) 100%)'
                        : 'linear-gradient(135deg, rgba(24, 19, 14, 0.78) 0%, rgba(11, 16, 28, 0.82) 100%)',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveIndex(DISCIPLINES.length)}
                      aria-pressed={isMaterialsSelected}
                      className="w-full text-start px-4 py-3.5 flex items-center gap-3.5"
                    >
                      <span
                        className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 transition-colors duration-300 ${
                          isMaterialsSelected
                            ? 'border-[#F3DCA6]/70 bg-[#DFBA78]/25 text-[#FBF6EB]'
                            : 'border-[#DFBA78]/32 bg-[#DFBA78]/10 text-[#DFBA78]'
                        }`}
                      >
                        <Layers className="w-4 h-4" strokeWidth={1.5} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[14px] rtl:text-[14.5px] font-semibold rtl:font-bold text-[#FBF6EB] leading-snug truncate">
                          {MATERIALS_DEPARTMENT_META.title[locale]}
                        </div>
                        <div className="text-xs text-[#D3C6B0]/88 mt-0.5 leading-snug truncate">
                          {MATERIALS_DEPARTMENT_META.shortSubtitle[locale]}
                        </div>
                      </div>
                    </button>

                    <AnimatePresence initial={false}>
                      {isMaterialsSelected && (
                        <motion.div
                          key="materials-technologies-body"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.42, ease: ARCHITECTURAL_EASE }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-3.5 pt-2.5 border-t border-[#DFBA78]/20 space-y-2.5">
                            <p className="text-xs text-[#DCD1BE] leading-relaxed rtl:leading-[1.8]">
                              {isRtl
                                ? 'ویترین تخصصی مصالح نوین ساختمانی، تصاویر گواهینامه‌های فنی و کاتالوگ برندهای منتخب.'
                                : 'Interactive showcase of modern building materials, verified technical certificates, and brand catalogs.'}
                            </p>
                            <a
                              href={buildPath(locale, { page: 'materials-technologies' })}
                              onClick={(e) => {
                                e.preventDefault();
                                onNavigate({ page: 'materials-technologies' });
                              }}
                              data-testid="hero-materials-link"
                              className="group/link inline-flex items-center gap-1.5 text-xs font-medium text-[#F3DCA6] hover:underline whitespace-nowrap"
                            >
                              <span>{isRtl ? 'ورود به آتلیه مصالح' : 'Explore Material Atelier'}</span>
                              <ArrowIcon className="w-3.5 h-3.5 transition-transform duration-300 group-hover/link:translate-x-0.5 rtl:group-hover/link:-translate-x-0.5" />
                            </a>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })()}
            </motion.div>
          </div>
        </div>

        {/* Bottom Hero Controls Bar (Desktop): Minimalist Hairline Indicator Rail + Quiet Scroll Cue */}
        <div className="hidden lg:flex relative z-20 max-w-[1380px] w-full mx-auto px-4 sm:px-6 lg:pl-40 lg:pr-10 pt-5 items-end justify-between gap-4">
          <div
            role="tablist"
            aria-label={locale === 'fa' ? 'انتخاب حوزه تخصصی' : 'Select featured discipline'}
            className="flex items-center gap-3"
          >
            {DISCIPLINES.map((disc, idx) => {
              const isSelected = idx === activeIndex;
              return (
                <button
                  key={disc.slug}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  aria-label={disc.title[locale]}
                  onClick={() => setActiveIndex(idx)}
                  className="group flex items-center py-2.5 transition-colors cursor-pointer"
                >
                  <span
                    className={`relative block h-[2.5px] rounded-full bg-white/18 overflow-hidden transition-all duration-300 ${
                      isSelected ? 'w-12' : 'w-8 group-hover:bg-white/35'
                    }`}
                  >
                    {isSelected && (
                      <motion.span
                        layoutId="hero-tab-active-line"
                        transition={{ duration: 0.45, ease: ARCHITECTURAL_EASE }}
                        className="absolute inset-0 rounded-full bg-gradient-to-r from-[#6F9BFF] to-[#28CF77]"
                      />
                    )}
                  </span>
                </button>
              );
            })}

            {/* Separated Materials Indicator on Bottom Rail */}
            <div className="ps-3 ms-1 border-s border-white/15">
              <button
                type="button"
                role="tab"
                aria-selected={activeIndex === DISCIPLINES.length}
                aria-label={MATERIALS_DEPARTMENT_META.title[locale]}
                onClick={() => setActiveIndex(DISCIPLINES.length)}
                className="group flex items-center py-2.5 transition-colors cursor-pointer"
              >
                <span
                  className={`relative block h-[2.5px] rounded-full bg-[#DFBA78]/25 overflow-hidden transition-all duration-300 ${
                    activeIndex === DISCIPLINES.length ? 'w-12' : 'w-8 group-hover:bg-[#DFBA78]/45'
                  }`}
                >
                  {activeIndex === DISCIPLINES.length && (
                    <motion.span
                      layoutId="hero-tab-active-line"
                      transition={{ duration: 0.45, ease: ARCHITECTURAL_EASE }}
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-[#DFBA78] to-[#F3DCA6]"
                    />
                  )}
                </span>
              </button>
            </div>
          </div>

          <div
            data-testid="hero-scroll-cue"
            className="inline-flex items-center gap-1.5 text-xs sm:text-[13px] font-medium text-white pb-0.5"
          >
            <span>{isRtl ? 'اسکرول کنید' : 'Scroll'}</span>
            <Animated3DMouseScroll />
          </div>
        </div>

        {/* Subtle Scroll-Scrub Progress Hairline along Bottom Edge */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-white/10 z-30 motion-reduce:hidden"
        >
          <div
            ref={progressBarRef}
            className={`h-full w-full ${
              isRtl
                ? 'bg-gradient-to-l from-[#3B68D6] via-[#00A651] to-[#6F9BFF] origin-right'
                : 'bg-gradient-to-r from-[#3B68D6] via-[#00A651] to-[#6F9BFF] origin-left'
            } will-change-transform`}
            style={{ transform: 'scaleX(0.02)' }}
          />
        </div>
      </div>
    </section>
  );
}
