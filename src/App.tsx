import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { AppErrorBoundary } from './components/BrandMark';
import { ArchitecturalPreloader, PRELOADER_SESSION_KEY } from './components/ArchitecturalPreloader';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { HeroCampus } from './components/HeroCampus';
import { HomeSections } from './components/HomeSections';
import { MascotCompanion } from './components/mascot/MascotCompanion';
import { AmbientLightField, ScrollDepthRail } from './components/MotionPrimitives';
import { ARCHITECTURAL_EASE } from './utils/motionMath';
import { shouldBypassPreloader } from './utils/preloaderMath';
import {
  DEFAULT_SITE_SETTINGS,
  SEED_COURSES,
  SEED_INSIGHTS,
  SEED_PARTNER_LOGOS,
  SEED_PROJECTS,
  SEED_TEAM_MEMBERS,
} from './data/seedContent';
import type {
  Course,
  Insight,
  Locale,
  MaterialItem,
  PageRoute,
  PartnerLogo,
  Project,
  SiteSettings,
  TeamMember,
} from './types/content';
import { SEED_MATERIALS } from './utils/materialsCatalog';
import { buildPath, parseLocationPath, switchLocaleInPath } from './utils/routing';
import { applyRouteSeoToDocument, buildRouteSeoMetadata } from './utils/seo';

// Code-split secondary routes & modal so the initial landing bundle stays lean and fast
const loadAboutExpertiseModule = () => import('./pages/AboutAndExpertisePages');
const loadMaterialsTechModule = () => import('./pages/MaterialsTechnologiesPage');
const loadProjectsModule = () => import('./pages/ProjectsPages');
const loadLabInsightsContactModule = () => import('./pages/LabTeamInsightsContactPages');
const loadCoursesModule = () => import('./pages/CoursesPage');
const loadAccountModule = () => import('./pages/AccountPortalPage');
const loadStudioModule = () => import('./pages/StudioAdminPage');
const loadSearchModalModule = () => import('./components/SearchModal');
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

const AboutPage = lazy(() =>
  loadAboutExpertiseModule().then((m) => ({ default: m.AboutPage }))
);
const ExpertiseIndexPage = lazy(() =>
  loadAboutExpertiseModule().then((m) => ({ default: m.ExpertiseIndexPage }))
);
const DisciplineDetailPage = lazy(() =>
  loadAboutExpertiseModule().then((m) => ({ default: m.DisciplineDetailPage }))
);
const MaterialsTechnologiesPage = lazy(() =>
  loadMaterialsTechModule().then((m) => ({ default: m.MaterialsTechnologiesPage }))
);
const ProjectsIndexPage = lazy(() =>
  loadProjectsModule().then((m) => ({ default: m.ProjectsIndexPage }))
);
const ProjectDetailPage = lazy(() =>
  loadProjectsModule().then((m) => ({ default: m.ProjectDetailPage }))
);
const SustainabilityLabPage = lazy(() =>
  loadLabInsightsContactModule().then((m) => ({ default: m.SustainabilityLabPage }))
);
const InsightsIndexPage = lazy(() =>
  loadLabInsightsContactModule().then((m) => ({ default: m.InsightsIndexPage }))
);
const InsightDetailPage = lazy(() =>
  loadLabInsightsContactModule().then((m) => ({ default: m.InsightDetailPage }))
);
const ContactPage = lazy(() =>
  loadLabInsightsContactModule().then((m) => ({ default: m.ContactPage }))
);
const CoursesPage = lazy(() =>
  loadCoursesModule().then((m) => ({ default: m.CoursesPage }))
);
const AccountPortalPage = lazy(() =>
  loadAccountModule().then((m) => ({ default: m.AccountPortalPage }))
);
const StudioAdminPage = lazy(() =>
  loadStudioModule().then((m) => ({ default: m.StudioAdminPage }))
);
const SearchModal = lazy(() =>
  loadSearchModalModule().then((m) => ({ default: m.SearchModal }))
);

const LOCALE_STORAGE_KEY = 'isb_group_locale';

function shouldSkipPreloaderNow(): boolean {
  if (typeof window === 'undefined') return true;
  if (shouldBypassPreloader(window.location.search)) return true;
  try {
    return window.sessionStorage.getItem(PRELOADER_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

function RouteLoadingFallback() {
  return (
    <div
      aria-busy="true"
      className="min-h-[62vh] flex flex-col items-center justify-center px-6 py-24"
    >
      <div className="w-28 h-[2px] rounded-full bg-white/10 overflow-hidden">
        <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-[#3B68D6] via-[#28CF77] to-[#6F9BFF] animate-pulse" />
      </div>
    </div>
  );
}

function resolveInitialLocation(): { locale: Locale; route: PageRoute } {
  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  const storedLocale: Locale = stored === 'en' ? 'en' : 'fa';
  const parsed = parseLocationPath(window.location.pathname, 'fa');

  let resolved: { locale: Locale; route: PageRoute };
  // Use Persian by default on root `/` unless path explicitly specifies `/en`
  if (parsed.hasExplicitLocale) {
    resolved = { locale: parsed.locale, route: parsed.route };
  } else if (window.location.pathname === '/' || window.location.pathname === '') {
    resolved = { locale: 'fa', route: { page: 'home' } };
  } else {
    resolved = { locale: storedLocale, route: parsed.route };
  }

  document.documentElement.lang = resolved.locale;
  document.documentElement.dir = resolved.locale === 'fa' ? 'rtl' : 'ltr';
  return resolved;
}

export default function App() {
  const initial = resolveInitialLocation();
  const [locale, setLocale] = useState<Locale>(initial.locale);
  const [requestedRoute, setRoute] = useState<PageRoute>(initial.route);
  const [searchOpen, setSearchOpen] = useState(false);
  const [showPreloader] = useState(() => initial.route.page !== 'not-found');
  const [introDone, setIntroDone] = useState(() => !showPreloader || shouldSkipPreloaderNow());
  const [revealScene, setRevealScene] = useState(() => !showPreloader || shouldSkipPreloaderNow());

  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [projects, setProjects] = useState<Project[]>(SEED_PROJECTS);
  const [insights, setInsights] = useState<Insight[]>(SEED_INSIGHTS);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(SEED_TEAM_MEMBERS);
  const [courses, setCourses] = useState<Course[]>(SEED_COURSES);
  const [partnerLogos, setPartnerLogos] = useState<PartnerLogo[]>(SEED_PARTNER_LOGOS);
  const [materials, setMaterials] = useState<MaterialItem[]>(SEED_MATERIALS);
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [contentReady, setContentReady] = useState(false);

  const missingDetail =
    (requestedRoute.page === 'project-detail' &&
      !projects.some((item) => item.slug === requestedRoute.slug && item.status === 'published')) ||
    (requestedRoute.page === 'insight-detail' &&
      !insights.some((item) => item.slug === requestedRoute.slug && item.status === 'published'));
  const route = useMemo<PageRoute>(
    () => missingDetail && contentReady ? { page: 'not-found' } : requestedRoute,
    [contentReady, missingDetail, requestedRoute]
  );

  const searchTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let active = true;
    let unsub: (() => void) | undefined;

    void Promise.all([import('firebase/auth'), import('./services/firebase')])
      .then(([{ onAuthStateChanged }, { auth }]) => {
        if (!active) return;
        unsub = onAuthStateChanged(auth, (nextUser) => {
          setAuthUser(nextUser);
          setAuthReady(true);
        });
      })
      .catch(() => {
        if (active) setAuthReady(true);
      });

    return () => {
      active = false;
      unsub?.();
    };
  }, []);

  const loadContent = useCallback(async () => {
    try {
      const { fetchPublicContent } = await import('./services/contentStore');
      const data = await fetchPublicContent();
      setSettings(data.settings);
      setProjects(data.projects);
      setInsights(data.insights);
      setTeamMembers(data.teamMembers);
      setCourses(data.courses);
      setPartnerLogos(data.partnerLogos);
      setMaterials(data.materials);
    } catch {
      // Retain seed or previously hydrated content gracefully when offline
    } finally {
      setContentReady(true);
    }
  }, []);

  useEffect(() => {
    void loadContent();
    const handleOnline = () => {
      void loadContent();
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [loadContent]);

  // Quietly prefetch high-traffic route chunks after first paint during browser idle time
  useEffect(() => {
    const prefetchCoreRoutes = () => {
      void loadAboutExpertiseModule();
      void loadMaterialsTechModule();
      void loadProjectsModule();
      void loadLabInsightsContactModule();
      void loadCoursesModule();
    };

    const win = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    if (typeof win.requestIdleCallback === 'function') {
      const id = win.requestIdleCallback(prefetchCoreRoutes, { timeout: 2200 });
      return () => win.cancelIdleCallback?.(id);
    }
    const timer = window.setTimeout(prefetchCoreRoutes, 1400);
    return () => window.clearTimeout(timer);
  }, []);

  // Keep HTML lang/dir, canonical, hreflang, OpenGraph, Twitter cards & Schema.org JSON-LD synced per route
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'fa' ? 'rtl' : 'ltr';
    const origin = window.location.origin;
    const seoMeta = buildRouteSeoMetadata({
      locale,
      route,
      origin,
      settings,
      projects,
      insights,
      courses,
    });
    applyRouteSeoToDocument(seoMeta, origin);
  }, [locale, route, settings, projects, insights, courses]);

  useEffect(() => {
    const onPopState = () => {
      const parsed = parseLocationPath(window.location.pathname, 'fa');
      setLocale(parsed.locale);
      setRoute(parsed.route);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback(
    (nextRoute: PageRoute, scrollTargetId?: string) => {
      const nextUrl = buildPath(locale, nextRoute);
      if (window.location.pathname !== nextUrl) {
        window.history.pushState({}, '', nextUrl);
      }
      setRoute(nextRoute);
      if (scrollTargetId) {
        setTimeout(() => {
          document.getElementById(scrollTargetId)?.scrollIntoView({ behavior: 'smooth' });
        }, 60);
      } else {
        window.scrollTo({ top: 0, behavior: 'auto' });
      }
    },
    [locale]
  );

  const switchLocale = useCallback((nextLocale: Locale) => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
    const nextPath = switchLocaleInPath(window.location.pathname, nextLocale);
    window.history.pushState({}, '', nextPath);
    setLocale(nextLocale);
  }, []);

  const openLabAssessment = useCallback(() => {
    navigate({ page: 'sustainability-lab' }, 'assessment-intake');
  }, [navigate]);

  const routeKey =
    'slug' in route ? `${locale}-${route.page}-${route.slug}` : `${locale}-${route.page}`;
  const isFullScreenGateway = route.page === 'account' && !authUser;

  return (
    <AppErrorBoundary>
      <MotionConfig reducedMotion="user">
        <div
          data-preloader-state={introDone ? 'done' : 'active'}
          className="relative min-h-screen flex flex-col bg-[#080D16] text-[#F5F8FC]"
        >
          {showPreloader && <ArchitecturalPreloader
            locale={locale}
            onRevealReady={() => setRevealScene(true)}
            onComplete={() => {
              setRevealScene(true);
              setIntroDone(true);
            }}
          />}

          <div
            className={
              revealScene
                ? 'flex flex-col flex-1'
                : 'flex flex-col flex-1 invisible pointer-events-none'
            }
          >
            {/* Scroll-reactive ambient light canvas enabling live frosted glass refraction site-wide */}
            {!isFullScreenGateway && <AmbientLightField />}
            {!isFullScreenGateway && <ScrollDepthRail isRtl={locale === 'fa'} />}

            {!isFullScreenGateway && (
              <Header
                locale={locale}
                route={route}
                settings={settings}
                authUser={authUser}
                onNavigate={(r) => navigate(r)}
                onSwitchLocale={switchLocale}
                onOpenSearch={() => setSearchOpen(true)}
                searchTriggerRef={searchTriggerRef}
              />
            )}

            <main className="relative z-10 flex-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={routeKey}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.26, ease: ARCHITECTURAL_EASE }}
                >
                  {missingDetail && !contentReady ? (
                    <RouteLoadingFallback />
                  ) : route.page === 'home' ? (
                    <>
                      <HeroCampus
                        locale={locale}
                        settings={settings}
                        onNavigate={(r) => navigate(r)}
                      />
                      <HomeSections
                        locale={locale}
                        projects={projects}
                        partnerLogos={partnerLogos}
                        settings={settings}
                        onNavigate={(r) => navigate(r)}
                        onOpenLabAssessment={openLabAssessment}
                      />
                    </>
                  ) : (
                    <Suspense fallback={<RouteLoadingFallback />}>
                      {route.page === 'not-found' && (
                        <NotFoundPage
                          locale={locale}
                          onNavigate={navigate}
                          onOpenSearch={() => setSearchOpen(true)}
                        />
                      )}
                      {route.page === 'about' && (
                        <AboutPage
                          locale={locale}
                          settings={settings}
                          teamMembers={teamMembers}
                          partnerLogos={partnerLogos}
                          onNavigate={(r) => navigate(r)}
                        />
                      )}

                      {route.page === 'expertise' && (
                        <ExpertiseIndexPage
                          locale={locale}
                          materials={materials}
                          partnerLogos={partnerLogos}
                          onNavigate={(r) => navigate(r)}
                        />
                      )}

                      {route.page === 'discipline' && (
                        <DisciplineDetailPage
                          locale={locale}
                          slug={route.slug}
                          projects={projects}
                          onNavigate={(r) => navigate(r)}
                        />
                      )}

                      {route.page === 'materials-technologies' && (
                        <MaterialsTechnologiesPage
                          locale={locale}
                          materials={materials}
                          partnerLogos={partnerLogos}
                          onNavigate={(r) => navigate(r)}
                        />
                      )}

                      {route.page === 'projects' && (
                        <ProjectsIndexPage
                          locale={locale}
                          projects={projects}
                          onNavigate={(r) => navigate(r)}
                        />
                      )}

                      {route.page === 'project-detail' && (
                        <ProjectDetailPage
                          locale={locale}
                          slug={route.slug}
                          projects={projects}
                          onNavigate={(r) => navigate(r)}
                        />
                      )}

                      {route.page === 'sustainability-lab' && (
                        <SustainabilityLabPage
                          locale={locale}
                          authUser={authUser}
                          onNavigate={(r) => navigate(r)}
                        />
                      )}

                      {route.page === 'insights' && (
                        <InsightsIndexPage
                          locale={locale}
                          insights={insights}
                          onNavigate={(r) => navigate(r)}
                        />
                      )}

                      {route.page === 'insight-detail' && (
                        <InsightDetailPage
                          locale={locale}
                          slug={route.slug}
                          insights={insights}
                          onNavigate={(r) => navigate(r)}
                        />
                      )}

                      {route.page === 'courses' && (
                        <CoursesPage
                          locale={locale}
                          authUser={authUser}
                          courses={courses}
                          settings={settings}
                          onNavigate={(r) => navigate(r)}
                        />
                      )}

                      {route.page === 'contact' && (
                        <ContactPage
                          locale={locale}
                          settings={settings}
                          authUser={authUser}
                          onNavigate={(r) => navigate(r)}
                        />
                      )}

                      {route.page === 'account' && (
                        <AccountPortalPage
                          locale={locale}
                          authUser={authUser}
                          authReady={authReady}
                          courses={courses}
                          onNavigate={(r) => navigate(r)}
                        />
                      )}

                      {route.page === 'studio' && (
                        <StudioAdminPage
                          locale={locale}
                          settings={settings}
                          onContentUpdated={loadContent}
                        />
                      )}
                    </Suspense>
                  )}
                </motion.div>
              </AnimatePresence>
            </main>

            {introDone && (
              <MascotCompanion
                locale={locale}
                page={route.page}
                searchOpen={searchOpen}
                onConsult={() => navigate({ page: 'contact' }, route.page === 'contact' ? 'project-inquiry' : undefined)}
              />
            )}

            {!isFullScreenGateway && (
              <Footer
                locale={locale}
                settings={settings}
                authUser={authUser}
                onNavigate={(r) => navigate(r)}
              />
            )}

            {searchOpen && (
              <Suspense fallback={null}>
                <SearchModal
                  open={searchOpen}
                  locale={locale}
                  projects={projects}
                  insights={insights}
                  onClose={() => setSearchOpen(false)}
                  onNavigate={(r) => navigate(r)}
                  returnFocusRef={searchTriggerRef}
                />
              </Suspense>
            )}
          </div>
        </div>
      </MotionConfig>
    </AppErrorBoundary>
  );
}
