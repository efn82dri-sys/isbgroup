import type { DisciplineSlug, Locale, PageRoute } from '../types/content';

const VALID_DISCIPLINES: DisciplineSlug[] = [
  'architecture-urbanism',
  'energy-mep',
  'structure-seismic',
];

export interface ParsedLocation {
  locale: Locale;
  hasExplicitLocale: boolean;
  route: PageRoute;
}

export function parseLocationPath(pathname: string, fallbackLocale: Locale = 'fa'): ParsedLocation {
  const clean = pathname.replace(/\/+$/, '') || '/';
  const segments = clean.split('/').filter(Boolean);

  let locale: Locale = fallbackLocale;
  let hasExplicitLocale = false;
  let rest = segments;

  if (segments[0] === 'en' || segments[0] === 'fa') {
    locale = segments[0];
    hasExplicitLocale = true;
    rest = segments.slice(1);
  }

  if (rest.length === 0) {
    return { locale, hasExplicitLocale, route: { page: 'home' } };
  }

  const [first, second] = rest;
  const notFound: ParsedLocation = { locale, hasExplicitLocale, route: { page: 'not-found' } };
  const nestedRoutes = first === 'expertise' || first === 'projects' || first === 'insights';
  if (rest.length > (nestedRoutes ? 2 : 1)) return notFound;

  switch (first) {
    case 'about':
      return { locale, hasExplicitLocale, route: { page: 'about' } };
    case 'expertise':
      if (second === 'materials-technologies') {
        return {
          locale,
          hasExplicitLocale,
          route: { page: 'materials-technologies' },
        };
      }
      if (second && VALID_DISCIPLINES.includes(second as DisciplineSlug)) {
        return {
          locale,
          hasExplicitLocale,
          route: { page: 'discipline', slug: second as DisciplineSlug },
        };
      }
      return second ? notFound : { locale, hasExplicitLocale, route: { page: 'expertise' } };
    case 'projects':
      if (second) {
        return { locale, hasExplicitLocale, route: { page: 'project-detail', slug: second } };
      }
      return { locale, hasExplicitLocale, route: { page: 'projects' } };
    case 'sustainability-lab':
      return { locale, hasExplicitLocale, route: { page: 'sustainability-lab' } };
    case 'team':
      return { locale, hasExplicitLocale, route: { page: 'about' } };
    case 'insights':
      if (second) {
        return { locale, hasExplicitLocale, route: { page: 'insight-detail', slug: second } };
      }
      return { locale, hasExplicitLocale, route: { page: 'insights' } };
    case 'courses':
      return { locale, hasExplicitLocale, route: { page: 'courses' } };
    case 'contact':
      return { locale, hasExplicitLocale, route: { page: 'contact' } };
    case 'account':
      return { locale, hasExplicitLocale, route: { page: 'account' } };
    case 'studio':
      return { locale, hasExplicitLocale, route: { page: 'studio' } };
    default:
      return notFound;
  }
}

export function buildPath(locale: Locale, route: PageRoute): string {
  const prefix = `/${locale}`;
  switch (route.page) {
    case 'home':
      return prefix;
    case 'not-found':
      return `${prefix}/404`;
    case 'about':
      return `${prefix}/about`;
    case 'expertise':
      return `${prefix}/expertise`;
    case 'discipline':
      return `${prefix}/expertise/${route.slug}`;
    case 'materials-technologies':
      return `${prefix}/expertise/materials-technologies`;
    case 'projects':
      return `${prefix}/projects`;
    case 'project-detail':
      return `${prefix}/projects/${route.slug}`;
    case 'sustainability-lab':
      return `${prefix}/sustainability-lab`;
    case 'insights':
      return `${prefix}/insights`;
    case 'insight-detail':
      return `${prefix}/insights/${route.slug}`;
    case 'courses':
      return `${prefix}/courses`;
    case 'contact':
      return `${prefix}/contact`;
    case 'account':
      return `${prefix}/account`;
    case 'studio':
      return `${prefix}/studio`;
  }
}

export function switchLocaleInPath(pathname: string, targetLocale: Locale): string {
  const parsed = parseLocationPath(pathname, targetLocale);
  if (parsed.route.page === 'not-found') {
    const suffix = parsed.hasExplicitLocale ? pathname.replace(/^\/+(en|fa)(?=\/|$)/, '') : pathname;
    return `/${targetLocale}/${suffix.replace(/^\/+/, '')}`;
  }
  return buildPath(targetLocale, parsed.route);
}
