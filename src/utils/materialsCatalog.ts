import { ASSETS } from '../data/assets';
import type {
  BilingualText,
  Locale,
  MaterialCategory,
  MaterialCertificate,
  MaterialItem,
  PartnerLogo,
} from '../types/content';
import {
  isSafeExternalUrl,
  isSafeImageSrc,
  normalizeSlug,
  sanitizeText,
  type FieldErrors,
} from './validation';

export type MaterialCategoryId = 'all' | MaterialCategory;

export const MATERIALS_DEPARTMENT_META = {
  slug: 'materials-technologies',
  kicker: {
    fa: 'دپارتمان ویژه · مصالح و فناوری‌های نوین',
    en: 'Special Division · Materials & Technologies',
  },
  title: {
    fa: 'مصالح و فناوری‌های نوین',
    en: 'Modern Materials & Technologies',
  },
  shortSubtitle: {
    fa: 'گالری مصالح، گواهینامه‌های فنی و کاتالوگ‌ها',
    en: 'Material Showcase, Certificates & Catalogs',
  },
  overview: {
    fa: 'ویترین تخصصی مصالح نوین ساختمانی همراه با تصویر گواهینامه‌های فنی و آزمایشگاهی، کاتالوگ‌های رسمی محصولات و معرفی برندهای همکار منتخب.',
    en: 'An interactive architectural showcase of modern building materials with verified technical certificate galleries, product catalogs, and selected partner brands.',
  },
} as const;

export const MATERIAL_CATEGORIES: { id: MaterialCategoryId; label: BilingualText }[] = [
  { id: 'all', label: { fa: 'همه مصالح', en: 'All Materials' } },
  { id: 'thermal-envelope', label: { fa: 'پوسته و عایق حرارتی', en: 'Thermal Envelope' } },
  { id: 'lightweight-structure', label: { fa: 'سازه سبک و پیش‌ساخته', en: 'Lightweight & Precast' } },
  { id: 'facade-glazing', label: { fa: 'نما و شیشه هوشمند', en: 'Facade & Glazing' } },
  { id: 'smart-energy', label: { fa: 'هوشمندسازی و آکوستیک', en: 'Smart & Acoustic' } },
];

export const MATERIAL_CATEGORY_LABELS: Record<MaterialCategory, BilingualText> = {
  'thermal-envelope': { fa: 'پوسته و عایق حرارتی', en: 'Thermal Envelope' },
  'lightweight-structure': { fa: 'سازه سبک و پیش‌ساخته', en: 'Lightweight & Precast' },
  'facade-glazing': { fa: 'نما و شیشه هوشمند', en: 'Facade & Glazing' },
  'smart-energy': { fa: 'هوشمندسازی و آکوستیک', en: 'Smart & Acoustic' },
};

export const SEED_MATERIALS: MaterialItem[] = [
  {
    id: 'etics-thermal-envelope',
    slug: 'etics-thermal-envelope',
    titleFa: 'سامانه عایق حرارتی نما از بیرون (ETICS)',
    titleEn: 'Exterior Thermal Insulation System (ETICS)',
    subtitleFa: 'عایق‌کاری پیوسته جداره خارجی با حذف کامل پل‌های حرارتی',
    subtitleEn: 'Continuous exterior facade insulation eliminating thermal bridges',
    summaryFa:
      'سامانه یکپارچه عایق حرارتی نما متشکل از عایق پشم سنگ یا EPS گرافیتی، لایه پایه مسلح به مش فایبرگلاس و پوشش معدنی بخارگذر برای دستیابی به رده انرژی EC++ در پروژه‌های نوساز و بازسازی.',
    summaryEn:
      'Integrated facade thermal envelope combining mineral wool or graphite EPS, fiberglass-reinforced base coat, and breathable hydrophobic mineral finish engineered for Code 19 EC++ compliance.',
    category: 'thermal-envelope',
    brandNameFa: 'ایران ایتیکس · ایزولتکو',
    brandNameEn: 'Iran ETICS · ISOLETCO',
    performanceMetric: 'U ≤ 0.28',
    performanceLabelFa: 'W/m²K ضریب انتقال حرارت',
    performanceLabelEn: 'W/m²K Thermal U-Value',
    standardRefFa: 'مبحث ۱۹ · رده انرژی EC++',
    standardRefEn: 'Code 19 · EC++ Class',
    applicationFa: 'نمای مسکونی، اداری و بهینه‌سازی انرژی بناهای موجود',
    applicationEn: 'Residential, commercial & energy-retrofit facades',
    coverImage: ASSETS.materialEticsCutaway,
    certificates: [
      {
        imageUrl: ASSETS.certThermalApproval,
        titleFa: 'گواهینامه فنی سامانه عایق حرارتی و عملکرد حریق (A1)',
        titleEn: 'Thermal Insulation & Class A1 Fire Technical Approval',
        issuerFa: 'آزمایشگاه مرجع عملکرد حرارتی مصالح',
        issuerEn: 'Accredited Thermal Performance Lab',
      },
      {
        imageUrl: ASSETS.catalogue.mehreganCert,
        titleFa: 'تأییدیه انطباق عملکرد انرژی رده EC++ در پروژه‌های اجرایی',
        titleEn: 'EC++ Energy Performance Field Verification Certificate',
        issuerFa: 'گواهی رتبه‌بندی ساختمان پایدار',
        issuerEn: 'Green Building Performance Registry',
      },
    ],
    catalogLabelFa: 'کاتالوگ فنی سامانه ETICS و جداول ضخامت اقلیمی',
    catalogLabelEn: 'ETICS Technical Catalog & Climate Thickness Tables',
    partnerIds: ['iran-etics', 'isoletco'],
    featured: true,
    order: 1,
    status: 'published',
    isSeedDefault: true,
  },
  {
    id: 'aac-precast-systems',
    slug: 'aac-precast-systems',
    titleFa: 'بلوک هوادار اتوکلاو (AAC) و قطعات پیش‌ساخته',
    titleEn: 'Autoclaved Aerated Concrete (AAC) & Precast',
    subtitleFa: 'سبک‌سازی سازه، کاهش بار لرزه‌ای و عایق حرارتی–صوتی هم‌زمان',
    subtitleEn: 'Lightweight cellular masonry reducing seismic dead load and heat loss',
    summaryFa:
      'بلوک‌های سلولی اتوکلاوشده با چگالی پایین و اجرای دقیق با چسب نازک، ضمن کاهش چشمگیر وزن مرده ساختمان و برش پایه زلزله، مقاومت حریق بالا و عایق حرارتی مناسب در تیغه‌های پیرامونی ایجاد می‌کنند.',
    summaryEn:
      'Precision-milled cellular concrete blocks installed with thin-bed thermal adhesive, lowering seismic dead loads while delivering high fire endurance and acoustic comfort.',
    category: 'lightweight-structure',
    brandNameFa: 'پرین بتن · بنیان بتن',
    brandNameEn: 'Parin Beton · Bonyan Beton',
    performanceMetric: 'λ ≈ 0.11',
    performanceLabelFa: 'W/mK ضریب هدایت حرارتی',
    performanceLabelEn: 'W/mK Thermal Conductivity',
    standardRefFa: 'مباحث ۶، ۱۸ و ۱۹ · پیوست ششم ۲۸۰۰',
    standardRefEn: 'Codes 6, 18 & 19 · Seismic 2800',
    applicationFa: 'دیوارهای پیرامونی، تیغه‌های جداکننده و ساختمان‌های بلندمرتبه',
    applicationEn: 'Exterior walls, partitions & multi-story resilient frames',
    coverImage: ASSETS.materialAacPrecast,
    certificates: [
      {
        imageUrl: ASSETS.certSeismicStandard,
        titleFa: 'گواهینامه آزمایشگاهی مقاومت سازه‌ای و انطباق لرزه‌ای مصالح',
        titleEn: 'Accredited Structural & Seismic Compliance Test Certificate',
        issuerFa: 'آزمایشگاه مرجع مصالح و رفتار لرزه‌ای',
        issuerEn: 'Accredited Structural & Seismic Testing Lab',
      },
    ],
    catalogLabelFa: 'دفترچه مشخصات فنی بلوک‌های AAC و راهنمای اجرا',
    catalogLabelEn: 'AAC Block Technical Specifications & Spec Sheet',
    partnerIds: ['parin-beton', 'bonyadin'],
    featured: true,
    order: 2,
    status: 'published',
    isSeedDefault: true,
  },
  {
    id: 'lowe-thermal-glazing',
    slug: 'lowe-thermal-glazing',
    titleFa: 'شیشه سه‌جداره Low-E و پروفیل آلومینیوم ترمال‌بریک',
    titleEn: 'Triple Low-E Glazing & Thermal-Break Framing',
    subtitleFa: 'توازن نور طبیعی روز با کنترل تابش حرارتی خورشید در اقلیم خشک',
    subtitleEn: 'Balancing daylight autonomy with selective solar heat rejection',
    summaryFa:
      'ترکیب شیشه‌های چندجداره با پوشش کم‌گسیل (Low-E)، گاز آرگون، اسپیسر گرم و فریم‌های آلومینیوم ترمال‌بریک با تیغه پلی‌آمید ۲۴ میلی‌متری برای کاهش بار سرمایشی و حذف میعان لبه‌ها.',
    summaryEn:
      'High-selectivity triple-glazed units filled with argon and warm-edge spacers inside 24mm polyamide thermal-break frames to maximize daylight while minimizing cooling loads.',
    category: 'facade-glazing',
    brandNameFa: 'مالتیکس · ایران ایتیکس',
    brandNameEn: 'Multics · Iran ETICS',
    performanceMetric: 'SHGC 0.32',
    performanceLabelFa: 'ضریب کنترل تابش خورشیدی',
    performanceLabelEn: 'Solar Heat Gain Coefficient',
    standardRefFa: 'مبحث ۱۹ · شاخص نور روز sDA',
    standardRefEn: 'Code 19 · Daylight sDA',
    applicationFa: 'کرتین‌وال، نمای اداری و بازشوهای اقلیم پرآفتاب',
    applicationEn: 'Curtain walls, office facades & solar-exposed apertures',
    coverImage: ASSETS.materialsFacadeSystems,
    certificates: [
      {
        imageUrl: ASSETS.certThermalApproval,
        titleFa: 'تأییدیه عملکرد حرارتی و کنترل تابش پوسته شفاف',
        titleEn: 'Glazing Thermal & Solar Control Approval Certificate',
        issuerFa: 'آزمایشگاه استانداردهای انرژی نما',
        issuerEn: 'Facade Energy Performance Lab',
      },
    ],
    catalogLabelFa: 'کاتالوگ شیشه‌های کم‌گسیل و پروفیل‌های ترمال‌بریک',
    catalogLabelEn: 'Low-E Glazing & Thermal-Break System Catalog',
    partnerIds: ['multics', 'iran-etics'],
    featured: true,
    order: 3,
    status: 'published',
    isSeedDefault: true,
  },
  {
    id: 'insulated-sandwich-panels',
    slug: 'insulated-sandwich-panels',
    titleFa: 'ساندویچ‌پانل معماری با هسته PIR مقاوم حریق',
    titleEn: 'Architectural PIR Insulated Sandwich Panel',
    subtitleFa: 'پوسته صنعتی و معماری هوابند با پیچ مخفی و مقاومت حریق بالا',
    subtitleEn: 'Concealed-fastener airtight architectural envelope with PIR fire core',
    summaryFa:
      'پانل‌های پیش‌ساخته با ورق میکروریب مقاوم در برابر UV و هسته صلب پلی‌ایزوسیانورات (PIR) یا پشم سنگ، مناسب سوله‌های صنعتی رده انرژی بالا، آزمایشگاه‌ها و فضاهای دهانه‌بلند با سرعت اجرای بالا.',
    summaryEn:
      'Micro-ribbed PVDF cladding bonded to rigid PIR or mineral wool cores with concealed airtight interlocking seams for high-efficiency industrial halls and cleanrooms.',
    category: 'thermal-envelope',
    brandNameFa: 'فراپانل · ایزولتکو',
    brandNameEn: 'Farapanel · ISOLETCO',
    performanceMetric: 'PIR · EI60',
    performanceLabelFa: 'عملکرد حرارتی و مقاومت حریق',
    performanceLabelEn: 'Thermal & Fire Resistance',
    standardRefFa: 'سوله‌های رده انرژی EC+ · EN 13501',
    standardRefEn: 'EC+ Industrial Envelope · EN 13501',
    applicationFa: 'سوله‌های صنعتی، سردخانه‌ها، فضاهای آزمایشگاهی و دهانه‌بلند',
    applicationEn: 'Industrial facilities, laboratories & long-span halls',
    coverImage: ASSETS.materialSandwichPanel,
    certificates: [
      {
        imageUrl: ASSETS.certThermalApproval,
        titleFa: 'گواهینامه آزمایشگاهی هدایت حرارتی و رفتار حریق هسته PIR',
        titleEn: 'PIR Core Thermal Conductivity & Fire Rating Certificate',
        issuerFa: 'مرکز آزمون مصالح عایق صنعتی',
        issuerEn: 'Industrial Insulation Testing Authority',
      },
      {
        imageUrl: ASSETS.certSeismicStandard,
        titleFa: 'گواهی کنترل کیفیت ورق و استحکام اتصالات هوابند',
        titleEn: 'Cladding Quality & Structural Interlock Certification',
        issuerFa: 'واحد تضمین کیفیت مصالح ساختمانی',
        issuerEn: 'Building Materials QA Board',
      },
    ],
    catalogLabelFa: 'کاتالوگ جامع ساندویچ‌پانل‌های سقفی و دیواری',
    catalogLabelEn: 'Comprehensive Roof & Wall Sandwich Panel Catalog',
    partnerIds: ['farapanel', 'isoletco'],
    featured: false,
    order: 4,
    status: 'published',
    isSeedDefault: true,
  },
  {
    id: 'smart-ems-bms',
    slug: 'smart-ems-bms',
    titleFa: 'سنسور اقلیم داخلی و مدیریت هوشمند انرژی (EMS)',
    titleEn: 'Smart Indoor Climate & Energy Node (EMS)',
    subtitleFa: 'پایش لحظه‌ای دما، CO₂ و نور با کنترل خودکار تأسیسات و سایه‌بان',
    subtitleEn: 'Flush multi-sensor wall node driving HVAC, shading & daylight dimming',
    summaryFa:
      'سامانه پایش و کنترل هوشمند ساختمان با طراحی توکار هم‌سطح دیوار، پشتیبانی از پروتکل‌های باز KNX و BACnet و کاهش واقعی مصرف انرژی بهره‌برداری از طریق مدیریت هوشمند بار سرمایش، گرمایش و روشنایی.',
    summaryEn:
      'Recessed architectural wall sensors supporting open KNX/BACnet protocols to dynamically orchestrate HVAC, motorized shading, and continuous EUI telemetry.',
    category: 'smart-energy',
    brandNameFa: 'گروه BST · مالتیکس',
    brandNameEn: 'BST Group · Multics',
    performanceMetric: '-25% EUI',
    performanceLabelFa: 'کاهش انرژی بهره‌برداری سالانه',
    performanceLabelEn: 'Operational Energy Reduction',
    standardRefFa: 'ISO 50001 · KNX / BACnet',
    standardRefEn: 'ISO 50001 · KNX / BACnet',
    applicationFa: 'ساختمان‌های اداری هوشمند، مجتمع‌های تجاری و پروژه‌های کربن‌صفر',
    applicationEn: 'Smart offices, commercial towers & net-zero projects',
    coverImage: ASSETS.materialSmartEmsSensor,
    certificates: [
      {
        imageUrl: ASSETS.certAcousticGreen,
        titleFa: 'گواهینامه سلامت هوای داخلی و پایش هوشمند کیفیت محیط (IAQ)',
        titleEn: 'Indoor Air Quality & Smart Environmental Verification',
        issuerFa: 'آزمایشگاه کیفیت هوای داخلی و ساختمان سبز',
        issuerEn: 'Green Building IAQ Verification Lab',
      },
    ],
    catalogLabelFa: 'کاتالوگ تجهیزات مدیریت هوشمند انرژی و پروتکل‌ها',
    catalogLabelEn: 'Smart EMS Hardware & Protocol Brochure',
    partnerIds: ['bst', 'multics'],
    featured: false,
    order: 5,
    status: 'published',
    isSeedDefault: true,
  },
  {
    id: 'eco-acoustic-materials',
    slug: 'eco-acoustic-materials',
    titleFa: 'پانل‌های آکوستیک معدنی و مصالح کم‌کربن داخلی',
    titleEn: 'Mineral Acoustic Baffles & Low-VOC Finishes',
    subtitleFa: 'جذب صوتی پهن‌باند همراه با گواهی سلامت هوای داخل (Low-VOC)',
    subtitleEn: 'Broadband acoustic comfort paired with formaldehyde-free air quality',
    summaryFa:
      'پانل‌های جاذب صوتی با رویه میکروپرفوره معدنی و هسته بدون فرمالدهید، طراحی‌شده برای ارتقای وضوح گفتار در فضاهای کاری و آموزشی و کسب امتیاز پایداری مصالح در رتبه‌بندی ساختمان سبز «سرو سبز».',
    summaryEn:
      'Micro-perforated mineral acoustic panels with zero-VOC binders engineered for speech clarity and indoor environmental credits in Saro Sabz green building rating.',
    category: 'smart-energy',
    brandNameFa: 'زیست‌آوین · ایزولتکو',
    brandNameEn: 'Zistavin · ISOLETCO',
    performanceMetric: 'NRC 0.85',
    performanceLabelFa: 'ضریب جذب صوتی پهن‌باند',
    performanceLabelEn: 'Noise Reduction Coefficient',
    standardRefFa: 'مبحث ۱۸ · رتبه‌بندی سرو سبز',
    standardRefEn: 'Code 18 · Saro Sabz Green Rating',
    applicationFa: 'سالن‌های همایش، فضاهای آموزشی، دفاتر کار و استودیوها',
    applicationEn: 'Auditoriums, educational halls & modern workspaces',
    coverImage: ASSETS.materialAcousticMineral,
    certificates: [
      {
        imageUrl: ASSETS.certAcousticGreen,
        titleFa: 'گواهینامه آزمایشگاهی جذب صوتی و سلامت هوای داخل (ISO 16000)',
        titleEn: 'Indoor Air Quality & Acoustic Lab Certificate (ISO 16000)',
        issuerFa: 'آزمایشگاه آکوستیک و کیفیت هوای ساختمان سبز',
        issuerEn: 'IAQ & Acoustic Laboratory',
      },
    ],
    catalogLabelFa: 'کاتالوگ پانل‌های آکوستیک معدنی و نمودارهای جذب صدا',
    catalogLabelEn: 'Mineral Acoustic Baffles & Absorption Curves Catalog',
    partnerIds: ['zistavin', 'isoletco'],
    featured: false,
    order: 6,
    status: 'published',
    isSeedDefault: true,
  },
];

// Backwards-compatible alias
export const MATERIAL_SYSTEMS = SEED_MATERIALS;

/**
 * Curated seed partner IDs representing building materials, envelope systems,
 * precast concrete, smart energy hardware, and green tech brands.
 */
export const MATERIAL_PARTNER_SEED_IDS = new Set<string>([
  'isoletco',
  'parin-beton',
  'iran-etics',
  'farapanel',
  'bonyadin',
  'multics',
  'bst',
  'zistavin',
]);

export function sanitizeMaterialCertificates(raw: unknown): MaterialCertificate[] {
  if (!Array.isArray(raw)) return [];
  const result: MaterialCertificate[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const obj = item as Record<string, unknown>;
    const imageUrl = typeof obj.imageUrl === 'string' ? sanitizeText(obj.imageUrl, 500) : '';
    if (!imageUrl || !isSafeImageSrc(imageUrl)) continue;
    const cert: MaterialCertificate = { imageUrl };
    const titleFa = typeof obj.titleFa === 'string' ? sanitizeText(obj.titleFa, 160) : '';
    if (titleFa) cert.titleFa = titleFa;
    const titleEn = typeof obj.titleEn === 'string' ? sanitizeText(obj.titleEn, 160) : '';
    if (titleEn) cert.titleEn = titleEn;
    const issuerFa = typeof obj.issuerFa === 'string' ? sanitizeText(obj.issuerFa, 120) : '';
    if (issuerFa) cert.issuerFa = issuerFa;
    const issuerEn = typeof obj.issuerEn === 'string' ? sanitizeText(obj.issuerEn, 120) : '';
    if (issuerEn) cert.issuerEn = issuerEn;
    result.push(cert);
    if (result.length >= 8) break;
  }
  return result;
}

export function mergeCatalogMaterials(
  seedMaterials: MaterialItem[],
  firestoreMaterials: MaterialItem[],
  hiddenSeedIds: string[] = [],
  includeDrafts = false
): MaterialItem[] {
  const hiddenSet = new Set(hiddenSeedIds);
  const byKey = new Map<string, MaterialItem>();

  for (const seed of seedMaterials) {
    if (hiddenSet.has(seed.id) || hiddenSet.has(seed.slug)) continue;
    byKey.set(seed.id, { ...seed, isSeedDefault: true });
  }

  for (const item of firestoreMaterials) {
    // Override matching seed by id or slug
    if (byKey.has(item.id)) {
      byKey.set(item.id, { ...item, isSeedDefault: false });
    } else {
      const existingBySlug = Array.from(byKey.values()).find((m) => m.slug === item.slug);
      if (existingBySlug) {
        byKey.delete(existingBySlug.id);
      }
      byKey.set(item.id, { ...item, isSeedDefault: false });
    }
  }

  const merged = Array.from(byKey.values()).filter((m) => includeDrafts || m.status === 'published');
  return merged.sort((a, b) => a.order - b.order);
}

export interface MaterialFilterOptions {
  searchQuery?: string;
  onlyCertified?: boolean;
  onlyWithCatalog?: boolean;
}

export function filterMaterialSystems(
  category: MaterialCategoryId,
  materials: MaterialItem[] = SEED_MATERIALS,
  options: MaterialFilterOptions = {}
): MaterialItem[] {
  const q = (options.searchQuery ?? '').trim().toLowerCase();

  return materials.filter((item) => {
    if (category !== 'all' && item.category !== category) return false;
    if (options.onlyCertified && (!item.certificates || item.certificates.length === 0)) {
      return false;
    }
    if (options.onlyWithCatalog && !item.catalogUrl?.trim()) {
      return false;
    }
    if (!q) return true;

    const haystack = [
      item.titleFa,
      item.titleEn,
      item.subtitleFa ?? '',
      item.subtitleEn ?? '',
      item.summaryFa ?? '',
      item.summaryEn ?? '',
      item.brandNameFa ?? '',
      item.brandNameEn ?? '',
      item.performanceMetric ?? '',
      item.standardRefFa ?? '',
      item.standardRefEn ?? '',
      item.applicationFa ?? '',
      item.applicationEn ?? '',
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(q);
  });
}

export function getMaterialsForBrand(
  brandId: string,
  materials: MaterialItem[] = SEED_MATERIALS
): MaterialItem[] {
  return materials.filter((item) => (item.partnerIds ?? []).includes(brandId));
}

export const getMaterialSystemsForBrand = getMaterialsForBrand;

export interface BrandCertificateEntry {
  certificate: MaterialCertificate;
  material: MaterialItem;
}

export function getBrandCertificates(
  brandId: string,
  materials: MaterialItem[] = SEED_MATERIALS
): BrandCertificateEntry[] {
  const linked = getMaterialsForBrand(brandId, materials);
  const seen = new Set<string>();
  const entries: BrandCertificateEntry[] = [];

  for (const material of linked) {
    for (const cert of material.certificates ?? []) {
      const dedupeKey = `${cert.imageUrl}::${cert.titleFa ?? cert.titleEn ?? ''}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      entries.push({ certificate: cert, material });
    }
  }
  return entries;
}

/**
 * Selects partner brands for the Modern Materials & Technologies division.
 */
export function selectMaterialPartnerBrands(
  partners: PartnerLogo[],
  scope: 'materials' | 'all' = 'materials'
): PartnerLogo[] {
  const published = partners
    .filter((p) => p.status === 'published')
    .sort((a, b) => a.order - b.order);

  if (scope === 'all') return published;

  const focused = published.filter(
    (p) => !p.isSeedDefault || MATERIAL_PARTNER_SEED_IDS.has(p.id)
  );
  return focused.length > 0 ? focused : published;
}

export const selectMaterialSponsorBrands = selectMaterialPartnerBrands;

export interface MaterialFormInput {
  slug: string;
  titleFa: string;
  titleEn: string;
  subtitleFa: string;
  subtitleEn: string;
  summaryFa: string;
  summaryEn: string;
  category: MaterialCategory;
  brandNameFa: string;
  brandNameEn: string;
  performanceMetric: string;
  performanceLabelFa: string;
  performanceLabelEn: string;
  standardRefFa: string;
  standardRefEn: string;
  applicationFa: string;
  applicationEn: string;
  coverImage: string;
  certificates: MaterialCertificate[];
  catalogUrl: string;
  catalogLabelFa: string;
  catalogLabelEn: string;
  partnerIds: string[];
  featured: boolean;
  order: number;
  status: 'draft' | 'published';
}

const SLUG_REGEX = /^[a-z0-9-]+$/;

export function deriveMaterialSlug(rawSlug: string, titleEn: string, fallbackSuffix?: string): string {
  const explicit = normalizeSlug(rawSlug)
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
  if (explicit.length >= 2) return explicit;

  const fromEn = normalizeSlug(titleEn)
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  if (fromEn.length >= 2) return fromEn;

  const suffix = fallbackSuffix ?? Math.random().toString(36).slice(2, 7);
  return `material-${suffix}`;
}

export function validateMaterialForm(
  input: MaterialFormInput,
  locale: Locale
): FieldErrors<MaterialFormInput> {
  const errors: FieldErrors<MaterialFormInput> = {};
  const isFa = locale === 'fa';

  const titleFa = input.titleFa.trim();
  if (titleFa.length < 2 || titleFa.length > 160) {
    errors.titleFa = isFa
      ? 'نام فارسی مصالح باید بین ۲ تا ۱۶۰ کاراکتر باشد.'
      : 'Persian material title must be between 2 and 160 characters.';
  }

  const effectiveTitleEn = (input.titleEn.trim() || titleFa).trim();
  if (effectiveTitleEn.length < 2 || effectiveTitleEn.length > 160) {
    errors.titleEn = isFa
      ? 'نام انگلیسی مصالح باید بین ۲ تا ۱۶۰ کاراکتر باشد.'
      : 'English material title must be between 2 and 160 characters.';
  }

  const slug = normalizeSlug(input.slug);
  if (slug && (slug.length < 2 || slug.length > 100 || !SLUG_REGEX.test(slug))) {
    errors.slug = isFa
      ? 'شناسه انگلیسی باید فقط شامل حروف کوچک انگلیسی، عدد و خط‌تیره باشد.'
      : 'Slug must use lowercase letters, numbers, and hyphens only (2–100 chars).';
  }

  const coverImage = input.coverImage.trim();
  if (!coverImage || coverImage.length > 500 || !isSafeImageSrc(coverImage)) {
    errors.coverImage = isFa
      ? 'لطفاً تصویر شاخص مصالح را آپلود کنید یا آدرس معتبر وارد کنید.'
      : 'Please upload a cover image or enter a valid image URL.';
  }

  const catalogUrl = input.catalogUrl.trim();
  if (catalogUrl && (catalogUrl.length > 500 || !isSafeExternalUrl(catalogUrl))) {
    errors.catalogUrl = isFa
      ? 'لینک کاتالوگ باید با https:// یا http:// شروع شود.'
      : 'Catalog URL must be a valid http(s) link.';
  }

  if (input.certificates.length > 8) {
    errors.certificates = isFa
      ? 'حداکثر ۸ تصویر گواهینامه برای هر مصالح مجاز است.'
      : 'Up to 8 certificate images are allowed per material.';
  } else if (input.certificates.some((c) => !c.imageUrl?.trim() || !isSafeImageSrc(c.imageUrl))) {
    errors.certificates = isFa
      ? 'یکی از تصاویر گواهینامه آدرس معتبر ندارد.'
      : 'One or more certificate images have an invalid URL.';
  }

  if (!Number.isFinite(input.order) || input.order < 0 || input.order > 999) {
    errors.order = isFa
      ? 'ترتیب نمایش باید عددی بین ۰ تا ۹۹۹ باشد.'
      : 'Display order must be between 0 and 999.';
  }

  return errors;
}
