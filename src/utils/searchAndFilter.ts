import type {
  Discipline,
  DisciplineSlug,
  Insight,
  Locale,
  PageRoute,
  Project,
  ProjectCategory,
} from '../types/content';

export interface SearchResultItem {
  id: string;
  kind: 'page' | 'discipline' | 'project' | 'insight';
  title: string;
  subtitle: string;
  route: PageRoute;
}

export interface StaticSearchPage {
  id: string;
  route: PageRoute;
  titleEn: string;
  titleFa: string;
  keywordsEn: string;
  keywordsFa: string;
  summaryEn: string;
  summaryFa: string;
}

export const STATIC_SEARCH_PAGES: StaticSearchPage[] = [
  {
    id: 'page-about',
    route: { page: 'about' },
    titleEn: 'About ISB Group & Our Team',
    titleFa: 'درباره گروه ISB و تیم ما',
    keywordsEn: 'practice interdisciplinary integrated architecture engineering studio mission team board directors inspectors architects engineers urban planners mep structural specialists partners',
    keywordsFa: 'درباره گروه معماری مهندسی یکپارچه رویکرد استودیو همکاری تیم ما هیئت مدیره بازرسان معماران مهندسان مشاوران همکاران شرکت‌های وابسته',
    summaryEn: 'Interdisciplinary practice, Board of Directors, specialized departments, advisors, and affiliated partners.',
    summaryFa: 'معرفی گروه، هیئت مدیره، بازرسان، دپارتمان‌های تخصصی، مشاوران و همکاران گروه ISB.',
  },
  {
    id: 'page-expertise',
    route: { page: 'expertise' },
    titleEn: 'Our Expertise & Services',
    titleFa: 'تخصص‌ها و خدمات',
    keywordsEn: 'services disciplines architecture urbanism energy mep structure seismic consulting',
    keywordsFa: 'خدمات تخصص معماری شهرسازی انرژی تأسیسات سازه زلزله مشاوره',
    summaryEn: 'Three specialized disciplines unified into one integrated design workflow.',
    summaryFa: 'سه حوزه تخصصی در یک فرایند طراحی و مهندسی یکپارچه.',
  },
  {
    id: 'page-projects',
    route: { page: 'projects' },
    titleEn: 'Selected Projects',
    titleFa: 'پروژه‌های منتخب',
    keywordsEn: 'portfolio mashhad administrative residential urban park case studies',
    keywordsFa: 'پروژه‌ها مشهد اداری مسکونی پارک شهری نمونه‌کار',
    summaryEn: 'Architectural, urban, climate analysis, and energy performance portfolio.',
    summaryFa: 'مجموعه پروژه‌های معماری، شهرسازی، تحلیل اقلیمی و عملکرد انرژی.',
  },
  {
    id: 'page-lab',
    route: { page: 'sustainability-lab' },
    titleEn: 'ISB Sustainability Lab',
    titleFa: 'آزمایشگاه پایداری ISB',
    keywordsEn: 'daylight sda eui energy carbon co2 saro sabz simulation assessment lab',
    keywordsFa: 'آزمایشگاه پایداری نور روز انرژی کربن سرو سبز شبیه‌سازی ارزیابی',
    summaryEn: 'Performance simulation, daylight analysis, EUI benchmarking, and assessment intake.',
    summaryFa: 'شبیه‌سازی عملکرد، تحلیل نور روز، شاخص انرژی و درخواست ارزیابی پایداری.',
  },
  {
    id: 'page-insights',
    route: { page: 'insights' },
    titleEn: 'Insights & Technical Notes',
    titleFa: 'دانش و مقالات',
    keywordsEn: 'articles research technical notes publications blog sustainability seismic',
    keywordsFa: 'مقالات پژوهش یادداشت فنی انتشارات پایداری زلزله',
    summaryEn: 'Research notes and technical publications from ISB Group.',
    summaryFa: 'یادداشت‌های فنی و مقالات تخصصی گروه ISB.',
  },
  {
    id: 'page-courses',
    route: { page: 'courses' },
    titleEn: 'Courses & ISB Academy',
    titleFa: 'دوره‌ها و آکادمی تخصصی ISB',
    keywordsEn: 'courses academy training workshop bim energy modeling seismic sustainable architecture',
    keywordsFa: 'دوره دوره‌ها آموزش آکادمی کارگاه شبیه‌سازی انرژی بیم معماری پایدار سازه زلزله',
    summaryEn: 'Upcoming interdisciplinary engineering courses and workshops by ISB Group.',
    summaryFa: 'دوره‌ها و کارگاه‌های تخصصی معماری اقلیمی، مهندسی انرژی و سازه گروه ISB.',
  },
  {
    id: 'page-contact',
    route: { page: 'contact' },
    titleEn: 'Contact & Project Inquiry',
    titleFa: 'تماس و ثبت درخواست پروژه',
    keywordsEn: 'contact inquiry partnership consultation email instagram project brief',
    keywordsFa: 'تماس درخواست پروژه همکاری مشاوره اینستاگرام',
    summaryEn: 'Start a project conversation or request interdisciplinary consulting.',
    summaryFa: 'شروع گفت‌وگو درباره پروژه یا همکاری تخصصی با گروه ISB.',
  },
];

export function filterProjects(
  projects: Project[],
  disciplineFilter: DisciplineSlug | 'all',
  categoryFilter: ProjectCategory | 'all'
): Project[] {
  return projects
    .filter((project) => project.status === 'published')
    .filter((project) =>
      disciplineFilter === 'all' ? true : project.disciplines.includes(disciplineFilter)
    )
    .filter((project) =>
      categoryFilter === 'all' ? true : project.category === categoryFilter
    )
    .sort((a, b) => a.featuredOrder - b.featuredOrder);
}

export function searchPublishedContent(
  query: string,
  locale: Locale,
  disciplines: Discipline[],
  projects: Project[],
  insights: Insight[]
): SearchResultItem[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return [];
  }

  const results: SearchResultItem[] = [];
  const isFa = locale === 'fa';

  for (const page of STATIC_SEARCH_PAGES) {
    const title = isFa ? page.titleFa : page.titleEn;
    const summary = isFa ? page.summaryFa : page.summaryEn;
    const haystack = `${title} ${summary} ${isFa ? page.keywordsFa : page.keywordsEn}`.toLowerCase();
    if (haystack.includes(normalized)) {
      results.push({
        id: page.id,
        kind: 'page',
        title,
        subtitle: summary,
        route: page.route,
      });
    }
  }

  for (const disc of disciplines) {
    const title = disc.title[locale];
    const summary = disc.cardSummary[locale];
    const servicesText = disc.services.map((s) => `${s.name[locale]} ${s.description[locale]}`).join(' ');
    const haystack = `${title} ${summary} ${disc.overview[locale]} ${servicesText}`.toLowerCase();
    if (haystack.includes(normalized)) {
      results.push({
        id: `disc-${disc.slug}`,
        kind: 'discipline',
        title,
        subtitle: summary,
        route: { page: 'discipline', slug: disc.slug },
      });
    }
  }

  for (const project of projects.filter((p) => p.status === 'published')) {
    const title = isFa ? project.titleFa : project.titleEn;
    const city = isFa ? project.cityFa : project.cityEn;
    const service = isFa ? project.serviceFa : project.serviceEn;
    const brief = isFa ? project.briefFa ?? '' : project.briefEn ?? '';
    const haystack = `${title} ${city} ${service} ${project.category} ${brief}`.toLowerCase();
    if (haystack.includes(normalized)) {
      results.push({
        id: `proj-${project.id}`,
        kind: 'project',
        title,
        subtitle: `${city} · ${service}`,
        route: { page: 'project-detail', slug: project.slug },
      });
    }
  }

  for (const insight of insights.filter((i) => i.status === 'published')) {
    const title = isFa ? insight.titleFa : insight.titleEn;
    const excerpt = isFa ? insight.excerptFa : insight.excerptEn;
    const haystack = `${title} ${excerpt} ${insight.topic}`.toLowerCase();
    if (haystack.includes(normalized)) {
      results.push({
        id: `insight-${insight.id}`,
        kind: 'insight',
        title,
        subtitle: excerpt,
        route: { page: 'insight-detail', slug: insight.slug },
      });
    }
  }

  return results;
}
