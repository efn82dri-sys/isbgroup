import { ASSETS } from '../data/assets';
import { DISCIPLINES } from '../data/seedContent';
import type {
  Course,
  Insight,
  Locale,
  PageRoute,
  Project,
  SiteSettings,
} from '../types/content';
import { buildPath } from './routing';

export interface RouteSeoMetadata {
  title: string;
  description: string;
  canonicalPath: string;
  faPath: string;
  enPath: string;
  ogType: 'website' | 'article';
  ogLocale: 'fa_IR' | 'en_US';
  ogAlternateLocale: 'fa_IR' | 'en_US';
  ogImagePath: string;
  ogImageAlt: string;
  siteName: string;
  robots: string;
  jsonLd: Record<string, unknown>;
}

const DEFAULT_OG_IMAGE = '/assets/aistudio/hero-frames/frame_001.webp';

function toAbsoluteUrl(origin: string, pathOrUrl: string): string {
  if (!pathOrUrl) return origin;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const cleanOrigin = origin.replace(/\/+$/, '');
  const cleanPath = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${cleanOrigin}${cleanPath}`;
}

function truncateMeta(text: string, maxLen: number): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLen) return clean;
  return `${clean.slice(0, maxLen - 1).trimEnd()}…`;
}

export function buildRouteSeoMetadata({
  locale,
  route,
  origin,
  settings,
  projects,
  insights,
  courses,
}: {
  locale: Locale;
  route: PageRoute;
  origin: string;
  settings: SiteSettings;
  projects: Project[];
  insights: Insight[];
  courses: Course[];
}): RouteSeoMetadata {
  const isFa = locale === 'fa';
  const brandShort = isFa ? 'گروه ISB' : 'ISB Group';
  const siteName = isFa ? settings.brandNameFa : settings.brandNameEn;
  const canonicalPath = buildPath(locale, route);
  const faPath = buildPath('fa', route);
  const enPath = buildPath('en', route);
  const canonicalUrl = toAbsoluteUrl(origin, canonicalPath);

  let title = isFa
    ? 'گروه ISB | معماری، انرژی و تأسیسات، سازه و زلزله'
    : 'ISB Group | Architecture, Energy & MEP, Structure & Seismic';

  let description = isFa
    ? 'گروه ساختمانی پایدار ایران زمین (ISB)؛ دفتر چندرشته‌ای معماری اقلیم‌محور، شبیه‌سازی انرژی، مبحث ۱۹ و مهندسی سازه و زلزله برای بناهای کارآمد و تاب‌آور.'
    : 'ISB Group is an interdisciplinary architecture, energy engineering, and seismic structural practice delivering resilient, code-19 compliant sustainable buildings.';

  let ogType: 'website' | 'article' = 'website';
  let ogImagePath = DEFAULT_OG_IMAGE;
  let ogImageAlt = isFa
    ? 'نمای معماری پایدار گروه ساختمانی پایدار ایران زمین (ISB)'
    : 'Sustainable architecture and engineering showcase by ISB Group';
  let robots = 'index, follow, max-image-preview:large, max-snippet:-1';

  const breadcrumbs: Array<{ name: string; path: string }> = [
    { name: isFa ? 'صفحه اصلی' : 'Home', path: buildPath(locale, { page: 'home' }) },
  ];

  let extraSchema: Record<string, unknown> | null = null;

  switch (route.page) {
    case 'not-found': {
      title = isFa ? `۴۰۴ | صفحه پیدا نشد | ${brandShort}` : `404 | Page not found | ${brandShort}`;
      description = isFa ? 'صفحهٔ مورد نظر در وب‌سایت گروه ISB پیدا نشد.' : 'This page could not be found on the ISB Group website.';
      robots = 'noindex, follow';
      break;
    }
    case 'about': {
      title = isFa
        ? `درباره ما و تیم متخصصان | ${brandShort}`
        : `About Us & Leadership Team | ${brandShort}`;
      description = isFa
        ? 'آشنایی با گروه ساختمانی پایدار ایران زمین (ISB)، هیئت مدیره، بازرسان، دپارتمان‌های تخصصی معماری، انرژی و سازه و شبکه شرکت‌های همکار.'
        : 'Meet Iran Zamin Sustainable Building Group (ISB): our board, inspectors, interdisciplinary engineering departments, and affiliated industry partners.';
      ogImagePath = ASSETS.teamStudio;
      ogImageAlt = isFa ? 'تیم چندرشته‌ای گروه ISB' : 'ISB Group multidisciplinary team';
      breadcrumbs.push({ name: isFa ? 'درباره ما' : 'About', path: canonicalPath });
      break;
    }

    case 'expertise': {
      title = isFa
        ? `تخصص‌ها و خدمات مهندسی | ${brandShort}`
        : `Expertise & Engineering Services | ${brandShort}`;
      description = isFa
        ? 'سه دپارتمان تخصصی گروه ISB: معماری و شهرسازی اقلیم‌محور، انرژی و تأسیسات (شبیه‌سازی EUI و مبحث ۱۹) و مهندسی سازه، زلزله و بهسازی لرزه‌ای.'
        : 'Explore ISB Group’s three integrated studios: Architecture & Urbanism, Energy & MEP Simulation, and Structural & Seismic Engineering.';
      ogImagePath = ASSETS.expertiseArchitecture;
      breadcrumbs.push({ name: isFa ? 'تخصص‌ها' : 'Expertise', path: canonicalPath });
      break;
    }

    case 'discipline': {
      const disc = DISCIPLINES.find((d) => d.slug === route.slug);
      if (disc) {
        title = `${disc.title[locale]} | ${brandShort}`;
        description = truncateMeta(disc.overview[locale], 158);
        ogImagePath = disc.coverImage;
        ogImageAlt = disc.title[locale];
        breadcrumbs.push(
          { name: isFa ? 'تخصص‌ها' : 'Expertise', path: buildPath(locale, { page: 'expertise' }) },
          { name: disc.title[locale], path: canonicalPath }
        );
        extraSchema = {
          '@type': 'Service',
          name: disc.title[locale],
          description: disc.overview[locale],
          provider: { '@id': `${toAbsoluteUrl(origin, '/')}#organization` },
          areaServed: isFa ? 'ایران' : 'Iran',
          url: canonicalUrl,
        };
      }
      break;
    }

    case 'materials-technologies': {
      title = isFa
        ? `مصالح و فناوری‌های نوین ساختمانی | ${brandShort}`
        : `Modern Materials & Building Technologies | ${brandShort}`;
      description = isFa
        ? 'ویترین تخصصی مصالح و فناوری‌های نوین گروه ISB؛ معرفی ETICS، بلوک AAC، شیشه‌های Low-E و ساندویچ‌پانل همراه با تصاویر گواهینامه‌های فنی، کاتالوگ‌ها و برندهای منتخب.'
        : 'ISB Group’s interactive Modern Materials & Technologies showroom featuring ETICS, AAC, Low-E glazing, smart EMS systems, technical certificate galleries, and partner catalogs.';
      ogImagePath = ASSETS.materialsAtelierHero;
      ogImageAlt = isFa
        ? 'ویترین مصالح و فناوری‌های نوین ساختمانی گروه ISB'
        : 'ISB Group Modern Materials & Building Technologies Showroom';
      breadcrumbs.push(
        { name: isFa ? 'تخصص‌ها' : 'Expertise', path: buildPath(locale, { page: 'expertise' }) },
        {
          name: isFa ? 'مصالح و فناوری‌های نوین' : 'Modern Materials & Technologies',
          path: canonicalPath,
        }
      );
      extraSchema = {
        '@type': 'CollectionPage',
        name: isFa ? 'مصالح و فناوری‌های نوین گروه ISB' : 'ISB Modern Materials & Technologies',
        description,
        publisher: { '@id': `${toAbsoluteUrl(origin, '/')}#organization` },
        url: canonicalUrl,
      };
      break;
    }

    case 'projects': {
      title = isFa
        ? `پروژه‌های منتخب معماری و پایداری | ${brandShort}`
        : `Selected Architecture & Energy Projects | ${brandShort}`;
      description = isFa
        ? 'مروری بر پروژه‌های مسکونی، اداری، آموزشی و صنعتی گروه ISB با رده انرژی EC++، گواهی سرو طلایی و طراحی اقلیم‌محور در مشهد و سراسر کشور.'
        : 'Browse ISB Group’s portfolio of residential, civic, educational, and industrial projects achieving Saro Sabz Green Building and Code 19 EC++ performance.';
      ogImagePath = ASSETS.catalogue.mehreganCover;
      breadcrumbs.push({ name: isFa ? 'پروژه‌ها' : 'Projects', path: canonicalPath });
      break;
    }

    case 'project-detail': {
      const proj = projects.find((p) => p.slug === route.slug);
      breadcrumbs.push({
        name: isFa ? 'پروژه‌ها' : 'Projects',
        path: buildPath(locale, { page: 'projects' }),
      });
      if (proj) {
        const projTitle = isFa ? proj.titleFa : proj.titleEn;
        const projSummary = isFa
          ? proj.briefFa || proj.approachFa || `${proj.titleFa} — ${proj.serviceFa} در ${proj.cityFa}`
          : proj.briefEn || proj.approachEn || `${proj.titleEn} — ${proj.serviceEn} in ${proj.cityEn}`;
        title = `${projTitle} | ${brandShort}`;
        description = truncateMeta(projSummary, 158);
        if (proj.coverImage && !proj.coverImage.startsWith('media:')) {
          ogImagePath = proj.coverImage;
        }
        ogImageAlt = projTitle;
        breadcrumbs.push({ name: projTitle, path: canonicalPath });
        extraSchema = {
          '@type': 'CreativeWork',
          name: projTitle,
          description: projSummary,
          image: toAbsoluteUrl(origin, ogImagePath),
          locationCreated: {
            '@type': 'Place',
            name: isFa ? proj.cityFa : proj.cityEn,
          },
          creator: { '@id': `${toAbsoluteUrl(origin, '/')}#organization` },
          url: canonicalUrl,
        };
      }
      break;
    }

    case 'sustainability-lab': {
      title = isFa
        ? `آزمایشگاه پایداری، سرو سبز و مبحث ۱۹ | ${brandShort}`
        : `Sustainability Lab, Saro Sabz & Code 19 | ${brandShort}`;
      description = isFa
        ? 'شبیه‌سازی ساعتی انرژی (EUI)، تحلیل نور روز، آسایش حرارتی، انطباق مبحث ۱۹ مقررات ملی ساختمان و اخذ رتبه‌بندی ساختمان سبز «سرو سبز» در آزمایشگاه پایداری ISB.'
        : 'Hourly energy modeling (EUI), daylight simulation, thermal comfort analysis, Code 19 compliance, and Saro Sabz green building certification by ISB Sustainability Lab.';
      ogImagePath = ASSETS.labAxonometric;
      ogImageAlt = isFa ? 'مدل تحلیلی آزمایشگاه پایداری ISB' : 'ISB Sustainability Lab axonometric model';
      breadcrumbs.push({
        name: isFa ? 'آزمایشگاه پایداری' : 'Sustainability Lab',
        path: canonicalPath,
      });
      extraSchema = {
        '@type': 'Service',
        name: isFa ? 'آزمایشگاه پایداری و شبیه‌سازی انرژی ISB' : 'ISB Sustainability & Energy Modeling Lab',
        description,
        provider: { '@id': `${toAbsoluteUrl(origin, '/')}#organization` },
        url: canonicalUrl,
      };
      break;
    }

    case 'insights': {
      title = isFa
        ? `مقالات تخصصی معماری پایدار و انرژی | ${brandShort}`
        : `Sustainable Architecture & Energy Insights | ${brandShort}`;
      description = isFa
        ? 'یادداشت‌های فنی، پژوهش‌ها و مقالات کاربردی مهندسین گروه ISB درباره معماری اقلیم‌محور، مبحث ۱۹، بهینه‌سازی انرژی، تاب‌آوری لرزه‌ای و فناوری‌های ساختمان سبز.'
        : 'Technical articles and research notes from ISB Group engineers on passive climate design, Code 19 energy efficiency, daylighting, and seismic resilience.';
      breadcrumbs.push({ name: isFa ? 'مقالات' : 'Insights', path: canonicalPath });
      break;
    }

    case 'insight-detail': {
      const article = insights.find((a) => a.slug === route.slug && a.status === 'published');
      breadcrumbs.push({
        name: isFa ? 'مقالات' : 'Insights',
        path: buildPath(locale, { page: 'insights' }),
      });
      if (article) {
        const artTitle = isFa ? article.titleFa : article.titleEn;
        const artExcerpt = isFa ? article.excerptFa : article.excerptEn;
        const authorName = isFa ? article.authorFa || article.authorEn : article.authorEn || article.authorFa;
        title = `${artTitle} | ${brandShort}`;
        description = truncateMeta(artExcerpt, 158);
        ogType = 'article';
        if (article.coverImage && !article.coverImage.startsWith('media:')) {
          ogImagePath = article.coverImage;
        }
        ogImageAlt = artTitle;
        breadcrumbs.push({ name: artTitle, path: canonicalPath });
        extraSchema = {
          '@type': 'Article',
          headline: artTitle,
          description: artExcerpt,
          image: toAbsoluteUrl(origin, ogImagePath),
          datePublished: article.publishedDate,
          inLanguage: isFa ? 'fa-IR' : 'en-US',
          author: authorName
            ? { '@type': 'Person', name: authorName }
            : { '@id': `${toAbsoluteUrl(origin, '/')}#organization` },
          publisher: { '@id': `${toAbsoluteUrl(origin, '/')}#organization` },
          mainEntityOfPage: canonicalUrl,
        };
      }
      break;
    }

    case 'courses': {
      title = isFa
        ? `دوره‌های تخصصی معماری، انرژی و سازه | ${brandShort}`
        : `Technical Courses in Architecture & Energy | ${brandShort}`;
      description = isFa
        ? 'آموزش‌های پروژه‌محور آکادمی گروه ISB در زمینه شبیه‌سازی انرژی ساختمان، نور روز، طراحی معماری پایدار و بهسازی لرزه‌ای با ثبت‌نام آنلاین.'
        : 'Enroll in ISB Group Academy’s applied courses in building energy simulation, daylight analysis, sustainable architecture, and seismic retrofitting.';
      breadcrumbs.push({ name: isFa ? 'دوره‌ها' : 'Courses', path: canonicalPath });
      const publishedCourses = courses.filter((c) => c.status === 'published');
      if (publishedCourses.length > 0) {
        extraSchema = {
          '@type': 'ItemList',
          name: isFa ? 'دوره‌های تخصصی آکادمی گروه ISB' : 'ISB Group Academy Courses',
          itemListElement: publishedCourses.map((c, idx) => ({
            '@type': 'ListItem',
            position: idx + 1,
            item: {
              '@type': 'Course',
              name: isFa ? c.titleFa : c.titleEn,
              description: isFa ? c.summaryFa : c.summaryEn,
              provider: { '@id': `${toAbsoluteUrl(origin, '/')}#organization` },
              offers: {
                '@type': 'Offer',
                price: String(c.priceToman),
                priceCurrency: 'IRR',
                availability: 'https://schema.org/InStock',
              },
            },
          })),
        };
      }
      break;
    }

    case 'contact': {
      title = isFa
        ? `تماس با ما و ثبت درخواست پروژه | ${brandShort}`
        : `Contact Us & Project Inquiry | ${brandShort}`;
      description = isFa
        ? 'برای مشاوره معماری پایدار، شبیه‌سازی انرژی، مبحث ۱۹ و مهندسی سازه با دفتر گروه ساختمانی پایدار ایران زمین (ISB) در مشهد در ارتباط باشید.'
        : 'Start a sustainable architecture, energy modeling, or structural engineering commission with ISB Group in Mashhad. Submit your project brief online.';
      breadcrumbs.push({ name: isFa ? 'تماس با ما' : 'Contact', path: canonicalPath });
      break;
    }

    case 'account': {
      title = isFa
        ? `پنل کاربری و پیگیری درخواست‌ها | ${brandShort}`
        : `Member Portal | ${brandShort}`;
      description = isFa
        ? 'ورود به پنل کاربری گروه ISB برای مدیریت دوره‌های آموزشی، سفارش‌ها و پیگیری پاسخ مهندسین.'
        : 'Sign in to the ISB Group Member Portal to access enrolled courses, invoices, and engineering responses.';
      robots = 'noindex, nofollow';
      break;
    }

    case 'studio': {
      title = isFa
        ? `مدیریت استودیو | ${brandShort}`
        : `Staff Studio | ${brandShort}`;
      description = isFa
        ? 'پنل مدیریت محتوا و پروژه‌های گروه ISB.'
        : 'ISB Group internal studio content management console.';
      robots = 'noindex, nofollow';
      break;
    }

    default:
      break;
  }

  const sameAs = [settings.instagramUrl, settings.linkedinUrl, settings.telegramUrl]
    .filter((u): u is string => Boolean(u && /^https?:\/\//i.test(u)));

  const baseRootUrl = toAbsoluteUrl(origin, '/');
  const graph: Record<string, unknown>[] = [
    {
      '@type': 'ProfessionalService',
      '@id': `${baseRootUrl}#organization`,
      name: siteName,
      alternateName: isFa ? settings.brandNameEn : settings.brandNameFa,
      url: baseRootUrl,
      logo: toAbsoluteUrl(origin, ASSETS.brandSymbol),
      image: toAbsoluteUrl(origin, DEFAULT_OG_IMAGE),
      address: {
        '@type': 'PostalAddress',
        addressLocality: isFa ? settings.studioCityFa : settings.studioCityEn,
        addressCountry: 'IR',
      },
      ...(sameAs.length > 0 ? { sameAs } : {}),
    },
    {
      '@type': 'WebSite',
      '@id': `${baseRootUrl}#website`,
      url: baseRootUrl,
      name: siteName,
      inLanguage: ['fa-IR', 'en-US'],
      publisher: { '@id': `${baseRootUrl}#organization` },
    },
  ];

  if (breadcrumbs.length > 1) {
    graph.push({
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((crumb, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        name: crumb.name,
        item: toAbsoluteUrl(origin, crumb.path),
      })),
    });
  }

  if (extraSchema) {
    graph.push(extraSchema);
  }

  return {
    title,
    description,
    canonicalPath,
    faPath,
    enPath,
    ogType,
    ogLocale: isFa ? 'fa_IR' : 'en_US',
    ogAlternateLocale: isFa ? 'en_US' : 'fa_IR',
    ogImagePath,
    ogImageAlt,
    siteName,
    robots,
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': graph,
    },
  };
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel: string, href: string, hreflang?: string) {
  const selector = hreflang
    ? `link[rel="${rel}"][hreflang="${hreflang}"]`
    : `link[rel="${rel}"]:not([hreflang])`;
  let el = document.querySelector<HTMLLinkElement>(selector);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    if (hreflang) el.setAttribute('hreflang', hreflang);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export function applyRouteSeoToDocument(meta: RouteSeoMetadata, origin: string) {
  if (typeof document === 'undefined') return;

  document.title = meta.title;
  const canonicalUrl = toAbsoluteUrl(origin, meta.canonicalPath);
  const ogImageUrl = toAbsoluteUrl(origin, meta.ogImagePath);

  upsertMeta('name', 'description', meta.description);
  upsertMeta('name', 'robots', meta.robots);

  // OpenGraph
  upsertMeta('property', 'og:type', meta.ogType);
  upsertMeta('property', 'og:site_name', meta.siteName);
  upsertMeta('property', 'og:title', meta.title);
  upsertMeta('property', 'og:description', meta.description);
  upsertMeta('property', 'og:url', canonicalUrl);
  upsertMeta('property', 'og:locale', meta.ogLocale);
  upsertMeta('property', 'og:locale:alternate', meta.ogAlternateLocale);
  upsertMeta('property', 'og:image', ogImageUrl);
  upsertMeta('property', 'og:image:alt', meta.ogImageAlt);

  // Twitter / X Card
  upsertMeta('name', 'twitter:card', 'summary_large_image');
  upsertMeta('name', 'twitter:title', meta.title);
  upsertMeta('name', 'twitter:description', meta.description);
  upsertMeta('name', 'twitter:image', ogImageUrl);

  // Canonical + Bilingual hreflang links
  upsertLink('canonical', canonicalUrl);
  upsertLink('alternate', toAbsoluteUrl(origin, meta.faPath), 'fa');
  upsertLink('alternate', toAbsoluteUrl(origin, meta.enPath), 'en');
  upsertLink('alternate', toAbsoluteUrl(origin, meta.faPath), 'x-default');

  // Dynamic Schema.org JSON-LD graph
  let scriptEl = document.getElementById('isb-structured-data') as HTMLScriptElement | null;
  if (!scriptEl) {
    scriptEl = document.createElement('script');
    scriptEl.id = 'isb-structured-data';
    scriptEl.type = 'application/ld+json';
    document.head.appendChild(scriptEl);
  }
  scriptEl.textContent = JSON.stringify(meta.jsonLd);
}
