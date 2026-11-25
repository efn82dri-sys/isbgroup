import { ASSETS } from './assets';
import type {
  Course,
  Discipline,
  Insight,
  LabMetric,
  PartnerLogo,
  Project,
  SiteSettings,
  TeamMember,
} from '../types/content';

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  brandNameEn: 'ISB Group',
  brandNameFa: 'گروه ساختمانی پایدار ایران زمین',
  instagramUrl: 'https://www.instagram.com/isb.group/',
  linkedinUrl: 'https://www.linkedin.com/company/isb-sustainable/',
  youtubeUrl: '',
  telegramUrl: '',
  whatsappUrl: '',
  publicEmail: '',
  publicPhone: '09151213005 · 09339039563',
  studioCityEn: 'No. 170, Shahid Ghasemi 26, Farhang Blvd., Mashhad, Iran',
  studioCityFa: 'مشهد، بلوار فرهنگ، خیابان شهید قاسمی، شهید قاسمی ۲۶، پلاک ۱۷۰',
  hiddenSeedPartnerIds: [],
  hiddenSeedInsightSlugs: [],
  paymentInstructionsFa:
    'پس از ثبت سفارش، می‌توانید از طریق لینک درگاه پرداخت آنلاین (در صورت فعال بودن برای دوره) یا هماهنگی با دبیرخانه آموزشی ISB پرداخت خود را تکمیل کرده و کد پیگیری را در همین فرم یا پنل کاربری ثبت کنید تا دسترسی دوره بلافاصله فعال شود.',
  paymentInstructionsEn:
    'After creating your enrollment order, complete payment via the course online gateway link (when configured) or coordinate with the ISB Academy desk and submit your payment tracking reference here or in your Member Portal to unlock course access.',
};

export const DISCIPLINES: Discipline[] = [
  {
    slug: 'architecture-urbanism',
    indexLabel: '01',
    title: {
      en: 'Architecture & Urbanism',
      fa: 'معماری و شهرسازی',
    },
    shortSubtitle: {
      en: 'People · Place · City',
      fa: 'انسان · مکان · شهر',
    },
    cardSummary: {
      en: 'Architectural design, urban planning, and public spaces rooted in climate and human comfort.',
      fa: 'طراحی معماری، برنامه‌ریزی شهری و فضاهای عمومی متناسب با اقلیم و آسایش انسان.',
    },
    heroAnnotation: {
      en: 'Sculptural civic pavilion and human-scaled public realm shaped for daylight, microclimate, and movement.',
      fa: 'پاویون عمومی و فضاهای شهری انسان‌محور با تمرکز بر نور طبیعی، خرداقلیم و پیوند با محیط.',
    },
    coverImage: ASSETS.expertiseArchitecture,
    heroAnchor: {
      cardLeftPct: 33,
      cardTopPct: 41,
      targetX: 46,
      targetY: 59,
    },
    overview: {
      en: 'Our Architecture & Urbanism studio designs civic, residential, mixed-use, and public-realm projects where spatial quality, passive climate response, and structural clarity reinforce one another from concept through execution.',
      fa: 'استودیوی معماری و شهرسازی گروه ISB با نگاه یکپارچه به کیفیت فضایی، پاسخگویی اقلیمی غیرفعال و خوانایی ساختار، پروژه‌های عمومی، مسکونی، چندمنظوره و فضاهای شهری را از ایده تا اجرا طراحی می‌کند.',
    },
    scope: [
      {
        en: 'Masterplanning and climate-responsive urban frameworks',
        fa: 'طراحی جامع و چارچوب‌های شهرسازی اقلیم‌محور',
      },
      {
        en: 'Concept, schematic, and detailed architectural design',
        fa: 'طراحی معماری از کانسپت تا فاز یک و فاز دو اجرایی',
      },
      {
        en: 'Public spaces, urban parks, and pedestrian microclimate design',
        fa: 'طراحی فضاهای عمومی، پارک‌های شهری و بهبود خرداقلیم پیاده‌مدار',
      },
      {
        en: 'Envelope optimization coordinated directly with energy and structural engineers',
        fa: 'بهینه‌سازی پوسته بنا در هماهنگی مستقیم با مهندسان انرژی و سازه',
      },
    ],
    services: [
      {
        name: { en: 'Architectural Design', fa: 'طراحی معماری' },
        description: {
          en: 'Full-cycle architectural design for civic, administrative, residential, and mixed-use buildings tailored to site context and occupant comfort.',
          fa: 'طراحی کامل معماری ساختمان‌های اداری، عمومی، مسکونی و چندمنظوره متناسب با بستر سایت و آسایش کاربران.',
        },
      },
      {
        name: { en: 'Urban Planning & Masterplanning', fa: 'برنامه‌ریزی و طراحی شهری' },
        description: {
          en: 'Neighborhood frameworks, density distribution, walkable circulation networks, and mixed-use campus planning.',
          fa: 'تدوین چارچوب‌های توسعه محله‌ای، توزیع تراکم، شبکه‌های پیاده‌مدار و طراحی مجموعه‌های چندمنظوره.',
        },
      },
      {
        name: { en: 'Public-Space & Landscape Design', fa: 'طراحی فضاهای عمومی و منظر' },
        description: {
          en: 'Shaded promenades, urban parks, water-wise planting, and outdoor thermal comfort strategies for arid and semi-arid climates.',
          fa: 'طراحی مسیرهای سایه‌دار، پارک‌های شهری، پوشش گیاهی کم‌آب‌بر و راهکارهای آسایش حرارتی فضاهای باز در اقلیم‌های خشک و نیمه‌خشک.',
        },
      },
    ],
    deliverables: [
      { en: 'Site, climatic, and urban context analysis dossier', fa: 'گزارش تحلیل سایت، اقلیم و بستر شهری' },
      { en: 'Massing options with early solar and daylight studies', fa: 'گزینه‌های حجمی همراه با مطالعات اولیه تابش و نور روز' },
      { en: 'Coordinated architectural drawings & BIM models', fa: 'نقشه‌های معماری هماهنگ‌شده و مدل‌های BIM' },
      { en: 'Public-realm material, shading, and planting guidelines', fa: 'ضوابط مصالح، سایه‌اندازی و کاشت فضاهای عمومی' },
    ],
  },
  {
    slug: 'energy-mep',
    indexLabel: '02',
    title: {
      en: 'Energy & MEP',
      fa: 'انرژی و تأسیسات',
    },
    shortSubtitle: {
      en: 'Efficient Systems · Lower Emissions',
      fa: 'سیستم‌های کارآمد · کاهش انتشار کربن',
    },
    cardSummary: {
      en: 'Energy modeling, daylight analysis, and integrated mechanical and electrical building services design.',
      fa: 'مدل‌سازی انرژی، تحلیل نور روز و طراحی یکپارچه تأسیسات مکانیکی و الکتریکی ساختمان.',
    },
    heroAnnotation: {
      en: 'High-efficiency building services paired with rooftop solar generation and dynamic energy simulation.',
      fa: 'تأسیسات ساختمانی پربازده در کنار سامانه فتوولتاییک بام و شبیه‌سازی دینامیک انرژی.',
    },
    coverImage: ASSETS.expertiseEnergyMep,
    heroAnchor: {
      cardLeftPct: 48,
      cardTopPct: 16,
      targetX: 49,
      targetY: 41,
    },
    overview: {
      en: 'Our Energy & MEP specialists bridge building physics with practical mechanical, electrical, and plumbing engineering—lowering operational loads before sizing efficient, maintainable systems.',
      fa: 'متخصصان انرژی و تأسیسات گروه ISB فیزیک ساختمان را به طراحی کاربردی تأسیسات مکانیکی و الکتریکی پیوند می‌دهند تا پیش از انتخاب تجهیزات، بار حرارتی و برودتی بنا به‌طور اصولی کاهش یابد.',
    },
    scope: [
      {
        en: 'Dynamic thermal and whole-building energy modeling',
        fa: 'مدل‌سازی دینامیک حرارتی و شبیه‌سازی انرژی کل ساختمان',
      },
      {
        en: 'Daylight autonomy, glare control, and envelope thermal-bridge review',
        fa: 'تحلیل استقلال نور روز، کنترل خیرگی و بررسی پل‌های حرارتی پوسته',
      },
      {
        en: 'HVAC, plumbing, electrical, and renewable system integration',
        fa: 'طراحی تأسیسات تهویه مطبوع، آبرسانی، برق و یکپارچه‌سازی انرژی‌های تجدیدپذیر',
      },
      {
        en: 'Code compliance, operational carbon benchmarking, and commissioning support',
        fa: 'تطبیق با مقررات مبحث ۱۹ انرژی، پایش کربن بهره‌برداری و پشتیبانی راه‌اندازی',
      },
    ],
    services: [
      {
        name: { en: 'Building Energy Modeling', fa: 'مدل‌سازی انرژی ساختمان' },
        description: {
          en: 'Hourly energy simulations comparing envelope assemblies, glazing ratios, shading geometry, and HVAC strategies.',
          fa: 'شبیه‌سازی ساعتی انرژی برای مقایسه جداره‌ها، نسبت بازشوها، سایه‌بان‌ها و سیستم‌های تهویه مطبوع.',
        },
      },
      {
        name: { en: 'Daylight & Thermal Comfort Analysis', fa: 'تحلیل نور روز و آسایش حرارتی' },
        description: {
          en: 'Spatial Daylight Autonomy (sDA), Annual Sunlight Exposure (ASE), and adaptive thermal comfort diagnostics.',
          fa: 'ارزیابی شاخص استقلال نور روز (sDA)، کنترل تابش مستقیم و تحلیل آسایش حرارتی فضاهای داخلی و باز.',
        },
      },
      {
        name: { en: 'Mechanical & Electrical Services Design', fa: 'طراحی تأسیسات مکانیکی و الکتریکی' },
        description: {
          en: 'Right-sized HVAC plants, heat recovery, low-energy lighting, rooftop PV integration, and BMS coordination.',
          fa: 'طراحی موتورخانه‌ها و سیستم‌های تهویه بهینه، بازیافت حرارت، روشنایی کم‌مصرف، فتوولتاییک بام و مدیریت هوشمند ساختمان.',
        },
      },
    ],
    deliverables: [
      { en: 'Whole-building energy & carbon baseline comparison report', fa: 'گزارش مدل‌سازی انرژی و مقایسه با خط مبنا' },
      { en: 'Daylight and facade solar-radiation maps', fa: 'نقشه‌های تحلیل نور روز و تابش خورشیدی نما' },
      { en: 'HVAC, plumbing, and electrical engineering drawings & schedules', fa: 'نقشه‌ها و جداول مهندسی تأسیسات مکانیکی و الکتریکی' },
      { en: 'Renewable PV feasibility and sizing study', fa: 'مطالعه امکان‌سنجی و اندازه‌گیری سامانه فتوولتاییک' },
    ],
  },
  {
    slug: 'structure-seismic',
    indexLabel: '03',
    title: {
      en: 'Structure & Seismic',
      fa: 'سازه و مهندسی زلزله',
    },
    shortSubtitle: {
      en: 'Safe · Resilient · Durable',
      fa: 'ایمن · تاب‌آور · پایدار',
    },
    cardSummary: {
      en: 'Structural design, seismic assessment, and retrofit consulting for resilient buildings.',
      fa: 'طراحی سازه، ارزیابی لرزه‌ای و مشاوره بهسازی ساختمان‌های تاب‌آور.',
    },
    heroAnnotation: {
      en: 'Performance-based structural systems engineered for seismic safety, material efficiency, and long service life.',
      fa: 'سیستم‌های سازه‌ای مبتنی بر عملکرد با تمرکز بر ایمنی لرزه‌ای، بهینگی مصالح و دوام بلندمدت.',
    },
    coverImage: ASSETS.expertiseStructure,
    heroAnchor: {
      cardLeftPct: 78,
      cardTopPct: 18,
      targetX: 89,
      targetY: 42,
    },
    overview: {
      en: 'Our Structure & Seismic engineering team develops clear, material-conscious structural systems and conducts rigorous seismic evaluations and retrofit studies for new and existing structures in active seismic zones.',
      fa: 'تیم سازه و مهندسی زلزله گروه ISB سیستم‌های سازه‌ای شفاف و بهینه را برای پروژه‌های جدید طراحی کرده و ارزیابی‌های دقیق لرزه‌ای و طرح‌های مقاوم‌سازی را برای بناهای موجود در مناطق لرزه‌خیز ارائه می‌دهد.',
    },
    scope: [
      {
        en: 'Concrete, steel, and composite structural framing design',
        fa: 'طراحی سازه‌های بتنی، فولادی و مرکب با رویکرد بهینه‌سازی مصالح',
      },
      {
        en: 'Performance-based seismic design and nonlinear analysis',
        fa: 'طراحی لرزه‌ای مبتنی بر عملکرد و تحلیل‌های غیرخطی سازه',
      },
      {
        en: 'Seismic vulnerability assessment and structural retrofit consulting',
        fa: 'ارزیابی آسیب‌پذیری لرزه‌ای و مشاوره بهسازی و مقاوم‌سازی سازه‌ها',
      },
      {
        en: 'Coordination of architectural spans, MEP penetrations, and embodied carbon reduction',
        fa: 'هماهنگی دهانه‌های معماری، عبور تأسیسات و کاهش کربن نهفته سازه',
      },
    ],
    services: [
      {
        name: { en: 'Structural System Design', fa: 'طراحی سیستم سازه‌ای' },
        description: {
          en: 'Gravity and lateral-force-resisting systems engineered for constructability, architectural integration, and material efficiency.',
          fa: 'طراحی سیستم‌های باربر ثقلی و جانبی با تمرکز بر اجراپذیری، هماهنگی با معماری و مصرف بهینه مصالح.',
        },
      },
      {
        name: { en: 'Seismic Performance Assessment', fa: 'ارزیابی عملکرد لرزه‌ای' },
        description: {
          en: 'Code-based and performance-based seismic checks for critical administrative, institutional, and residential facilities.',
          fa: 'کنترل‌های لرزه‌ای آیین‌نامه‌ای و مبتنی بر عملکرد برای ساختمان‌های مهم اداری، عمومی و مسکونی.',
        },
      },
      {
        name: { en: 'Retrofit & Strengthening Consulting', fa: 'مشاوره بهسازی و مقاوم‌سازی' },
        description: {
          en: 'Diagnostic structural evaluation and targeted strengthening interventions for existing building stock.',
          fa: 'ارزیابی وضع موجود سازه‌ها و ارائه راهکارهای هدفمند بهسازی لرزه‌ای برای افزایش ایمنی و عمر مفید بنا.',
        },
      },
    ],
    deliverables: [
      { en: 'Structural concept comparison and framing selection memo', fa: 'گزارش مقایسه گزینه‌ها و انتخاب سیستم سازه‌ای' },
      { en: 'Analytical seismic models and calculation books', fa: 'مدل‌های تحلیلی لرزه‌ای و دفترچه‌های محاسبات' },
      { en: 'Detailed structural construction drawings and reinforcement schedules', fa: 'نقشه‌های اجرایی سازه و جزئیات اتصالات و آرماتوربندی' },
      { en: 'Seismic assessment and retrofit feasibility reports', fa: 'گزارش‌های ارزیابی آسیب‌پذیری و طرح بهسازی لرزه‌ای' },
    ],
  },
];

export const SEED_PROJECTS: Project[] = [
  {
    id: 'mehregan-residential-complex',
    slug: 'mehregan-residential-complex',
    titleEn: 'Mehregan Residential Complex',
    titleFa: 'مجتمع مسکونی مهرگان',
    cityEn: 'Dandanpezeshkan Blvd., Mashhad',
    cityFa: 'بلوار دندانپزشکان، مشهد',
    category: 'residential',
    serviceEn: 'Saro Gold · EC++ Rating',
    serviceFa: 'سرو طلایی · رده انرژی EC++',
    disciplines: ['energy-mep', 'architecture-urbanism'],
    year: '۱۴۰۳',
    roleEn:
      'Collaborating Architect: Noutash Naghsh Architecture Studio · Whole-building energy simulation & EC++ certification, thermal envelope, low-E glazing & shading optimization, Iran Green Building (Saro Sabz) Gold dossier, green roof, solar PV & water management.',
    roleFa:
      'معمار همکار: دفتر معماری نوتاش نقش · شبیه‌سازی انرژی و ارزیابی رده EC++، بهینه‌سازی پوسته، شیشه‌ها و سایبان‌ها، ارزیابی الزامات سرو سبز و تدوین مستندات، طراحی بام سبز، انرژی خورشیدی و مدیریت پایدار آب.',
    briefEn:
      'A high-performance residential complex on Dandanpezeshkan Boulevard in Mashhad engineered to achieve Iran’s Saro Sabz Gold Green Building Design Certificate (issued Khordad 1404 by the Road, Housing & Urban Development Research Center and National Land & Housing Organization) alongside an EC++ National Building Code Chapter 19 energy grade.',
    briefFa:
      'مجتمع مسکونی مهرگان در بلوار دندانپزشکان مشهد با هدف دستیابی به بالاترین استانداردهای ساختمان سبز ایران طراحی و تحلیل شد و موفق به اخذ گواهی «سرو طلایی» سامانه رتبه‌بندی ساختمان سبز ایران (صادره خرداد ۱۴۰۴ توسط مرکز تحقیقات راه، مسکن و شهرسازی و سازمان ملی زمین و مسکن) و رده انرژی EC++ گردید.',
    approachEn:
      'Eight coordinated passive and active interventions were modeled against the reference building: high-resistance envelope assemblies (roof R=3.677, exterior wall R=1.802 m²·K/W), low-E glazing (U=1.8 W/m²·K), solar shading, airtightness and thermal-bridge detailing, low-energy LED lighting, solar thermal water heating (13,965 kWh/yr, 29.76% coverage), rooftop photovoltaic array (11,076 kWh/yr), green roof, and greywater reuse.',
    approachFa:
      'در چارچوب هشت راهبرد یکپارچه طراحی پایدار شامل بهینه‌سازی مقاومت حرارتی پوسته (بام با R=3.677 و دیوار خارجی با R=1.802)، پنجره کم‌گسیل (U=1.8 W/m²·K)، کنترل تابش و سایبان، هوابندی و حذف پل‌های حرارتی، روشنایی کم‌مصرف، آبگرمکن خورشیدی، سلول فتوولتاییک بام و مدیریت پایدار آب، سناریوهای متعدد در برابر ساختمان مرجع شبیه‌سازی و بهینه‌سازی شدند.',
    coverImage: ASSETS.catalogue.mehreganCover,
    gallery: [ASSETS.catalogue.mehreganCert, ASSETS.catalogue.mehreganBoard],
    imageDisclosure: 'photograph',
    verifiedMetrics: [
      {
        label: { en: 'Iran Green Building Certificate', fa: 'گواهی ساختمان سبز ایران (سرو سبز)' },
        value: 'سرو طلایی · Gold',
        basis: {
          en: 'Official design certification · BHRC & NLHO (Khordad 1404)',
          fa: 'گواهی رسمی مرحله طراحی · مرکز تحقیقات راه، مسکن و شهرسازی (خرداد ۱۴۰۴)',
        },
      },
      {
        label: { en: 'National Code 19 Energy Grade', fa: 'رده انرژی مبحث نوزدهم' },
        value: 'EC++',
        basis: {
          en: 'Up to −40% heating load & −20% cooling load vs. reference building',
          fa: 'کاهش نیاز گرمایش تا ۴۰٪− و کاهش نیاز سرمایش تا ۲۰٪− نسبت به ساختمان مرجع',
        },
      },
      {
        label: { en: 'Solar Thermal Water Heating', fa: 'تولید انرژی آبگرمکن خورشیدی' },
        value: '13,965 kWh/yr',
        basis: {
          en: '6.28 kWh/m² annual yield · 29.76% domestic hot water coverage',
          fa: 'معادل ۶.۲۸ کیلووات‌ساعت بر متر مربع · پوشش ۲۹.۷۶٪ نیاز آب گرم',
        },
      },
      {
        label: { en: 'Rooftop Solar PV Generation', fa: 'تولید برق سلول فتوولتاییک' },
        value: '11,076 kWh/yr',
        basis: {
          en: '4.98 kWh/m² annual clean power · 4.7%–5.2% building electricity share',
          fa: 'معادل ۴.۹۸ کیلووات‌ساعت بر متر مربع · پوشش ۴.۷ تا ۵.۲٪ مصرف برق',
        },
      },
    ],
    featuredOrder: 1,
    status: 'published',
  },
  {
    id: 'crisis-management-building',
    slug: 'crisis-management-building',
    titleEn: 'Mashhad Governorate Crisis Management Building',
    titleFa: 'ساختمان مدیریت بحران استانداری مشهد',
    cityEn: 'Abadgaran Blvd., Mashhad',
    cityFa: 'بلوار آبادگران، مشهد',
    category: 'administrative',
    serviceEn: 'Energy Audit & Retrofit · EC+',
    serviceFa: 'ممیزی و بهینه‌سازی انرژی · EC+',
    disciplines: ['energy-mep', 'architecture-urbanism'],
    year: '۱۴۰۵',
    roleEn:
      'Collaborating Architect: Sarvestan Consulting Group · Existing envelope & HVAC systems review, baseline dynamic energy modeling, stepwise retrofit strategy identification, and quantified annual savings per measure.',
    roleFa:
      'معمار همکار: گروه مشاور سروستان · بررسی عملکرد حرارتی پوسته و سیستم‌های اصلی ساختمان، تهیه مدل پایه و تحلیل مصرف انرژی، شناسایی فرصت‌های کاهش مصرف انرژی و تعیین میزان صرفه‌جویی هر راهکار.',
    briefEn:
      'An institutional operations and crisis-coordination facility on Abadgaran Boulevard in Mashhad audited to achieve an EC+ energy rating and drastically cut annual heating and cooling demand while maintaining continuous operational reliability.',
    briefFa:
      'ساختمان مدیریت بحران استانداری مشهد در بلوار آبادگران با هدف ارتقای تاب‌آوری محیطی، کاهش چشمگیر بار گرمایش و سرمایش سالانه و دستیابی به رده انرژی EC+ مورد ممیزی جامع و شبیه‌سازی مرحله‌ای انرژی قرار گرفت.',
    approachEn:
      'A six-stage progressive optimization sequence was modeled from the 397.53 MWh/yr baseline: localized thermal-bridge remediation (388.01 MWh/yr), exterior wall insulation upgrade (382.63 MWh/yr), high-albedo reflective roof coating (374.25 MWh/yr), daylight-linked lighting controls (371.78 MWh/yr), exhaust heat recovery (360.37 MWh/yr), and economizer free cooling (212.61 MWh/yr).',
    approachFa:
      'در یک روند شش‌مرحله‌ای از مدل وضع موجود (۳۹۷.۵۳ مگاوات‌ساعت در سال)، اثر هر مداخله به‌صورت جداگانه محاسبه شد: اصلاح پل‌های حرارتی (۳۸۸.۰۱)، تقویت عایق پوسته دیوارها (۳۸۲.۶۳)، پوشش بازتابنده بام (۳۷۴.۲۵)، کنترل هوشمند روشنایی با نور روز (۳۷۱.۷۸)، بازیافت حرارت (۳۶۰.۳۷) و بهره‌گیری از سرمایش آزاد (۲۱۲.۶۱ مگاوات‌ساعت در سال).',
    coverImage: ASSETS.catalogue.crisisCover,
    gallery: [ASSETS.catalogue.crisisBoard],
    imageDisclosure: 'photograph',
    verifiedMetrics: [
      {
        label: { en: 'Total Annual Energy Reduction', fa: 'کاهش کل نیاز گرمایش و سرمایش' },
        value: '−46.52%',
        basis: {
          en: 'Verified cumulative savings vs. existing baseline (EC+ rating achieved)',
          fa: 'کاهش کل نیاز انرژی سالانه نسبت به وضع موجود با تحقق رده انرژی EC+',
        },
      },
      {
        label: { en: 'Baseline vs. Optimized Demand', fa: 'مقایسه مصرف وضع موجود و بهینه' },
        value: '397.5 → 212.6 MWh/yr',
        basis: {
          en: 'Stepwise reduction through envelope, cool roof, heat recovery & free cooling',
          fa: 'کاهش پله‌ای از ۳۹۷.۵۳ به ۲۱۲.۶۱ مگاوات‌ساعت در سال در ۶ گام اجرایی',
        },
      },
    ],
    featuredOrder: 2,
    status: 'published',
  },
  {
    id: 'kerman-sustainable-school',
    slug: 'kerman-sustainable-school',
    titleEn: "Kerman Boys' Primary School (Future Building)",
    titleFa: 'مدرسه ابتدایی پسرانه کرمان (با رویکرد انرژی و پایداری)',
    cityEn: 'Hot-Arid Central Plateau, Kerman',
    cityFa: 'اقلیم گرم و خشک فلات مرکزی، کرمان',
    category: 'educational',
    serviceEn: 'Integrated Energy Design · EC++',
    serviceFa: 'طراحی یکپارچه معماری و انرژی · EC++',
    disciplines: ['architecture-urbanism', 'energy-mep'],
    year: '۱۴۰۳',
    roleEn:
      'Design Lead: Zahra Ramezani & Associates · Integrated architecture & energy design, dynamic energy & thermal-comfort simulation, daylight & visual-comfort analysis (sDA/ASE), artificial lighting design (DIALux), and natural cross/stack ventilation modeling.',
    roleFa:
      'معمار و طراح: زهرا رمضانی و همکاران · طراحی یکپارچه معماری و انرژی (مسابقه ساختمان آینده)، شبیه‌سازی مصرف انرژی و آسایش حرارتی، ارزیابی نور روز و آسایش بصری، طراحی روشنایی مصنوعی (DIALux) و تحلیل تهویه طبیعی و جریان هوا.',
    briefEn:
      'A competition-designed sustainable primary school for Kerman’s hot-arid central plateau climate, uniting shaded green courtyards, atrium stack ventilation, calibrated classrooms, and EC++ whole-building energy performance.',
    briefFa:
      'مدرسه ابتدایی پسرانه کرمان (مسابقه ساختمان آینده) در اقلیم گرم و خشک فلات مرکزی با پیوند حیاط میانی و بام سبز، تهویه متقاطع و دودکشی آتریوم، کنترل دقیق تابش غرب و دستیابی به رده انرژی EC++ طراحی و ارزیابی شده است.',
    approachEn:
      'Architectural massing wraps around a planted central courtyard and green terraces to moderate microclimate temperatures, while vertical and horizontal louvers eliminate glare without sacrificing classroom daylight. Cross-ventilation in classrooms pairs with stack-effect airflow through the central atrium, complemented by DIALux-verified lighting uniformity.',
    approachFa:
      'توده‌گذاری بنا پیرامون حیاط میانی سبز و بام‌های گیاهی برای تعدیل خرداقلیم شکل گرفته و سایه‌بان‌های دقیق برای حذف خیرگی غرب همراه با نورگیری یکنواخت کلاس‌ها تنظیم شده‌اند. تحلیل دینامیک جریان هوا، تهویه متقاطع کلاس‌ها و دودکشی آتریوم مرکزی را هم‌زمان با ارزیابی کیفیت دید و روشنایی مصنوعی (DIALux) بهینه کرده است.',
    coverImage: ASSETS.catalogue.kermanSchoolCover,
    gallery: [ASSETS.catalogue.kermanSchoolBoard],
    imageDisclosure: 'photograph',
    verifiedMetrics: [
      {
        label: { en: 'Site Energy vs. Target (EC++)', fa: 'انرژی سایت نسبت به هدف (EC++)' },
        value: '63.82 kWh/m²·yr',
        basis: {
          en: '20.72% below the 80.50 kWh/m²·yr benchmark (source energy 150.57 vs. 161.11)',
          fa: '۲۰.۷۲٪ کمتر از مقدار هدف ۸۰.۵۰ کیلووات‌ساعت بر متر مربع (انرژی منبع ۱۵۰.۵۷)',
        },
      },
      {
        label: { en: 'Spatial Daylight Autonomy (sDA)', fa: 'استقلال نور روز (sDA)' },
        value: '93.08%',
        basis: {
          en: 'Glare-controlled annual sunlight exposure ASE = 9.49%',
          fa: 'بهره‌گیری حداکثری از نور طبیعی همراه با کنترل تابش مستقیم (ASE = ۹.۴۹٪)',
        },
      },
      {
        label: { en: 'Visual Quality & DIALux Lighting', fa: 'کیفیت دید و روشنایی مصنوعی' },
        value: '98.53%',
        basis: {
          en: 'Verified illuminance distribution across desks, boards, and teaching zones',
          fa: 'توزیع یکنواخت روشنایی تأییدشده در نرم‌افزار DIALux برای سطوح کار و تخته',
        },
      },
    ],
    featuredOrder: 3,
    status: 'published',
  },
  {
    id: 'behineh-sazan-toos-factory',
    slug: 'behineh-sazan-toos-factory',
    titleEn: 'Behineh Sazan Toos Energy Metering Factory',
    titleFa: 'کارخانه سنجش انرژی بهینه‌سازان توس',
    cityEn: 'Industrial Town, Mashhad',
    cityFa: 'شهرک صنعتی، مشهد',
    category: 'industrial',
    serviceEn: 'Energy & Daylight Simulation · EC+',
    serviceFa: 'شبیه‌سازی انرژی و نور روز · EC+',
    disciplines: ['energy-mep', 'architecture-urbanism'],
    year: '۱۴۰۴',
    roleEn:
      'Project Architect: Dr. Elham Mehrdoust · Whole-building energy simulation vs. reference model, National Code 19 energy rating (EC+), thermal-envelope & airtightness optimization, daylight analysis (sDA/ASE), and solar/thermal comfort guidelines.',
    roleFa:
      'معمار پروژه: دکتر الهام مهردوست · شبیه‌سازی انرژی و مقایسه ساختمان طرح با ساختمان مرجع، ارزیابی رده انرژی بر اساس الزامات مبحث ۱۹، تحلیل عملکرد حرارتی پوسته، پنجره‌ها و نفوذ هوا، و ارزیابی نور روز با شاخص‌های sDA و ASE.',
    briefEn:
      'An industrial headquarters and energy-metering manufacturing facility in Mashhad Industrial Town designed to reflect its energy-technology mission through an EC+ thermal envelope, calibrated natural daylighting, and controlled ventilation.',
    briefFa:
      'ساختمان اداری و تولیدی کارخانه سنجش انرژی بهینه‌سازان توس در شهرک صنعتی مشهد با هدف هم‌راستایی هویت فنی مجموعه با عملکرد واقعی انرژی، در چارچوب مبحث نوزدهم مقررات ملی و رده EC+ طراحی و شبیه‌سازی شده است.',
    approachEn:
      'Specified continuous thermal insulation across all envelope assemblies—extruded polystyrene roof with reflective top finish (U=0.46 W/m²·K, R=2.2), rockwool-insulated composite walls (U=0.62 W/m²·K, R=1.6), insulated ground slab (U=0.70 W/m²·K, R=1.43), and low-E glazing (SHGC=0.40, TV=0.60)—paired with smart lighting and solar energy readiness.',
    approachFa:
      'مشخصات حرارتی کل پوسته شامل بام با عایق پلی‌استایرن اکسترود شده و پوشش بازتابنده (U=0.46، R=2.2)، دیوار خارجی با پشم سنگ (U=0.62، R=1.6)، کف مجاور خاک عایق‌شده (U=0.70، R=1.43) و پنجره کم‌گسیل با SHGC=0.40 و TV=0.60 در کنار کنترل تابش و تهویه طبیعی بهینه‌سازی گردید.',
    coverImage: ASSETS.catalogue.behinehCover,
    gallery: [ASSETS.catalogue.behinehBoard],
    imageDisclosure: 'photograph',
    verifiedMetrics: [
      {
        label: { en: 'National Code 19 Rating', fa: 'رده انرژی (مبحث ۱۹)' },
        value: 'EC+',
        basis: {
          en: 'Verified against reference industrial/administrative baseline model',
          fa: 'تأییدشده در مقایسه دینامیک ساختمان طرح با ساختمان مرجع',
        },
      },
      {
        label: { en: 'Daylight Autonomy (sDA)', fa: 'استقلال نور طبیعی (sDA)' },
        value: '62%',
        basis: {
          en: 'Balanced daylight penetration with low-E glazing (SHGC 0.40 · TV 0.60)',
          fa: 'تأمین نور روز مطلوب در فضاهای کاری با پنجره کم‌گسیل (SHGC=0.40 و TV=0.60)',
        },
      },
      {
        label: { en: 'Optimized Envelope U-Values', fa: 'عملکرد حرارتی پوسته (U-Value)' },
        value: 'Roof 0.46 · Wall 0.62',
        basis: {
          en: 'W/m²·K with R=2.2 roof insulation & R=1.6 rockwool wall assembly',
          fa: 'وات بر متر مربع کلوین · بام R=2.2 و دیوار خارجی پشم سنگ R=1.6',
        },
      },
    ],
    featuredOrder: 4,
    status: 'published',
  },
  {
    id: 'farapanel-manufacturing-factory',
    slug: 'farapanel-manufacturing-factory',
    titleEn: 'Farapanel Manufacturing Plant',
    titleFa: 'کارخانه تولیدی فراپانل',
    cityEn: 'Razavi Industrial Town, Mashhad',
    cityFa: 'شهرک صنعتی رضوی، مشهد',
    category: 'industrial',
    serviceEn: 'DesignBuilder & Daylight · EC+',
    serviceFa: 'شبیه‌سازی DesignBuilder و نور روز · EC+',
    disciplines: ['energy-mep', 'architecture-urbanism'],
    year: '۱۴۰۳',
    roleEn:
      'Collaborating Architect: Mahsa Sedaghat & Associates · Dynamic energy modeling in DesignBuilder, sDA/ASE daylight evaluation, central green atrium & skylight performance, thermal envelope upgrades, and Code 19 scenario comparison.',
    roleFa:
      'معمار همکار: مهسا صداقت و همکاران · تحلیل و شبیه‌سازی مصرف انرژی با DesignBuilder، ارزیابی نور روز و شاخص‌های sDA و ASE، بررسی عملکرد آتریوم مرکزی، نورگیرهای سقفی و سایبان‌ها و مقایسه سناریوهای انطباق با مبحث ۱۹.',
    briefEn:
      'A modern panel-manufacturing facility in Mashhad’s Razavi Industrial Town incorporating a planted central atrium, controlled skylights, and vertical western louvers to deliver an EC+ industrial environment with abundant daylight.',
    briefFa:
      'کارخانه تولیدی فراپانل در شهرک صنعتی رضوی مشهد با ترکیب آتریوم سبز مرکزی، نورگیرهای سقفی کنترل‌شده و سایه‌بان‌های عمودی غرب، تعادل کم‌نظیری میان روشنایی طبیعی بالا و کاهش بار انرژی صنعتی ایجاد کرده است.',
    approachEn:
      'Evaluated multiple wall-insulation and glazing scenarios in DesignBuilder comparing baseline EC compliance against double-wall and thermal-mortar assemblies. High-reflectance roofing, insulated wall shells, controlled roof monitors, and vertical west-facade fins reduced total annual energy demand by 22% while delivering 77% sDA.',
    approachFa:
      'سناریوهای متعدد عایق‌کاری جداره (دیوارهای دوپوش و عایق حرارتی)، مصالح بازتابنده بام، کنترل تابش جبهه غرب با سایه‌بان‌های عمودی و ابعاد نورگیرهای سقفی در نرم‌افزار DesignBuilder مقایسه شد که به کاهش ۲۲ درصدی بار کل و دستیابی به استقلال نور روز ۷۷ درصد انجامید.',
    coverImage: ASSETS.catalogue.farapanelCover,
    gallery: [ASSETS.catalogue.farapanelAtrium, ASSETS.catalogue.farapanelBoard],
    imageDisclosure: 'photograph',
    verifiedMetrics: [
      {
        label: { en: 'Total Annual Energy Reduction', fa: 'کاهش بار کل انرژی (رده EC+)' },
        value: '−22%',
        basis: {
          en: 'Heating load −29% and cooling load −26% vs. reference model',
          fa: 'کاهش ۲۹٪ بار گرمایش و ۲۶٪ بار سرمایش نسبت به مدل مرجع مبحث ۱۹',
        },
      },
      {
        label: { en: 'Natural Daylight Performance', fa: 'تحلیل نور طبیعی (sDA / ASE)' },
        value: 'sDA 77% · ASE 15%',
        basis: {
          en: 'Central green atrium, controlled roof skylights & vertical west shading',
          fa: 'آتریوم مرکزی سبز، نورگیرهای سقفی بهینه و سایه‌بان‌های عمودی نما',
        },
      },
    ],
    featuredOrder: 5,
    status: 'published',
  },
  {
    id: 'farhang-residential-building',
    slug: 'farhang-residential-building',
    titleEn: 'Farhang Residential Building',
    titleFa: 'ساختمان مسکونی فرهنگ',
    cityEn: 'Farhang Blvd., Mashhad',
    cityFa: 'بلوار فرهنگ، مشهد',
    category: 'residential',
    serviceEn: 'Envelope & Code 19 · EC+',
    serviceFa: 'بهینه‌سازی پوسته و مبحث ۱۹ · EC+',
    disciplines: ['energy-mep', 'architecture-urbanism'],
    year: '۱۴۰۵',
    roleEn:
      'Collaborating Architect: Charsoo Architecture Group · Whole-building energy simulation, natural daylighting analysis, National Building Code Chapter 19 evaluation (EC+), and parametric comparison of insulating wall mortars.',
    roleFa:
      'معمار همکار: گروه معماری چارسو · شبیه‌سازی انرژی ساختمان، تحلیل روشنایی طبیعی، ارزیابی بر اساس مبحث ۱۹ مقررات ملی ساختمان و مقایسه سناریوهای پوسته و بهینه‌سازی عملکرد.',
    briefEn:
      'An urban residential building on Farhang Boulevard in Mashhad evaluated to quantify the real energy impact of exterior thermal-insulating mortar thicknesses, thermal-break windows, roof insulation, and thermal-bridge control.',
    briefFa:
      'ساختمان مسکونی فرهنگ در بلوار فرهنگ مشهد با تمرکز بر بهینه‌سازی دقیق لایه‌های جداره خارجی (ملات عایق حرارتی)، پنجره ترمال‌بریک، عایق بام، کنترل پل حرارتی و تأمین نور روز مناسب فضاها به رده انرژی EC+ دست یافت.',
    approachEn:
      'Modeled three exterior wall assemblies side by side: base wall without thermal mortar (70,615 kWh/yr), wall with 2 cm thermal-insulating mortar (59,433 kWh/yr, −15.8%), and wall with 3 cm thermal-insulating mortar (57,750 kWh/yr, −18.2%), paired with daylight autonomy mapping across residential rooms.',
    approachFa:
      'سه سناریوی دقیق برای جداره خارجی شامل دیوار بدون ملات عایق حرارتی (۷۰٬۶۱۵ کیلووات‌ساعت در سال)، دیوار با ملات عایق ۲ سانتی‌متری (۵۹٬۴۳۳ کیلووات‌ساعت، کاهش ۱۵.۸٪) و دیوار با ملات عایق ۳ سانتی‌متری (۵۷٬۷۵۰ کیلووات‌ساعت، کاهش ۱۸.۲٪) همراه با تحلیل نور روز مقایسه و انتخاب شد.',
    coverImage: ASSETS.catalogue.farhangCover,
    gallery: [ASSETS.catalogue.farhangBoard],
    imageDisclosure: 'photograph',
    verifiedMetrics: [
      {
        label: { en: '3 cm Thermal Mortar Savings', fa: 'کاهش بار کل (ملات عایق ۳ سانتی‌متر)' },
        value: '−18.2%',
        basis: {
          en: '57,750 kWh/yr vs. 70,615 kWh/yr uninsulated base wall (EC+ rating)',
          fa: 'کاهش مصرف سالانه از ۷۰٬۶۱۵ به ۵۷٬۷۵۰ کیلووات‌ساعت در سال (رده EC+)',
        },
      },
      {
        label: { en: '2 cm Thermal Mortar Scenario', fa: 'سناریوی ملات عایق ۲ سانتی‌متر' },
        value: '−15.8%',
        basis: {
          en: '59,433 kWh/yr annual load with thermal-break glazing & roof insulation',
          fa: '۵۹٬۴۳۳ کیلووات‌ساعت در سال در کنار پنجره ترمال‌بریک و کنترل پل حرارتی',
        },
      },
    ],
    featuredOrder: 6,
    status: 'published',
  },
  {
    id: 'yas-residential-building',
    slug: 'yas-residential-building',
    titleEn: 'Yas Residential Building',
    titleFa: 'ساختمان مسکونی یاس',
    cityEn: 'Yas Blvd., Mashhad',
    cityFa: 'بلوار یاس، مشهد',
    category: 'residential',
    serviceEn: 'Thermal Bridge & Code 19 · EC',
    serviceFa: 'تحلیل پل‌های حرارتی و مبحث ۱۹ · EC',
    disciplines: ['energy-mep'],
    year: '۱۴۰۵',
    roleEn:
      'Collaborating Partner: Sustainable Building Monitoring Institute · Energy simulation & Code 19 dossier (EC), finite-element thermal-bridge analysis (THERM) at parapets, balconies & slab edges, shading evaluation, and insulation detailing.',
    roleFa:
      'همکار پروژه: مؤسسه مدیریت پایش ساختمان پایدار · شبیه‌سازی انرژی و ارزیابی مبحث ۱۹، تحلیل انتقال حرارت و پل‌های حرارتی نما، اصلاح جزئیات اتصال دیوار و سقف، ارزیابی سایبان پنجره‌ها و تدوین دفترچه فنی مبحث ۱۹.',
    briefEn:
      'A residential building on Yas Boulevard in Mashhad where detailed two-dimensional heat-transfer modeling was deployed to resolve critical envelope thermal bridges at roof parapets, cantilevered balconies, slab edges, and base junctions.',
    briefFa:
      'ساختمان مسکونی یاس در بلوار یاس مشهد با تمرکز ویژه بر شناسایی و حذف پل‌های حرارتی بحرانی در لبه بام، اتصال بالکن، لبه دال طبقات و اتصال کف به پی، به‌صورت دقیق در نرم‌افزار THERM تحلیل و در چارچوب مبحث ۱۹ مستندسازی شد.',
    approachEn:
      'Produced an exploded facade heat-flux map paired with finite-element THERM temperature-distribution profiles (−18.5°C to +21.1°C) across structural junctions to specify continuous exterior insulation, low-E glazing, and controlled shading for Code 19 EC compliance.',
    approachFa:
      'با ترسیم نقشه تفکیکی مسیرهای اتلاف حرارت نما و تحلیل پروفیل دمایی اتصالات ساختاری در بازه ۱۸.۵− تا ۲۱.۱+ درجه سانتی‌گراد، جزئیات اجرایی پیوستگی عایق حرارتی، پنجره کم‌گسیل و سایه‌بان پنجره‌ها برای تحقق رده EC تدوین گردید.',
    coverImage: ASSETS.catalogue.yasCover,
    gallery: [ASSETS.catalogue.yasAxon, ASSETS.catalogue.yasBoard],
    imageDisclosure: 'photograph',
    verifiedMetrics: [
      {
        label: { en: 'National Code 19 Compliance', fa: 'رده انرژی مبحث نوزدهم' },
        value: 'EC',
        basis: {
          en: 'Full technical compliance dossier covering envelope & glazing specs',
          fa: 'تدوین کامل دفترچه فنی و مستندات انطباق با مبحث ۱۹ مقررات ملی',
        },
      },
      {
        label: { en: 'THERM Junction Analysis', fa: 'تحلیل پروفیل پل حرارتی (THERM)' },
        value: '−18.5°C → +21.1°C',
        basis: {
          en: '2D heat-flux diagnostics for parapet, balcony, slab-edge & base details',
          fa: 'مدل‌سازی دقیق لبه بام، اتصال بالکن، لبه دال و کف برای حذف نقاط میعان و اتلاف حرارت',
        },
      },
    ],
    featuredOrder: 7,
    status: 'published',
  },
  {
    id: 'vista-plaza-residential',
    slug: 'vista-plaza-residential',
    titleEn: 'Vista Plaza Residential Complex',
    titleFa: 'مجتمع مسکونی ویستا پلازا',
    cityEn: 'Namaz Blvd., Mashhad',
    cityFa: 'بلوار نماز، مشهد',
    category: 'residential',
    serviceEn: 'Climatic Massing & Energy',
    serviceFa: 'شبیه‌سازی انرژی و توده‌گذاری اقلیمی',
    disciplines: ['energy-mep', 'architecture-urbanism'],
    year: '۱۴۰۵',
    roleEn:
      'Collaborating Architect: Zistavin Consulting Group · Energy simulation vs. reference building, thermal envelope evaluation, and four-stage climatic massing optimization with ventilation canyon, stepped terraces, green roof & solar PV.',
    roleFa:
      'معمار همکار: گروه مشاور زیستاوین · شبیه‌سازی انرژی و مقایسه ساختمان طرح با ساختمان مرجع، تحلیل عملکرد حرارتی پوسته و تدوین راهبردهای چهارمرحله‌ای توده‌گذاری اقلیمی.',
    briefEn:
      'A twin-block green residential complex on Namaz Boulevard in Mashhad shaped through climate-driven massing moves that maximize natural ventilation, daylight penetration, planted roof retention, and renewable energy integration.',
    briefFa:
      'مجتمع مسکونی ویستا پلازا در بلوار نماز مشهد بر پایه چهار گام هوشمند توده‌گذاری اقلیمی شامل شکل‌گیری شکاف میانی تهویه، عقب‌نشینی پلکانی تراس‌ها، بام سبز و یکپارچه‌سازی پنل‌های خورشیدی طراحی و ارزیابی شده است.',
    approachEn:
      'Evolved the zoning envelope across four documented steps: site code volume, central split canyon for cross-ventilation and daylight access, stepped terraced facades with planted balconies, and an active eco-roof integrating photovoltaic panels, rainwater retention, and greywater recycling.',
    approachFa:
      'روند شکل‌گیری حجم از توده پایه و ضوابط سایت آغاز شده و با ایجاد شکاف میانی برای تهویه و دسترسی به نور طبیعی، عقب‌نشینی تراس‌های سبز و تجهیز بام به پنل خورشیدی، سامانه ذخیره آب باران و بازچرخانی آب خاکستری تکمیل شده است.',
    coverImage: ASSETS.catalogue.vistaPlazaCover,
    gallery: [ASSETS.catalogue.vistaPlazaBoard],
    imageDisclosure: 'photograph',
    featuredOrder: 8,
    status: 'published',
  },
  {
    id: 'banafsheh-park',
    slug: 'banafsheh-park',
    titleEn: 'Banafsheh Park',
    titleFa: 'پارک بنفشه',
    cityEn: 'Sajjad Blvd., Mashhad',
    cityFa: 'بلوار سجاد، مشهد',
    category: 'urban-park',
    serviceEn: 'Microclimate & Ecological Landscape',
    serviceFa: 'تحلیل پایداری محیطی و منظر اکولوژیک',
    disciplines: ['architecture-urbanism', 'energy-mep'],
    year: '۱۴۰۵',
    roleEn:
      'Collaborating Architect: Zistavin Consulting Group · Park redesign & landscape reorganization, environmental sustainability diagnostics, solar radiation & pedestrian thermal comfort mapping, prevailing wind analysis, and ecological guidelines.',
    roleFa:
      'معمار همکار: گروه مشاور زیستاوین · بازطراحی پارک و ساماندهی منظر، تحلیل‌های پایداری محیطی، ارزیابی تابش و آسایش حرارتی، تحلیل باد غالب مشهد و تهویه طبیعی، و ارائه راهکارهای طراحی اکولوژیک.',
    briefEn:
      'An urban neighborhood park on Sajjad Boulevard in Mashhad reimagined through quantitative microclimate mapping—radiation exposure, prevailing wind corridors, permeable water management, biodiversity planting, and urban heat-island mitigation.',
    briefFa:
      'بازطراحی پارک بنفشه در بلوار سجاد مشهد با تکیه بر تحلیل‌های کمی خرداقلیم شامل نقشه تابش خورشیدی و آسایش حرارتی، گلباد و جریان باد غالب مشهد، افزایش نفوذپذیری آب، تنوع زیستی و کاهش اثر جزیره حرارتی شهری انجام شده است.',
    approachEn:
      'Mapped Mashhad’s wind rose (peak gusts up to 18.50 m/s) alongside spatial solar radiation and airflow corridors to locate dense shade canopies, permeable paving, water-wise biodiversity zones, and socially inclusive gathering pockets.',
    approachFa:
      'با ترکیب تحلیل گلباد مشهد (تا سرعت ۱۸.۵۰ متر بر ثانیه)، نقشه تابش و آسایش حرارتی و مسیرهای تهویه طبیعی، شش راهبرد پایداری شامل مدیریت آب و نفوذپذیری سطح، افزایش پوشش گیاهی، کاهش جزیره حرارتی، مصالح پایدار و فضاهای سالم مشارکتی در طرح اعمال گردید.',
    coverImage: ASSETS.catalogue.banafshehCover,
    gallery: [ASSETS.catalogue.banafshehBoard],
    imageDisclosure: 'photograph',
    verifiedMetrics: [
      {
        label: { en: 'Prevailing Wind Analysis', fa: 'تحلیل گلباد و جریان هوای مشهد' },
        value: '0 – 18.50 m/s',
        basis: {
          en: 'Microclimate airflow corridors & solar radiation mapping across park zones',
          fa: 'شبیه‌سازی کریدورهای باد غالب، تابش و آسایش حرارتی پیاده در کل عرصه پارک',
        },
      },
      {
        label: { en: 'Ecological Design Pillars', fa: 'محورهای طراحی اکولوژیک' },
        value: '6 Strategies',
        basis: {
          en: 'Permeable water capture, biodiversity, heat-island reduction & sustainable paving',
          fa: 'مدیریت آب و نفوذپذیری، تنوع زیستی، آسایش حرارتی، تهویه طبیعی، مصالح پایدار و فضای سالم',
        },
      },
    ],
    featuredOrder: 9,
    status: 'published',
  },
  {
    id: 'arsh-residential-tower',
    slug: 'arsh-residential-tower',
    titleEn: 'Arsh Residential Tower',
    titleFa: 'برج مسکونی عرش',
    cityEn: 'Delavaran Blvd., Mashhad',
    cityFa: 'بلوار دلاوران، مشهد',
    category: 'residential',
    serviceEn: 'Daylight & Envelope Studies',
    serviceFa: 'روشنایی طبیعی و مطالعات پوسته',
    disciplines: ['energy-mep', 'architecture-urbanism'],
    year: '۱۴۰۵',
    roleEn:
      'Collaborating Partner: Emarat Hashtom Institute · Natural daylighting & artificial lighting evaluation, thermal envelope & thermal-bridge performance review, glazing & facade shading specifications, and optimization comparisons.',
    roleFa:
      'همکار پروژه: مؤسسه عمارت هشتم · ارزیابی روشنایی طبیعی و توزیع نور روز، تحلیل عملکرد حرارتی پوسته و پل‌های حرارتی، بررسی مشخصات شیشه و سایه‌اندازی نما و مقایسه سناریوهای بهینه‌سازی.',
    briefEn:
      'A high-rise residential tower on Delavaran Boulevard in Mashhad studied for balanced interior daylight distribution, high-altitude facade thermal performance, glazing selection, and exterior wall section integrity.',
    briefFa:
      'برج مسکونی عرش در بلوار دلاوران مشهد با هدف ارزیابی دقیق توزیع نور روز و روشنایی داخلی واحدها، کنترل عملکرد حرارتی پوسته در ارتفاع و انتخاب بهینه مشخصات شیشه و جزئیات نما مطالعه و تحلیل شده است.',
    approachEn:
      'Combined interior daylight/artificial lighting simulation with detailed multi-layer exterior wall sections and shading diagnostics to ensure uniform visual comfort and reduced facade heat transfer across upper residential floors.',
    approachFa:
      'ارزیابی هم‌زمان روشنایی طبیعی و مصنوعی در فضاهای داخلی واحدها در کنار تحلیل مقطع تفصیلی دیوار خارجی، مشخصات شیشه و سایه‌اندازی نما، مبنای مقایسه سناریوهای بهینه‌سازی عملکرد حرارتی برج قرار گرفت.',
    coverImage: ASSETS.catalogue.arshCover,
    gallery: [ASSETS.catalogue.arshBoard],
    imageDisclosure: 'photograph',
    featuredOrder: 10,
    status: 'published',
  },
  {
    id: 'alaleh-residential-complex',
    slug: 'alaleh-residential-complex',
    titleEn: 'Alaleh Residential Complex',
    titleFa: 'مجتمع مسکونی آلاله',
    cityEn: 'Samen District, Mashhad',
    cityFa: 'منطقه ثامن، مشهد',
    category: 'residential',
    serviceEn: 'Thermal Bridge Mitigation (THERM)',
    serviceFa: 'تحلیل و عایق‌کاری پل‌های حرارتی',
    disciplines: ['energy-mep'],
    year: '۱۴۰۵',
    roleEn:
      'Collaborating Partner: Maskan Shomal Shargh · Identification of facade structural thermal bridges (concrete columns, beams & slab edges), conceptual THERM diagnostics, and continuous envelope insulation detailing.',
    roleFa:
      'همکار پروژه: مسکن شمال شرق · شناسایی پل‌های حرارتی پوسته (ستون بتنی، تیر و لبه دال)، تحلیل جزئیات بحرانی و بررسی مفهومی THERM، عایق‌کاری پل‌های حرارتی و بررسی پیوستگی عایق حرارتی.',
    briefEn:
      'A multi-block residential complex in Mashhad’s Samen District audited specifically to pinpoint structural concrete thermal bridges across the facade grid and establish continuous exterior insulation details.',
    briefFa:
      'مجتمع مسکونی آلاله در منطقه ثامن مشهد در یک فرایند پنج‌مرحله‌ای تخصصی برای شناسایی نقاط بحرانی پل حرارتی در ستون‌ها، تیرها و لبه‌های دال بتنی و تضمین پیوستگی عایق حرارتی پوسته مورد بررسی قرار گرفت.',
    approachEn:
      'Mapped every linear and point thermal bridge on the residential elevation, evaluated critical column-wall and beam-slab junctions via conceptual THERM heat-flow modeling, and specified continuous wrap-around insulation details to minimize conductive heat loss.',
    approachFa:
      'در پنج گام منظم شامل شناسایی پل‌های حرارتی نما، تحلیل جزئیات بحرانی ستون بتنی و تیر و لبه دال، بررسی مفهومی THERM و ارائه جزئیات عایق‌کاری پیوسته، مسیرهای اتلاف حرارت پوسته اصلاح و بهینه‌سازی گردید.',
    coverImage: ASSETS.catalogue.alalehCover,
    gallery: [ASSETS.catalogue.alalehBoard],
    imageDisclosure: 'photograph',
    featuredOrder: 11,
    status: 'published',
  },
  {
    id: 'setayesh-residential-complex',
    slug: 'setayesh-residential-complex',
    titleEn: 'Setayesh Residential Complex',
    titleFa: 'مجتمع مسکونی ستایش',
    cityEn: 'Mashhad',
    cityFa: 'مشهد',
    category: 'residential',
    serviceEn: 'Architecture',
    serviceFa: 'معماری و طراحی اقلیم‌محور',
    disciplines: ['architecture-urbanism'],
    roleEn: 'Architectural design, spatial organization, and climate-conscious residential facade articulation.',
    roleFa: 'طراحی معماری، سازماندهی فضایی واحدها و طراحی نمای اقلیم‌محور مسکونی.',
    briefEn:
      'A contemporary residential complex in Mashhad focused on daylit living spaces, private shaded balconies, and quiet courtyard transitions between city streets and homes.',
    briefFa:
      'مجتمع مسکونی معاصر در مشهد با تمرکز بر نورگیری مطلوب فضاهای سکونت، بالکن‌های سایه‌دار خصوصی و سلسله‌مراتب آرام میان فضای شهری و واحدها.',
    approachEn:
      'Organized residential plans to balance solar orientation, privacy, and cross-ventilation while articulating deep recessed stone facades that moderate summer heat gain.',
    approachFa:
      'سازماندهی پلان واحدها برای تعادل میان جهت‌گیری خورشیدی، محرمیت و تهویه طبیعی همراه با نمای سنگی فرورفته برای کنترل بار حرارتی تابستان.',
    coverImage: ASSETS.projectSetayesh,
    imageDisclosure: 'concept',
    featuredOrder: 12,
    status: 'published',
  },
];

export const SEED_INSIGHTS: Insight[] = [
  {
    id: 'passive-daylight-code19-mashhad',
    slug: 'passive-daylight-code19-mashhad',
    titleFa: 'طراحی اقلیم‌محور، نور روز و دستیابی به رده انرژی EC++ در اقلیم نیمه‌خشک مشهد',
    titleEn: 'Climate-Responsive Daylight & Achieving Code 19 EC++ in Mashhad’s Semi-Arid Climate',
    subtitleFa:
      'چگونه یکپارچه‌سازی معماری غیرفعال، تحلیل ساعتی پوسته و مدل‌سازی نور روز، مصرف انرژی مجتمع‌های مسکونی را تا بیش از ۶۰ درصد کاهش می‌دهد.',
    subtitleEn:
      'How passive envelope geometry, hourly thermal simulation, and calibrated daylighting cut residential energy intensity by over 60%.',
    excerptFa:
      'بررسی فنی تجربه گروه ISB در هم‌افزایی طراحی پوسته، سایه‌اندازی پارامتریک، کنترل پل‌های حرارتی و اخذ گواهی سرو طلایی در پروژه‌های مسکونی مشهد.',
    excerptEn:
      'A technical field monograph from ISB Sustainability Lab examining envelope glazing ratios, passive shading, thermal bridge elimination, and Saro Gold certification in Mashhad.',
    bodyFa:
      'در اقلیم نیمه‌خشک و دارای نوسان دمایی شدید مشهد، دستیابی هم‌زمان به آسایش حرارتی تابستانه و بهره‌گیری از گرمایش خورشیدی زمستانه تنها از مسیر افزایش ضخامت عایق ممکن نیست. تجربه پروژه‌های مسکونی گروه ISB نشان می‌دهد تصمیمات کلیدی در فاز طراحی معماری — شامل نسبت سطح پنجره به دیوار (WWR)، عمق پیش‌آمدگی بالکن‌ها و حذف پل‌های حرارتی — بیش از نیمی از پتانسیل کاهش بار انرژی را تعیین می‌کنند.',
    bodyEn:
      'In Mashhad’s semi-arid climate with wide diurnal swings, achieving summer thermal comfort alongside winter passive solar gain requires more than thicker insulation alone. ISB Group project telemetry confirms that early architectural decisions—window-to-wall ratio, recessed shading depth, and thermal-bridge detailing—unlock over half of total energy savings.',
    topic: 'sustainability-lab',
    publishedDate: '2026-09-14',
    coverImage: ASSETS.catalogue.mehreganCover,
    coverCaptionFa: 'نمای اقلیم‌محور مجتمع مسکونی مهرگان — برنده گواهی ساختمان سبز سرو طلایی و رده انرژی EC++',
    coverCaptionEn: 'Climate-responsive facade of Mehregan Residential Complex — Saro Gold & Code 19 EC++ certified.',
    authorFa: 'دکتر سارا آتشی گلستان',
    authorEn: 'Dr. Sara Atashi Golestan',
    authorRoleFa: 'مدیرعامل و رئیس دپارتمان انرژی گروه ISB',
    authorRoleEn: 'CEO & Head of Energy Department, ISB Group',
    readingTimeMinutes: 6,
    featured: true,
    tagsFa: ['مبحث ۱۹', 'سرو طلایی', 'رده انرژی EC++', 'نور روز'],
    tagsEn: ['Code 19', 'Saro Gold', 'EC++ Rating', 'Daylighting'],
    status: 'published',
    isSeedDefault: true,
    blocks: [
      {
        id: 'sec-context',
        type: 'section-heading',
        kickerFa: 'فصل اول · تحلیل اقلیم و چالش انرژی',
        kickerEn: 'CHAPTER 01 · CLIMATE & ENERGY BASELINE',
        headingFa: 'چرا پوسته ساختمان مهم‌ترین ابزار کنترل مصرف انرژی در مشهد است؟',
        headingEn: 'Why the Building Envelope Drives Energy Performance in Mashhad',
      },
      {
        id: 'txt-lead',
        type: 'rich-text',
        leadStyle: true,
        bodyFa:
          'در پروژه‌های مسکونی متعارف، بخش قابل توجهی از اتلاف حرارتی زمستانه و بار تابشی تابستانه نه از سیستم‌های تأسیساتی، بلکه از **ناهمخوانی هندسه نما با زاویه تابش خورشید** و وجود **پل‌های حرارتی در لبه سقف‌ها و قاب پنجره‌ها** ناشی می‌شود.\n\nدر رویکرد یکپارچه آزمایشگاه پایداری ISB، پیش از نهایی شدن پلان و نمای فاز یک، مدل تحلیلی ساعتی ساختمان (۸۷۶۰ ساعت در سال) برای ارزیابی هم‌زمان سه متغیر اجرا می‌شود:\n- کنترل بار سرمایشی تابستان از طریق سایه‌بان‌های افقی و بالکن‌های فرورفته\n- بهینه‌سازی **استقلال مکانی نور روز (sDA)** بدون ایجاد خیرگی حرارتی\n- یکپارچگی عایق حرارتی پیوسته برای حذف کامل پل‌های حرارتی سازه‌ای',
        bodyEn:
          'In conventional residential developments, excessive winter heat loss and summer cooling spikes rarely stem from HVAC equipment alone—they originate from **uncalibrated facade geometry** and **structural thermal bridges** at slab edges.\n\nWithin the ISB Sustainability Lab workflow, an 8,760-hour annual dynamic model is run before schematic design freeze to co-optimize three linked variables:\n- Summer solar heat-gain suppression via recessed balconies and horizontal overhangs\n- Calibrated **Spatial Daylight Autonomy (sDA)** without glare penalties\n- Continuous exterior thermal insulation eliminating slab-edge bridging',
      },
      {
        id: 'tg-mehregan',
        type: 'telegram-media-post',
        headingFa: 'مطالعه موردی مجتمع مهرگان: از شبیه‌سازی تا گواهی سرو طلایی',
        headingEn: 'Mehregan Case Dossier: From Dynamic Simulation to Saro Gold',
        mediaLayout: 'mosaic',
        textPosition: 'below',
        media: [
          {
            url: ASSETS.catalogue.mehreganCover,
            captionFa: 'نمای جنوبی با پیش‌آمدگی محاسبه‌شده برای کنترل تابش تیرماه و ورود خورشید دی‌ماه',
            captionEn: 'South facade calibrated for July shade and January passive solar gain',
          },
          {
            url: ASSETS.catalogue.mehreganBoard,
            captionFa: 'شیت تحلیل انرژی، مقایسه بار حرارتی و نمودارهای کاهش مصرف سالانه',
            captionEn: 'Energy performance board comparing baseline vs. optimized annual loads',
          },
          {
            url: ASSETS.catalogue.mehreganCert,
            captionFa: 'گواهی رسمی ساختمان سبز «سرو طلایی» صادرشده بر پایه عملکرد واقعی پروژه',
            captionEn: 'Official Saro Gold Green Building certificate verified on project performance',
          },
        ],
        bodyFa:
          'در مجموعه تصاویر بالا، زنجیره کامل طراحی مبتنی بر شواهد در **مجتمع مسکونی مهرگان** دیده می‌شود. با بازطراحی نسبت بازشوهای شرقی و غربی، انتخاب شیشه‌های دوجداره با پوشش *Low-E* و پیاده‌سازی دیتیل‌های بدون پل حرارتی، پروژه توانست علاوه بر عبور کامل از الزامات سخت‌گیرانه **مبحث نوزدهم مقررات ملی ساختمان**، به رده انرژی **EC++** و گواهی معتبر **سرو طلایی** دست یابد.',
        bodyEn:
          'The curated frames above trace the evidence-led delivery of **Mehregan Residential Complex**. By tuning east/west glazing ratios, specifying *Low-E* double glazing, and detailing continuous thermal-break junctions, the building surpassed Iran’s **National Building Code Chapter 19** benchmark to earn both an **EC++** energy label and **Saro Gold** certification.',
      },
      {
        id: 'metrics-ecpp',
        type: 'key-metrics',
        headingFa: 'نتایج اندازه‌گیری‌شده در مدل تحلیلی و ارزیابی نهایی',
        headingEn: 'Verified Performance Benchmarks',
        metrics: [
          {
            value: 'EC++',
            unit: 'مبحث ۱۹',
            labelFa: 'رده برچسب انرژی ساختمان',
            labelEn: 'National Code 19 Energy Class',
          },
          {
            value: '۶۲٪',
            unit: 'کاهش EUI',
            labelFa: 'صرفه‌جویی مصرف انرژی سالانه',
            labelEn: 'Annual Energy Intensity Reduction',
          },
          {
            value: '۷۴٪',
            unit: 'sDA 300/50%',
            labelFa: 'پوشش مطلوب نور طبیعی روز',
            labelEn: 'Useful Natural Daylight Coverage',
          },
          {
            value: 'سرو طلایی',
            unit: 'BHRC',
            labelFa: 'رتبه‌بندی ساختمان سبز',
            labelEn: 'Green Building Certification',
          },
        ],
      },
      {
        id: 'sec-workflow',
        type: 'section-heading',
        kickerFa: 'فصل دوم · هم‌افزایی معماری و تأسیسات',
        kickerEn: 'CHAPTER 02 · INTEGRATED ARCHITECTURE & MEP',
        headingFa: 'تأثیر مستقیم بهینه‌سازی پوسته بر کوچک‌سازی ظرفیت تأسیسات',
        headingEn: 'Right-Sizing HVAC Systems Through Envelope Optimization',
      },
      {
        id: 'split-lab',
        type: 'text-image-split',
        splitSide: 'start',
        headingFa: 'مدل‌سازی هم‌زمان نور روز، تهویه و بار اوج سرمایش',
        headingEn: 'Co-Simulating Daylight, Ventilation & Peak Cooling Loads',
        media: [
          {
            url: ASSETS.labAxonometric,
            captionFa: 'دیاگرام آکسونومتریک تحلیل مسیر خورشید، جریان هوا و لایه‌های حرارتی پوسته در آزمایشگاه ISB',
            captionEn: 'ISB Lab axonometric diagram mapping solar paths, airflow, and thermal envelope zones',
          },
        ],
        bodyFa:
          'یکی از دستاوردهای اقتصادی مهم در طراحی پایدار، **کاهش هزینه اولیه خرید تجهیزات مکانیکی** است. زمانی که بار اوج سرمایش و گرمایش در پوسته کنترل شود:\n- ظرفیت چیلر، بویلر و داکت‌اسپلیت‌ها تا **۳۰ تا ۴۰ درصد** کاهش می‌یابد\n- فضای اشغال‌شده توسط کانال‌کشی و موتورخانه بهینه‌تر می‌شود\n- هزینه بهره‌برداری و قبض انرژی ساکنین در طول چرخه عمر ۵۰ ساله ساختمان به‌طور چشمگیری افت می‌کند',
        bodyEn:
          'A frequently overlooked capital benefit of passive envelope engineering is **mechanical right-sizing**. Once peak envelope gains are suppressed:\n- Cooling and heating plant capacity drops by **30–40%**\n- Mechanical room footprints and ducting chases shrink cleanly\n- Lifecycle utility expenses fall dramatically across a 50-year operating horizon',
      },
      {
        id: 'callout-code19',
        type: 'callout',
        tone: 'standard',
        headingFa: 'نکته کلیدی اجرایی · مبحث نوزدهم مقررات ملی ساختمان',
        headingEn: 'Technical Compliance Note · National Code Chapter 19',
        bodyFa:
          'دستیابی به رده انرژی **EC+** و **EC++** صرفاً با تغییر مصالح در مرحله نازک‌کاری ممکن نیست. بهترین زمان ورود تیم بهینه‌سازی انرژی، **پیش از نهایی شدن نقشه‌های معماری فاز یک** است تا هزینه اصلاح جزئیات به حداقل و بازگشت سرمایه به حداکثر برسد.',
        bodyEn:
          'Reaching **EC+** or **EC++** performance cannot be retrofitted cleanly at finishing stage. Engaging the energy simulation team **prior to Phase 1 architectural sign-off** minimizes redesign cost and maximizes lifecycle ROI.',
      },
      {
        id: 'quote-closing',
        type: 'quote',
        bodyFa:
          'ساختمان پایدار واقعی، ساختمانی نیست که با تجهیزات گران‌قیمت به زور خنک یا گرم شود؛ بلکه معماری هوشمندی است که با اقلیم خود به تعادل می‌رسد.',
        bodyEn:
          'A truly sustainable building is not forced into comfort by oversized machinery—it is architecture calibrated in quiet equilibrium with its climate.',
        attributionFa: 'دکتر سارا آتشی گلستان · آزمایشگاه پایداری گروه ISB',
        attributionEn: 'Dr. Sara Atashi Golestan · ISB Sustainability Lab',
      },
    ],
  },
  {
    id: 'integrated-atrium-industrial-sustainability',
    slug: 'integrated-atrium-industrial-sustainability',
    titleFa: 'معماری صنعتی پایدار: هم‌افزایی نورگیری سقفی، پوسته عایق و سازه در فضاهای تولیدی',
    titleEn: 'Sustainable Industrial Architecture: Daylit Atriums, Insulated Envelopes & Structural Clarity',
    subtitleFa:
      'مروری بر راهکارهای کاهش مصرف برق روشنایی و کنترل آسایش حرارتی در کارخانجات و مجتمع‌های تولیدی مدرن.',
    subtitleEn:
      'Practical engineering strategies for cutting lighting electricity and stabilizing indoor comfort in modern production facilities.',
    excerptFa:
      'چگونه در پروژه‌های صنعتی نظیر کارخانجات فراپانل و بهینه‌سازان توس، طراحی آتریوم مرکزی، نورگیری کنترل‌شده و پوسته با مقاومت حرارتی بالا بهره‌وری محیط کار را متحول می‌کند.',
    excerptEn:
      'How central daylit atriums, glare-controlled skylights, and high-resistance envelopes transformed industrial performance across Farapanel and Behineh Sazan Toos.',
    bodyFa:
      'ساختمان‌های صنعتی معمولاً به عنوان مصرف‌کنندگان سنگین انرژی روشنایی و تهویه شناخته می‌شوند. با این حال، تلفیق مهندسی سازه با طراحی معماری اقلیمی و نورگیری طبیعی سقفی می‌تواند مصرف برق روزانه سالن‌ها و بخش‌های اداری را به شکل محسوسی کاهش داده و کیفیت محیط کار مهندسین و پرسنل را ارتقا دهد.',
    bodyEn:
      'Industrial facilities are traditionally among the heaviest consumers of daytime lighting and conditioning energy. Yet integrating structural geometry with calibrated roof daylighting and high-performance insulated cladding drastically lowers operational energy while elevating workplace quality.',
    topic: 'architecture',
    publishedDate: '2026-08-22',
    coverImage: ASSETS.catalogue.farapanelCover,
    coverCaptionFa: 'نمای ورودی و آتریوم نورگیر مجموعه صنعتی فراپانل — طراحی یکپارچه معماری و انرژی',
    coverCaptionEn: 'Entrance volume and daylit atrium of Farapanel Industrial Complex — integrated architecture & energy design.',
    authorFa: 'دکتر الهام مهردوست',
    authorEn: 'Dr. Elham Mehrdoust',
    authorRoleFa: 'عضو هیئت مدیره و معمار ارشد گروه ISB',
    authorRoleEn: 'Board Member & Senior Architect, ISB Group',
    readingTimeMinutes: 5,
    featured: false,
    tagsFa: ['معماری صنعتی', 'آتریوم نورگیر', 'طراحی یکپارچه', 'بهره‌وری انرژی'],
    tagsEn: ['Industrial Architecture', 'Daylit Atrium', 'Integrated Design', 'Energy Efficiency'],
    status: 'published',
    isSeedDefault: true,
    blocks: [
      {
        id: 'sec-ind-1',
        type: 'section-heading',
        kickerFa: 'فصل اول · رویکرد معماری در فضاهای صنعتی',
        kickerEn: 'CHAPTER 01 · INDUSTRIAL HUMAN-CENTERED DESIGN',
        headingFa: 'فراتر از یک سوله: تبدیل فضاهای اداری و تولیدی به محیط‌های سالم و کم‌مصرف',
        headingEn: 'Beyond the Warehouse: Healthy, Low-Energy Industrial Environments',
      },
      {
        id: 'tg-industrial-4',
        type: 'telegram-media-post',
        headingFa: 'گزارش تصویری تطبیقی پروژه‌های صنعتی گروه ISB',
        headingEn: 'Comparative Visual Dossier: ISB Industrial Portfolio',
        mediaLayout: 'mosaic',
        textPosition: 'above',
        bodyFa:
          'در دو پروژه شاخص **کارخانه فراپانل** و **کارخانه بهینه‌سازان توس**، تیم معماری و انرژی گروه ISB نشان داد که فضاهای صنعتی نیز می‌توانند از **نور طبیعی یکنواخت، آتریوم‌های تعاملی و پوسته‌های عایق دقیق** بهره‌مند شوند. در گالری زیر، پیوند میان فرم معماری، نورگیری مرکزی و شیت‌های تحلیل عملکردی را مشاهده می‌کنید:',
        bodyEn:
          'Across two flagship commissions—**Farapanel Manufacturing** and **Behineh Sazan Toos**—ISB’s architecture and energy teams demonstrated how industrial buildings can achieve **glare-free daylight, civic-grade atriums, and high-efficiency envelopes**. Explore the four frames below:',
        media: [
          {
            url: ASSETS.catalogue.farapanelCover,
            captionFa: 'حجم‌سازی خوانا و کنترل تابش در جبهه اصلی کارخانه فراپانل',
            captionEn: 'Articulated massing and solar control on the main Farapanel facade',
          },
          {
            url: ASSETS.catalogue.farapanelAtrium,
            captionFa: 'آتریوم مرکزی با نورگیری طبیعی سقفی و ارتباط بصری طبقات اداری',
            captionEn: 'Central top-lit atrium linking administrative levels with natural daylight',
          },
          {
            url: ASSETS.catalogue.behinehCover,
            captionFa: 'پوسته صنعتی عایق و خوانایی عملکردی در مجموعه بهینه‌سازان توس',
            captionEn: 'Insulated industrial envelope at Behineh Sazan Toos facility',
          },
          {
            url: ASSETS.catalogue.farapanelBoard,
            captionFa: 'مستندات تحلیل پایداری و دیاگرام‌های جریان نور و حرارت پروژه',
            captionEn: 'Sustainability documentation mapping daylight and thermal flows',
          },
        ],
      },
      {
        id: 'metrics-ind',
        type: 'key-metrics',
        headingFa: 'شاخص‌های کلیدی در طراحی صنعتی پایدار',
        headingEn: 'Core Industrial Performance Indicators',
        metrics: [
          {
            value: '۴۵٪+',
            unit: 'روشنایی روز',
            labelFa: 'کاهش مصرف برق روشنایی روزانه',
            labelEn: 'Daytime Lighting Load Reduction',
          },
          {
            value: 'BIM',
            unit: 'هماهنگی ۳ رشته',
            labelFa: 'تلفیق معماری، سازه و تأسیسات',
            labelEn: 'Architecture, Structure & MEP Sync',
          },
          {
            value: '۲۴/۷',
            unit: 'تاب‌آوری',
            labelFa: 'پایداری دمایی سالن و بخش اداری',
            labelEn: 'Thermal Stability Across Shifts',
          },
        ],
      },
      {
        id: 'callout-ind',
        type: 'callout',
        tone: 'highlight',
        headingFa: 'پیشنهاد اجرایی برای کارفرمایان شهرک‌های صنعتی',
        headingEn: 'Practical Takeaway for Industrial Developers',
        bodyFa:
          'هزینه اجرای نورگیرهای جهت‌دار شمالی و ساندویچ‌پنل‌های با دیتیل هوابندی استاندارد کمتر از **۳ درصد** کل هزینه ساخت است، اما در کمتر از **۲٫۵ سال** از طریق کاهش هزینه برق و گاز و افزایش راندمان کاری پرسنل بازگشت سرمایه کامل دارد.',
        bodyEn:
          'North-facing roof monitors and airtight insulated envelope detailing typically represent under **3%** of total construction cost while delivering full payback in under **2.5 years** via energy savings and occupant productivity.',
      },
    ],
  },
];

export const SEED_TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'sara-atashi-golestan',
    nameFa: 'دکتر سارا آتشی گلستان',
    nameEn: 'Dr. Sara Atashi Golestan',
    roleFa: 'مدیرعامل و رئیس دپارتمان انرژی',
    roleEn: 'Chief Executive Officer & Head of Energy Department',
    discipline: 'leadership',
    tier: 'ceo',
    portraitUrl: ASSETS.catalogue.saraAtashi,
    bioFa:
      'پژوهشگر و مدرس معماری پایدار، مقررات ملی و بهینه‌سازی انرژی ساختمان؛ عضو شورای سیاست‌گذاری توسعه ساختمان سبز و پایدار مرکز تحقیقات راه، مسکن و شهرسازی.',
    bioEn:
      'Researcher and lecturer in sustainable architecture, national building energy codes, and building energy optimization; member of the Green & Sustainable Building Policy Council at Iran’s Road, Housing & Urban Development Research Center (BHRC).',
    specialtiesFa: 'معماری پایدار، مبحث نوزدهم مقررات ملی، گواهی سرو سبز، بهینه‌سازی انرژی ساختمان',
    specialtiesEn: 'Sustainable Architecture, National Code 19, Saro Sabz Certification, Building Energy Optimization',
    resumeFa:
      '• مدیرعامل گروه ساختمانی پایدار ایران زمین (ISB) و رئیس دپارتمان انرژی\n• عضو شورای سیاست‌گذاری توسعه ساختمان سبز و پایدار مرکز تحقیقات راه، مسکن و شهرسازی\n• پژوهشگر و مدرس تخصصی مبحث نوزدهم مقررات ملی ساختمان و طراحی معماری پایدار\n• راهبر علمی پروژه‌های دارای گواهی سرو طلایی و رده انرژی EC++ در مشهد و کشور',
    resumeEn:
      '• Chief Executive Officer of Iran Zamin Sustainable Building Group (ISB) & Head of Energy Department\n• Member of the Green & Sustainable Building Policy Council, Road, Housing & Urban Development Research Center (BHRC)\n• Researcher and national instructor on Building Energy Conservation Code (Chapter 19) & sustainable architecture\n• Technical lead on Saro Gold certified and EC++ high-performance projects across Mashhad and Iran',
    order: 1,
    status: 'published',
    isSeedDefault: true,
  },
  {
    id: 'elham-mehrdoust',
    nameFa: 'دکتر الهام مهردوست',
    nameEn: 'Dr. Elham Mehrdoust',
    roleFa: 'عضو هیئت مدیره · معمار ارشد و پژوهشگر معماری',
    roleEn: 'Board Member · Senior Architect & Architectural Researcher',
    discipline: 'architecture-urbanism',
    tier: 'board',
    bioFa:
      'متخصص حوزه پژوهش‌های معماری، هویت و الگوهای معماری ایران و معمار پروژه‌های شاخص صنعتی و ساختمانی مجموعه.',
    bioEn:
      'Specialist in architectural research, Iranian architectural identity and typologies, and lead architect on flagship industrial and building projects.',
    specialtiesFa: 'طراحی معماری، پژوهش‌های معماری، هویت و الگوهای معماری ایران',
    specialtiesEn: 'Architectural Design, Architectural Research, Iranian Architectural Identity & Patterns',
    resumeFa:
      '• عضو هیئت مدیره و راهبر ارشد معماری در گروه ساختمانی پایدار ایران زمین\n• متخصص حوزه پژوهش‌های معماری، هویت و الگوهای بومی معماری ایران\n• معمار پروژه کارخانه سنجش انرژی بهینه‌سازان توس (شهرک صنعتی مشهد، رده انرژی EC+)',
    resumeEn:
      '• Board Member and senior architecture lead at ISB Group\n• Researcher in architectural identity and vernacular spatial patterns of Iran\n• Lead architect of Behineh Sazan Toos Energy Metering Factory (Mashhad Industrial Town, EC+ rating)',
    order: 2,
    status: 'published',
    isSeedDefault: true,
  },
  {
    id: 'hamid-erfanian',
    nameFa: 'مهندس حمید عرفانیان',
    nameEn: 'Eng. Hamid Erfanian',
    roleFa: 'عضو هیئت مدیره · معمار ارشد، تکنولوژی ساخت و ساختمان‌های سبز',
    roleEn: 'Board Member · Senior Architect, Construction Technology & Green Buildings',
    discipline: 'architecture-urbanism',
    tier: 'board',
    bioFa:
      'معمار ارشد و متخصص طراحی، تکنولوژی ساخت و ساختمان‌های سبز با سابقه حرفه‌ای داخلی و بین‌المللی.',
    bioEn:
      'Senior architect specializing in architectural design, construction technology, and green building delivery with domestic and international experience.',
    specialtiesFa: 'طراحی معماری، تکنولوژی ساخت، ساختمان‌های سبز، تجربه حرفه‌ای بین‌المللی',
    specialtiesEn: 'Architectural Design, Construction Technology, Green Buildings, International Practice',
    resumeFa:
      '• عضو هیئت مدیره و معمار ارشد دپارتمان معماری و شهرسازی گروه ساختمانی پایدار ایران زمین\n• متخصص طراحی معماری، تکنولوژی ساخت و استانداردهای ساختمان‌های سبز\n• دارای سابقه حرفه‌ای در پروژه‌های داخلی و بین‌المللی',
    resumeEn:
      '• Board Member and Senior Architect in Architecture & Urbanism at ISB Group\n• Specialist in design integration, construction detailing, and green building standards\n• Domestic and international architectural practice background',
    order: 3,
    status: 'published',
    isSeedDefault: true,
  },
  {
    id: 'arefeh-baraki',
    nameFa: 'مهندس عارفه برکی',
    nameEn: 'Eng. Arefeh Baraki',
    roleFa: 'متخصص روابط عمومی، برندینگ و توسعه بازرگانی',
    roleEn: 'Public Relations, Branding & Business Development Specialist',
    discipline: 'architecture-urbanism',
    tier: 'specialist',
    specialtiesFa: 'روابط عمومی و توسعه بازرگانی، برندینگ تخصصی',
    specialtiesEn: 'PR & Business Development, Architectural Branding',
    order: 4,
    status: 'published',
    isSeedDefault: true,
  },
  {
    id: 'zahra-rasouli',
    nameFa: 'مهندس زهرا رسولی',
    nameEn: 'Eng. Zahra Rasouli',
    roleFa: 'کارشناس معماری',
    roleEn: 'Architectural Designer',
    discipline: 'architecture-urbanism',
    tier: 'member',
    order: 5,
    status: 'published',
    isSeedDefault: true,
  },
  {
    id: 'hamed-moslehi',
    nameFa: 'مهندس حامد مصلحی',
    nameEn: 'Eng. Hamed Moslehi',
    roleFa: 'عضو هیئت مدیره · راهبر تأسیسات مکانیکی و ممیزی انرژی',
    roleEn: 'Board Member · Senior MEP Systems & Energy Audit Lead',
    discipline: 'energy-mep',
    tier: 'board',
    bioFa:
      'متخصص طراحی و بهینه‌سازی سیستم‌های مکانیکی و تأسیساتی ساختمان، ممیزی انرژی، طراحی ساختمان و مدرس شبیه‌سازی انرژی.',
    bioEn:
      'Specialist in mechanical & HVAC building systems optimization, building energy auditing, DesignBuilder simulation, and Chapter 19 compliance instruction.',
    specialtiesFa: 'تأسیسات مکانیکی و HVAC، ممیزی انرژی، شبیه‌سازی DesignBuilder، مبحث نوزدهم',
    specialtiesEn: 'Mechanical & HVAC Systems, Building Energy Audits, DesignBuilder Simulation, Code 19',
    resumeFa:
      '• عضو هیئت مدیره و راهبر طراحی و بهینه‌سازی سیستم‌های مکانیکی و تأسیساتی در گروه ساختمانی پایدار ایران زمین\n• راهبر فنی ممیزی و مدل‌سازی انرژی ساختمان‌های اداری، صنعتی و مسکونی\n• مدرس کارگاه‌های تخصصی شبیه‌سازی انرژی و انطباق با مبحث نوزدهم مقررات ملی ساختمان',
    resumeEn:
      '• Board Member and Senior MEP & building energy systems lead at ISB Group\n• Technical lead for energy auditing and simulation across civic, industrial, and residential projects\n• Instructor of professional workshops on DesignBuilder energy modeling and Code 19 compliance',
    order: 6,
    status: 'published',
    isSeedDefault: true,
  },
  {
    id: 'behrouz-kari',
    nameFa: 'دکتر بهروز کاری',
    nameEn: 'Dr. Behrouz Kari',
    roleFa: 'عضو هیئت مدیره · مشاور علمی انرژی ساختمان',
    roleEn: 'Board Member · Scientific Advisor, Building Energy',
    discipline: 'energy-mep',
    tier: 'board',
    bioFa:
      'عضو هیئت علمی و رئیس بخش انرژی و نور مرکز تحقیقات راه، مسکن و شهرسازی؛ متخصص بهینه‌سازی مصرف انرژی، عملکرد حرارتی پوسته و پنجره‌های ساختمانی.',
    bioEn:
      'Faculty member and Head of the Energy & Lighting Department at Iran’s Road, Housing & Urban Development Research Center (BHRC); authority on building energy conservation, envelope thermal physics, and glazing systems.',
    specialtiesFa: 'مشاوره علمی انرژی، عملکرد حرارتی پوسته، فیزیک پنجره و نور، مبحث ۱۹',
    specialtiesEn: 'Scientific Energy Advisory, Envelope Thermal Performance, Glazing & Lighting Physics, Code 19',
    resumeFa:
      '• عضو هیئت مدیره و مشاور علمی انرژی ساختمان در گروه ساختمانی پایدار ایران زمین\n• عضو هیئت علمی و رئیس بخش انرژی و نور مرکز تحقیقات راه، مسکن و شهرسازی\n• متخصص برجسته بهینه‌سازی مصرف انرژی، عملکرد حرارتی پوسته و پنجره‌های ساختمانی',
    resumeEn:
      '• Board Member and Scientific Energy Advisor to ISB Group\n• Faculty member and Head of Energy & Lighting Department, Road, Housing & Urban Development Research Center (BHRC)\n• Specialist in building energy optimization, thermal envelope physics, and high-performance fenestration',
    order: 7,
    status: 'published',
    isSeedDefault: true,
  },
  {
    id: 'zahra-ramezani',
    nameFa: 'مهندس زهرا رمضانی',
    nameEn: 'Eng. Zahra Ramezani',
    roleFa: 'کارشناس ارشد علوم ساختمان · شبیه‌سازی انرژی، نور روز و تحلیل پارامتریک نما',
    roleEn: 'M.Sc. Building Science · Energy, Daylight & Parametric Envelope Analysis',
    discipline: 'energy-mep',
    tier: 'specialist',
    specialtiesFa: 'شبیه‌سازی انرژی و نور روز، تحلیل پارامتریک نما',
    specialtiesEn: 'Energy & Daylight Simulation, Parametric Facade Analysis',
    order: 8,
    status: 'published',
    isSeedDefault: true,
  },
  {
    id: 'somayeh-amini-nasab',
    nameFa: 'مهندس سمیه امینی‌نسب',
    nameEn: 'Eng. Somayeh Amini-Nasab',
    roleFa: 'مشاور آکوستیک ساختمان · پژوهشگر گروه آکوستیک مرکز تحقیقات راه، مسکن و شهرسازی',
    roleEn: 'Building Acoustics Advisor · Acoustics Research Group, BHRC',
    discipline: 'energy-mep',
    tier: 'advisor',
    specialtiesFa: 'آکوستیک و آسایش صوتی ساختمان',
    specialtiesEn: 'Building Acoustics & Sound Comfort',
    order: 9,
    status: 'published',
    isSeedDefault: true,
  },
];

export const LAB_METRICS: LabMetric[] = [
  {
    id: 'sda',
    label: {
      en: 'Daylight Autonomy (sDA)',
      fa: 'استقلال نور روز (sDA)',
    },
    valueDisplay: {
      en: '72%',
      fa: '۷۲٪',
    },
    unitOrContext: {
      en: 'Illustrative demo · % floor area ≥ 300 lux for 50% occupied hours',
      fa: 'نمونه نمایشی · درصد سطح با روشنایی ≥ ۳۰۰ لوکس در ۵۰٪ ساعات کاربری',
    },
    progressPct: 72,
    isIllustrative: true,
    methodologySummary: {
      en: 'Evaluated using annual climate-based daylight modeling (CBDM) across occupied floor plates to balance useful daylight with glare control.',
      fa: 'بر اساس مدل‌سازی سالانه نور روز مبتنی بر اقلیم (CBDM) در سطوح کاربری برای ایجاد تعادل میان نور طبیعی مفید و کنترل خیرگی.',
    },
  },
  {
    id: 'eui',
    label: {
      en: 'Energy Use Intensity (EUI)',
      fa: 'شدت مصرف انرژی (EUI)',
    },
    valueDisplay: {
      en: '68 kWh/m²·yr',
      fa: '۶۸ kWh/m²·yr',
    },
    unitOrContext: {
      en: 'Illustrative demo · −46% annual site energy vs. code baseline',
      fa: 'نمونه نمایشی · ۴۶٪ کاهش مصرف سالانه نسبت به مدل مبنای آیین‌نامه',
    },
    progressPct: 54,
    isIllustrative: true,
    methodologySummary: {
      en: 'Whole-building hourly simulation quantifying heating, cooling, lighting, and equipment energy normalized per square meter of conditioned floor area.',
      fa: 'شبیه‌سازی ساعتی کل ساختمان برای محاسبه انرژی گرمایش، سرمایش، روشنایی و تجهیزات به ازای هر متر مربع زیربنای مفید.',
    },
  },
  {
    id: 'co2',
    label: {
      en: 'CO₂ Emissions',
      fa: 'انتشار دی‌اکسید کربن (CO₂)',
    },
    valueDisplay: {
      en: '−13.7%',
      fa: '۱۳.۷٪−',
    },
    unitOrContext: {
      en: 'Illustrative demo · Annual operational CO₂ vs. baseline model',
      fa: 'نمونه نمایشی · کاهش انتشار سالانه CO₂ بهره‌برداری نسبت به مدل مبنا',
    },
    progressPct: 62,
    isIllustrative: true,
    methodologySummary: {
      en: 'Converts simulated electricity and fuel consumption into annual operational CO₂e emissions using regional grid and fuel factors.',
      fa: 'تبدیل مصرف شبیه‌سازی‌شده برق و سوخت به میزان انتشار سالانه CO₂e بر اساس ضرایب شبکه و سوخت منطقه‌ای.',
    },
  },
  {
    id: 'saro-sabz',
    label: {
      en: 'Saro Sabz Score',
      fa: 'امتیاز سرو سبز',
    },
    valueDisplay: null,
    unitOrContext: {
      en: 'Project-specific sustainability benchmark · Assessed per brief',
      fa: 'ارزیابی اختصاصی پایداری · محاسبه بر اساس مشخصات هر پروژه',
    },
    progressPct: null,
    isIllustrative: false,
    methodologySummary: {
      en: 'Multi-criteria sustainability framework evaluating daylight, thermal envelope, energy intensity, water efficiency, and resilience once project parameters are verified.',
      fa: 'چارچوب چندمعیاره ارزیابی پایداری شامل نور روز، پوسته حرارتی، شدت مصرف انرژی، بهره‌وری آب و تاب‌آوری پس از بررسی داده‌های واقعی پروژه.',
    },
  },
];

export const SEED_COURSES: Course[] = [
  {
    id: 'seed-course-energy-simulation',
    slug: 'building-energy-daylight-simulation',
    titleFa: 'شبیه‌سازی انرژی، نور روز و آسایش حرارتی ساختمان (کاربردی)',
    titleEn: 'Applied Building Energy, Daylight & Thermal Comfort Simulation',
    department: 'energy-mep',
    format: 'hybrid',
    instructorFa: 'تیم تخصصی دپارتمان انرژی و تأسیسات ISB',
    instructorEn: 'ISB Energy & MEP Engineering Faculty',
    durationFa: '۲۴ ساعت آموزشی (۸ جلسه کارگاهی)',
    durationEn: '24 Hours (8 Studio Sessions)',
    scheduleFa: 'پنج‌شنبه‌ها · ساعت ۱۶ تا ۱۹ (حضوری مشهد + آنلاین زنده)',
    scheduleEn: 'Thursdays · 16:00–19:00 IRST (Mashhad Studio + Live Online)',
    priceToman: 4800000,
    originalPriceToman: 5900000,
    capacity: 25,
    summaryFa:
      'آموزش پروژه‌محور مدلسازی مصرف انرژی (EUI)، تحلیل نور روز (sDA/ASE)، بهینه‌سازی پوسته حرارتی و مبحث ۱۹ مقررات ملی ساختمان روی پروژه‌های واقعی اجراشده در گروه ISB.',
    summaryEn:
      'Project-based training covering whole-building Energy Use Intensity (EUI), daylight metrics (sDA/ASE), thermal envelope optimization, and code compliance modeled on real ISB projects.',
    syllabusFa: [
      'مبانی فیزیک ساختمان، اقلیم‌شناسی و خوانش داده‌های آب‌وهوایی (EPW)',
      'مدلسازی هندسه حرارتی و تنظیم پروفایل بهره‌برداری در پروژه‌های اداری و مسکونی',
      'شبیه‌سازی نور روز (sDA / ASE) و طراحی سایبان‌های اقلیمی بهینه',
      'تحلیل پل‌های حرارتی، انتخاب جداره و کاهش بار سرمایش و گرمایش',
      'تدوین گزارش مهندسی انرژی برای کارفرما و اخذ گواهی‌های پایداری',
    ],
    syllabusEn: [
      'Building physics fundamentals, climate analysis & EPW weather files',
      'Thermal zoning geometry and occupancy profiles for residential & civic assets',
      'Daylight autonomy (sDA / ASE) and climate-responsive shading optimization',
      'Envelope thermal bridging, glazing selection & HVAC load reduction',
      'Preparing engineering energy dossiers for clients and green ratings',
    ],
    coverImage: ASSETS.expertiseEnergyMep,
    paymentNoteFa:
      'پس از ثبت‌نام، اطلاعات واریز یا لینک درگاه پرداخت اختصاصی دوره نمایش داده می‌شود و با ثبت کد پیگیری، عضویت شما در کلاس تأیید خواهد شد.',
    paymentNoteEn:
      'Complete payment via the provided gateway link or academy transfer instructions and enter your tracking reference to activate enrollment.',
    featuredOrder: 1,
    status: 'published',
    isSeedDefault: true,
  },
  {
    id: 'seed-course-climate-architecture',
    slug: 'climate-responsive-architectural-design',
    titleFa: 'طراحی معماری اقلیم‌محور و پایداری در فضاهای شهری',
    titleEn: 'Climate-Responsive Architectural Design & Sustainable Urbanism',
    department: 'architecture-urbanism',
    format: 'online-live',
    instructorFa: 'تیم طراحی دپارتمان معماری و شهرسازی ISB',
    instructorEn: 'ISB Architecture & Urbanism Studio',
    durationFa: '۲۰ ساعت آموزشی (۷ جلسه)',
    durationEn: '20 Hours (7 Live Sessions)',
    scheduleFa: 'دوشنبه‌ها و چهارشنبه‌ها · ساعت ۱۸ تا ۲۰:۳۰',
    scheduleEn: 'Mondays & Wednesdays · 18:00–20:30 IRST',
    priceToman: 3900000,
    capacity: 30,
    summaryFa:
      'از تحلیل سایت و خرداقلیم تا تدوین کانسپت اجرایی؛ چگونه تصمیم‌های اولیه حجم، جهت‌گیری و پوسته، کیفیت فضایی و مصرف انرژی بنا را هم‌زمان ارتقا می‌دهند.',
    summaryEn:
      'From site microclimate diagnostics to coordinated schematic design — integrating massing, orientation, daylight, and material strategy from day one.',
    syllabusFa: [
      'تحلیل جامع بستر شهری، باد غالب، زاویه تابش و خرداقلیم سایت',
      'استراتژی‌های طراحی غیرفعال (Passive Design) در اقلیم نیمه‌خشک و سرد',
      'هماهنگی یکپارچه معماری با تیم‌های سازه و تأسیسات از فاز کانسپت',
      'بررسی موردی پروژه‌های مسکونی، اداری و پارک‌های شهری گروه ISB',
    ],
    syllabusEn: [
      'Comprehensive site context, prevailing wind, solar geometry & microclimate',
      'Passive design strategies tailored to semi-arid and cold-winter climates',
      'Early-stage architectural coordination with MEP and structural teams',
      'Case studies from ISB residential, civic, and urban park commissions',
    ],
    coverImage: ASSETS.expertiseArchitecture,
    featuredOrder: 2,
    status: 'published',
    isSeedDefault: true,
  },
  {
    id: 'seed-course-seismic-retrofit',
    slug: 'performance-based-seismic-engineering',
    titleFa: 'طراحی لرزه‌ای مبتنی بر عملکرد و بهسازی سازه‌ها',
    titleEn: 'Performance-Based Seismic Design & Structural Retrofitting',
    department: 'structure-seismic',
    format: 'hybrid',
    instructorFa: 'تیم مهندسی دپارتمان سازه و زلزله ISB',
    instructorEn: 'ISB Structural & Seismic Engineering Studio',
    durationFa: '۲۸ ساعت آموزشی (پروژه‌محور)',
    durationEn: '28 Hours (Project-Based)',
    scheduleFa: 'سه‌شنبه‌ها · ساعت ۱۷ تا ۲۰:۳۰',
    scheduleEn: 'Tuesdays · 17:00–20:30 IRST',
    priceToman: 5400000,
    originalPriceToman: 6200000,
    capacity: 20,
    summaryFa:
      'تحلیل غیرخطی، ارزیابی آسیب‌پذیری لرزه‌ای ساختمان‌های موجود و طراحی بهسازی سازه‌ای با رویکرد کاهش کربن نهفته و بهینه‌سازی مصرف مصالح.',
    summaryEn:
      'Nonlinear seismic evaluation, vulnerability diagnostics of existing buildings, and structural retrofitting balanced for resilience and low embodied carbon.',
    syllabusFa: [
      'مبانی طراحی مبتنی بر عملکرد (PBD) و سطوح عملکردی در آیین‌نامه‌های روز',
      'تحلیل استاتیکی غیرخطی (Pushover) و ارزیابی مفاصل پلاستیک',
      'انتخاب سیستم‌های بهسازی لرزه‌ای و کاهش هزینه‌های اجرایی',
      'رویکرد بهینه‌سازی مصالح برای کاهش کربن نهفته در سازه‌های بتنی و فولادی',
    ],
    syllabusEn: [
      'Performance-Based Design (PBD) fundamentals and modern seismic codes',
      'Nonlinear static (Pushover) analysis and plastic hinge evaluation',
      'Selecting cost-effective seismic retrofit systems for existing buildings',
      'Material optimization to reduce embodied carbon in concrete & steel frames',
    ],
    coverImage: ASSETS.expertiseStructure,
    featuredOrder: 3,
    status: 'published',
    isSeedDefault: true,
  },
];

export const SEED_PARTNER_LOGOS: PartnerLogo[] = [
  {
    id: 'isoletco',
    nameFa: 'ایزولتکو',
    nameEn: 'ISOLETCO',
    descriptionFa: 'تأمین‌کننده تخصصی سامانه‌های عایق حرارتی، صوتی و مصالح بهینه‌ساز پوسته ساختمان.',
    descriptionEn: 'Specialist supplier of thermal and acoustic building envelope insulation systems.',
    presetMarkId: 'isoletco',
    order: 1,
    status: 'published',
    isSeedDefault: true,
  },
  {
    id: 'parin-beton',
    nameFa: 'پرین بتن',
    nameEn: 'PARIN BETON',
    descriptionFa: 'تولیدکننده بلوک‌های سبک AAC و مصالح ساختمانی کم‌مصرف منطبق با الزامات مبحث ۱۹.',
    descriptionEn: 'Manufacturer of lightweight AAC blocks and energy-efficient masonry compliant with Code 19.',
    presetMarkId: 'parin-beton',
    order: 2,
    status: 'published',
    isSeedDefault: true,
  },
  {
    id: 'toos-khorasan',
    nameFa: 'طوس خراسان',
    nameEn: 'TOOS KHORASAN',
    descriptionFa: 'مجری و توسعه‌دهنده پروژه‌های عمرانی، ساختمانی و زیرساختی در استان خراسان.',
    descriptionEn: 'Civil development and building construction partner across Khorasan Province.',
    presetMarkId: 'toos-khorasan',
    order: 3,
    status: 'published',
    isSeedDefault: true,
  },
  {
    id: 'bonyadin',
    nameFa: 'قطعات بتنی بنیادین',
    nameEn: 'BONYADIN',
    descriptionFa: 'تولیدکننده قطعات بتنی پیش‌ساخته و سازه‌ای با کنترل کیفیت مهندسی و دوام بالا.',
    descriptionEn: 'Producer of engineered precast concrete and durable structural building components.',
    presetMarkId: 'bonyadin',
    order: 4,
    status: 'published',
    isSeedDefault: true,
  },
  {
    id: 'iran-etics',
    nameFa: 'ایران اتیکس',
    nameEn: 'IRAN ETICS',
    descriptionFa: 'طراحی و اجرای سامانه‌های عایق‌کاری حرارتی از بیرون (ETICS) برای ارتقای رده انرژی نما.',
    descriptionEn: 'External Thermal Insulation Composite Systems (ETICS) specialist for high-performance facades.',
    presetMarkId: 'iran-etics',
    order: 5,
    status: 'published',
    isSeedDefault: true,
  },
  {
    id: 'multics',
    nameFa: 'مالتیکس',
    nameEn: 'MULTICS',
    descriptionFa: 'همکار صنعتی در حوزه فناوری‌های نوین ساختمانی، تأسیسات و یکپارچه‌سازی مصالح مدرن.',
    descriptionEn: 'Industrial partner in modern building technologies, MEP solutions, and material integration.',
    presetMarkId: 'multics',
    order: 6,
    status: 'published',
    isSeedDefault: true,
  },
  {
    id: 'bhrc',
    nameFa: 'مرکز تحقیقات راه، مسکن و شهرسازی',
    nameEn: 'BHRC',
    descriptionFa: 'همکاری علمی، پژوهشی و تدوین استانداردهای ساختمان سبز، آکوستیک و مبحث نوزدهم.',
    descriptionEn: 'National research collaboration on green building certification, acoustics, and Code 19 standards.',
    presetMarkId: 'bhrc',
    order: 7,
    status: 'published',
    isSeedDefault: true,
  },
  {
    id: 'nlho',
    nameFa: 'سازمان ملی زمین و مسکن',
    nameEn: 'NLHO',
    descriptionFa: 'کارفرما و همکار راهبردی در پروژه‌های توسعه مسکن، شهرسازی و طرح‌های پایلوت پایدار.',
    descriptionEn: 'Public-sector partner on urban land development and sustainable housing initiatives.',
    presetMarkId: 'nlho',
    order: 8,
    status: 'published',
    isSeedDefault: true,
  },
  {
    id: 'bst',
    nameFa: 'بهینه‌سازان توس',
    nameEn: 'BEHINEH SAZAN TOOS',
    descriptionFa: 'تولیدکننده تجهیزات هوشمند سنجش و مدیریت انرژی و همکار پروژه‌های صنعتی رده انرژی EC+.',
    descriptionEn: 'Manufacturer of smart energy metering systems and partner on EC+ industrial commissions.',
    presetMarkId: 'bst',
    order: 9,
    status: 'published',
    isSeedDefault: true,
  },
  {
    id: 'farapanel',
    nameFa: 'فراپانل',
    nameEn: 'FARAPANEL',
    descriptionFa: 'تولیدکننده ساندویچ‌پانل‌های عایق و پوسته‌های سبک صنعتی با عملکرد حرارتی بالا.',
    descriptionEn: 'Manufacturer of insulated sandwich panels and high-efficiency industrial envelopes.',
    presetMarkId: 'farapanel',
    order: 10,
    status: 'published',
    isSeedDefault: true,
  },
  {
    id: 'notash-naghsh',
    nameFa: 'نوتاش نقش',
    nameEn: 'NOTASH NAGHSH',
    descriptionFa: 'دفتر مهندسی و همکار طراحی در پروژه‌های معماری، هویت فضایی و توسعه شهری.',
    descriptionEn: 'Architectural and urban design collaborator on contemporary spatial commissions.',
    presetMarkId: 'notash-naghsh',
    order: 11,
    status: 'published',
    isSeedDefault: true,
  },
  {
    id: 'zistavin',
    nameFa: 'زیستاوین',
    nameEn: 'ZISTAVIN',
    descriptionFa: 'مجموعه تخصصی در حوزه فناوری‌های زیست‌محیطی، توسعه پایدار و راهکارهای ساختمان سبز.',
    descriptionEn: 'Environmental engineering and sustainable green-building solutions partner.',
    presetMarkId: 'zistavin',
    order: 12,
    status: 'published',
    isSeedDefault: true,
  },
  {
    id: 'sarvestan',
    nameFa: 'گروه مشاور سروستان',
    nameEn: 'SARVESTAN',
    descriptionFa: 'مهندسان مشاور همکار در طراحی چندرشته‌ای، نظارت فنی و راهبری پروژه‌های ساختمانی.',
    descriptionEn: 'Consulting engineering partner in multidisciplinary design and technical supervision.',
    presetMarkId: 'sarvestan',
    order: 13,
    status: 'published',
    isSeedDefault: true,
  },
  {
    id: 'emarat-hashtom',
    nameFa: 'مؤسسه عمارت هشتم',
    nameEn: 'EMARAT HASHTOM',
    descriptionFa: 'مؤسسه همکار در توسعه، سرمایه‌گذاری و اجرای پروژه‌های شاخص ساختمانی و شهری.',
    descriptionEn: 'Partner institution in architectural development and flagship urban projects.',
    presetMarkId: 'emarat-hashtom',
    order: 14,
    status: 'published',
    isSeedDefault: true,
  },
  {
    id: 'charsoo',
    nameFa: 'گروه معماری چارسو',
    nameEn: 'CHARSOO',
    descriptionFa: 'استودیو معماری همکار در طراحی فضاهای عمومی، مسکونی و بازآفرینی معماری معاصر.',
    descriptionEn: 'Collaborating architectural studio for residential, civic, and contemporary spatial projects.',
    presetMarkId: 'charsoo',
    order: 15,
    status: 'published',
    isSeedDefault: true,
  },
  {
    id: 'shomal-shargh',
    nameFa: 'مسکن شمال شرق',
    nameEn: 'SHOMAL SHARGH',
    descriptionFa: 'توسعه‌دهنده و مجری مجتمع‌های مسکونی و طرح‌های انبوه‌سازی در شرق کشور.',
    descriptionEn: 'Residential developer and mass-housing execution partner in northeastern Iran.',
    presetMarkId: 'shomal-shargh',
    order: 16,
    status: 'published',
    isSeedDefault: true,
  },
];


