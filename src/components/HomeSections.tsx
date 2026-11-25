import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Box,
  Building2,
  ChevronLeft,
  ChevronRight,
  Cloud,
  FlaskConical,
  Leaf,
  Sun,
  Users,
  Zap,
} from './icons/IsbIcons';
import { AnimatePresence, motion } from 'motion/react';
import { ASSETS } from '../data/assets';
import { DISCIPLINES, LAB_METRICS } from '../data/seedContent';
import { getCopy } from '../data/translations';
import type {
  DisciplineSlug,
  Locale,
  PageRoute,
  PartnerLogo,
  Project,
  SiteSettings,
} from '../types/content';
import { ARCHITECTURAL_EASE } from '../utils/motionMath';
import { buildPath } from '../utils/routing';
import { IsbPatternOverlay, SafeImage } from './BrandMark';
import { PartnerLogos } from './PartnerLogos';
import {
  ArchitecturalReveal,
  ArchitecturalTiltCard,
  AxonometricScanOverlay,
  CalibratedProgressBar,
  MagneticWrapper,
  StudioParallaxBackdrop,
  type RevealVariant,
  type TiltTheme,
} from './MotionPrimitives';

function getDisciplineMotion(slug: DisciplineSlug): { reveal: RevealVariant; tilt: TiltTheme } {
  if (slug === 'architecture-urbanism') return { reveal: 'elevation', tilt: 'architecture' };
  if (slug === 'energy-mep') return { reveal: 'thermal', tilt: 'energy' };
  return { reveal: 'seismic', tilt: 'structure' };
}

interface HomeSectionsProps {
  locale: Locale;
  projects: Project[];
  partnerLogos?: PartnerLogo[];
  settings?: SiteSettings;
  onNavigate: (route: PageRoute) => void;
  onOpenLabAssessment: () => void;
}

function ExpertiseIcon({ slug }: { slug: DisciplineSlug }) {
  if (slug === 'architecture-urbanism') return <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#6F9BFF]" strokeWidth={1.5} />;
  if (slug === 'energy-mep') return <Leaf className="w-4 h-4 sm:w-5 sm:h-5 text-[#28CF77]" strokeWidth={1.5} />;
  return <Box className="w-4 h-4 sm:w-5 sm:h-5 text-[#93B8FF]" strokeWidth={1.5} />;
}

function MetricIcon({ id }: { id: 'sda' | 'eui' | 'co2' | 'saro-sabz' }) {
  if (id === 'sda') return <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#6F9BFF]" strokeWidth={1.6} />;
  if (id === 'eui') return <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#93B8FF]" strokeWidth={1.6} />;
  if (id === 'co2') return <Cloud className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#28CF77]" strokeWidth={1.6} />;
  return <Leaf className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#28CF77]" strokeWidth={1.6} />;
}

export function HomeSections({
  locale,
  projects,
  partnerLogos,
  settings,
  onNavigate,
  onOpenLabAssessment,
}: HomeSectionsProps) {
  const copy = getCopy(locale);
  const isRtl = locale === 'fa';
  const teamCoverSrc = settings?.teamCoverImage?.trim() || ASSETS.teamStudio;
  const teamCoverCaption =
    (locale === 'fa' ? settings?.teamCoverCaptionFa : settings?.teamCoverCaptionEn)?.trim() ||
    copy.team.illustrativeCaption;
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const publishedProjects = projects
    .filter((p) => p.status === 'published')
    .sort((a, b) => a.featuredOrder - b.featuredOrder);

  // Carousel pagination appears ONLY when there are more than 3 published projects
  const pageSize = 3;
  const totalPages = Math.max(1, Math.ceil(publishedProjects.length / pageSize));
  const [projectPage, setProjectPage] = useState(0);
  const showCarouselControls = publishedProjects.length > pageSize;
  const visibleProjects = publishedProjects.slice(
    projectPage * pageSize,
    projectPage * pageSize + pageSize
  );

  return (
    <div className="relative">
      {/* B. OUR EXPERTISE — Distinct Subject-Tailored 3D Motion per Discipline */}
      <section data-mascot-scene="plan" className="border-b border-white/10 py-8 sm:py-12 lg:py-16">
        <div className="max-w-[1380px] mx-auto px-3.5 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-5 items-stretch">
            {/* Narrow Intro Column */}
            <ArchitecturalReveal
              variant="slide-start"
              isRtl={isRtl}
              className="lg:col-span-3 flex flex-col justify-between gap-4 sm:gap-6 pe-0 sm:pe-2"
            >
              <div className="space-y-2 sm:space-y-3.5">
                <p className="text-[10px] sm:text-[11px] rtl:text-[11px] sm:rtl:text-xs uppercase tracking-[0.2em] text-[#D5D4CC]/85 font-medium">
                  {copy.expertise.label}
                </p>
                <h2 className="text-[20px] sm:text-[28px] lg:text-[31px] rtl:text-[21px] sm:rtl:text-[29px] lg:rtl:text-[32px] font-semibold rtl:font-extrabold tracking-[-0.02em] leading-[1.18] sm:leading-[1.16] rtl:leading-[1.34] text-[#F5F8FC]">
                  {copy.expertise.titleStart}{' '}
                  <span className="text-[#6F9BFF]">{copy.expertise.titleAccent}</span>
                </h2>
                <p className="text-[12.5px] sm:text-sm text-[#C6D2E3]/90 leading-relaxed rtl:leading-[1.8] sm:rtl:leading-[1.85]">
                  {copy.expertise.description}
                </p>
              </div>

              <div>
                <a
                  href={buildPath(locale, { page: 'expertise' })}
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate({ page: 'expertise' });
                  }}
                  className="group/btn glass-pill inline-flex items-center gap-2 sm:gap-2.5 min-h-[42px] sm:min-h-0 rounded-full px-4 py-2 sm:px-5 sm:py-2.5 text-[11.5px] sm:text-xs font-medium text-[#F5F8FC] hover:border-[#6F9BFF] hover:text-[#9AC0FF] active:scale-[0.98] transition-all duration-300 whitespace-nowrap"
                >
                  <span>{copy.expertise.cta}</span>
                  <ArrowIcon className="w-3.5 h-3.5 transition-transform duration-300 group-hover/btn:translate-x-0.5 rtl:group-hover/btn:-translate-x-0.5" />
                </a>
              </div>
            </ArchitecturalReveal>

            {/* Three Image-Led Glassmorphism Discipline Cards with Subject-Specific 3D Physics */}
            <div className="lg:col-span-9 grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
              {DISCIPLINES.map((disc, idx) => {
                const { reveal, tilt } = getDisciplineMotion(disc.slug);
                return (
                  <ArchitecturalReveal
                    key={disc.slug}
                    variant={reveal}
                    delay={0.08 + idx * 0.12}
                    className="h-full"
                  >
                    <ArchitecturalTiltCard
                      theme={tilt}
                      maxTilt={5.5}
                      className="h-full rounded-2xl sm:rounded-3xl"
                    >
                      <a
                        href={buildPath(locale, { page: 'discipline', slug: disc.slug })}
                        onClick={(e) => {
                          e.preventDefault();
                          onNavigate({ page: 'discipline', slug: disc.slug });
                        }}
                        aria-label={`${disc.title[locale]} — ${disc.cardSummary[locale]}`}
                        className="group relative rounded-2xl sm:rounded-3xl border border-[#8AB2FF]/20 overflow-hidden min-h-[196px] sm:min-h-[290px] lg:min-h-[325px] h-full flex flex-col justify-between p-3 sm:p-4 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-[#6F9BFF]/65 active:scale-[0.985] shadow-[0_24px_54px_-24px_rgba(2,8,24,0.85)] focus-visible:outline-offset-2"
                      >
                        <SafeImage
                          src={disc.coverImage}
                          alt={disc.title[locale]}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.07]"
                        />
                        <div
                          aria-hidden="true"
                          className="absolute inset-0 bg-gradient-to-t from-[#080D16]/92 via-[#080D16]/36 to-[#080D16]/20"
                        />

                        {/* Frosted Glass Icon Badge */}
                        <div className="relative z-10 flex items-center justify-between">
                          <span className="glass-pill w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-0.5 group-hover:border-[#6F9BFF]/55">
                            <ExpertiseIcon slug={disc.slug} />
                          </span>
                          <span className="glass-pill rounded-full px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-[11px] font-mono font-numeric text-[#F5F8FC]/90">
                            {disc.indexLabel}
                          </span>
                        </div>

                        {/* Frosted Glass Inner Content Tray with Subtle 3D Elevation Lift */}
                        <div className="relative z-10 glass-overlay-dock rounded-xl sm:rounded-2xl p-3 sm:p-4 space-y-1.5 sm:space-y-2 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-1 group-hover:border-[#6F9BFF]/55">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-[15px] sm:text-lg font-semibold rtl:font-bold text-[#F5F8FC] leading-snug rtl:leading-[1.4]">
                              {disc.title[locale]}
                            </h3>
                            <span
                              aria-hidden="true"
                              className="w-7 h-7 rounded-full border border-[#8AB2FF]/30 bg-[#223A87]/35 flex items-center justify-center text-[#9AC0FF] shrink-0 group-hover:bg-[#223A87] group-hover:border-[#6F9BFF] group-hover:text-[#FFFFFF] transition-all duration-300"
                            >
                              <ArrowIcon className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
                            </span>
                          </div>
                          <p className="text-[11.5px] sm:text-[12.5px] text-[#C6D2E3] leading-relaxed rtl:leading-[1.75] sm:rtl:leading-[1.8]">
                            {disc.cardSummary[locale]}
                          </p>
                        </div>
                      </a>
                    </ArchitecturalTiltCard>
                  </ArchitecturalReveal>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* C. FEATURED PROJECTS — Architectural Aperture Reveal & Tactile Gallery Depth */}
      <section data-mascot-scene="helmet" className="py-8 sm:py-12 lg:py-16">
        <div className="max-w-[1380px] mx-auto px-3.5 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-5 items-stretch">
            {/* Narrow Editorial Intro */}
            <ArchitecturalReveal
              variant="slide-start"
              isRtl={isRtl}
              className="lg:col-span-3 flex flex-col justify-between gap-3.5 sm:gap-6 pe-0 sm:pe-2"
            >
              <div className="space-y-2 sm:space-y-3.5">
                <p className="text-[10px] sm:text-[11px] rtl:text-[11px] sm:rtl:text-xs uppercase tracking-[0.2em] text-[#D5D4CC]/85 font-medium">
                  {copy.projects.label}
                </p>
                <h2 className="text-[20px] sm:text-[28px] lg:text-[31px] rtl:text-[21px] sm:rtl:text-[29px] lg:rtl:text-[32px] font-semibold rtl:font-extrabold tracking-[-0.02em] leading-[1.18] sm:leading-[1.15] rtl:leading-[1.34] text-[#F7F5F0]">
                  {copy.projects.title}
                </h2>
                <p className="text-[12.5px] sm:text-sm text-[#D5D4CC]/90 leading-relaxed rtl:leading-[1.8] sm:rtl:leading-[1.85]">
                  {copy.projects.description}
                </p>
              </div>

              <div>
                <a
                  href={buildPath(locale, { page: 'projects' })}
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate({ page: 'projects' });
                  }}
                  className="group/link inline-flex items-center gap-2 min-h-[40px] sm:min-h-0 text-[12.5px] sm:text-sm font-medium text-[#F5F8FC] hover:text-[#6F9BFF] transition-colors whitespace-nowrap"
                >
                  <span>{copy.projects.cta}</span>
                  <ArrowIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-300 group-hover/link:translate-x-1 rtl:group-hover/link:-translate-x-1" />
                </a>
              </div>
            </ArchitecturalReveal>

            {/* Three Landscape Project Cards with Architectural Aperture Unveil & 3D Glass Tilt */}
            <div className="lg:col-span-9 space-y-3 sm:space-y-4">
              <div className="relative">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={projectPage}
                    initial={{ opacity: 0, x: isRtl ? -18 : 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: isRtl ? 18 : -18 }}
                    transition={{ duration: 0.45, ease: ARCHITECTURAL_EASE }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 lg:gap-5"
                  >
                    {visibleProjects.map((project, idx) => {
                      const title = locale === 'fa' ? project.titleFa : project.titleEn;
                      const city = locale === 'fa' ? project.cityFa : project.cityEn;
                      const service = locale === 'fa' ? project.serviceFa : project.serviceEn;
                      const categoryLabel = copy.categories[project.category];
                      return (
                        <ArchitecturalReveal
                          key={project.id}
                          variant="aperture"
                          delay={0.06 + idx * 0.12}
                        >
                          <ArchitecturalTiltCard
                            theme="project"
                            maxTilt={4.5}
                            className="rounded-2xl sm:rounded-3xl"
                          >
                            <a
                              href={buildPath(locale, { page: 'project-detail', slug: project.slug })}
                              onClick={(e) => {
                                e.preventDefault();
                                onNavigate({ page: 'project-detail', slug: project.slug });
                              }}
                              aria-label={`${title}, ${city}`}
                              className="group relative rounded-2xl sm:rounded-3xl border border-[#8AB2FF]/20 overflow-hidden aspect-[16/10] sm:aspect-[4/3] flex flex-col justify-end p-2.5 sm:p-3.5 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-[#6F9BFF]/65 active:scale-[0.985] shadow-[0_24px_54px_-24px_rgba(2,8,24,0.85)]"
                            >
                              <SafeImage
                                src={project.coverImage}
                                alt={`${title} — ${city}`}
                                fallbackTitle={title}
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.07]"
                              />
                              <div
                                aria-hidden="true"
                                className="absolute inset-0 bg-gradient-to-t from-[#080D16]/88 via-transparent to-[#080D16]/20"
                              />

                              {/* Honest Image Provenance Disclosure */}
                              {project.imageDisclosure === 'concept' && (
                                <span className="glass-pill absolute top-2.5 start-2.5 sm:top-3.5 sm:start-3.5 z-10 text-[9.5px] sm:text-[10px] font-medium text-[#F5F8FC]/90 rounded-md sm:rounded-lg px-2 py-0.5 sm:px-2.5">
                                  {copy.projects.conceptBadge}
                                </span>
                              )}

                              <div className="relative z-10 glass-overlay-dock rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 flex items-end justify-between gap-2 sm:gap-2.5 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-1 group-hover:border-[#6F9BFF]/55">
                                <div className="min-w-0 space-y-0.5 sm:space-y-1">
                                  <h3 className="text-[13.5px] sm:text-[15px] rtl:text-[14px] sm:rtl:text-[15.5px] font-semibold rtl:font-bold text-[#F5F8FC] leading-snug rtl:leading-[1.45]">
                                    {title}
                                  </h3>
                                  <p className="text-[11px] sm:text-xs text-[#C6D2E3]">{city}</p>
                                  <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 pt-0.5 text-[10.5px] sm:text-[11px] rtl:text-[10.5px] sm:rtl:text-[11.5px]">
                                    <span className="text-[#C6D2E3]">{categoryLabel}</span>
                                    <span aria-hidden="true" className="text-white/35">·</span>
                                    <span className="text-[#28CF77] font-medium">{service}</span>
                                  </div>
                                </div>

                                <span
                                  aria-hidden="true"
                                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-[#8AB2FF]/30 bg-[#223A87]/35 flex items-center justify-center text-[#F5F8FC] shrink-0 group-hover:bg-[#223A87] group-hover:border-[#6F9BFF] group-hover:text-[#FFFFFF] transition-all duration-300"
                                >
                                  <ArrowIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 transition-transform duration-300 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
                                </span>
                              </div>
                            </a>
                          </ArchitecturalTiltCard>
                        </ArchitecturalReveal>
                      );
                    })}
                  </motion.div>
                </AnimatePresence>

                {/* Carousel Controls: ONLY rendered when more than 3 published projects exist */}
                {showCarouselControls && (
                  <div className="mt-4 sm:mt-5 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }).map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setProjectPage(idx)}
                          aria-label={`${locale === 'fa' ? 'صفحه' : 'Page'} ${idx + 1}`}
                          aria-current={idx === projectPage}
                          className="py-2.5 px-1 inline-flex items-center justify-center"
                        >
                          <span
                            className={`block h-1.5 rounded-full transition-all ${
                              idx === projectPage ? 'w-6 bg-[#28CF77]' : 'w-2.5 bg-white/20 hover:bg-white/40'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setProjectPage((prev) => (prev - 1 + totalPages) % totalPages)
                        }
                        aria-label={copy.projects.prevSlide}
                        className="glass-pill w-10 h-10 sm:w-9 sm:h-9 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 rounded-full flex items-center justify-center text-[#F5F8FC] hover:border-[#6F9BFF] active:scale-[0.95] transition-all"
                      >
                        {isRtl ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => setProjectPage((prev) => (prev + 1) % totalPages)}
                        aria-label={copy.projects.nextSlide}
                        className="glass-pill w-10 h-10 sm:w-9 sm:h-9 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 rounded-full flex items-center justify-center text-[#F5F8FC] hover:border-[#6F9BFF] active:scale-[0.95] transition-all"
                      >
                        {isRtl ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* D. ISB SUSTAINABILITY LAB — Telemetry Calibration & Solar Blueprint Sweep */}
      <section data-mascot-scene="lab" className="cv-auto py-3 sm:py-4 lg:py-6">
        <div className="max-w-[1380px] mx-auto px-3.5 sm:px-6 lg:px-10">
          <ArchitecturalReveal variant="float">
            <div className="glass-surface rounded-[22px] sm:rounded-[30px] p-4 sm:p-7 lg:p-8 relative overflow-hidden border-[#00A651]/25">
              {/* Signature Official ISB Emerald Catalog Pattern & Deep Cobalt/Emerald Refraction */}
              <IsbPatternOverlay
                color="#00A651"
                opacity={0.14}
                scale={1.05}
                maskStyle="radial-gradient(ellipse 72% 88% at 10% 22%, black 0%, transparent 76%)"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-28 end-1/4 w-[28rem] h-[28rem] rounded-full bg-[#00A651]/[0.16] blur-[105px]"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-28 start-10 w-[28rem] h-[28rem] rounded-full bg-[#223A87]/[0.28] blur-[105px]"
              />

              <div
                data-testid="home-lab-showcase"
                className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch"
              >
                {/* 1. Editorial Intro + Primary CTA (Bottom-Right in RTL) */}
                <div className="lg:col-span-3 flex flex-col justify-between gap-3.5 sm:gap-5 py-0.5 sm:py-1">
                  <div className="space-y-2.5 sm:space-y-4">
                    <div className="inline-flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] rtl:text-[11px] sm:rtl:text-xs uppercase tracking-[0.18em] text-[#C6D2E3] font-medium">
                      <FlaskConical className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#28CF77]" strokeWidth={1.6} />
                      <span>{copy.lab.label}</span>
                    </div>
                    <h2 className="text-[20px] sm:text-[28px] lg:text-[32px] rtl:text-[21px] sm:rtl:text-[29px] lg:rtl:text-[33px] font-semibold rtl:font-extrabold tracking-[-0.02em] leading-[1.16] sm:leading-[1.12] rtl:leading-[1.34] text-[#F5F8FC]">
                      {copy.lab.titleStart}{' '}
                      <span className="text-[#28CF77]">{copy.lab.titleAccent}</span>
                    </h2>
                    <p className="text-[12.5px] sm:text-sm text-[#C6D2E3] leading-relaxed rtl:leading-[1.8] sm:rtl:leading-[1.85]">
                      {copy.lab.description}
                    </p>
                  </div>
                  <div className="pt-0.5 sm:pt-1">
                    <MagneticWrapper maxOffset={3.5}>
                      <a
                        href={`${buildPath(locale, { page: 'sustainability-lab' })}#assessment-intake`}
                        onClick={(e) => {
                          e.preventDefault();
                          onOpenLabAssessment();
                        }}
                        className="glass-cta-emerald inline-flex items-center justify-center gap-2 min-h-[44px] sm:min-h-0 rounded-full px-4 py-2 sm:px-5 sm:py-2.5 text-[12px] sm:text-xs rtl:text-[12.5px] sm:rtl:text-[13px] font-semibold rtl:font-bold active:scale-[0.98] transition-all whitespace-nowrap"
                      >
                        <span>{copy.lab.cta}</span>
                        <ArrowIcon className="w-3.5 h-3.5" />
                      </a>
                    </MagneticWrapper>
                  </div>
                </div>

                {/* 2. Enlarged Axonometric Performance Render with Solar Blueprint Scan */}
                <div className="lg:col-span-5 flex">
                  <ArchitecturalTiltCard theme="energy" maxTilt={3.5} className="rounded-xl sm:rounded-2xl w-full h-full">
                    <div className="relative rounded-xl sm:rounded-2xl overflow-hidden border border-[#28CF77]/28 bg-white/[0.03] shadow-xl group w-full h-full min-h-[172px] max-h-[196px] sm:max-h-none sm:min-h-[320px] lg:min-h-[360px]">
                      <SafeImage
                        src={ASSETS.labAxonometric}
                        alt={
                          locale === 'fa'
                            ? 'مدل اکسونومتریک تحلیل انرژی و نور روز ساختمان با پنل خورشیدی بام'
                            : 'Axonometric architectural render showing rooftop photovoltaics, terraces, and solar performance facade analysis'
                        }
                        className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
                      />
                      <AxonometricScanOverlay />
                      <span className="glass-pill absolute bottom-2.5 start-2.5 sm:bottom-3 sm:start-3 text-[10px] sm:text-[11px] text-[#F5F8FC]/95 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-md sm:rounded-lg">
                        {copy.lab.axonCaption}
                      </span>
                    </div>
                  </ArchitecturalTiltCard>
                </div>

                {/* 3. Live Calibrating Frosted Metric Stack (2-col compact grid on mobile, 1-col stack on desktop) */}
                <div className="lg:col-span-4 flex flex-col justify-center space-y-2 sm:space-y-2.5">
                  <p className="text-[10px] sm:text-[11px] text-[#8B9DB7] leading-snug">
                    {copy.lab.illustrativeBanner}
                  </p>

                  <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 sm:gap-2.5">
                    {LAB_METRICS.map((metric, idx) => (
                      <motion.div
                        key={metric.id}
                        initial={{ opacity: 0, y: 14 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.25 }}
                        transition={{ duration: 0.65, delay: 0.08 + idx * 0.09, ease: ARCHITECTURAL_EASE }}
                        className="glass-card glass-card-hover rounded-xl p-2.5 sm:px-3.5 sm:py-2.5 space-y-1.5 flex flex-col justify-between"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-3">
                          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                            <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-[#8AB2FF]/20 bg-[#223A87]/25 flex items-center justify-center shrink-0">
                              <MetricIcon id={metric.id} />
                            </span>
                            <span className="text-[11px] sm:text-xs font-medium text-[#F5F8FC] leading-tight">
                              {metric.label[locale]}
                            </span>
                          </div>

                          {metric.valueDisplay ? (
                            <span className="text-[11.5px] sm:text-[13px] font-semibold font-numeric text-[#F5F8FC] whitespace-nowrap ltr-inline self-start sm:self-auto">
                              {metric.valueDisplay[locale]}
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onNavigate({ page: 'sustainability-lab' })}
                              className="text-[10.5px] sm:text-[11px] font-medium text-[#28CF77] hover:underline whitespace-nowrap self-start sm:self-auto min-h-[28px] sm:min-h-0 inline-flex items-center"
                            >
                              {copy.lab.viewMethodology}
                            </button>
                          )}
                        </div>

                        {metric.progressPct !== null ? (
                          <CalibratedProgressBar
                            pct={metric.progressPct}
                            delay={0.18 + idx * 0.12}
                          />
                        ) : null}

                        <p className="text-[9.5px] sm:text-[10px] text-[#8B9DB7] leading-snug">
                          {metric.unitOrContext[locale]}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </ArchitecturalReveal>
        </div>
      </section>

      {/* E. OUR TEAM — Scroll-Driven 3D Architectural Window Parallax */}
      <section data-mascot-scene="idle" className="cv-auto relative mt-6 sm:mt-10 lg:mt-14 border-y border-[#6F9BFF]/18">
        <StudioParallaxBackdrop
          className="min-h-[265px] sm:min-h-[380px] lg:min-h-[460px] flex items-center"
          backdrop={
            <SafeImage
              src={teamCoverSrc}
              alt={teamCoverCaption}
              className={`w-full h-full object-cover ${
                isRtl ? 'object-[68%_center]' : 'object-[75%_center]'
              }`}
            />
          }
        >
          <div
            aria-hidden="true"
            className={`absolute inset-0 z-[1] ${
              isRtl
                ? 'bg-gradient-to-l from-[#080D16]/85 via-[#080D16]/48 via-[52%] to-[#080D16]/22'
                : 'bg-gradient-to-r from-[#080D16]/85 via-[#080D16]/48 via-[52%] to-[#080D16]/22'
            }`}
          />

          <div className="relative z-10 max-w-[1380px] w-full mx-auto px-3.5 sm:px-6 lg:px-10 py-7 sm:py-12 lg:py-14">
            <ArchitecturalReveal variant="slide-start" isRtl={isRtl}>
              <div className="glass-surface-strong max-w-lg rounded-2xl sm:rounded-3xl p-4 sm:p-8 space-y-2.5 sm:space-y-4">
                <div className="inline-flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] rtl:text-[11px] sm:rtl:text-xs uppercase tracking-[0.2em] text-[#C6D2E3] font-medium">
                  <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#28CF77]" strokeWidth={1.6} />
                  <span>{copy.team.label}</span>
                </div>
                <h2 className="text-[20px] sm:text-[34px] font-semibold rtl:font-extrabold tracking-[-0.02em] leading-[1.2] sm:leading-[1.15] rtl:leading-[1.34] text-[#F5F8FC]">
                  {copy.team.title}
                </h2>
                <p className="text-[12.5px] sm:text-[15px] text-[#C6D2E3] leading-relaxed rtl:leading-[1.8] sm:rtl:leading-[1.9] rtl:font-light">
                  {copy.team.description}
                </p>
                <div className="pt-1 sm:pt-2 flex flex-wrap items-center gap-3 sm:gap-4">
                  <MagneticWrapper maxOffset={4}>
                    <a
                      href={buildPath(locale, { page: 'about' })}
                      onClick={(e) => {
                        e.preventDefault();
                        onNavigate({ page: 'about' });
                      }}
                      className="glass-cta inline-flex items-center justify-center gap-2 min-h-[44px] sm:min-h-0 rounded-full px-5 py-2 sm:px-6 sm:py-2.5 text-[12.5px] sm:text-sm font-semibold rtl:font-bold active:scale-[0.98] transition-all whitespace-nowrap"
                    >
                      <span>{copy.team.cta}</span>
                      <ArrowIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </a>
                  </MagneticWrapper>
                  <span className="text-[10.5px] sm:text-[11px] text-[#8B9DB7]">
                    {teamCoverCaption}
                  </span>
                </div>
              </div>
            </ArchitecturalReveal>
          </div>
        </StudioParallaxBackdrop>
      </section>

      {/* E2. CONFERENCE-STYLE SINGLE-LINE PARTNER LOGO RIBBON (NO HEADING) */}
      <section aria-label={copy.aboutPage.audiencesTitle} className="cv-auto py-4 sm:py-6 lg:py-8">
        <div className="max-w-[1380px] mx-auto px-3.5 sm:px-6 lg:px-10">
          <PartnerLogos locale={locale} partners={partnerLogos} />
        </div>
      </section>

      {/* F. SIGNATURE ISB CATALOG ROYAL COBALT CONTACT BANNER — Emerald Accent & Architectural Pattern */}
      <section className="cv-auto py-5 sm:py-10 lg:py-12">
        <div className="max-w-[1380px] mx-auto px-3.5 sm:px-6 lg:px-10">
          <ArchitecturalReveal variant="float">
            <div
              className="group relative rounded-[22px] sm:rounded-[30px] overflow-hidden px-4 py-5 sm:px-10 sm:py-8 lg:py-10 border border-[#6F9BFF]/32 shadow-[inset_0_1px_0_rgba(214,230,255,0.28),0_26px_64px_-22px_rgba(14,30,84,0.85)]"
              style={{
                background:
                  'linear-gradient(135deg, rgba(34, 58, 135, 0.72) 0%, rgba(19, 35, 82, 0.88) 54%, rgba(10, 18, 38, 0.94) 100%)',
              }}
            >
              {/* Signature Official ISB Catalog Parallelogram Pattern (directly echoing Catalog Page 9 & 12) */}
              <IsbPatternOverlay
                color="#7EA6FF"
                opacity={0.18}
                scale={0.95}
                maskStyle={
                  isRtl
                    ? 'radial-gradient(ellipse 62% 105% at 90% 50%, black 0%, transparent 80%)'
                    : 'radial-gradient(ellipse 62% 105% at 10% 50%, black 0%, transparent 80%)'
                }
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-24 start-0 w-[28rem] h-[28rem] rounded-full bg-[#3B68D6]/[0.24] blur-[95px]"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-24 end-1/4 w-[20rem] h-[20rem] rounded-full bg-[#00A651]/[0.16] blur-[90px]"
              />
              {/* Subtle botanical foliage along far trailing edge feathered seamlessly via alpha mask */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 end-0 w-1/3 max-w-[320px] hidden md:block overflow-hidden"
                style={{
                  maskImage: isRtl
                    ? 'linear-gradient(to right, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.65) 45%, transparent 100%)'
                    : 'linear-gradient(to left, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.65) 45%, transparent 100%)',
                  WebkitMaskImage: isRtl
                    ? 'linear-gradient(to right, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.65) 45%, transparent 100%)'
                    : 'linear-gradient(to left, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.65) 45%, transparent 100%)',
                }}
              >
                <SafeImage
                  src={ASSETS.contactFoliage}
                  alt=""
                  className={`w-full h-full object-cover opacity-70 mix-blend-lighten transition-transform duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06] ${
                    isRtl ? '-scale-x-100 group-hover:-scale-x-[1.06]' : ''
                  }`}
                />
              </div>

              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6 lg:pe-40">
                <h2 className="text-[18px] sm:text-[28px] font-semibold rtl:font-extrabold tracking-[-0.02em] leading-snug sm:leading-tight rtl:leading-[1.36] text-[#FFFFFF] max-w-md">
                  {copy.contactBanner.titleStart}{' '}
                  <span className="text-[#28CF77]">{copy.contactBanner.titleAccent}</span>{' '}
                  {copy.contactBanner.titleEnd}
                </h2>

                <p className="text-[12px] sm:text-sm text-[#D8E4F7] max-w-xs lg:border-s lg:border-[#8AB2FF]/30 lg:ps-6 leading-relaxed rtl:leading-[1.8] sm:rtl:leading-[1.85]">
                  {copy.contactBanner.subtitle}
                </p>

                <div className="shrink-0 w-full sm:w-auto">
                  <MagneticWrapper maxOffset={4.5}>
                    <a
                      href={buildPath(locale, { page: 'contact' })}
                      onClick={(e) => {
                        e.preventDefault();
                        onNavigate({ page: 'contact' });
                      }}
                      className="glass-cta-emerald w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[44px] sm:min-h-0 rounded-full px-5 py-2.5 sm:px-6 sm:py-3 text-[12.5px] sm:text-sm font-semibold rtl:font-bold active:scale-[0.98] transition-all whitespace-nowrap"
                    >
                      <span>{copy.contactBanner.cta}</span>
                      <ArrowIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </a>
                  </MagneticWrapper>
                </div>
              </div>
            </div>
          </ArchitecturalReveal>
        </div>
      </section>
    </div>
  );
}
