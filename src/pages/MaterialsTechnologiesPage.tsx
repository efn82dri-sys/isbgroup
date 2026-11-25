import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Building2,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  Images,
  Layers,
  Maximize2,
  Search,
  ShieldCheck,
  X,
} from '../components/icons/IsbIcons';
import { SafeImage } from '../components/BrandMark';
import { ASSETS } from '../data/assets';
import { getCopy } from '../data/translations';
import type {
  Locale,
  MaterialCertificate,
  MaterialItem,
  PageRoute,
  PartnerLogo,
} from '../types/content';
import {
  MATERIAL_CATEGORIES,
  MATERIAL_CATEGORY_LABELS,
  MATERIALS_DEPARTMENT_META,
  SEED_MATERIALS,
  filterMaterialSystems,
  getBrandCertificates,
  getMaterialsForBrand,
  selectMaterialPartnerBrands,
  type MaterialCategoryId,
} from '../utils/materialsCatalog';
import { ARCHITECTURAL_EASE } from '../utils/motionMath';
import { buildPath } from '../utils/routing';
import { isSafeExternalUrl } from '../utils/validation';

interface MaterialsTechnologiesPageProps {
  locale: Locale;
  materials?: MaterialItem[];
  partnerLogos: PartnerLogo[];
  onNavigate: (route: PageRoute) => void;
}

interface LightboxCertificateItem {
  certificate: MaterialCertificate;
  materialTitle: string;
}

interface CertificateLightboxState {
  items: LightboxCertificateItem[];
  index: number;
}

function getPartnerMonogram(name: string): string {
  const cleaned = name
    .replace(/[\u200c\u200f().·\-–—]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (cleaned.length === 0) return 'ISB';
  if (cleaned.length === 1) return cleaned[0].slice(0, 2).toUpperCase();
  return `${cleaned[0][0] ?? ''}${cleaned[1][0] ?? ''}`.toUpperCase();
}

export function MaterialsTechnologiesPage({
  locale,
  materials = SEED_MATERIALS,
  partnerLogos,
  onNavigate,
}: MaterialsTechnologiesPageProps) {
  const copy = getCopy(locale);
  const isRtl = locale === 'fa';
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const publishedMaterials = useMemo(
    () =>
      materials
        .filter((m) => m.status === 'published')
        .sort((a, b) => a.order - b.order),
    [materials]
  );

  // Discovery & Filter state
  const [activeCategory, setActiveCategory] = useState<MaterialCategoryId>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyCertified, setOnlyCertified] = useState(false);
  const [onlyWithCatalog, setOnlyWithCatalog] = useState(false);

  // Partner showcase scope
  const [brandScope, setBrandScope] = useState<'materials' | 'all'>('materials');

  // Interactive Comparison Tray (up to 3 materials)
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareModalOpen, setCompareModalOpen] = useState(false);

  // Modals & Full-Screen Zoomable Certificate Lightbox
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<CertificateLightboxState | null>(null);
  const [lightboxZoomed, setLightboxZoomed] = useState(false);

  const visibleMaterials = useMemo(
    () =>
      filterMaterialSystems(activeCategory, publishedMaterials, {
        searchQuery,
        onlyCertified,
        onlyWithCatalog,
      }),
    [activeCategory, publishedMaterials, searchQuery, onlyCertified, onlyWithCatalog]
  );

  const focusedPartnerBrands = useMemo(
    () => selectMaterialPartnerBrands(partnerLogos, 'materials'),
    [partnerLogos]
  );

  const displayedBrands = useMemo(
    () => selectMaterialPartnerBrands(partnerLogos, brandScope),
    [partnerLogos, brandScope]
  );

  const totalCertificateCount = useMemo(
    () => publishedMaterials.reduce((sum, item) => sum + (item.certificates?.length ?? 0), 0),
    [publishedMaterials]
  );

  const directCatalogCount = useMemo(
    () => publishedMaterials.filter((item) => Boolean(item.catalogUrl?.trim())).length,
    [publishedMaterials]
  );

  const selectedMaterial = useMemo(
    () => publishedMaterials.find((item) => item.id === selectedMaterialId) ?? null,
    [publishedMaterials, selectedMaterialId]
  );

  const selectedBrand = useMemo(
    () => partnerLogos.find((b) => b.id === selectedBrandId) ?? null,
    [partnerLogos, selectedBrandId]
  );

  const comparedMaterials = useMemo(
    () =>
      compareIds
        .map((id) => publishedMaterials.find((m) => m.id === id))
        .filter((m): m is MaterialItem => Boolean(m)),
    [compareIds, publishedMaterials]
  );

  const toggleCompare = (materialId: string) => {
    setCompareIds((prev) => {
      if (prev.includes(materialId)) {
        return prev.filter((id) => id !== materialId);
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), materialId];
      }
      return [...prev, materialId];
    });
  };

  const openMaterialCertificatesLightbox = (material: MaterialItem, startIndex = 0) => {
    const certs = material.certificates ?? [];
    if (certs.length === 0) return;
    const matTitle = isRtl ? material.titleFa : material.titleEn;
    setLightboxZoomed(false);
    setLightbox({
      items: certs.map((certificate) => ({ certificate, materialTitle: matTitle })),
      index: Math.max(0, Math.min(startIndex, certs.length - 1)),
    });
  };

  const openBrandCertificatesLightbox = (brandId: string, startIndex = 0) => {
    const entries = getBrandCertificates(brandId, publishedMaterials);
    if (entries.length === 0) return;
    setLightboxZoomed(false);
    setLightbox({
      items: entries.map(({ certificate, material }) => ({
        certificate,
        materialTitle: isRtl ? material.titleFa : material.titleEn,
      })),
      index: Math.max(0, Math.min(startIndex, entries.length - 1)),
    });
  };

  const anyModalOpen = Boolean(selectedMaterial || selectedBrand || compareModalOpen || lightbox);

  // Lock page scroll while any modal or lightbox is open & bind keyboard navigation
  useEffect(() => {
    if (!anyModalOpen) return;
    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (lightbox) {
        if (e.key === 'Escape') {
          setLightbox(null);
          setLightboxZoomed(false);
          return;
        }
        if (lightbox.items.length > 1) {
          if (e.key === 'ArrowRight') {
            setLightboxZoomed(false);
            setLightbox((prev) =>
              prev
                ? {
                    ...prev,
                    index: (prev.index + (isRtl ? -1 : 1) + prev.items.length) % prev.items.length,
                  }
                : null
            );
          } else if (e.key === 'ArrowLeft') {
            setLightboxZoomed(false);
            setLightbox((prev) =>
              prev
                ? {
                    ...prev,
                    index: (prev.index + (isRtl ? 1 : -1) + prev.items.length) % prev.items.length,
                  }
                : null
            );
          }
        }
        return;
      }

      if (e.key === 'Escape') {
        setSelectedMaterialId(null);
        setSelectedBrandId(null);
        setCompareModalOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.documentElement.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [anyModalOpen, lightbox, isRtl]);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatNum = (n: number) => (isRtl ? n.toLocaleString('fa-IR') : String(n));

  const hasActiveFilters =
    activeCategory !== 'all' || searchQuery.trim().length > 0 || onlyCertified || onlyWithCatalog;

  return (
    <div
      data-testid="materials-technologies-page"
      className={`pt-20 sm:pt-28 ${comparedMaterials.length > 0 ? 'pb-36 sm:pb-32' : 'pb-16 sm:pb-24'}`}
    >
      <div className="max-w-[1380px] mx-auto px-3.5 sm:px-6 lg:px-10 space-y-12 sm:space-y-20">
        {/* 1. EXHIBITION OPENING — VISUAL SHOWROOM HERO */}
        <section className="space-y-5 sm:space-y-8">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 text-[11px] sm:text-xs text-[#8B9DB7]"
          >
            <a
              href={buildPath(locale, { page: 'expertise' })}
              onClick={(e) => {
                e.preventDefault();
                onNavigate({ page: 'expertise' });
              }}
              className="inline-flex items-center min-h-[36px] sm:min-h-0 hover:text-[#DFBA78] transition-colors"
            >
              {copy.nav.expertise}
            </a>
            <span aria-hidden="true">/</span>
            <span className="text-[#F3DCA6] truncate">
              {MATERIALS_DEPARTMENT_META.title[locale]}
            </span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 sm:gap-8">
            <div className="max-w-3xl space-y-2.5 sm:space-y-4">
              <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.18em] rtl:tracking-normal text-[#DFBA78]">
                {MATERIALS_DEPARTMENT_META.kicker[locale]}
              </p>
              <h1 className="text-[26px] sm:text-5xl lg:text-[52px] font-semibold rtl:font-extrabold tracking-tight rtl:tracking-normal leading-[1.15] rtl:leading-[1.3] text-[#FBF7EF]">
                {MATERIALS_DEPARTMENT_META.title[locale]}
              </h1>
              <p className="text-[13.5px] sm:text-[16px] text-[#C5CBD6] leading-relaxed rtl:leading-[1.85] max-w-2xl">
                {MATERIALS_DEPARTMENT_META.overview[locale]}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => scrollToSection('materials-showroom-gallery')}
                className="inline-flex items-center justify-center gap-2 min-h-[44px] rounded-full px-5 sm:px-6 py-2.5 text-[12.5px] sm:text-[13px] font-semibold text-[#13100A] bg-gradient-to-r from-[#F3DCA6] via-[#DFBA78] to-[#C89B54] hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_14px_34px_-14px_rgba(223,186,120,0.65)]"
              >
                <span>{isRtl ? 'مرور ویترین مصالح' : 'Explore Showroom'}</span>
                <ArrowIcon className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('materials-brands-archive')}
                className="inline-flex items-center justify-center gap-2 min-h-[44px] rounded-full border border-[#DFBA78]/32 bg-[#DFBA78]/[0.06] hover:bg-[#DFBA78]/[0.14] px-5 py-2.5 text-[12.5px] sm:text-[13px] font-medium text-[#F3DCA6] transition-all"
              >
                <span>{isRtl ? 'برندها و کاتالوگ‌ها' : 'Brands & Catalogs'}</span>
              </button>
            </div>
          </div>

          {/* Panoramic Showroom Visual + Minimalist Ledger Strip */}
          <div className="relative overflow-hidden rounded-[22px] sm:rounded-[30px] border border-[#DFBA78]/24 bg-[#0B101B] shadow-[0_36px_100px_-34px_rgba(0,0,0,0.95)]">
            <div className="relative aspect-[16/10] sm:aspect-[21/9] lg:aspect-[24/9] overflow-hidden">
              <SafeImage
                src={ASSETS.materialsAtelierHero}
                alt={MATERIALS_DEPARTMENT_META.title[locale]}
                className="w-full h-full object-cover object-center"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#080D16] via-[#080D16]/25 to-transparent"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-[#F3DCA6]/55 to-transparent"
              />

              {/* Subtle Bottom Architectural Ledger */}
              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6 lg:p-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[#FBF6EB]">
                  <div>
                    <div className="font-numeric text-lg sm:text-2xl font-bold text-[#F3DCA6]">
                      {formatNum(publishedMaterials.length)}
                    </div>
                    <div className="text-[11px] sm:text-xs text-[#C6D2E3]">
                      {isRtl ? 'سامانه مصالح منتخب' : 'Curated Materials'}
                    </div>
                  </div>
                  <div className="h-7 w-px bg-white/15 hidden sm:block" />
                  <div>
                    <div className="font-numeric text-lg sm:text-2xl font-bold text-[#28CF77]">
                      {formatNum(totalCertificateCount)}
                    </div>
                    <div className="text-[11px] sm:text-xs text-[#C6D2E3]">
                      {isRtl ? 'تصویر گواهینامه فنی' : 'Verified Certificates'}
                    </div>
                  </div>
                  <div className="h-7 w-px bg-white/15 hidden sm:block" />
                  <div>
                    <div className="font-numeric text-lg sm:text-2xl font-bold text-[#F5F8FC]">
                      {formatNum(focusedPartnerBrands.length)}
                    </div>
                    <div className="text-[11px] sm:text-xs text-[#C6D2E3]">
                      {isRtl ? 'برند همکار تأییدشده' : 'Partner Brands'}
                    </div>
                  </div>
                </div>

                <p className="text-[11.5px] sm:text-xs text-[#D2C9BA] max-w-md leading-relaxed">
                  {isRtl
                    ? 'برای مقایسه کنار هم تا ۳ مصالح را نشان‌گذاری کنید و روی تصاویر گواهینامه‌ها برای بزرگ‌نمایی کلیک کنید.'
                    : 'Pin up to 3 materials for side-by-side comparison and click any certificate photo for full-screen zoom.'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 2. INTERACTIVE MATERIAL DISCOVERY & VISUAL SHOWROOM */}
        <section id="materials-showroom-gallery" className="space-y-6 sm:space-y-8">
          {/* Discovery Console: Search + Category Hairline Tabs + Quick Document Filters */}
          <div className="space-y-4 sm:space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] rtl:tracking-normal text-[#DFBA78]">
                  {isRtl ? 'گالری تعاملی مصالح و مستندات' : 'INTERACTIVE MATERIAL LIBRARY'}
                </p>
                <h2 className="text-[20px] sm:text-3xl font-semibold rtl:font-extrabold text-[#F5F8FC]">
                  {isRtl ? 'ویترین مصالح، گواهینامه‌ها و کاتالوگ‌ها' : 'Materials, Certificates & Catalogs'}
                </h2>
              </div>

              {/* Search & Document Filter Controls */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 lg:min-w-[440px]">
                <div className="relative flex-1">
                  <Search
                    className={`w-4 h-4 text-[#8B9DB7] pointer-events-none absolute top-1/2 -translate-y-1/2 ${
                      isRtl ? 'right-3.5' : 'left-3.5'
                    }`}
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    data-testid="materials-search-input"
                    placeholder={
                      isRtl
                        ? 'جستجو در نام مصالح، برند یا استاندارد...'
                        : 'Search material, brand, or standard...'
                    }
                    className={`w-full min-h-[44px] rounded-xl border border-white/14 bg-[#0D1424]/85 py-2 text-xs sm:text-[13px] text-[#F5F8FC] placeholder:text-[#7E90AA] focus:outline-none focus:border-[#DFBA78]/65 transition-colors ${
                      isRtl ? 'pr-10 pl-9' : 'pl-10 pr-9'
                    }`}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      aria-label={isRtl ? 'پاک کردن جستجو' : 'Clear search'}
                      className={`absolute top-1/2 -translate-y-1/2 p-1.5 text-[#8B9DB7] hover:text-white ${
                        isRtl ? 'left-2' : 'right-2'
                      }`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setOnlyCertified((v) => !v)}
                    aria-pressed={onlyCertified}
                    className={`min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl border px-3.5 py-2 text-[11.5px] font-medium whitespace-nowrap transition-all ${
                      onlyCertified
                        ? 'border-[#28CF77]/65 bg-[#00A651]/18 text-[#D8FBE7]'
                        : 'border-white/12 bg-white/[0.03] text-[#B8C7DC] hover:border-white/25'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-[#28CF77]" />
                    <span>{isRtl ? 'دارای گواهینامه' : 'Certified'}</span>
                  </button>

                  {directCatalogCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setOnlyWithCatalog((v) => !v)}
                      aria-pressed={onlyWithCatalog}
                      className={`min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl border px-3.5 py-2 text-[11.5px] font-medium whitespace-nowrap transition-all ${
                        onlyWithCatalog
                          ? 'border-[#DFBA78]/65 bg-[#DFBA78]/16 text-[#F7E5BE]'
                          : 'border-white/12 bg-white/[0.03] text-[#B8C7DC] hover:border-white/25'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5 text-[#DFBA78]" />
                      <span>{isRtl ? 'کاتالوگ مستقیم' : 'PDF Ready'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Category Hairline Navigation Bar */}
            <div
              role="tablist"
              aria-label={isRtl ? 'دسته‌بندی مصالح' : 'Material categories'}
              className="flex items-center gap-5 sm:gap-7 overflow-x-auto border-b border-white/10 pb-0.5 no-scrollbar"
            >
              {MATERIAL_CATEGORIES.map((cat) => {
                const active = activeCategory === cat.id;
                const catCount =
                  cat.id === 'all'
                    ? publishedMaterials.length
                    : publishedMaterials.filter((m) => m.category === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    data-testid={`material-cat-${cat.id}`}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`relative shrink-0 min-h-[44px] pb-3 pt-1 text-[12.5px] sm:text-[13.5px] font-medium transition-colors inline-flex items-center gap-2 ${
                      active ? 'text-[#F3DCA6] font-semibold' : 'text-[#95A6BF] hover:text-[#F5F8FC]'
                    }`}
                  >
                    <span>{cat.label[locale]}</span>
                    <span
                      className={`font-numeric text-[11px] ${
                        active ? 'text-[#DFBA78]' : 'text-[#6D7E97]'
                      }`}
                    >
                      {formatNum(catCount)}
                    </span>
                    {active && (
                      <span
                        aria-hidden="true"
                        className="absolute bottom-0 inset-x-0 h-[2px] bg-gradient-to-r from-[#F3DCA6] via-[#DFBA78] to-[#C89B54] rounded-full"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Empty Filter State */}
          {visibleMaterials.length === 0 ? (
            <div className="rounded-3xl border border-white/12 bg-[#0D1422]/75 p-10 sm:p-14 text-center space-y-4">
              <p className="text-sm sm:text-base text-[#C6D2E3]">
                {isRtl
                  ? 'هیچ مصالحی با فیلتر یا عبارت جستجوی فعلی مطابقت نداشت.'
                  : 'No materials match your current search or filter selection.'}
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveCategory('all');
                    setSearchQuery('');
                    setOnlyCertified(false);
                    setOnlyWithCatalog(false);
                  }}
                  className="inline-flex items-center gap-2 min-h-[44px] rounded-full border border-[#DFBA78]/45 bg-[#DFBA78]/12 px-5 py-2 text-xs font-semibold text-[#F3DCA6] hover:bg-[#DFBA78]/20 transition-colors"
                >
                  <span>{isRtl ? 'نمایش همه مصالح' : 'Reset Filters'}</span>
                </button>
              )}
            </div>
          ) : (
            /* Asymmetric Editorial Showroom Grid */
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6">
              {visibleMaterials.map((item, idx) => {
                const isHeroCard = activeCategory === 'all' && !searchQuery && idx === 0;
                const isSecondFeature = activeCategory === 'all' && !searchQuery && idx === 1;
                const colSpanClass = isHeroCard
                  ? 'md:col-span-7'
                  : isSecondFeature
                    ? 'md:col-span-5'
                    : 'md:col-span-6 lg:col-span-4';

                const isCompared = compareIds.includes(item.id);
                const certs = item.certificates ?? [];
                const title = isRtl ? item.titleFa : item.titleEn;
                const subtitle = isRtl
                  ? item.subtitleFa || item.summaryFa || ''
                  : item.subtitleEn || item.summaryEn || '';
                const brandLabel = isRtl
                  ? item.brandNameFa || item.brandNameEn || ''
                  : item.brandNameEn || item.brandNameFa || '';
                const catLabel = MATERIAL_CATEGORY_LABELS[item.category][locale];
                const hasDirectCatalog = Boolean(
                  item.catalogUrl?.trim() && isSafeExternalUrl(item.catalogUrl)
                );

                return (
                  <article
                    key={item.id}
                    data-testid={`material-card-${item.slug}`}
                    className={`${colSpanClass} group relative overflow-hidden rounded-[22px] sm:rounded-[26px] border transition-all duration-300 flex flex-col justify-between bg-[#0B111E] ${
                      isCompared
                        ? 'border-[#DFBA78]/75 shadow-[0_24px_65px_-28px_rgba(223,186,120,0.4)]'
                        : 'border-white/12 hover:border-[#DFBA78]/45 shadow-[0_26px_70px_-36px_rgba(0,0,0,0.92)]'
                    }`}
                  >
                    {/* Visual Stage */}
                    <div
                      onClick={() => setSelectedMaterialId(item.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedMaterialId(item.id);
                        }
                      }}
                      className={`relative overflow-hidden cursor-pointer ${
                        isHeroCard
                          ? 'aspect-[16/10] md:aspect-[16/10]'
                          : isSecondFeature
                            ? 'aspect-[16/10] md:aspect-[11/10]'
                            : 'aspect-[16/11]'
                      }`}
                    >
                      <SafeImage
                        src={item.coverImage}
                        alt={title}
                        className="w-full h-full object-cover object-center group-hover:scale-[1.04] transition-transform duration-700 ease-out"
                      />
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0B111E] via-[#0B111E]/28 to-[#080D16]/45"
                      />

                      {/* Top Unboxed Metadata + Compare Pin Action */}
                      <div className="absolute top-3.5 inset-x-3.5 sm:top-4 sm:inset-x-4 flex items-center justify-between gap-2">
                        <span className="text-[11px] font-medium text-[#F3DCA6] drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)]">
                          {catLabel}
                        </span>

                        <button
                          type="button"
                          data-testid={`compare-toggle-${item.slug}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCompare(item.id);
                          }}
                          aria-pressed={isCompared}
                          className={`min-h-[36px] inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium backdrop-blur-md border transition-all ${
                            isCompared
                              ? 'border-[#DFBA78] bg-[#DFBA78] text-[#13100A] font-semibold'
                              : 'border-white/22 bg-[#080D16]/72 text-[#F5F8FC] hover:border-[#DFBA78]/65 hover:text-[#F3DCA6]'
                          }`}
                        >
                          {isCompared ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <Layers className="w-3 h-3" />
                          )}
                          <span>
                            {isCompared
                              ? isRtl
                                ? 'در مقایسه'
                                : 'Pinned'
                              : isRtl
                                ? 'مقایسه'
                                : 'Compare'}
                          </span>
                        </button>
                      </div>

                      {/* Performance Metric Overlay anchored bottom-start */}
                      {item.performanceMetric && (
                        <div className="absolute bottom-3 start-3.5 sm:bottom-3.5 sm:start-4 flex items-baseline gap-2">
                          <span className="font-mono font-numeric ltr-inline text-sm sm:text-base font-bold text-[#28CF77] drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                            {item.performanceMetric}
                          </span>
                          {(isRtl ? item.performanceLabelFa : item.performanceLabelEn) && (
                            <span className="text-[10.5px] sm:text-[11px] text-[#DCE6F5]/85 drop-shadow">
                              {isRtl ? item.performanceLabelFa : item.performanceLabelEn}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Architectural Body + Live Certificate Photo Preview Strip */}
                    <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-4">
                      <div
                        onClick={() => setSelectedMaterialId(item.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedMaterialId(item.id);
                          }
                        }}
                        className="space-y-1.5 cursor-pointer"
                      >
                        {brandLabel && (
                          <p className="text-[11px] font-medium text-[#DFBA78]/90">{brandLabel}</p>
                        )}
                        <h3 className="text-[16px] sm:text-[18px] font-semibold rtl:font-bold text-[#FBF7EF] group-hover:text-[#F3DCA6] transition-colors leading-snug">
                          {title}
                        </h3>
                        {subtitle && (
                          <p className="text-[12px] sm:text-[13px] text-[#AEBFD6] leading-relaxed line-clamp-2">
                            {subtitle}
                          </p>
                        )}
                      </div>

                      {/* Live Certificate Thumbnails + Catalog Cue Footer */}
                      <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
                        {/* Clickable Mini Certificate Thumbnails */}
                        <div className="flex items-center gap-2.5 min-w-0">
                          {certs.length > 0 ? (
                            <button
                              type="button"
                              data-testid={`card-certs-${item.slug}`}
                              onClick={() => openMaterialCertificatesLightbox(item, 0)}
                              className="group/cert inline-flex items-center gap-2.5 min-h-[40px] text-start focus-visible:outline-offset-2"
                              title={
                                isRtl
                                  ? 'مشاهده بزرگ‌نمایی تصاویر گواهینامه‌ها'
                                  : 'Inspect certificate photographs'
                              }
                            >
                              <div className="flex items-center -space-x-2 rtl:space-x-reverse shrink-0">
                                {certs.slice(0, 3).map((cert, cIdx) => (
                                  <span
                                    key={`${item.id}-thumb-${cIdx}`}
                                    className="relative w-7 h-9 rounded-md overflow-hidden border border-[#DFBA78]/55 bg-[#121928] shadow-md group-hover/cert:border-[#28CF77] transition-colors"
                                  >
                                    <SafeImage
                                      src={cert.imageUrl}
                                      alt={
                                        (isRtl ? cert.titleFa : cert.titleEn) ||
                                        (isRtl ? 'گواهینامه فنی' : 'Certificate')
                                      }
                                      className="w-full h-full object-cover"
                                    />
                                  </span>
                                ))}
                              </div>
                              <div className="min-w-0">
                                <div className="text-[11.5px] font-semibold text-[#28CF77] group-hover/cert:text-[#5BE69B] transition-colors truncate">
                                  {isRtl
                                    ? `${formatNum(certs.length)} گواهینامه تصویری`
                                    : `${certs.length} Certificate${certs.length > 1 ? 's' : ''}`}
                                </div>
                                <div className="text-[10.5px] text-[#8B9DB7] truncate">
                                  {hasDirectCatalog
                                    ? isRtl
                                      ? 'کاتالوگ PDF آماده'
                                      : 'PDF Catalog Ready'
                                    : isRtl
                                      ? 'مشخصات و کاتالوگ'
                                      : 'Specs & Catalog'}
                                </div>
                              </div>
                            </button>
                          ) : (
                            <div className="text-[11px] text-[#8B9DB7] flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-[#DFBA78]" />
                              <span>
                                {hasDirectCatalog
                                  ? isRtl
                                    ? 'کاتالوگ PDF آماده'
                                    : 'PDF Catalog Ready'
                                  : isRtl
                                    ? 'پرونده مشخصات فنی'
                                    : 'Technical Dossier'}
                              </span>
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedMaterialId(item.id)}
                          className="shrink-0 inline-flex items-center gap-1 min-h-[40px] text-[12px] font-semibold text-[#F3DCA6] hover:text-white transition-colors"
                        >
                          <span>{isRtl ? 'پرونده' : 'Dossier'}</span>
                          <ArrowIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* 3. CURATED PARTNER BRANDS ARCHIVE — CERTIFICATES & CATALOG HUB */}
        <section
          id="materials-brands-archive"
          data-testid="materials-brands-section"
          className="border-t border-white/10 pt-10 sm:pt-16 space-y-6 sm:space-y-9"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] rtl:tracking-normal text-[#DFBA78]">
                {isRtl ? 'برندهای همکار منتخب' : 'SELECTED PARTNER BRANDS'}
              </p>
              <h2 className="text-[20px] sm:text-3xl font-semibold rtl:font-extrabold text-[#F5F8FC]">
                {isRtl
                  ? 'آرشیو برندها، گواهینامه‌ها و کاتالوگ‌های رسمی'
                  : 'Brand Archive, Certificates & Official Catalogs'}
              </h2>
              <p className="text-[12.5px] sm:text-sm text-[#9FB1CA] leading-relaxed">
                {isRtl
                  ? 'با انتخاب هر برند، تمامی مصالح مرتبط، گالری عکس گواهینامه‌های فنی و کاتالوگ‌های آن به‌صورت یکجا نمایش داده می‌شود.'
                  : 'Select any brand to inspect all linked material systems, verified certificate photographs, and product catalogs in one dossier.'}
              </p>
            </div>

            <div className="inline-flex items-center rounded-full border border-white/12 bg-white/[0.03] p-1 self-start md:self-auto">
              <button
                type="button"
                onClick={() => setBrandScope('materials')}
                className={`min-h-[38px] rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                  brandScope === 'materials'
                    ? 'bg-[#DFBA78] text-[#13100A] font-semibold'
                    : 'text-[#C6D2E3] hover:text-white'
                }`}
              >
                {isRtl ? 'برندهای مصالح و فناوری' : 'Material Brands'}
              </button>
              <button
                type="button"
                onClick={() => setBrandScope('all')}
                className={`min-h-[38px] rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                  brandScope === 'all'
                    ? 'bg-[#DFBA78] text-[#13100A] font-semibold'
                    : 'text-[#C6D2E3] hover:text-white'
                }`}
              >
                {isRtl ? 'همه همکاران ISB' : 'All ISB Partners'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
            {displayedBrands.map((brand) => {
              const linkedMaterials = getMaterialsForBrand(brand.id, publishedMaterials);
              const brandCerts = getBrandCertificates(brand.id, publishedMaterials);
              const name = isRtl ? brand.nameFa : brand.nameEn;

              return (
                <button
                  key={brand.id}
                  type="button"
                  data-testid={`brand-card-${brand.id}`}
                  onClick={() => setSelectedBrandId(brand.id)}
                  className="group text-start rounded-2xl border border-white/12 bg-[#0C121F]/88 hover:border-[#DFBA78]/50 hover:bg-[#11192A] p-4 sm:p-5 flex flex-col justify-between gap-4 transition-all duration-300"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="h-12 w-12 rounded-xl border border-white/12 bg-white/[0.04] flex items-center justify-center overflow-hidden shrink-0">
                      {brand.logoUrl ? (
                        <SafeImage
                          src={brand.logoUrl}
                          alt={name}
                          className="max-h-9 max-w-[40px] object-contain"
                        />
                      ) : (
                        <span className="font-mono text-xs font-bold text-[#DFBA78]">
                          {getPartnerMonogram(brand.nameEn || brand.nameFa)}
                        </span>
                      )}
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-[#7E90AA] group-hover:text-[#F3DCA6] transition-colors shrink-0" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-[14.5px] font-semibold text-[#F5F8FC] group-hover:text-[#F3DCA6] transition-colors">
                      {name}
                    </h3>
                    <p className="text-[11.5px] text-[#8B9DB7]">
                      {linkedMaterials.length > 0
                        ? isRtl
                          ? `${formatNum(linkedMaterials.length)} مصالح · ${formatNum(brandCerts.length)} گواهینامه`
                          : `${linkedMaterials.length} Material${linkedMaterials.length > 1 ? 's' : ''} · ${brandCerts.length} Cert${brandCerts.length === 1 ? '' : 's'}`
                        : isRtl
                          ? 'همکار شبکه فنی ISB'
                          : 'ISB Technical Network Partner'}
                    </p>
                  </div>

                  <div className="pt-2.5 border-t border-white/8 flex items-center justify-between text-[11px]">
                    <span className="text-[#DFBA78] font-medium">
                      {isRtl ? 'گواهینامه‌ها و کاتالوگ' : 'Certificates & Catalogs'}
                    </span>
                    {brandCerts.length > 0 && (
                      <span className="text-[#28CF77] font-medium inline-flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        <span>{isRtl ? 'موجود' : 'Verified'}</span>
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* 4. TECHNICAL CONSULTATION & BRAND SUBMISSION CTA */}
        <section
          className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[#DFBA78]/26 p-5 sm:p-9 flex flex-col lg:flex-row lg:items-center justify-between gap-5"
          style={{
            background:
              'linear-gradient(128deg, rgba(24, 20, 14, 0.94) 0%, rgba(12, 18, 32, 0.96) 55%, rgba(8, 13, 22, 0.98) 100%)',
          }}
        >
          <div className="space-y-1.5 max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] rtl:tracking-normal text-[#DFBA78]">
              {isRtl ? 'مشاوره انتخاب مصالح و ثبت برند' : 'SPECIFICATION & BRAND SUBMISSION'}
            </p>
            <h2 className="text-lg sm:text-2xl font-semibold text-[#FBF7EF]">
              {isRtl
                ? 'نیاز به کاتالوگ پروژه یا معرفی محصول نوین خود در این ویترین دارید؟'
                : 'Need a project specification package or want to feature your certified material?'}
            </h2>
            <p className="text-xs sm:text-sm text-[#C6D2E3] leading-relaxed">
              {isRtl
                ? 'مهندسین گروه ISB برای انتخاب بهینه مصالح مطابق مبحث ۱۹ و بررسی گواهینامه‌های فنی برندهای تولیدکننده در کنار شما هستند.'
                : 'Our engineering team advises on Code 19 material selection and reviews manufacturer certificates for inclusion in this library.'}
            </p>
          </div>
          <a
            href={buildPath(locale, { page: 'contact' })}
            onClick={(e) => {
              e.preventDefault();
              onNavigate({ page: 'contact' });
            }}
            className="inline-flex items-center justify-center gap-2 min-h-[46px] rounded-full px-6 py-3 text-[13px] font-semibold text-[#13100A] bg-gradient-to-r from-[#F3DCA6] via-[#DFBA78] to-[#C89B54] hover:brightness-110 active:scale-[0.98] transition-all whitespace-nowrap shrink-0"
          >
            <span>{isRtl ? 'ارتباط با دپارتمان مصالح' : 'Contact Materials Division'}</span>
            <ArrowIcon className="w-4 h-4" />
          </a>
        </section>
      </div>

      {/* FLOATING INTERACTIVE COMPARISON DOCK, MODALS & LIGHTBOX PORTALED ABOVE HEADER */}
      {typeof document !== 'undefined' &&
        createPortal(
          <>
            {/* FLOATING INTERACTIVE COMPARISON DOCK («میز مقایسه مصالح») */}
            <AnimatePresence>
              {comparedMaterials.length > 0 && (
                <motion.div
                  data-testid="materials-compare-dock"
                  initial={{ opacity: 0, y: 28 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 24 }}
                  transition={{ duration: 0.28, ease: ARCHITECTURAL_EASE }}
                  className="fixed bottom-4 inset-x-3 sm:inset-x-auto sm:start-1/2 sm:-translate-x-1/2 rtl:sm:translate-x-1/2 z-[60] sm:w-[min(92vw,760px)] rounded-2xl border border-[#DFBA78]/42 bg-[#0B111E]/95 backdrop-blur-2xl shadow-[0_24px_70px_-14px_rgba(0,0,0,0.95)] p-3 sm:p-4"
                >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar">
                {comparedMaterials.map((mat) => (
                  <div
                    key={mat.id}
                    className="flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-2.5 py-1.5 shrink-0 max-w-[190px]"
                  >
                    <SafeImage
                      src={mat.coverImage}
                      alt={isRtl ? mat.titleFa : mat.titleEn}
                      className="w-7 h-7 rounded-lg object-cover shrink-0"
                    />
                    <span className="text-[11.5px] font-medium text-[#F5F8FC] truncate">
                      {isRtl ? mat.titleFa : mat.titleEn}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleCompare(mat.id)}
                      aria-label={isRtl ? 'حذف از مقایسه' : 'Remove from comparison'}
                      className="p-0.5 text-[#8B9DB7] hover:text-white shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setCompareIds([])}
                  className="min-h-[40px] px-3 py-1.5 text-xs text-[#9FB1CA] hover:text-white transition-colors"
                >
                  {isRtl ? 'پاک کردن' : 'Clear'}
                </button>
                <button
                  type="button"
                  data-testid="open-compare-modal-btn"
                  disabled={comparedMaterials.length < 2}
                  onClick={() => setCompareModalOpen(true)}
                  className="min-h-[40px] inline-flex items-center gap-2 rounded-full px-4 sm:px-5 py-2 text-xs font-semibold text-[#13100A] bg-gradient-to-r from-[#F3DCA6] via-[#DFBA78] to-[#C89B54] hover:brightness-110 transition-all disabled:opacity-45 disabled:cursor-not-allowed"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>
                    {comparedMaterials.length < 2
                      ? isRtl
                        ? 'یک مورد دیگر انتخاب کنید'
                        : 'Pin 1 more to compare'
                      : isRtl
                        ? `مقایسه کنار هم (${formatNum(comparedMaterials.length)})`
                        : `Compare (${comparedMaterials.length})`}
                  </span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL A: MATERIAL DOSSIER — SPECIMEN PHOTO, CERTIFICATES GALLERY & CATALOG */}
      <AnimatePresence>
        {selectedMaterial && (
          <motion.div
            key="material-dossier-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setSelectedMaterialId(null)}
            className="fixed inset-0 z-[75] bg-[#04070D]/86 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="material-dossier-title"
              data-testid="material-dossier-modal"
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 8 }}
              transition={{ duration: 0.25, ease: ARCHITECTURAL_EASE }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-[24px] sm:rounded-[30px] border border-[#DFBA78]/32 bg-[#0B101C] shadow-[0_38px_110px_-24px_rgba(0,0,0,0.98)]"
            >
              {/* Top Modal Header */}
              <div className="sticky top-0 z-20 flex items-center justify-between gap-3 px-5 sm:px-7 py-4 bg-[#0B101C]/92 backdrop-blur-xl border-b border-white/10">
                <div className="flex items-center gap-2 text-xs text-[#DFBA78] font-medium min-w-0">
                  <span>{MATERIAL_CATEGORY_LABELS[selectedMaterial.category][locale]}</span>
                  {(isRtl ? selectedMaterial.brandNameFa : selectedMaterial.brandNameEn) && (
                    <>
                      <span aria-hidden="true" className="text-white/25">
                        ·
                      </span>
                      <span className="text-[#C6D2E3] truncate">
                        {isRtl ? selectedMaterial.brandNameFa : selectedMaterial.brandNameEn}
                      </span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleCompare(selectedMaterial.id)}
                    className={`min-h-[38px] inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all ${
                      compareIds.includes(selectedMaterial.id)
                        ? 'border-[#DFBA78] bg-[#DFBA78] text-[#13100A] font-semibold'
                        : 'border-white/18 bg-white/[0.04] text-[#F5F8FC] hover:border-[#DFBA78]/60'
                    }`}
                  >
                    {compareIds.includes(selectedMaterial.id) ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Layers className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {compareIds.includes(selectedMaterial.id)
                        ? isRtl
                          ? 'در میز مقایسه'
                          : 'Pinned'
                        : isRtl
                          ? 'افزودن به مقایسه'
                          : 'Compare'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMaterialId(null)}
                    aria-label={isRtl ? 'بستن پنجره' : 'Close dialog'}
                    className="w-10 h-10 rounded-full border border-white/14 bg-white/[0.04] hover:bg-white/10 flex items-center justify-center text-[#DCE6F5]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-5 sm:p-7 space-y-8">
                {/* Split Visual & Specifications Stage */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  <div className="lg:col-span-6 space-y-3">
                    <div className="relative overflow-hidden rounded-2xl border border-white/14 aspect-[16/11] bg-[#080D16]">
                      <SafeImage
                        src={selectedMaterial.coverImage}
                        alt={isRtl ? selectedMaterial.titleFa : selectedMaterial.titleEn}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  <div className="lg:col-span-6 space-y-5">
                    <div className="space-y-2">
                      <h2
                        id="material-dossier-title"
                        className="text-xl sm:text-2xl font-bold text-[#FBF7EF] leading-snug"
                      >
                        {isRtl ? selectedMaterial.titleFa : selectedMaterial.titleEn}
                      </h2>
                      {(isRtl ? selectedMaterial.subtitleFa : selectedMaterial.subtitleEn) && (
                        <p className="text-sm text-[#DFBA78]">
                          {isRtl ? selectedMaterial.subtitleFa : selectedMaterial.subtitleEn}
                        </p>
                      )}
                      {(isRtl ? selectedMaterial.summaryFa : selectedMaterial.summaryEn) && (
                        <p className="text-[13px] sm:text-sm text-[#C6D2E3] leading-relaxed rtl:leading-[1.85] pt-1">
                          {isRtl ? selectedMaterial.summaryFa : selectedMaterial.summaryEn}
                        </p>
                      )}
                    </div>

                    {/* Clean Unboxed Specs Ledger */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 border-y border-white/10 divide-y sm:divide-y-0 sm:divide-x rtl:sm:divide-x-reverse divide-white/10 py-3.5 gap-y-3">
                      {selectedMaterial.performanceMetric && (
                        <div className="sm:pe-4 flex flex-col items-start">
                          <div className="text-[11px] text-[#8B9DB7]">
                            {(isRtl
                              ? selectedMaterial.performanceLabelFa
                              : selectedMaterial.performanceLabelEn) ||
                              (isRtl ? 'شاخص عملکرد فنی' : 'Key Performance')}
                          </div>
                          <div className="font-mono font-numeric ltr-inline text-lg font-bold text-[#28CF77] mt-0.5">
                            {selectedMaterial.performanceMetric}
                          </div>
                        </div>
                      )}
                      {(isRtl ? selectedMaterial.standardRefFa : selectedMaterial.standardRefEn) && (
                        <div className="pt-2 sm:pt-0 sm:ps-4">
                          <div className="text-[11px] text-[#8B9DB7]">
                            {isRtl ? 'استاندارد و رده عملکرد' : 'Standard & Classification'}
                          </div>
                          <div className="text-sm font-semibold text-[#F5F8FC] mt-0.5">
                            {isRtl
                              ? selectedMaterial.standardRefFa
                              : selectedMaterial.standardRefEn}
                          </div>
                        </div>
                      )}
                    </div>

                    {(isRtl ? selectedMaterial.applicationFa : selectedMaterial.applicationEn) && (
                      <div className="space-y-1">
                        <div className="text-[11px] text-[#8B9DB7]">
                          {isRtl ? 'کاربرد پیشنهادی در پروژه' : 'Recommended Application'}
                        </div>
                        <p className="text-[13px] text-[#E6EEF9]">
                          {isRtl
                            ? selectedMaterial.applicationFa
                            : selectedMaterial.applicationEn}
                        </p>
                      </div>
                    )}

                    {/* Prominent Catalog Action Card */}
                    <div className="rounded-2xl border border-[#DFBA78]/28 bg-[#DFBA78]/[0.06] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <FileText className="w-5 h-5 text-[#DFBA78] shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-[#FBF7EF]">
                            {(isRtl
                              ? selectedMaterial.catalogLabelFa
                              : selectedMaterial.catalogLabelEn) ||
                              (isRtl ? 'کاتالوگ فنی محصول' : 'Official Product Catalog')}
                          </div>
                          <div className="text-[11px] text-[#C6D2E3] mt-0.5">
                            {selectedMaterial.catalogUrl &&
                            isSafeExternalUrl(selectedMaterial.catalogUrl)
                              ? isRtl
                                ? 'فایل کاتالوگ رسمی آماده مشاهده و دانلود است.'
                                : 'Official PDF catalog is ready to view or download.'
                              : isRtl
                                ? 'دریافت نسخه کامل کاتالوگ و مشخصات فنی از طریق دپارتمان مصالح ISB'
                                : 'Request the full technical datasheet via ISB Materials Division'}
                          </div>
                        </div>
                      </div>

                      {selectedMaterial.catalogUrl &&
                      isSafeExternalUrl(selectedMaterial.catalogUrl) ? (
                        <a
                          href={selectedMaterial.catalogUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 inline-flex items-center justify-center gap-1.5 min-h-[42px] rounded-full px-4 py-2 text-xs font-semibold text-[#13100A] bg-gradient-to-r from-[#F3DCA6] via-[#DFBA78] to-[#C89B54] hover:brightness-110 transition-all"
                        >
                          <span>{isRtl ? 'مشاهده کاتالوگ' : 'Open Catalog'}</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMaterialId(null);
                            onNavigate({ page: 'contact' });
                          }}
                          className="shrink-0 inline-flex items-center justify-center gap-1.5 min-h-[42px] rounded-full border border-[#DFBA78]/50 bg-[#DFBA78]/14 hover:bg-[#DFBA78]/24 px-4 py-2 text-xs font-semibold text-[#F3DCA6] transition-all"
                        >
                          <span>{isRtl ? 'درخواست کاتالوگ' : 'Request Catalog'}</span>
                          <ArrowIcon className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* VERIFIED CERTIFICATE PHOTO GALLERY */}
                <div className="border-t border-white/10 pt-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-[#28CF77]" />
                      <h3 className="text-base sm:text-lg font-semibold text-[#F5F8FC]">
                        {isRtl
                          ? 'تصاویر گواهینامه‌های فنی و تأییدیه‌ها'
                          : 'Verified Technical Certificate Photographs'}
                      </h3>
                    </div>
                    <span className="text-xs text-[#8B9DB7]">
                      {isRtl
                        ? 'برای بزرگ‌نمایی و بررسی جزئیات، روی تصویر هر گواهینامه کلیک کنید'
                        : 'Click any certificate image to inspect full-screen with zoom'}
                    </span>
                  </div>

                  {(selectedMaterial.certificates ?? []).length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/14 bg-white/[0.02] p-6 text-center text-xs text-[#8B9DB7]">
                      {isRtl
                        ? 'تصویر گواهینامه برای این مصالح در حال تکمیل توسط واحد فنی است.'
                        : 'Certificate photographs for this material are currently being archived.'}
                    </div>
                  ) : (
                    <div
                      data-testid="material-certificates-gallery"
                      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                    >
                      {(selectedMaterial.certificates ?? []).map((cert, certIdx) => (
                        <button
                          key={`${selectedMaterial.id}-cert-${certIdx}`}
                          type="button"
                          data-testid={`material-cert-item-${certIdx}`}
                          onClick={() => openMaterialCertificatesLightbox(selectedMaterial, certIdx)}
                          className="group/item text-start rounded-2xl border border-white/12 hover:border-[#28CF77]/55 bg-[#0F1626] overflow-hidden flex flex-col transition-all"
                        >
                          <div className="relative aspect-[4/3] bg-[#080D16] overflow-hidden">
                            <SafeImage
                              src={cert.imageUrl}
                              alt={
                                (isRtl ? cert.titleFa : cert.titleEn) ||
                                (isRtl ? 'گواهینامه فنی مصالح' : 'Material Certificate')
                              }
                              className="w-full h-full object-cover group-hover/item:scale-[1.04] transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-[#080D16]/0 group-hover/item:bg-[#080D16]/35 transition-colors flex items-center justify-center">
                              <span className="opacity-0 group-hover/item:opacity-100 transition-opacity inline-flex items-center gap-1.5 rounded-full bg-[#080D16]/85 border border-white/25 px-3 py-1.5 text-[11px] font-medium text-white">
                                <Maximize2 className="w-3.5 h-3.5 text-[#28CF77]" />
                                <span>{isRtl ? 'بزرگ‌نمایی' : 'Zoom View'}</span>
                              </span>
                            </div>
                          </div>
                          <div className="p-3.5 space-y-1">
                            <div className="text-xs font-semibold text-[#F5F8FC] leading-snug">
                              {(isRtl ? cert.titleFa : cert.titleEn) ||
                                (isRtl
                                  ? `گواهینامه فنی شماره ${formatNum(certIdx + 1)}`
                                  : `Technical Certificate #${certIdx + 1}`)}
                            </div>
                            {(isRtl ? cert.issuerFa : cert.issuerEn) && (
                              <div className="text-[11px] text-[#9FB1CA]">
                                {isRtl ? cert.issuerFa : cert.issuerEn}
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Linked Partner Brands */}
                {(() => {
                  const linkedBrands = partnerLogos.filter(
                    (b) =>
                      b.status === 'published' && (selectedMaterial.partnerIds ?? []).includes(b.id)
                  );
                  if (linkedBrands.length === 0) return null;
                  return (
                    <div className="border-t border-white/10 pt-5 space-y-3">
                      <div className="text-xs font-medium text-[#8B9DB7]">
                        {isRtl
                          ? 'برندهای همکار ارائه‌دهنده این مصالح:'
                          : 'Partner brands supplying this material:'}
                      </div>
                      <div className="flex flex-wrap gap-2.5">
                        {linkedBrands.map((brand) => (
                          <button
                            key={brand.id}
                            type="button"
                            onClick={() => {
                              setSelectedMaterialId(null);
                              setSelectedBrandId(brand.id);
                            }}
                            className="inline-flex items-center gap-2 min-h-[40px] rounded-xl border border-[#DFBA78]/28 bg-[#DFBA78]/[0.06] hover:bg-[#DFBA78]/[0.15] px-3.5 py-1.5 text-xs font-medium text-[#F3DCA6] transition-colors"
                          >
                            <Building2 className="w-3.5 h-3.5" />
                            <span>{isRtl ? brand.nameFa : brand.nameEn}</span>
                            <ArrowUpRight className="w-3.5 h-3.5 opacity-75" />
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL B: BRAND DOSSIER — AGGREGATED CERTIFICATES, LINKED MATERIALS & CATALOGS */}
      <AnimatePresence>
        {selectedBrand && (
          <motion.div
            key="brand-dossier-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setSelectedBrandId(null)}
            className="fixed inset-0 z-[75] bg-[#04070D]/86 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          >
            {(() => {
              const linkedMaterials = getMaterialsForBrand(selectedBrand.id, publishedMaterials);
              const brandCertificates = getBrandCertificates(selectedBrand.id, publishedMaterials);
              const brandName = isRtl ? selectedBrand.nameFa : selectedBrand.nameEn;

              return (
                <motion.div
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="brand-dossier-title"
                  data-testid="brand-dossier-modal"
                  initial={{ opacity: 0, scale: 0.96, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97, y: 8 }}
                  transition={{ duration: 0.25, ease: ARCHITECTURAL_EASE }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[24px] sm:rounded-[30px] border border-[#DFBA78]/32 bg-[#0B101C] shadow-[0_38px_110px_-24px_rgba(0,0,0,0.98)]"
                >
                  <div className="sticky top-0 z-20 flex items-center justify-between gap-4 px-5 sm:px-7 py-4 bg-[#0B101C]/92 backdrop-blur-xl border-b border-white/10">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl border border-white/14 bg-white/[0.04] flex items-center justify-center overflow-hidden shrink-0">
                        {selectedBrand.logoUrl ? (
                          <SafeImage
                            src={selectedBrand.logoUrl}
                            alt={brandName}
                            className="max-h-8 max-w-[36px] object-contain"
                          />
                        ) : (
                          <span className="font-mono text-xs font-bold text-[#DFBA78]">
                            {getPartnerMonogram(selectedBrand.nameEn || selectedBrand.nameFa)}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] text-[#DFBA78] font-medium">
                          {isRtl ? 'پرونده برند همکار' : 'Partner Brand Dossier'}
                        </p>
                        <h2
                          id="brand-dossier-title"
                          className="text-base sm:text-xl font-bold text-[#FBF7EF] truncate"
                        >
                          {brandName}
                        </h2>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedBrandId(null)}
                      aria-label={isRtl ? 'بستن پنجره' : 'Close dialog'}
                      className="w-10 h-10 rounded-full border border-white/14 bg-white/[0.04] hover:bg-white/10 flex items-center justify-center text-[#DCE6F5] shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-5 sm:p-7 space-y-7">
                    {/* Aggregated Certificate Photographs */}
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-[#28CF77]" />
                          <h3 className="text-sm sm:text-base font-semibold text-[#F5F8FC]">
                            {isRtl
                              ? `گالری گواهینامه‌های ثبت‌شده (${formatNum(brandCertificates.length)})`
                              : `Recorded Certificates (${brandCertificates.length})`}
                          </h3>
                        </div>
                        {selectedBrand.websiteUrl && isSafeExternalUrl(selectedBrand.websiteUrl) && (
                          <a
                            href={selectedBrand.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#DFBA78] hover:text-white transition-colors"
                          >
                            <span>{isRtl ? 'وب‌سایت رسمی برند' : 'Official Website'}</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>

                      {brandCertificates.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-white/12 bg-white/[0.02] p-5 text-xs text-[#8B9DB7]">
                          {isRtl
                            ? 'تصویر گواهینامه‌های این برند از طریق پنل مدیریت در حال بارگذاری است.'
                            : 'Certificate photographs for this partner brand are being uploaded.'}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                          {brandCertificates.map(({ certificate, material }, cIdx) => (
                            <button
                              key={`${selectedBrand.id}-cert-${cIdx}`}
                              type="button"
                              onClick={() => openBrandCertificatesLightbox(selectedBrand.id, cIdx)}
                              className="group/bcert text-start rounded-2xl border border-white/12 hover:border-[#28CF77]/55 bg-[#0F1626] overflow-hidden transition-all"
                            >
                              <div className="relative aspect-[4/3] bg-[#080D16] overflow-hidden">
                                <SafeImage
                                  src={certificate.imageUrl}
                                  alt={
                                    (isRtl ? certificate.titleFa : certificate.titleEn) || brandName
                                  }
                                  className="w-full h-full object-cover group-hover/bcert:scale-[1.04] transition-transform duration-500"
                                />
                              </div>
                              <div className="p-3 space-y-1">
                                <div className="text-xs font-semibold text-[#F5F8FC] line-clamp-2">
                                  {(isRtl ? certificate.titleFa : certificate.titleEn) ||
                                    (isRtl ? 'گواهینامه فنی' : 'Technical Certificate')}
                                </div>
                                <div className="text-[11px] text-[#DFBA78] truncate">
                                  {isRtl ? material.titleFa : material.titleEn}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Linked Materials & Catalogs */}
                    <div className="border-t border-white/10 pt-6 space-y-3.5">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#DFBA78]" />
                        <h3 className="text-sm sm:text-base font-semibold text-[#F5F8FC]">
                          {isRtl
                            ? 'مصالح و کاتالوگ‌های مرتبط با این برند'
                            : 'Linked Materials & Technical Catalogs'}
                        </h3>
                      </div>

                      {linkedMaterials.length === 0 ? (
                        <p className="text-xs text-[#8B9DB7]">
                          {isRtl
                            ? 'این برند به عنوان همکار فنی در شبکه ISB ثبت شده است.'
                            : 'This partner is registered in the ISB technical network.'}
                        </p>
                      ) : (
                        <div className="space-y-2.5">
                          {linkedMaterials.map((mat) => {
                            const hasPdf = Boolean(
                              mat.catalogUrl && isSafeExternalUrl(mat.catalogUrl)
                            );
                            return (
                              <div
                                key={mat.id}
                                className="rounded-2xl border border-white/10 bg-[#0F1626] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <SafeImage
                                    src={mat.coverImage}
                                    alt={isRtl ? mat.titleFa : mat.titleEn}
                                    className="w-14 h-11 rounded-xl object-cover shrink-0 border border-white/10"
                                  />
                                  <div className="min-w-0">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedBrandId(null);
                                        setSelectedMaterialId(mat.id);
                                      }}
                                      className="text-sm font-semibold text-[#F5F8FC] hover:text-[#F3DCA6] transition-colors text-start truncate block max-w-full"
                                    >
                                      {isRtl ? mat.titleFa : mat.titleEn}
                                    </button>
                                    <div className="text-[11px] text-[#9FB1CA] truncate">
                                      {(isRtl ? mat.catalogLabelFa : mat.catalogLabelEn) ||
                                        (isRtl ? 'کاتالوگ مشخصات فنی' : 'Technical Catalog')}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedBrandId(null);
                                      setSelectedMaterialId(mat.id);
                                    }}
                                    className="min-h-[38px] rounded-full border border-white/15 px-3.5 py-1.5 text-xs text-[#DCE6F5] hover:border-[#DFBA78]/50"
                                  >
                                    {isRtl ? 'مشاهده پرونده' : 'Dossier'}
                                  </button>
                                  {hasPdf ? (
                                    <a
                                      href={mat.catalogUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="min-h-[38px] inline-flex items-center gap-1.5 rounded-full bg-[#DFBA78] px-3.5 py-1.5 text-xs font-semibold text-[#13100A] hover:brightness-110"
                                    >
                                      <span>{isRtl ? 'کاتالوگ' : 'Catalog'}</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedBrandId(null);
                                        onNavigate({ page: 'contact' });
                                      }}
                                      className="min-h-[38px] inline-flex items-center gap-1.5 rounded-full border border-[#DFBA78]/45 bg-[#DFBA78]/10 px-3.5 py-1.5 text-xs font-medium text-[#F3DCA6] hover:bg-[#DFBA78]/20"
                                    >
                                      <span>{isRtl ? 'درخواست کاتالوگ' : 'Request PDF'}</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL C: SIDE-BY-SIDE MATERIAL COMPARISON MATRIX («میز مقایسه مصالح») */}
      <AnimatePresence>
        {compareModalOpen && comparedMaterials.length >= 2 && (
          <motion.div
            key="compare-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setCompareModalOpen(false)}
            className="fixed inset-0 z-[75] bg-[#04070D]/86 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="compare-modal-title"
              data-testid="materials-compare-modal"
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 8 }}
              transition={{ duration: 0.25, ease: ARCHITECTURAL_EASE }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-6xl max-h-[92vh] overflow-y-auto rounded-[24px] sm:rounded-[30px] border border-[#DFBA78]/32 bg-[#0B101C] shadow-[0_38px_110px_-24px_rgba(0,0,0,0.98)]"
            >
              <div className="sticky top-0 z-20 flex items-center justify-between gap-4 px-5 sm:px-7 py-4 bg-[#0B101C]/92 backdrop-blur-xl border-b border-white/10">
                <div>
                  <p className="text-[11px] font-semibold text-[#DFBA78]">
                    {isRtl ? 'میز مقایسه تخصصی مصالح' : 'SIDE-BY-SIDE MATERIAL COMPARISON'}
                  </p>
                  <h2 id="compare-modal-title" className="text-base sm:text-xl font-bold text-[#FBF7EF]">
                    {isRtl
                      ? `مقایسه ${formatNum(comparedMaterials.length)} سامانه انتخاب‌شده`
                      : `Comparing ${comparedMaterials.length} Selected Materials`}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setCompareModalOpen(false)}
                  aria-label={isRtl ? 'بستن مقایسه' : 'Close comparison'}
                  className="w-10 h-10 rounded-full border border-white/14 bg-white/[0.04] hover:bg-white/10 flex items-center justify-center text-[#DCE6F5]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 sm:p-7">
                <div
                  className={`grid grid-cols-1 gap-4 sm:gap-5 ${
                    comparedMaterials.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'
                  }`}
                >
                  {comparedMaterials.map((mat) => {
                    const certs = mat.certificates ?? [];
                    const hasPdf = Boolean(mat.catalogUrl && isSafeExternalUrl(mat.catalogUrl));
                    return (
                      <div
                        key={mat.id}
                        className="rounded-2xl border border-white/12 bg-[#0F1626] overflow-hidden flex flex-col justify-between"
                      >
                        <div>
                          <div className="relative aspect-[16/10] bg-[#080D16] overflow-hidden">
                            <SafeImage
                              src={mat.coverImage}
                              alt={isRtl ? mat.titleFa : mat.titleEn}
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                toggleCompare(mat.id);
                                if (comparedMaterials.length <= 2) setCompareModalOpen(false);
                              }}
                              aria-label={isRtl ? 'حذف از مقایسه' : 'Remove from comparison'}
                              className="absolute top-2.5 end-2.5 w-8 h-8 rounded-full bg-[#080D16]/80 border border-white/20 flex items-center justify-center text-[#DCE6F5] hover:text-white"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="p-4 space-y-4">
                            <div>
                              <div className="text-[11px] font-medium text-[#DFBA78]">
                                {MATERIAL_CATEGORY_LABELS[mat.category][locale]}
                              </div>
                              <h3 className="text-base font-bold text-[#FBF7EF] mt-0.5 leading-snug">
                                {isRtl ? mat.titleFa : mat.titleEn}
                              </h3>
                            </div>

                            <div className="divide-y divide-white/10 text-xs">
                              <div className="py-2.5 flex items-center justify-between gap-2">
                                <span className="text-[#8B9DB7]">
                                  {isRtl ? 'شاخص عملکرد' : 'Performance'}
                                </span>
                                <span className="font-mono font-numeric ltr-inline font-bold text-[#28CF77]">
                                  {mat.performanceMetric || '—'}
                                </span>
                              </div>
                              <div className="py-2.5 flex items-start justify-between gap-3">
                                <span className="text-[#8B9DB7] shrink-0">
                                  {isRtl ? 'استاندارد' : 'Standard'}
                                </span>
                                <span className="text-[#F5F8FC] text-end">
                                  {(isRtl ? mat.standardRefFa : mat.standardRefEn) || '—'}
                                </span>
                              </div>
                              <div className="py-2.5 flex items-start justify-between gap-3">
                                <span className="text-[#8B9DB7] shrink-0">
                                  {isRtl ? 'برند همکار' : 'Brand'}
                                </span>
                                <span className="text-[#F3DCA6] text-end">
                                  {(isRtl ? mat.brandNameFa : mat.brandNameEn) || '—'}
                                </span>
                              </div>
                              <div className="py-2.5 flex items-start justify-between gap-3">
                                <span className="text-[#8B9DB7] shrink-0">
                                  {isRtl ? 'کاربرد' : 'Application'}
                                </span>
                                <span className="text-[#C6D2E3] text-end leading-relaxed">
                                  {(isRtl ? mat.applicationFa : mat.applicationEn) || '—'}
                                </span>
                              </div>
                              <div className="py-2.5 flex items-center justify-between gap-2">
                                <span className="text-[#8B9DB7]">
                                  {isRtl ? 'گواهینامه‌ها' : 'Certificates'}
                                </span>
                                {certs.length > 0 ? (
                                  <button
                                    type="button"
                                    onClick={() => openMaterialCertificatesLightbox(mat, 0)}
                                    className="inline-flex items-center gap-1 font-semibold text-[#28CF77] hover:underline"
                                  >
                                    <Images className="w-3.5 h-3.5" />
                                    <span>
                                      {isRtl
                                        ? `مشاهده ${formatNum(certs.length)} عکس`
                                        : `View ${certs.length} photo${certs.length > 1 ? 's' : ''}`}
                                    </span>
                                  </button>
                                ) : (
                                  <span className="text-[#7E90AA]">—</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 pt-0 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setCompareModalOpen(false);
                              setSelectedMaterialId(mat.id);
                            }}
                            className="flex-1 min-h-[40px] rounded-full border border-white/15 bg-white/[0.04] hover:border-[#DFBA78]/55 text-xs font-medium text-[#F5F8FC] transition-colors"
                          >
                            {isRtl ? 'پرونده کامل' : 'Full Dossier'}
                          </button>
                          {hasPdf && (
                            <a
                              href={mat.catalogUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="min-h-[40px] inline-flex items-center justify-center gap-1 rounded-full bg-[#DFBA78] px-4 text-xs font-semibold text-[#13100A]"
                            >
                              <span>{isRtl ? 'کاتالوگ' : 'PDF'}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FULL-SCREEN ZOOMABLE CERTIFICATE PHOTO LIGHTBOX */}
      <AnimatePresence>
        {lightbox && lightbox.items[lightbox.index] && (
          <motion.div
            key="certificate-lightbox"
            data-testid="certificate-lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => {
              setLightbox(null);
              setLightboxZoomed(false);
            }}
            className="fixed inset-0 z-[90] bg-[#03050A]/96 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-6"
          >
            {/* Lightbox Top Bar */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-between gap-4 max-w-6xl w-full mx-auto"
            >
              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-2 text-xs text-[#28CF77] font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{lightbox.items[lightbox.index].materialTitle}</span>
                  {lightbox.items.length > 1 && (
                    <span className="font-numeric text-[#DFBA78] shrink-0">
                      · {formatNum(lightbox.index + 1)} / {formatNum(lightbox.items.length)}
                    </span>
                  )}
                </div>
                <h3 className="text-sm sm:text-base font-semibold text-[#FBF7EF] truncate">
                  {(isRtl
                    ? lightbox.items[lightbox.index].certificate.titleFa
                    : lightbox.items[lightbox.index].certificate.titleEn) ||
                    (isRtl ? 'گواهینامه فنی مصالح' : 'Technical Material Certificate')}
                </h3>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  data-testid="lightbox-zoom-toggle"
                  onClick={() => setLightboxZoomed((z) => !z)}
                  className={`min-h-[40px] inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                    lightboxZoomed
                      ? 'border-[#28CF77] bg-[#00A651]/25 text-[#D8FBE7]'
                      : 'border-white/20 bg-white/[0.06] text-[#F5F8FC] hover:border-[#DFBA78]'
                  }`}
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>
                    {lightboxZoomed
                      ? isRtl
                        ? 'بزرگ‌نمایی ۱×'
                        : 'Reset 1×'
                      : isRtl
                        ? 'بزرگ‌نمایی ۱.۷۵×'
                        : 'Zoom 1.75×'}
                  </span>
                </button>

                <button
                  type="button"
                  data-testid="lightbox-close-btn"
                  onClick={() => {
                    setLightbox(null);
                    setLightboxZoomed(false);
                  }}
                  aria-label={isRtl ? 'بستن گالری گواهینامه' : 'Close certificate viewer'}
                  className="w-10 h-10 rounded-full border border-white/20 bg-white/[0.08] hover:bg-white/15 flex items-center justify-center text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Lightbox Image Stage */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative flex-1 my-4 flex items-center justify-center overflow-auto max-w-6xl w-full mx-auto"
            >
              {lightbox.items.length > 1 && (
                <button
                  type="button"
                  aria-label={isRtl ? 'گواهینامه قبلی' : 'Previous certificate'}
                  onClick={() => {
                    setLightboxZoomed(false);
                    setLightbox((prev) =>
                      prev
                        ? {
                            ...prev,
                            index: (prev.index - 1 + prev.items.length) % prev.items.length,
                          }
                        : null
                    );
                  }}
                  className="fixed start-3 sm:start-6 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full border border-white/20 bg-[#080D16]/85 hover:border-[#DFBA78] flex items-center justify-center text-white"
                >
                  {isRtl ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                </button>
              )}

              <button
                type="button"
                onClick={() => setLightboxZoomed((z) => !z)}
                className={`relative rounded-2xl overflow-hidden border border-[#DFBA78]/35 bg-[#0C121E] shadow-[0_30px_90px_-18px_rgba(0,0,0,0.95)] transition-transform duration-300 ${
                  lightboxZoomed ? 'scale-[1.75] cursor-zoom-out my-20' : 'scale-100 cursor-zoom-in'
                }`}
              >
                <SafeImage
                  src={lightbox.items[lightbox.index].certificate.imageUrl}
                  alt={
                    (isRtl
                      ? lightbox.items[lightbox.index].certificate.titleFa
                      : lightbox.items[lightbox.index].certificate.titleEn) ||
                    (isRtl ? 'تصویر گواهینامه فنی' : 'Technical Certificate')
                  }
                  className="max-h-[70vh] max-w-[88vw] sm:max-w-[74vw] object-contain"
                />
              </button>

              {lightbox.items.length > 1 && (
                <button
                  type="button"
                  aria-label={isRtl ? 'گواهینامه بعدی' : 'Next certificate'}
                  onClick={() => {
                    setLightboxZoomed(false);
                    setLightbox((prev) =>
                      prev ? { ...prev, index: (prev.index + 1) % prev.items.length } : null
                    );
                  }}
                  className="fixed end-3 sm:end-6 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full border border-white/20 bg-[#080D16]/85 hover:border-[#DFBA78] flex items-center justify-center text-white"
                >
                  {isRtl ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </button>
              )}
            </div>

            {/* Lightbox Caption Bar */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="max-w-4xl w-full mx-auto text-center space-y-1"
            >
              {(isRtl
                ? lightbox.items[lightbox.index].certificate.issuerFa
                : lightbox.items[lightbox.index].certificate.issuerEn) && (
                <p className="text-xs sm:text-sm text-[#DFBA78]">
                  {isRtl
                    ? lightbox.items[lightbox.index].certificate.issuerFa
                    : lightbox.items[lightbox.index].certificate.issuerEn}
                </p>
              )}
              <p className="text-[11px] text-[#8B9DB7]">
                {isRtl
                  ? 'برای بزرگ‌نمایی روی تصویر کلیک کنید یا با کلیدهای جهت‌نما بین گواهینامه‌ها جابه‌جا شوید.'
                  : 'Click the certificate to toggle zoom, or use arrow keys to browse.'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
          </>,
          document.body
        )}
    </div>
  );
}
