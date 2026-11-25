import React from 'react';
import { ArrowLeft, ArrowRight, Check } from '../components/icons/IsbIcons';
import { ASSETS } from '../data/assets';
import { DISCIPLINES } from '../data/seedContent';
import { getCopy } from '../data/translations';
import type {
  DisciplineSlug,
  Locale,
  MaterialItem,
  PageRoute,
  PartnerLogo,
  Project,
  SiteSettings,
  TeamMember,
} from '../types/content';
import { buildPath } from '../utils/routing';
import {
  MATERIALS_DEPARTMENT_META,
  SEED_MATERIALS,
  selectMaterialPartnerBrands,
} from '../utils/materialsCatalog';
import { IsbPatternOverlay, SafeImage } from '../components/BrandMark';
import { TeamOrgTree } from '../components/TeamOrgTree';

interface BasePageProps {
  locale: Locale;
  onNavigate: (route: PageRoute) => void;
}

interface AboutPageProps extends BasePageProps {
  settings: SiteSettings;
  teamMembers: TeamMember[];
  partnerLogos?: PartnerLogo[];
}

export function AboutPage({
  locale,
  settings,
  teamMembers,
  partnerLogos,
  onNavigate,
}: AboutPageProps) {
  const copy = getCopy(locale);
  const isFa = locale === 'fa';
  const ArrowIcon = isFa ? ArrowLeft : ArrowRight;

  const aboutLead =
    (isFa ? settings?.aboutLeadFa : settings?.aboutLeadEn)?.trim() || copy.aboutPage.lead;

  const studioPhotoSrc = settings.teamCoverImage?.trim() || ASSETS.teamStudio;
  const studioPhotoCaption =
    (isFa ? settings.teamCoverCaptionFa : settings.teamCoverCaptionEn)?.trim() ||
    copy.team.illustrativeCaption;

  return (
    <div data-testid="about-page" className="pt-20 pb-12 sm:pt-28 sm:pb-20">
      <div className="max-w-[1380px] mx-auto px-3.5 sm:px-6 lg:px-10 space-y-8 sm:space-y-12 lg:space-y-16">
        {/* 1. CONCISE FULL-WIDTH EDITORIAL OPENING */}
        <section className="space-y-5 sm:space-y-8">
          <div className="space-y-2.5 sm:space-y-4">
            <p className="text-[10px] sm:text-[11px] rtl:text-[11px] sm:rtl:text-xs uppercase tracking-[0.2em] rtl:tracking-normal text-[#28CF77] font-semibold">
              {copy.aboutPage.label}
            </p>
            <h1 className="text-[22px] sm:text-4xl lg:text-[42px] font-semibold rtl:font-extrabold tracking-tight rtl:tracking-normal leading-[1.2] sm:leading-[1.16] rtl:leading-[1.34] sm:rtl:leading-[1.32] text-[#F5F8FC]">
              {copy.aboutPage.title}
            </h1>
            <p className="text-[13px] sm:text-[17px] rtl:font-light text-[#C6D2E3] leading-relaxed rtl:leading-[1.85] sm:rtl:leading-[1.9]">
              {aboutLead}
            </p>
          </div>

          {/* Compact 3-Column Horizontal Architectural Strip */}
          <div className="grid grid-cols-1 md:grid-cols-3 border-y border-white/10 divide-y md:divide-y-0 md:divide-x rtl:md:divide-x-reverse divide-white/10">
            {copy.aboutPage.pillars.map((pillar) => (
              <div
                key={pillar.step}
                className="py-3.5 sm:py-5 md:py-6 md:px-6 first:md:ps-0 last:md:pe-0 space-y-1.5 sm:space-y-2"
              >
                <div className="flex items-baseline gap-2 sm:gap-2.5">
                  <span className="font-mono font-numeric text-[11px] sm:text-xs font-semibold text-[#28CF77]">
                    {pillar.step}
                  </span>
                  <h2 className="text-[13px] sm:text-[15px] font-bold text-[#F5F8FC]">
                    {pillar.title}
                  </h2>
                </div>
                <p className="text-[11.5px] sm:text-[13.5px] text-[#AEBFD6] leading-relaxed rtl:leading-[1.78] sm:rtl:leading-[1.85]">
                  {pillar.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 2. INTEGRATED TEAM SHOWCASE — STUDIO BANNER, GOVERNANCE, DEPARTMENTS, ADVISORS & PARTNERS */}
        <section
          id="about-team-section"
          data-testid="about-team-section"
          className="space-y-5 sm:space-y-11"
        >
          {/* Minimal Section Heading + Full-Width Elongated Studio Visual Banner */}
          <div className="space-y-2.5 sm:space-y-4">
            <div className="flex items-end justify-between gap-4">
              <h2 className="text-[19px] sm:text-3xl lg:text-[2.15rem] font-bold rtl:font-extrabold tracking-tight text-[#F5F8FC]">
                {copy.teamPage.label}
              </h2>
              {studioPhotoCaption && (
                <p className="hidden sm:block text-xs sm:text-sm font-medium text-[#9EB2CE]">
                  {studioPhotoCaption}
                </p>
              )}
            </div>

            <div className="relative w-full overflow-hidden rounded-[18px] sm:rounded-[28px] border border-[#6F9BFF]/24 bg-[#0B1426] shadow-[0_32px_90px_-30px_rgba(0,0,0,0.92)] aspect-[16/9] sm:aspect-[21/8] lg:h-[430px]">
              <SafeImage
                src={studioPhotoSrc}
                alt={studioPhotoCaption}
                className="w-full h-full object-cover object-center"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-16 sm:h-20 bg-gradient-to-t from-[#060C18]/78 via-[#060C18]/20 to-transparent"
              />
              {studioPhotoCaption && (
                <span className="sm:hidden absolute bottom-2.5 start-3 text-[10px] font-medium text-[#E8EFFA] drop-shadow">
                  {studioPhotoCaption}
                </span>
              )}
            </div>
          </div>

          {/* Architectural Governance, Columnar Departments, Advisors & Partners Directory */}
          <TeamOrgTree
            locale={locale}
            settings={settings}
            teamMembers={teamMembers}
            partnerLogos={partnerLogos}
          />
        </section>

        {/* Signature ISB Royal Cobalt Catalog CTA */}
        <div
          className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[#6F9BFF]/32 p-4 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6"
          style={{
            background:
              'linear-gradient(125deg, rgba(34, 58, 135, 0.92) 0%, rgba(22, 41, 102, 0.95) 58%, rgba(12, 26, 62, 0.96) 100%)',
          }}
        >
          <IsbPatternOverlay
            color="#FFFFFF"
            opacity={0.14}
            scale={1.05}
            maskStyle="radial-gradient(ellipse 80% 90% at 88% 50%, black 0%, transparent 78%)"
          />
          <div className="relative z-10 space-y-1 sm:space-y-1.5">
            <h2 className="text-[17px] sm:text-xl font-semibold text-[#FFFFFF]">
              {copy.contactBanner.titleStart}{' '}
              <span className="text-[#34D381]">{copy.contactBanner.titleAccent}</span>{' '}
              {copy.contactBanner.titleEnd}
            </h2>
            <p className="text-[12px] sm:text-sm text-[#DBE6F7]">{copy.contactBanner.subtitle}</p>
          </div>
          <a
            href={buildPath(locale, { page: 'contact' })}
            onClick={(e) => {
              e.preventDefault();
              onNavigate({ page: 'contact' });
            }}
            className="relative z-10 glass-cta-emerald w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[44px] sm:min-h-0 rounded-full px-5 py-2.5 sm:px-6 sm:py-3 text-[12.5px] sm:text-sm font-semibold active:scale-[0.98] transition-all whitespace-nowrap shrink-0"
          >
            <span>{copy.contactBanner.cta}</span>
            <ArrowIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}

interface ExpertiseIndexPageProps extends BasePageProps {
  materials?: MaterialItem[];
  partnerLogos?: PartnerLogo[];
}

export function ExpertiseIndexPage({
  locale,
  materials = SEED_MATERIALS,
  partnerLogos = [],
  onNavigate,
}: ExpertiseIndexPageProps) {
  const copy = getCopy(locale);
  const isRtl = locale === 'fa';
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;
  const featuredPartners = selectMaterialPartnerBrands(partnerLogos, 'materials');
  const partnerPreviewNames = featuredPartners
    .slice(0, 6)
    .map((brand) => (isRtl ? brand.nameFa : brand.nameEn));
  const totalCertCount = materials.reduce((sum, item) => sum + (item.certificates?.length ?? 0), 0);

  return (
    <div data-testid="expertise-index-page" className="pt-20 pb-12 sm:pt-28 sm:pb-20">
      <div className="max-w-[1380px] mx-auto px-3.5 sm:px-6 lg:px-10 space-y-8 sm:space-y-14">
        <div className="max-w-3xl space-y-2.5 sm:space-y-4">
          <p className="text-[10px] sm:text-[11px] rtl:text-[11px] sm:rtl:text-xs uppercase tracking-[0.2em] text-[#6F9BFF] font-medium">
            {copy.expertise.label}
          </p>
          <h1 className="text-[22px] sm:text-5xl font-semibold rtl:font-extrabold tracking-tight leading-[1.18] sm:leading-[1.12] rtl:leading-[1.34] sm:rtl:leading-[1.3] text-[#F5F8FC]">
            {copy.expertise.titleStart}{' '}
            <span className="text-[#28CF77]">{copy.expertise.titleAccent}</span>
          </h1>
          <p className="text-[13px] sm:text-base rtl:font-light text-[#C6D2E3] leading-relaxed rtl:leading-[1.85] sm:rtl:leading-[1.9]">{copy.expertise.description}</p>
        </div>

        <div className="space-y-5 sm:space-y-8">
          {DISCIPLINES.map((disc) => (
            <article
              key={disc.slug}
              className="glass-surface rounded-2xl sm:rounded-3xl overflow-hidden grid grid-cols-1 lg:grid-cols-12"
            >
              <div className="lg:col-span-4 relative h-[168px] sm:h-auto sm:min-h-[240px]">
                <SafeImage
                  src={disc.coverImage}
                  alt={disc.title[locale]}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="lg:col-span-8 p-4 sm:p-8 flex flex-col justify-between gap-4 sm:gap-6">
                <div className="space-y-2.5 sm:space-y-4">
                  <div
                    className={`flex items-center gap-2 sm:gap-3 text-[11px] sm:text-xs font-mono font-numeric ${
                      disc.slug === 'energy-mep' ? 'text-[#28CF77]' : 'text-[#6F9BFF]'
                    }`}
                  >
                    <span>{disc.indexLabel}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-sans">{disc.shortSubtitle[locale]}</span>
                  </div>
                  <h2 className="text-[18px] sm:text-2xl font-semibold rtl:font-bold text-[#F5F8FC]">{disc.title[locale]}</h2>
                  <p className="text-[12.5px] sm:text-sm text-[#C6D2E3] leading-relaxed rtl:leading-[1.8] sm:rtl:leading-[1.85]">{disc.overview[locale]}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 pt-1 sm:pt-2">
                    {disc.services.map((srv) => (
                      <div
                        key={srv.name.en}
                        className="glass-card rounded-xl p-3 sm:p-4 space-y-1 sm:space-y-1.5"
                      >
                        <h3 className="text-[12px] sm:text-xs font-semibold text-[#F5F8FC]">{srv.name[locale]}</h3>
                        <p className="text-[11px] sm:text-xs text-[#8B9DB7] leading-relaxed">
                          {srv.description[locale]}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <a
                    href={buildPath(locale, { page: 'discipline', slug: disc.slug })}
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate({ page: 'discipline', slug: disc.slug });
                    }}
                    className={`${
                      disc.slug === 'energy-mep' ? 'glass-cta-emerald' : 'glass-cta'
                    } inline-flex items-center justify-center gap-2 min-h-[44px] sm:min-h-0 rounded-full px-5 py-2.5 text-[12px] sm:text-xs font-semibold active:scale-[0.98] transition-all`}
                  >
                    <span>{copy.hero.viewDiscipline}</span>
                    <ArrowIcon className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Separated Special Division: Modern Materials & Technologies (Certificates, Catalogs & Visual Showroom) */}
        <section
          data-testid="expertise-materials-section"
          aria-labelledby="expertise-materials-heading"
          className="border-t border-white/12 pt-8 sm:pt-14 space-y-4 sm:space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div className="space-y-1">
              <p className="text-[10.5px] sm:text-xs font-semibold uppercase tracking-[0.18em] rtl:tracking-normal text-[#DFBA78]">
                {MATERIALS_DEPARTMENT_META.kicker[locale]}
              </p>
              <p className="text-[12px] sm:text-sm text-[#9FB1CA]">
                {isRtl
                  ? 'ویترین مستقل مصالح نوین ساختمانی، تصاویر گواهینامه‌های فنی، کاتالوگ‌ها و برندهای همکار — جدا از سه دپارتمان مهندسی پایه'
                  : 'An independent architectural showroom for modern building materials, certificate galleries, product catalogs, and partner brands — distinct from the three core studios'}
              </p>
            </div>
            <span className="font-numeric text-[11px] sm:text-xs font-medium text-[#DFBA78]/90">
              {isRtl
                ? `${materials.length.toLocaleString('fa-IR')} سامانه مصالح · ${totalCertCount.toLocaleString('fa-IR')} گواهینامه فنی · ${featuredPartners.length.toLocaleString('fa-IR')} برند منتخب`
                : `${materials.length} Materials · ${totalCertCount} Certificates · ${featuredPartners.length} Partner Brands`}
            </span>
          </div>

          <article
            className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[#DFBA78]/28 grid grid-cols-1 lg:grid-cols-12 shadow-[0_28px_80px_-34px_rgba(0,0,0,0.92)]"
            style={{
              background:
                'linear-gradient(132deg, rgba(24, 20, 15, 0.94) 0%, rgba(11, 15, 25, 0.97) 54%, rgba(8, 12, 20, 0.99) 100%)',
            }}
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-[#F3DCA6]/55 to-transparent"
            />

            <div className="lg:col-span-5 relative h-[220px] sm:h-[290px] lg:h-auto lg:min-h-[340px] overflow-hidden bg-[#0A0E16]">
              <SafeImage
                src={ASSETS.materialEticsCutaway}
                alt={MATERIALS_DEPARTMENT_META.title[locale]}
                className="w-full h-full object-cover object-center"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0A0E16]/90 via-transparent to-[#0A0E16]/15 lg:bg-gradient-to-l rtl:lg:bg-gradient-to-r lg:from-[#0C101A]/75 lg:via-transparent lg:to-transparent"
              />
              <div className="absolute bottom-3 start-3.5 sm:bottom-4 sm:start-5 z-10">
                <span className="text-[11px] sm:text-xs font-semibold tracking-[0.14em] rtl:tracking-normal uppercase text-[#F3DCA6]">
                  {isRtl ? 'ویترین مصالح و گواهینامه‌های فنی' : 'MATERIALS & CERTIFICATES SHOWROOM'}
                </span>
              </div>
            </div>

            <div className="lg:col-span-7 p-4 sm:p-8 lg:p-9 flex flex-col justify-between gap-5 sm:gap-7">
              <div className="space-y-3 sm:space-y-4">
                <p className="text-[11px] sm:text-xs font-medium text-[#DFBA78]">
                  {MATERIALS_DEPARTMENT_META.shortSubtitle[locale]}
                </p>

                <h2
                  id="expertise-materials-heading"
                  className="text-[20px] sm:text-3xl font-semibold rtl:font-extrabold text-[#FBF6EB] tracking-tight rtl:tracking-normal"
                >
                  {MATERIALS_DEPARTMENT_META.title[locale]}
                </h2>

                <p className="text-[12.5px] sm:text-[14.5px] text-[#D2C9BA] leading-relaxed rtl:leading-[1.85]">
                  {MATERIALS_DEPARTMENT_META.overview[locale]}
                </p>

                {/* Architectural Spec Strip — Certificate Photos, Technical Catalogs & Interactive Comparison */}
                <div className="grid grid-cols-1 sm:grid-cols-3 border-y border-[#DFBA78]/18 divide-y sm:divide-y-0 sm:divide-x rtl:sm:divide-x-reverse divide-[#DFBA78]/15 py-2.5 sm:py-3.5">
                  <div className="py-1.5 sm:py-0 sm:px-3.5 first:sm:ps-0">
                    <div className="text-[11px] text-[#B7A991]">
                      {isRtl ? 'مستندات تصویری' : 'Verified Records'}
                    </div>
                    <div className="text-[12.5px] sm:text-[13px] font-semibold text-[#F6EFE2] mt-0.5">
                      {isRtl ? 'گالری عکس گواهینامه‌ها' : 'Certificate Photo Gallery'}
                    </div>
                  </div>
                  <div className="py-1.5 sm:py-0 sm:px-3.5">
                    <div className="text-[11px] text-[#B7A991]">
                      {isRtl ? 'اطلاعات محصول' : 'Product Specs'}
                    </div>
                    <div className="text-[12.5px] sm:text-[13px] font-semibold text-[#F6EFE2] mt-0.5">
                      {isRtl ? 'کاتالوگ‌های رسمی و مقایسه' : 'Official Catalogs & Compare'}
                    </div>
                  </div>
                  <div className="py-1.5 sm:py-0 sm:px-3.5 last:sm:pe-0">
                    <div className="text-[11px] text-[#B7A991]">
                      {isRtl ? 'شبکه تولیدکنندگان' : 'Brand Archive'}
                    </div>
                    <div className="text-[12.5px] sm:text-[13px] font-semibold text-[#28CF77] mt-0.5">
                      {isRtl ? 'برندهای همکار منتخب' : 'Curated Partner Brands'}
                    </div>
                  </div>
                </div>

                {partnerPreviewNames.length > 0 && (
                  <p className="text-[11.5px] sm:text-xs text-[#C7B99F] leading-relaxed">
                    <span className="font-semibold text-[#F3DCA6]">
                      {isRtl ? 'برندهای منتخب: ' : 'Selected Brands: '}
                    </span>
                    {partnerPreviewNames.join(' · ')}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <a
                  href={buildPath(locale, { page: 'materials-technologies' })}
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate({ page: 'materials-technologies' });
                  }}
                  data-testid="expertise-materials-cta"
                  className="inline-flex items-center justify-center gap-2 min-h-[44px] sm:min-h-0 rounded-full px-5 py-2.5 sm:px-6 sm:py-3 text-[12.5px] sm:text-[13px] font-semibold text-[#13100A] bg-gradient-to-r from-[#F3DCA6] via-[#DFBA78] to-[#C89B54] hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_14px_34px_-14px_rgba(223,186,120,0.65)]"
                >
                  <span>
                    {isRtl
                      ? 'ورود به ویترین مصالح و گواهینامه‌ها'
                      : 'Explore Materials & Certificates'}
                  </span>
                  <ArrowIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </a>
                <span className="text-[11px] text-[#9A8E7A]">
                  {isRtl
                    ? 'مقایسه مصالح، تصویر گواهینامه‌ها و کاتالوگ برندها'
                    : 'Compare systems, view certificates & brand catalogs'}
                </span>
              </div>
            </div>
          </article>
        </section>
      </div>
    </div>
  );
}

interface DisciplineDetailPageProps extends BasePageProps {
  slug: DisciplineSlug;
  projects: Project[];
}

export function DisciplineDetailPage({
  locale,
  slug,
  projects,
  onNavigate,
}: DisciplineDetailPageProps) {
  const copy = getCopy(locale);
  const isRtl = locale === 'fa';
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;
  const discipline = DISCIPLINES.find((d) => d.slug === slug) ?? DISCIPLINES[0];

  const relatedProjects = projects.filter(
    (p) => p.status === 'published' && p.disciplines.includes(discipline.slug)
  );

  return (
    <div className="pt-20 pb-12 sm:pt-28 sm:pb-20">
      <div className="max-w-[1380px] mx-auto px-3.5 sm:px-6 lg:px-10 space-y-8 sm:space-y-14">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[11px] sm:text-xs text-[#8B9DB7]">
          <a
            href={buildPath(locale, { page: 'expertise' })}
            onClick={(e) => {
              e.preventDefault();
              onNavigate({ page: 'expertise' });
            }}
            className="inline-flex items-center min-h-[36px] sm:min-h-0 hover:text-[#6F9BFF] transition-colors"
          >
            {copy.nav.expertise}
          </a>
          <span aria-hidden="true">/</span>
          <span className="text-[#F5F8FC] truncate">{discipline.title[locale]}</span>
        </nav>

        {/* Hero Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-center space-y-3 sm:space-y-5">
            <div
              className={`inline-flex items-center gap-2 text-[11px] sm:text-xs font-medium ${
                discipline.slug === 'energy-mep' ? 'text-[#28CF77]' : 'text-[#6F9BFF]'
              }`}
            >
              <span className="font-mono font-numeric">{discipline.indexLabel}</span>
              <span aria-hidden="true">·</span>
              <span>{discipline.shortSubtitle[locale]}</span>
            </div>
            <h1 className="text-[22px] sm:text-5xl font-semibold rtl:font-extrabold tracking-tight leading-[1.18] sm:leading-[1.12] rtl:leading-[1.34] sm:rtl:leading-[1.3] text-[#F5F8FC]">
              {discipline.title[locale]}
            </h1>
            <p className="text-[13px] sm:text-base rtl:font-light text-[#C6D2E3] leading-relaxed rtl:leading-[1.85] sm:rtl:leading-[1.9]">
              {discipline.overview[locale]}
            </p>
            <div className="pt-1 sm:pt-2">
              <a
                href={buildPath(locale, { page: 'contact' })}
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate({ page: 'contact' });
                }}
                className={`${
                  discipline.slug === 'energy-mep' ? 'glass-cta-emerald' : 'glass-cta'
                } inline-flex items-center justify-center gap-2 min-h-[44px] sm:min-h-0 rounded-full px-5 py-2.5 sm:px-6 sm:py-3 text-[12.5px] sm:text-sm font-semibold active:scale-[0.98] transition-all`}
              >
                <span>{copy.projects.relatedCtaBtn}</span>
                <ArrowIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </a>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="rounded-2xl sm:rounded-3xl border border-[#6F9BFF]/22 overflow-hidden aspect-[16/10] sm:aspect-[4/3] lg:h-full">
              <SafeImage
                src={discipline.coverImage}
                alt={discipline.title[locale]}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Scope & Deliverables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 border-t border-white/10 pt-7 sm:pt-12">
          <div className="glass-surface rounded-2xl p-4 sm:p-8 space-y-3.5 sm:space-y-5">
            <h2 className="text-[17px] sm:text-xl font-semibold text-[#F5F8FC]">
              {locale === 'fa' ? 'دامنه فعالیت و تخصص' : 'Discipline Scope'}
            </h2>
            <ul className="space-y-2.5 sm:space-y-3">
              {discipline.scope.map((item) => (
                <li key={item.en} className="flex items-start gap-2.5 sm:gap-3 text-[12.5px] sm:text-sm text-[#C6D2E3]">
                  <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#28CF77] mt-0.5 shrink-0" />
                  <span>{item[locale]}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="glass-surface rounded-2xl p-4 sm:p-8 space-y-3.5 sm:space-y-5">
            <h2 className="text-[17px] sm:text-xl font-semibold text-[#F5F8FC]">
              {locale === 'fa' ? 'خروجی‌ها و مدارک معمول' : 'Typical Deliverables'}
            </h2>
            <ul className="space-y-2.5 sm:space-y-3">
              {discipline.deliverables.map((item) => (
                <li key={item.en} className="flex items-start gap-2.5 sm:gap-3 text-[12.5px] sm:text-sm text-[#C6D2E3]">
                  <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#6F9BFF] mt-0.5 shrink-0" />
                  <span>{item[locale]}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Services Breakdown */}
        <section className="space-y-4 sm:space-y-6">
          <h2 className="text-[18px] sm:text-2xl font-semibold text-[#F5F8FC]">
            {locale === 'fa' ? 'خدمات کلیدی' : 'Core Services'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-5">
            {discipline.services.map((srv) => (
              <div
                key={srv.name.en}
                className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-1.5 sm:space-y-2.5"
              >
                <h3 className="text-[14px] sm:text-base font-semibold text-[#F5F8FC]">{srv.name[locale]}</h3>
                <p className="text-[12px] sm:text-sm text-[#C6D2E3] leading-relaxed">
                  {srv.description[locale]}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Related Projects */}
        {relatedProjects.length > 0 && (
          <section className="border-t border-white/10 pt-7 sm:pt-12 space-y-4 sm:space-y-6">
            <h2 className="text-[18px] sm:text-2xl font-semibold text-[#F5F8FC]">
              {locale === 'fa' ? 'پروژه‌های مرتبط' : 'Related Projects'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-5">
              {relatedProjects.map((project) => (
                <a
                  key={project.id}
                  href={buildPath(locale, { page: 'project-detail', slug: project.slug })}
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate({ page: 'project-detail', slug: project.slug });
                  }}
                  className="group relative rounded-2xl sm:rounded-3xl border border-white/16 overflow-hidden aspect-[16/10] sm:aspect-[4/3] flex flex-col justify-end p-2.5 sm:p-3.5 hover:border-[#6F9BFF]/60 active:scale-[0.985] transition-all"
                >
                  <SafeImage
                    src={project.coverImage}
                    alt={locale === 'fa' ? project.titleFa : project.titleEn}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#070B14]/86 via-transparent to-[#080D16]/20" />
                  {project.imageDisclosure === 'concept' && (
                    <span className="glass-pill absolute top-2.5 start-2.5 sm:top-3.5 sm:start-3.5 text-[9.5px] sm:text-[10px] rounded-md sm:rounded-lg px-2 py-0.5 sm:px-2.5 text-[#F5F8FC]">
                      {copy.projects.conceptBadge}
                    </span>
                  )}
                  <div className="relative z-10 glass-overlay-dock rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5">
                    <h3 className="text-[14px] sm:text-base font-semibold text-[#F5F8FC]">
                      {locale === 'fa' ? project.titleFa : project.titleEn}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-[#C6D2E3] mt-0.5 sm:mt-1">
                      {locale === 'fa' ? project.cityFa : project.cityEn} ·{' '}
                      <span className="text-[#28CF77]">
                        {locale === 'fa' ? project.serviceFa : project.serviceEn}
                      </span>
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
