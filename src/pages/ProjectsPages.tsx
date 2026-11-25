import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Images,
  MapPin,
  X,
} from '../components/icons/IsbIcons';
import { AnimatePresence, motion } from 'motion/react';
import { DISCIPLINES } from '../data/seedContent';
import { getCopy } from '../data/translations';
import type {
  DisciplineSlug,
  Locale,
  PageRoute,
  Project,
  ProjectCategory,
} from '../types/content';
import { ARCHITECTURAL_EASE } from '../utils/motionMath';
import { buildPath } from '../utils/routing';
import { filterProjects } from '../utils/searchAndFilter';
import { SafeImage } from '../components/BrandMark';
import { ArchitecturalTiltCard } from '../components/MotionPrimitives';

interface ProjectsIndexPageProps {
  locale: Locale;
  projects: Project[];
  onNavigate: (route: PageRoute) => void;
}

export function ProjectsIndexPage({ locale, projects, onNavigate }: ProjectsIndexPageProps) {
  const copy = getCopy(locale);
  const isRtl = locale === 'fa';
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const [disciplineFilter, setDisciplineFilter] = useState<DisciplineSlug | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<ProjectCategory | 'all'>('all');

  const availableCategories = useMemo(() => {
    const set = new Set<ProjectCategory>();
    for (const p of projects) {
      if (p.status === 'published') set.add(p.category);
    }
    return Array.from(set);
  }, [projects]);

  const filtered = useMemo(
    () => filterProjects(projects, disciplineFilter, categoryFilter),
    [projects, disciplineFilter, categoryFilter]
  );

  return (
    <div className="pt-20 pb-12 sm:pt-28 sm:pb-20">
      <div className="max-w-[1380px] mx-auto px-3.5 sm:px-6 lg:px-10 space-y-6 sm:space-y-10">
        <div className="max-w-3xl space-y-2.5 sm:space-y-4">
          <p className="text-[10px] sm:text-[11px] rtl:text-[11px] sm:rtl:text-xs uppercase tracking-[0.2em] text-[#6F9BFF] font-medium">
            {copy.projects.label}
          </p>
          <h1 className="text-[22px] sm:text-5xl font-semibold rtl:font-extrabold tracking-tight rtl:leading-[1.34] sm:rtl:leading-[1.3] text-[#F5F8FC]">
            {copy.projects.title}
          </h1>
          <p className="text-[13px] sm:text-base rtl:font-light text-[#C6D2E3] leading-relaxed rtl:leading-[1.85] sm:rtl:leading-[1.9]">{copy.projects.description}</p>
        </div>

        {/* Working Discipline & Project Type Filters (Single-line horizontal scroll on mobile) */}
        <div className="glass-surface rounded-2xl p-3 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 sm:gap-4">
          <div
            className="flex flex-nowrap overflow-x-auto no-scrollbar sm:flex-wrap items-center gap-1.5 sm:gap-2 pb-0.5 sm:pb-0"
            role="group"
            aria-label={copy.nav.expertise}
          >
            <button
              type="button"
              onClick={() => setDisciplineFilter('all')}
              aria-pressed={disciplineFilter === 'all'}
              className={`min-h-[38px] sm:min-h-0 rounded-full px-3 py-1.5 sm:px-4 sm:py-2 text-[11.5px] sm:text-xs font-medium transition-all whitespace-nowrap shrink-0 active:scale-[0.97] ${
                disciplineFilter === 'all'
                  ? 'glass-cta font-semibold'
                  : 'glass-pill text-[#C6D2E3] hover:border-[#6F9BFF]/50'
              }`}
            >
              {copy.projects.filterAllDisciplines}
            </button>
            {DISCIPLINES.map((disc) => (
              <button
                key={disc.slug}
                type="button"
                onClick={() => setDisciplineFilter(disc.slug)}
                aria-pressed={disciplineFilter === disc.slug}
                className={`min-h-[38px] sm:min-h-0 rounded-full px-3 py-1.5 sm:px-4 sm:py-2 text-[11.5px] sm:text-xs font-medium transition-all whitespace-nowrap shrink-0 active:scale-[0.97] ${
                  disciplineFilter === disc.slug
                    ? disc.slug === 'energy-mep'
                      ? 'glass-cta-emerald font-semibold'
                      : 'glass-cta font-semibold'
                    : 'glass-pill text-[#C6D2E3] hover:border-[#6F9BFF]/50'
                }`}
              >
                {disc.title[locale]}
              </button>
            ))}
          </div>

          <div
            className="flex flex-nowrap overflow-x-auto no-scrollbar sm:flex-wrap items-center gap-1.5 sm:gap-2 border-t border-white/[0.07] pt-2 lg:border-t-0 lg:pt-0"
            role="group"
            aria-label={copy.projects.typeLabel}
          >
            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              aria-pressed={categoryFilter === 'all'}
              className={`min-h-[36px] sm:min-h-0 rounded-lg px-2.5 py-1.5 sm:px-3 text-[11.5px] sm:text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
                categoryFilter === 'all'
                  ? 'glass-card-active text-[#93BCFF]'
                  : 'text-[#8B9DB7] hover:text-[#F5F8FC]'
              }`}
            >
              {copy.projects.filterAllTypes}
            </button>
            {availableCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                aria-pressed={categoryFilter === cat}
                className={`min-h-[36px] sm:min-h-0 rounded-lg px-2.5 py-1.5 sm:px-3 text-[11.5px] sm:text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
                  categoryFilter === cat
                    ? 'glass-card-active text-[#93BCFF]'
                    : 'text-[#8B9DB7] hover:text-[#F5F8FC]'
                }`}
              >
                {copy.categories[cat]}
              </button>
            ))}
          </div>
        </div>

        {/* Project Cards Grid */}
        {filtered.length === 0 ? (
          <div className="glass-surface rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center space-y-4">
            <p className="text-[13px] sm:text-sm text-[#C6D2E3]">{copy.projects.noMatches}</p>
            <button
              type="button"
              onClick={() => {
                setDisciplineFilter('all');
                setCategoryFilter('all');
              }}
              className="glass-pill inline-flex items-center justify-center min-h-[42px] sm:min-h-0 rounded-full px-5 py-2 text-xs font-medium text-[#93BCFF] hover:border-[#6F9BFF]"
            >
              {copy.projects.resetFilters}
            </button>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6">
            <AnimatePresence mode="popLayout">
              {filtered.map((project, idx) => {
                const title = locale === 'fa' ? project.titleFa : project.titleEn;
                const city = locale === 'fa' ? project.cityFa : project.cityEn;
                const service = locale === 'fa' ? project.serviceFa : project.serviceEn;
                return (
                  <motion.div
                    key={project.id}
                    layout
                    initial={{ opacity: 0, y: 24, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.55, delay: idx * 0.06, ease: ARCHITECTURAL_EASE }}
                  >
                    <ArchitecturalTiltCard theme="project" maxTilt={4.5} className="rounded-2xl sm:rounded-3xl">
                      <a
                        href={buildPath(locale, { page: 'project-detail', slug: project.slug })}
                        onClick={(e) => {
                          e.preventDefault();
                          onNavigate({ page: 'project-detail', slug: project.slug });
                        }}
                        className="group relative rounded-2xl sm:rounded-3xl border border-white/16 overflow-hidden aspect-[16/10] sm:aspect-[4/3] flex flex-col justify-end p-2.5 sm:p-3.5 hover:border-[#6F9BFF]/60 active:scale-[0.985] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] shadow-[0_24px_54px_-24px_rgba(3,7,18,0.88)]"
                      >
                        <SafeImage
                          src={project.coverImage}
                          alt={`${title} — ${city}`}
                          fallbackTitle={title}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.07] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#070B14]/86 via-transparent to-[#080D16]/20" />

                        {project.imageDisclosure === 'concept' && (
                          <span className="glass-pill absolute top-2.5 start-2.5 sm:top-3.5 sm:start-3.5 z-10 text-[9.5px] sm:text-[10px] font-medium rounded-md sm:rounded-lg px-2 py-0.5 sm:px-2.5 text-[#F5F8FC]">
                            {copy.projects.conceptBadge}
                          </span>
                        )}

                        <div className="relative z-10 glass-overlay-dock rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 flex items-end justify-between gap-2 sm:gap-2.5 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-1 group-hover:border-[#6F9BFF]/50">
                          <div className="min-w-0 space-y-0.5 sm:space-y-1">
                            <h2 className="text-[14px] sm:text-[16px] font-semibold rtl:font-bold text-[#F5F8FC] leading-snug rtl:leading-[1.45]">{title}</h2>
                            <p className="text-[11px] sm:text-xs text-[#C6D2E3]">{city}</p>
                            <div className="flex flex-wrap items-center gap-1.5 text-[10.5px] sm:text-xs pt-0.5">
                              <span className="text-[#C6D2E3]">{copy.categories[project.category]}</span>
                              <span aria-hidden="true" className="text-white/35">·</span>
                              <span className="text-[#28CF77] font-medium">{service}</span>
                            </div>
                          </div>

                          <span
                            aria-hidden="true"
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-[#6F9BFF]/30 bg-[#223A87]/30 flex items-center justify-center text-[#F5F8FC] shrink-0 group-hover:bg-[#223A87] group-hover:border-[#6F9BFF] group-hover:text-white transition-all duration-300"
                          >
                            <ArrowIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          </span>
                        </div>
                      </a>
                    </ArchitecturalTiltCard>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}

interface ProjectDetailPageProps {
  locale: Locale;
  slug: string;
  projects: Project[];
  onNavigate: (route: PageRoute) => void;
}

export function ProjectDetailPage({
  locale,
  slug,
  projects,
  onNavigate,
}: ProjectDetailPageProps) {
  const copy = getCopy(locale);
  const isRtl = locale === 'fa';
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;
  const ForwardIcon = isRtl ? ArrowLeft : ArrowRight;

  const project = projects.find((p) => p.slug === slug && p.status === 'published');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const allPhotos = useMemo(() => {
    if (!project) return [];
    const extras = (project.gallery ?? []).filter(
      (img) => img && img.trim() && img !== project.coverImage
    );
    return [project.coverImage, ...extras];
  }, [project]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxIndex(null);
      } else if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) =>
          prev === null ? null : (prev + (isRtl ? -1 : 1) + allPhotos.length) % allPhotos.length
        );
      } else if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) =>
          prev === null ? null : (prev + (isRtl ? 1 : -1) + allPhotos.length) % allPhotos.length
        );
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lightboxIndex, allPhotos.length, isRtl]);

  if (!project) {
    return (
      <div className="pt-32 pb-24 max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-10 text-center space-y-4">
        <h1 className="text-2xl font-semibold text-[#F5F8FC]">
          {locale === 'fa' ? 'پروژه مورد نظر یافت نشد' : 'Project not found'}
        </h1>
        <button
          type="button"
          onClick={() => onNavigate({ page: 'projects' })}
          className="glass-cta inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold"
        >
          <BackIcon className="w-4 h-4" />
          <span>{copy.projects.backToProjects}</span>
        </button>
      </div>
    );
  }

  const title = locale === 'fa' ? project.titleFa : project.titleEn;
  const city = locale === 'fa' ? project.cityFa : project.cityEn;
  const service = locale === 'fa' ? project.serviceFa : project.serviceEn;
  const role = locale === 'fa' ? project.roleFa : project.roleEn;
  const brief = locale === 'fa' ? project.briefFa : project.briefEn;
  const approach = locale === 'fa' ? project.approachFa : project.approachEn;
  const galleryPhotos = allPhotos.slice(1);
  const metadataCount =
    3 + (project.year?.trim() ? 1 : 0) + (project.areaSqm?.trim() ? 1 : 0);

  return (
    <div className="pt-20 pb-12 sm:pt-28 sm:pb-20">
      <div className="max-w-[1380px] mx-auto px-3.5 sm:px-6 lg:px-10 space-y-7 sm:space-y-12">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[11px] sm:text-xs text-[#8B9DB7]">
          <a
            href={buildPath(locale, { page: 'projects' })}
            onClick={(e) => {
              e.preventDefault();
              onNavigate({ page: 'projects' });
            }}
            className="inline-flex items-center gap-1.5 min-h-[38px] sm:min-h-0 hover:text-[#6F9BFF] transition-colors"
          >
            <BackIcon className="w-3.5 h-3.5" />
            <span>{copy.projects.backToProjects}</span>
          </a>
        </nav>

        <div className="space-y-2.5 sm:space-y-4 max-w-4xl">
          <div className="flex flex-wrap items-center gap-2 text-[11px] sm:text-xs text-[#28CF77]">
            <span>{copy.categories[project.category]}</span>
            <span aria-hidden="true">·</span>
            <span>{service}</span>
          </div>
          <h1 className="text-[22px] sm:text-5xl font-semibold rtl:font-extrabold tracking-tight rtl:leading-[1.34] sm:rtl:leading-[1.3] text-[#F5F8FC]">
            {title}
          </h1>
          <p className="inline-flex items-center gap-1.5 text-[12.5px] sm:text-sm text-[#C6D2E3]">
            <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#6F9BFF]" />
            <span>{city}</span>
          </p>
        </div>

        {/* Cover Media with Provenance Label & Click to Enlarge */}
        <button
          type="button"
          onClick={() => setLightboxIndex(0)}
          aria-label={locale === 'fa' ? 'بزرگ‌نمایی تصویر پروژه' : 'Open project photo lightbox'}
          className="group relative block w-full text-start rounded-2xl sm:rounded-3xl border border-[#6F9BFF]/22 overflow-hidden aspect-[16/10] sm:aspect-[16/9] max-h-[580px] bg-[#0E1626] shadow-2xl cursor-zoom-in"
        >
          <SafeImage
            src={project.coverImage}
            alt={`${title} — ${city}`}
            fallbackTitle={title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
          />
          {project.imageDisclosure === 'concept' && (
            <span className="glass-pill absolute bottom-2.5 start-2.5 sm:bottom-4 sm:start-4 text-[10px] sm:text-xs font-medium rounded-lg px-2.5 py-0.5 sm:px-3 sm:py-1 text-[#F5F8FC]">
              {copy.projects.conceptBadge}
            </span>
          )}
          {allPhotos.length > 1 && (
            <span className="glass-pill absolute bottom-2.5 end-2.5 sm:bottom-4 sm:end-4 inline-flex items-center gap-1.5 text-[10.5px] sm:text-xs font-medium rounded-full px-2.5 py-1 sm:px-3 sm:py-1.5 text-[#F5F8FC]">
              <Images className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#28CF77]" />
              <span className="font-numeric">
                {locale === 'fa' ? `${allPhotos.length} تصویر` : `${allPhotos.length} photos`}
              </span>
            </span>
          )}
        </button>

        {/* Frosted Metadata Bar (Compact 2-column grid on mobile) */}
        <div
          className={`glass-surface rounded-2xl grid grid-cols-2 sm:grid-cols-3 ${
            metadataCount >= 5
              ? 'lg:grid-cols-5'
              : metadataCount === 4
                ? 'lg:grid-cols-4'
                : 'lg:grid-cols-3'
          } gap-3.5 sm:gap-5 p-4 sm:p-6`}
        >
          <div>
            <p className="text-[11px] sm:text-xs text-[#8B9DB7]">{copy.projects.locationLabel}</p>
            <p className="text-[13px] sm:text-sm font-medium text-[#F5F8FC] mt-0.5 sm:mt-1">{city}</p>
          </div>
          <div>
            <p className="text-[11px] sm:text-xs text-[#8B9DB7]">{copy.projects.typeLabel}</p>
            <p className="text-[13px] sm:text-sm font-medium text-[#F5F8FC] mt-0.5 sm:mt-1">
              {copy.categories[project.category]}
            </p>
          </div>
          <div>
            <p className="text-[11px] sm:text-xs text-[#8B9DB7]">{copy.projects.serviceLabel}</p>
            <p className="text-[13px] sm:text-sm font-medium text-[#28CF77] mt-0.5 sm:mt-1">{service}</p>
          </div>
          {project.year?.trim() && (
            <div>
              <p className="text-[11px] sm:text-xs text-[#8B9DB7]">
                {locale === 'fa' ? 'سال طراحی / اجرا' : 'Year'}
              </p>
              <p className="text-[13px] sm:text-sm font-medium font-numeric text-[#F5F8FC] mt-0.5 sm:mt-1">
                {project.year}
              </p>
            </div>
          )}
          {project.areaSqm?.trim() && (
            <div>
              <p className="text-[11px] sm:text-xs text-[#8B9DB7]">
                {locale === 'fa' ? 'زیربنا / مقیاس' : 'Floor Area'}
              </p>
              <p className="text-[13px] sm:text-sm font-medium font-numeric text-[#F5F8FC] mt-0.5 sm:mt-1">
                {project.areaSqm}
              </p>
            </div>
          )}
        </div>

        {/* Narrative Sections (omitted cleanly when empty) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8">
          {role && (
            <div className="lg:col-span-4 glass-surface rounded-2xl p-4 sm:p-6 space-y-2 sm:space-y-2.5 h-fit">
              <h2 className="text-[13px] sm:text-sm font-semibold text-[#6F9BFF]">{copy.projects.roleLabel}</h2>
              <p className="text-[12.5px] sm:text-sm text-[#C6D2E3] leading-relaxed whitespace-pre-line">{role}</p>
            </div>
          )}

          <div className={`${role ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-5 sm:space-y-8`}>
            {brief && (
              <section className="space-y-2 sm:space-y-2.5">
                <h2 className="text-[17px] sm:text-xl font-semibold rtl:font-bold text-[#F5F8FC]">
                  {copy.projects.briefLabel}
                </h2>
                <p className="text-[13px] sm:text-[15px] text-[#C6D2E3] leading-relaxed rtl:leading-[1.85] sm:rtl:leading-[1.9] whitespace-pre-line">
                  {brief}
                </p>
              </section>
            )}

            {approach && (
              <section className="space-y-2 sm:space-y-2.5">
                <h2 className="text-[17px] sm:text-xl font-semibold rtl:font-bold text-[#F5F8FC]">
                  {copy.projects.approachLabel}
                </h2>
                <p className="text-[13px] sm:text-[15px] text-[#C6D2E3] leading-relaxed rtl:leading-[1.85] sm:rtl:leading-[1.9] whitespace-pre-line">
                  {approach}
                </p>
              </section>
            )}

            {/* Verified Performance Metrics ONLY when supplied */}
            {project.verifiedMetrics && project.verifiedMetrics.length > 0 && (
              <section className="space-y-3 sm:space-y-4 pt-3 sm:pt-4 border-t border-white/10">
                <h2 className="text-[17px] sm:text-xl font-semibold text-[#F5F8FC]">
                  {copy.projects.metricsLabel}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {project.verifiedMetrics.map((m) => (
                    <div key={m.label.en} className="glass-card rounded-xl p-3.5 sm:p-4 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] sm:text-xs text-[#8B9DB7]">{m.label[locale]}</span>
                        {m.isTarget && (
                          <span className="text-[10px] text-[#28CF77]">
                            {copy.projects.targetLabel}
                          </span>
                        )}
                      </div>
                      <div
                        dir={/[\u0600-\u06FF]/.test(m.value) ? undefined : 'ltr'}
                        className="text-base sm:text-lg font-semibold font-numeric text-[#F5F8FC] inline-block"
                      >
                        {m.value}
                      </div>
                      <div className="text-[11px] sm:text-xs text-[#8B9DB7]">{m.basis[locale]}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Project Gallery Grid when admin uploaded extra images */}
        {galleryPhotos.length > 0 && (
          <section className="space-y-4 sm:space-y-5 border-t border-white/10 pt-7 sm:pt-10">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[17px] sm:text-2xl font-semibold rtl:font-bold text-[#F5F8FC]">
                {locale === 'fa' ? 'گالری تصاویر و مدارک پروژه' : 'Project Gallery'}
              </h2>
              <span className="text-[11px] sm:text-xs text-[#8B9DB7] font-numeric">
                {locale === 'fa'
                  ? `${galleryPhotos.length} تصویر تکمیلی`
                  : `${galleryPhotos.length} additional images`}
              </span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-5">
              {galleryPhotos.map((photoSrc, idx) => (
                <button
                  key={`${photoSrc}-${idx}`}
                  type="button"
                  onClick={() => setLightboxIndex(idx + 1)}
                  className="group relative rounded-xl sm:rounded-2xl border border-white/15 overflow-hidden aspect-[4/3] bg-[#0E1626] hover:border-[#6F9BFF]/60 transition-all cursor-zoom-in"
                >
                  <SafeImage
                    src={photoSrc}
                    alt={`${title} — ${idx + 2}`}
                    fallbackTitle={title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                  />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Bottom Inquiry Callout */}
        <div className="glass-surface rounded-2xl sm:rounded-3xl p-4 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-5">
          <h2 className="text-[16px] sm:text-xl font-semibold text-[#F5F8FC]">
            {copy.projects.relatedCtaTitle}
          </h2>
          <a
            href={buildPath(locale, { page: 'contact' })}
            onClick={(e) => {
              e.preventDefault();
              onNavigate({ page: 'contact' });
            }}
            className="glass-cta w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[44px] sm:min-h-0 rounded-full px-5 py-2.5 sm:px-6 sm:py-3 text-[12.5px] sm:text-sm font-semibold active:scale-[0.98] transition-all whitespace-nowrap"
          >
            <span>{copy.projects.relatedCtaBtn}</span>
            <ForwardIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </a>
        </div>
      </div>

      {/* Fullscreen Photo Lightbox Modal portaled above global header */}
      {typeof document !== 'undefined' &&
        lightboxIndex !== null &&
        allPhotos[lightboxIndex] &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={locale === 'fa' ? 'نمایشگر تصاویر پروژه' : 'Project image lightbox'}
            onClick={() => setLightboxIndex(null)}
            className="fixed inset-0 z-[95] bg-[#060A12]/94 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-8"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-5xl w-full flex flex-col items-center gap-4"
            >
              <div className="w-full flex items-center justify-between gap-3">
                <span className="text-xs text-[#C6D2E3] font-numeric">
                  {title} · {lightboxIndex + 1} / {allPhotos.length}
                </span>
                <button
                  type="button"
                  onClick={() => setLightboxIndex(null)}
                  aria-label={locale === 'fa' ? 'بستن' : 'Close'}
                  className="glass-pill w-10 h-10 rounded-full flex items-center justify-center text-[#F5F8FC] hover:border-[#6F9BFF]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="relative w-full rounded-2xl overflow-hidden border border-[#6F9BFF]/24 bg-[#080D16] max-h-[78vh] flex items-center justify-center">
                <SafeImage
                  src={allPhotos[lightboxIndex]}
                  alt={`${title} — ${lightboxIndex + 1}`}
                  fallbackTitle={title}
                  className="max-h-[78vh] w-auto max-w-full object-contain"
                />
              </div>

              {allPhotos.length > 1 && (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setLightboxIndex((prev) =>
                        prev === null ? 0 : (prev - 1 + allPhotos.length) % allPhotos.length
                      )
                    }
                    aria-label={locale === 'fa' ? 'تصویر قبلی' : 'Previous photo'}
                    className="glass-pill w-10 h-10 rounded-full flex items-center justify-center text-[#F5F8FC] hover:border-[#6F9BFF]"
                  >
                    {isRtl ? (
                      <ChevronRight className="w-4 h-4" />
                    ) : (
                      <ChevronLeft className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setLightboxIndex((prev) =>
                        prev === null ? 0 : (prev + 1) % allPhotos.length
                      )
                    }
                    aria-label={locale === 'fa' ? 'تصویر بعدی' : 'Next photo'}
                    className="glass-pill w-10 h-10 rounded-full flex items-center justify-center text-[#F5F8FC] hover:border-[#6F9BFF]"
                  >
                    {isRtl ? (
                      <ChevronLeft className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
