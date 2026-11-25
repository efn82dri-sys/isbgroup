import { ArrowLeft, ArrowRight, Search } from '../components/icons/IsbIcons';
import type { MouseEvent } from 'react';
import type { Locale, PageRoute } from '../types/content';
import { buildPath } from '../utils/routing';
import './not-found.css';

interface NotFoundPageProps {
  locale: Locale;
  onNavigate: (route: PageRoute) => void;
  onOpenSearch: () => void;
}

const copy = {
  fa: {
    title: 'صفحه پیدا نشد',
    description: 'ممکن است نشانی اشتباه باشد یا صفحه جابه‌جا شده باشد. برای ادامه، به خانه برگردید یا در سایت جست‌وجو کنید.',
    home: 'صفحهٔ اصلی',
    search: 'جست‌وجو',
    projects: 'دیدن پروژه‌ها',
    illustration: 'ماکت پلی چوبی و بتنی که دهانهٔ میانی آن فقط در خطوط نقشه دیده می‌شود.',
  },
  en: {
    title: 'Page not found',
    description: 'The address may be incorrect or the page may have moved. Go home or search the site to continue.',
    home: 'Go home',
    search: 'Search site',
    projects: 'Explore projects',
    illustration: 'A timber and concrete bridge model with its missing central span drawn in blueprint lines.',
  },
} as const;

export default function NotFoundPage({ locale, onNavigate, onOpenSearch }: NotFoundPageProps) {
  const labels = copy[locale];
  const isFa = locale === 'fa';
  const BackArrow = isFa ? ArrowRight : ArrowLeft;
  const ForwardArrow = isFa ? ArrowLeft : ArrowRight;

  function followRoute(event: MouseEvent<HTMLAnchorElement>, route: PageRoute) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onNavigate(route);
  }

  return (
    <section
      aria-labelledby="not-found-title"
      data-testid="not-found-page"
      className="isb-not-found"
    >
      <div className="isb-not-found__layout">
        <div className="isb-not-found__copy">
          <p dir="ltr" className="isb-not-found__code">
            4<span>0</span>4
          </p>
          <h1 id="not-found-title">{labels.title}</h1>
          <p className="isb-not-found__description">{labels.description}</p>

          <div className="isb-not-found__actions">
            <a
              href={buildPath(locale, { page: 'home' })}
              className="isb-not-found__action isb-not-found__action--primary"
              onClick={(event) => followRoute(event, { page: 'home' })}
            >
              <BackArrow size={18} aria-hidden="true" />
              {labels.home}
            </a>
            <button
              type="button"
              className="isb-not-found__action"
              onClick={onOpenSearch}
            >
              <Search size={18} aria-hidden="true" />
              {labels.search}
            </button>
          </div>

          <a
            href={buildPath(locale, { page: 'projects' })}
            className="isb-not-found__projects"
            onClick={(event) => followRoute(event, { page: 'projects' })}
          >
            {labels.projects}
            <ForwardArrow size={17} aria-hidden="true" />
          </a>
        </div>

        <figure className="isb-not-found__illustration">
          <img
            src="/assets/isb-404-bridge.jpg"
            alt={labels.illustration}
            width={1536}
            height={1024}
            decoding="async"
            fetchPriority="high"
          />
        </figure>
      </div>
    </section>
  );
}
