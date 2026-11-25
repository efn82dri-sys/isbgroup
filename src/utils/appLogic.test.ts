import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_SITE_SETTINGS,
  DISCIPLINES,
  SEED_PARTNER_LOGOS,
  SEED_PROJECTS,
  SEED_TEAM_MEMBERS,
} from '../data/seedContent';
import { buildPath, parseLocationPath, switchLocaleInPath } from './routing';
import { filterProjects, searchPublishedContent } from './searchAndFilter';
import {
  buildMailtoReplyHref,
  hasErrors,
  isSafeExternalUrl,
  isSafeImageSrc,
  mapStudioAuthError,
  mergeCatalogProjects,
  mergePartnerLogos,
  mergeTeamMembers,
  parseSpecialtiesList,
  slugifyEnglish,
  validateAssessmentForm,
  validateInquiryForm,
  validateInsightForm,
  validatePartnerLogoForm,
  validateProjectForm,
  validateStudioPassword,
  validateTeamMemberForm,
} from './validation';
import {
  buildHeroFrameUrl,
  computeCoverDrawRect,
  computeScrollProgress,
  findNearestLoadedFrame,
  progressToFrameIndex,
  stepDampedValue,
} from './scrollScrub';
import {
  computeMagneticOffset,
  computeSpecularPosition,
  computeTiltAngles,
} from './motionMath';
import {
  computeActiveStageIndex,
  computeLogoTopInsetPct,
  computeStageLocalProgress,
  computeTimelineProgress,
  DEFAULT_LOADER_TIMING,
  shouldBypassPreloader,
  stepVirtualElapsed,
} from './preloaderMath';

test('routing parses localized paths and preserves page on locale switch', () => {
  const rootDefault = parseLocationPath('/');
  assert.equal(rootDefault.locale, 'fa');
  assert.equal(rootDefault.hasExplicitLocale, false);
  assert.deepEqual(rootDefault.route, { page: 'home' });

  const enProj = parseLocationPath('/en/projects/banafsheh-park');
  assert.equal(enProj.locale, 'en');
  assert.deepEqual(enProj.route, { page: 'project-detail', slug: 'banafsheh-park' });

  const switchedToFa = switchLocaleInPath('/en/projects/banafsheh-park', 'fa');
  assert.equal(switchedToFa, '/fa/projects/banafsheh-park');

  const faDisc = parseLocationPath('/fa/expertise/energy-mep');
  assert.equal(faDisc.locale, 'fa');
  assert.deepEqual(faDisc.route, { page: 'discipline', slug: 'energy-mep' });

  assert.equal(buildPath('en', { page: 'sustainability-lab' }), '/en/sustainability-lab');
});

test('unknown paths render a localized 404 without rewriting the invalid address', () => {
  for (const path of ['/missing', '/fa/contact/unexpected', '/en/expertise/missing', '/fa/projects/any/extra']) {
    assert.deepEqual(parseLocationPath(path).route, { page: 'not-found' });
  }
  assert.equal(buildPath('fa', { page: 'not-found' }), '/fa/404');
  assert.equal(switchLocaleInPath('/fa/missing/path', 'en'), '/en/missing/path');
  assert.deepEqual(parseLocationPath('/fa/team/').route, { page: 'about' });
});

test('filterProjects filters all 12 catalogue projects by discipline and category accurately', () => {
  const all = filterProjects(SEED_PROJECTS, 'all', 'all');
  assert.equal(all.length, 12);

  const energyProjects = filterProjects(SEED_PROJECTS, 'energy-mep', 'all');
  assert.equal(energyProjects.length, 11);
  assert.ok(energyProjects.some((p) => p.slug === 'mehregan-residential-complex'));
  assert.ok(energyProjects.some((p) => p.slug === 'crisis-management-building'));

  const industrial = filterProjects(SEED_PROJECTS, 'all', 'industrial');
  assert.deepEqual(
    industrial.map((p) => p.slug),
    ['behineh-sazan-toos-factory', 'farapanel-manufacturing-factory']
  );

  const educational = filterProjects(SEED_PROJECTS, 'all', 'educational');
  assert.deepEqual(
    educational.map((p) => p.slug),
    ['kerman-sustainable-school']
  );

  const residential = filterProjects(SEED_PROJECTS, 'all', 'residential');
  assert.equal(residential.length, 7);
  assert.ok(residential.some((p) => p.slug === 'setayesh-residential-complex'));
});

test('searchPublishedContent matches English and Persian queries cleanly', () => {
  const enResults = searchPublishedContent('Banafsheh', 'en', DISCIPLINES, SEED_PROJECTS, []);
  assert.ok(enResults.some((item) => item.kind === 'project' && item.title === 'Banafsheh Park'));

  const faResults = searchPublishedContent('ستایش', 'fa', DISCIPLINES, SEED_PROJECTS, []);
  assert.ok(faResults.some((item) => item.kind === 'project' && item.title.includes('ستایش')));

  const emptyResults = searchPublishedContent('   ', 'en', DISCIPLINES, SEED_PROJECTS, []);
  assert.equal(emptyResults.length, 0);
});

test('validateInquiryForm rejects invalid payloads and accepts valid submissions', () => {
  const emptyErrors = validateInquiryForm(
    {
      fullName: '',
      email: 'not-an-email',
      phone: '',
      organization: '',
      projectType: '',
      disciplines: [],
      city: '',
      message: 'short',
    },
    'en'
  );
  assert.equal(hasErrors(emptyErrors), true);
  assert.ok(emptyErrors.fullName);
  assert.ok(emptyErrors.email);
  assert.ok(emptyErrors.disciplines);
  assert.ok(emptyErrors.message);

  const validErrors = validateInquiryForm(
    {
      fullName: 'Nima Karimi',
      email: 'nima@example.com',
      phone: '+989151234567',
      organization: 'Khorasan Urban Dev',
      projectType: 'Mixed-Use Development',
      disciplines: ['architecture-urbanism', 'energy-mep'],
      city: 'Mashhad',
      message: 'Seeking integrated architectural and energy modeling services for a mixed-use block.',
    },
    'en'
  );
  assert.equal(hasErrors(validErrors), false);
});

test('validateAssessmentForm enforces floor area bounds and required goals in EN and FA', () => {
  const faErrors = validateAssessmentForm(
    {
      fullName: 'ا',
      email: 'bad@',
      phone: '',
      organization: '',
      projectType: '',
      city: '',
      approximateFloorAreaSqm: '5',
      projectStage: 'concept',
      assessmentGoals: [],
      notes: '',
    },
    'fa'
  );
  assert.equal(hasErrors(faErrors), true);
  assert.ok(faErrors.approximateFloorAreaSqm?.includes('متر مربع'));
  assert.ok(faErrors.assessmentGoals?.includes('هدف'));

  const validAssessment = validateAssessmentForm(
    {
      fullName: 'سارا محمدی',
      email: 'sara@studio.ir',
      phone: '',
      organization: '',
      projectType: 'Administrative / Office',
      city: 'مشهد',
      approximateFloorAreaSqm: '4200',
      projectStage: 'schematic',
      assessmentGoals: ['daylight', 'energy-eui'],
      notes: 'نیاز به ارزیابی نور روز و بار سرمایشی پیش از فاز دو.',
    },
    'fa'
  );
  assert.equal(hasErrors(validAssessment), false);
});

test('scrollScrub computes clamped progress, frame indices, damping, and cover geometry', () => {
  assert.equal(computeScrollProgress(100, 3000, 900), 0);
  assert.equal(computeScrollProgress(-1050, 3000, 900), 0.5);
  assert.equal(computeScrollProgress(-2500, 3000, 900), 1);

  assert.equal(progressToFrameIndex(0, 90), 0);
  assert.equal(progressToFrameIndex(0.5, 90), 45);
  assert.equal(progressToFrameIndex(1, 90), 89);

  assert.equal(buildHeroFrameUrl(0), '/assets/aistudio/hero-frames/frame_001.webp');
  assert.equal(buildHeroFrameUrl(89), '/assets/aistudio/hero-frames/frame_090.webp');

  const damped = stepDampedValue(0, 1, 0.2);
  assert.equal(damped, 0.2);
  assert.equal(stepDampedValue(0.9999, 1, 0.2, 0.001), 1);

  assert.equal(findNearestLoadedFrame(4, [true, false, false, false, false, true]), 5);
  assert.equal(findNearestLoadedFrame(2, [true, false, false, false, false, true]), 0);

  const rect = computeCoverDrawRect(1920, 1080, 1440, 900, 0.5, 0.5);
  assert.equal(Math.round(rect.dh), 900);
  assert.equal(Math.round(rect.dw), 1600);
  assert.equal(Math.round(rect.dx), -80);
});

test('motionMath computes clamped 3D tilt angles, specular reflection coordinates, and magnetic offsets', () => {
  assert.deepEqual(computeTiltAngles(0, 0, 5), { rotateX: 0, rotateY: 0 });
  assert.deepEqual(computeTiltAngles(1, -1, 6), { rotateX: 6, rotateY: 6 });
  assert.deepEqual(computeTiltAngles(3, 3, 5), { rotateX: -5, rotateY: 5 });

  assert.deepEqual(computeSpecularPosition(-1, -1), { xPct: 0, yPct: 0 });
  assert.deepEqual(computeSpecularPosition(0, 0), { xPct: 50, yPct: 50 });
  assert.deepEqual(computeSpecularPosition(1, 1), { xPct: 100, yPct: 100 });

  assert.deepEqual(computeMagneticOffset(0.5, -0.5, 4), { x: 2, y: -2 });
  assert.deepEqual(computeMagneticOffset(5, -5, 4), { x: 4, y: -4 });
});

test('preloaderMath drives timeline milestones, asset hold-cap, logo elevation inset, and bypass query', () => {
  assert.equal(computeTimelineProgress(0, false), 0);
  assert.equal(
    computeTimelineProgress(DEFAULT_LOADER_TIMING.minDurationMs, false),
    DEFAULT_LOADER_TIMING.holdCapBeforeReady
  );
  assert.equal(computeTimelineProgress(DEFAULT_LOADER_TIMING.minDurationMs, true), 1);
  assert.equal(computeTimelineProgress(DEFAULT_LOADER_TIMING.maxWaitMs, false), 1);

  assert.equal(computeActiveStageIndex(0.1), 0);
  assert.equal(computeActiveStageIndex(0.5), 1);
  assert.equal(computeActiveStageIndex(0.85), 2);

  assert.equal(computeStageLocalProgress(0.17, 0), 0.5);
  assert.equal(computeStageLocalProgress(0.17, 1), 0);
  assert.equal(computeStageLocalProgress(0.85, 0), 1);
  assert.equal(computeStageLocalProgress(1, 2), 1);

  assert.equal(computeLogoTopInsetPct(0), 100);
  assert.equal(computeLogoTopInsetPct(0.5), 50);
  assert.equal(computeLogoTopInsetPct(1), 0);

  assert.equal(shouldBypassPreloader(''), false);
  assert.equal(shouldBypassPreloader('?autostart=1'), true);
  assert.equal(shouldBypassPreloader('?skipLoader=1'), true);

  assert.equal(stepVirtualElapsed(100, 16), 116);
  assert.equal(stepVirtualElapsed(100, 2500, 42), 142);
  assert.equal(stepVirtualElapsed(100, -50, 42), 100);
});

test('validateInsightForm enforces Firestore rule constraints in FA and EN', () => {
  const invalid = validateInsightForm(
    {
      slug: 'مقاله فارسی!',
      titleEn: 'A',
      titleFa: '',
      excerptEn: '',
      excerptFa: 'ک',
      bodyEn: '',
      bodyFa: '',
    },
    'fa'
  );
  assert.equal(hasErrors(invalid), true);
  assert.ok(invalid.slug);
  assert.ok(invalid.titleEn);
  assert.ok(invalid.titleFa);
  assert.ok(invalid.excerptEn);
  assert.ok(invalid.excerptFa);
  assert.ok(invalid.bodyEn);
  assert.ok(invalid.bodyFa);

  const valid = validateInsightForm(
    {
      slug: '  Daylight-Mashhad-2026 ',
      titleEn: 'Daylight Envelope Optimization',
      titleFa: 'بهینه‌سازی نور روز در پوسته ساختمان',
      excerptEn: 'Parametric shading study for arid climates.',
      excerptFa: 'مطالعه سایه‌اندازی پارامتریک برای اقلیم گرم و خشک.',
      bodyEn: 'Full engineering note covering simulation inputs and glazing ratios.',
      bodyFa: 'متن کامل یادداشت مهندسی درباره ورودی‌های شبیه‌سازی و نسبت بازشوها.',
    },
    'en'
  );
  assert.equal(hasErrors(valid), false);
});

test('validateStudioPassword and mapStudioAuthError enforce strong passwords and localized errors', () => {
  assert.ok(validateStudioPassword('1234567', '1234567', 'fa')?.includes('۸'));
  assert.ok(validateStudioPassword('StrongPass99', 'Different99', 'en')?.includes('match'));
  assert.equal(validateStudioPassword('StrongPass99', 'StrongPass99', 'fa'), null);

  assert.ok(mapStudioAuthError('auth/operation-not-allowed', 'fa').includes('کنسول فایربیس'));
  assert.ok(mapStudioAuthError('auth/invalid-credential', 'en').includes('Incorrect password'));
  assert.ok(mapStudioAuthError('auth/too-many-requests', 'fa').includes('تلاش'));
  assert.ok(mapStudioAuthError(undefined, 'en').includes('Unable to complete'));
});

test('isSafeImageSrc and isSafeExternalUrl allow safe assets and reject XSS/SVG/unsafe schemes', () => {
  assert.equal(isSafeImageSrc('/assets/aistudio/project.jpg'), true);
  assert.equal(isSafeImageSrc('https://cdn.example.com/photo.webp'), true);
  assert.equal(isSafeImageSrc('media://med_1710000000_abc123'), true);
  assert.equal(isSafeImageSrc('data:image/webp;base64,UklGRh4AAABXRUJQ'), true);
  assert.equal(isSafeImageSrc('data:image/jpeg;base64,/9j/4AAQ'), true);

  // Blocked XSS / unsafe vectors
  assert.equal(isSafeImageSrc('javascript:alert(1)'), false);
  assert.equal(isSafeImageSrc('data:image/svg+xml;base64,PHN2Zz4='), false);
  assert.equal(isSafeImageSrc('data:text/html;base64,PHNjcmlwdD4='), false);
  assert.equal(isSafeImageSrc('//evil.example/img.png'), false);
  assert.equal(isSafeImageSrc('media://../etc/passwd'), false);

  assert.equal(isSafeExternalUrl('https://linkedin.com/in/isb-architect'), true);
  assert.equal(isSafeExternalUrl('http://example.com'), true);
  assert.equal(isSafeExternalUrl('javascript:void(0)'), false);
  assert.equal(isSafeExternalUrl('data:text/html,hi'), false);
});

test('slugifyEnglish, parseSpecialtiesList, and buildMailtoReplyHref format CMS inputs cleanly', () => {
  assert.equal(slugifyEnglish('  Khorasan Tower — Phase 2! '), 'khorasan-tower-phase-2');
  assert.deepEqual(
    parseSpecialtiesList('BIM، طراحی اقلیمی, EnergyPlus،  , مدلسازی انرژی'),
    ['BIM', 'طراحی اقلیمی', 'EnergyPlus', 'مدلسازی انرژی']
  );

  const href = buildMailtoReplyHref({
    recipientEmail: 'client@example.com',
    recipientName: 'سارا محمدی',
    subject: 'پاسخ گروه ISB',
    replyBody: 'سلام و احترام',
  });
  assert.ok(href.startsWith('mailto:client@example.com?subject=') || href.startsWith('mailto:client%40example.com?subject='));
  assert.ok(href.includes('&body='));
});

test('validateProjectForm and validateTeamMemberForm validate required bilingual fields and safe image URLs', () => {
  const badProject = validateProjectForm(
    {
      slug: 'invalid slug!',
      titleFa: '',
      titleEn: 'A',
      cityFa: '',
      cityEn: '',
      serviceFa: '',
      serviceEn: '',
      disciplines: [],
      coverImage: 'javascript:alert(1)',
    },
    'fa'
  );
  assert.equal(hasErrors(badProject), true);
  assert.ok(badProject.slug);
  assert.ok(badProject.titleFa);
  assert.ok(badProject.coverImage);
  assert.ok(badProject.disciplines);

  const goodProject = validateProjectForm(
    {
      slug: 'khorasan-innovation-hub',
      titleFa: 'مرکز نوآوری خراسان',
      titleEn: 'Khorasan Innovation Hub',
      cityFa: 'مشهد',
      cityEn: 'Mashhad',
      serviceFa: 'معماری و بهینه‌سازی انرژی',
      serviceEn: 'Architecture & Energy Modeling',
      disciplines: ['architecture-urbanism', 'energy-mep'],
      coverImage: 'media://med_1710000000_xyz999',
    },
    'fa'
  );
  assert.equal(hasErrors(goodProject), false);

  const badMember = validateTeamMemberForm(
    {
      nameFa: '',
      nameEn: '',
      roleFa: '',
      roleEn: '',
      portraitUrl: 'data:image/svg+xml;base64,PHN2Zz4=',
      linkedinUrl: 'javascript:alert(1)',
    },
    'en'
  );
  assert.equal(hasErrors(badMember), true);
  assert.ok(badMember.nameFa);
  assert.ok(badMember.portraitUrl);
  assert.ok(badMember.linkedinUrl);

  const goodMember = validateTeamMemberForm(
    {
      nameFa: 'مهندس آرش حسینی',
      nameEn: 'Arash Hosseini',
      roleFa: 'مدیر معماری پایدار',
      roleEn: 'Sustainable Architecture Lead',
      portraitUrl: 'media://med_1710000000_port01',
      linkedinUrl: 'https://linkedin.com/in/arash-hosseini',
    },
    'fa'
  );
  assert.equal(hasErrors(goodMember), false);
});

test('mergeCatalogProjects overrides edited seed projects, hides deleted seeds, and sorts by featuredOrder', () => {
  const editedSeed = {
    ...SEED_PROJECTS[0],
    id: SEED_PROJECTS[0].slug,
    titleFa: 'ساختمان مدیریت بحران (به‌روزرسانی‌شده)',
    featuredOrder: 1,
    isSeedDefault: false,
  };
  const customProject = {
    ...SEED_PROJECTS[1],
    id: 'prj_custom_1',
    slug: 'mashhad-green-tower',
    titleFa: 'برج سبز مشهد',
    titleEn: 'Mashhad Green Tower',
    featuredOrder: 0,
    isSeedDefault: false,
  };

  const merged = mergeCatalogProjects(
    SEED_PROJECTS,
    [editedSeed, customProject],
    [SEED_PROJECTS[2].slug]
  );

  // Hidden seed (index 2) is omitted; seed 0 is overridden; remaining seeds stay default; custom is added at order 0
  assert.equal(merged.length, SEED_PROJECTS.length);
  assert.equal(merged[0].slug, 'mashhad-green-tower');
  assert.equal(merged[1].slug, SEED_PROJECTS[0].slug);
  assert.equal(merged[1].titleFa, 'ساختمان مدیریت بحران (به‌روزرسانی‌شده)');
  assert.equal(merged[1].isSeedDefault, false);
  assert.equal(merged[1].verifiedMetrics?.length, SEED_PROJECTS[0].verifiedMetrics?.length);
  assert.equal(merged[2].slug, SEED_PROJECTS[1].slug);
  assert.equal(merged[2].isSeedDefault, true);
  assert.equal(
    merged.some((p) => p.slug === SEED_PROJECTS[2].slug),
    false
  );
});

test('SEED_TEAM_MEMBERS includes all 9 official catalogue members and mergeTeamMembers deduplicates Firestore overrides', async () => {
  assert.equal(SEED_TEAM_MEMBERS.length, 9);
  const sara = SEED_TEAM_MEMBERS.find((m) => m.id === 'sara-atashi-golestan');
  assert.ok(sara?.portraitUrl?.endsWith('/sara-atashi.webp'));

  const { buildTeamHierarchy } = await import('./teamTree.ts');
  const tree = buildTeamHierarchy(SEED_TEAM_MEMBERS);
  assert.equal(tree.totalPublished, 9);
  assert.equal(tree.executiveBoard.length, 1);
  assert.equal(tree.departments[0].totalCount, 4);
  assert.equal(tree.departments[1].totalCount, 4);

  const merged = mergeTeamMembers(SEED_TEAM_MEMBERS, [
    {
      ...SEED_TEAM_MEMBERS[0],
      id: 'tm_custom_sara',
      nameFa: 'دکتر آتشی گلستان',
      roleFa: 'مدیرعامل (به‌روزرسانی‌شده)',
      resumeFa: '',
      isSeedDefault: false,
    },
    {
      id: 'tm_custom_ramezani',
      nameFa: 'زهرا رمضانی',
      nameEn: 'Zahra Ramezani',
      roleFa: 'ارشد معماری',
      roleEn: 'Senior Architect',
      discipline: 'energy-mep',
      tier: 'specialist',
      order: 8,
      status: 'published',
    },
    {
      id: 'tm_new_struct',
      nameFa: 'محمدرضا مهردوست',
      nameEn: 'Mohammadreza Mehrdoust',
      roleFa: 'ارشد سازه',
      roleEn: 'Senior Structural Engineer',
      discipline: 'structure-seismic',
      tier: 'director',
      order: 10,
      status: 'published',
    },
  ]);

  assert.equal(merged.length, 10);
  assert.equal(
    merged.filter((m) => m.nameFa.includes('آتشی گلستان')).length,
    1
  );
  assert.equal(
    merged.filter((m) => m.nameFa.includes('زهرا رمضانی')).length,
    1
  );
  assert.equal(
    merged.filter((m) => m.nameFa.includes('مهردوست')).length,
    2
  );
  assert.equal(merged[0].roleFa, 'مدیرعامل (به‌روزرسانی‌شده)');
  assert.ok(merged[0].resumeFa?.includes('سرو طلایی'));
  assert.equal(merged[0].isSeedDefault, false);
});

test('teamTree groups published members into 3 departments, gates resumes to directors, and extracts clean monograms', async () => {
  const { buildTeamHierarchy, getMemberMonogram, hasPublicResume, resolveMemberTier } =
    await import('./teamTree.ts');

  const sample = [
    {
      id: 'tm_exec',
      nameFa: 'دکتر مهران علوی',
      nameEn: 'Dr. Mehran Alavi',
      roleFa: 'رئیس هیئت‌مدیره',
      roleEn: 'Chairman',
      discipline: 'leadership' as const,
      resumeFa: 'دکترای معماری...',
      order: 1,
      status: 'published' as const,
    },
    {
      id: 'tm_arch_ceo',
      nameFa: 'مهندس سارا کریمی',
      nameEn: 'Sara Karimi',
      roleFa: 'مدیرعامل دپارتمان معماری',
      roleEn: 'Architecture Managing Director',
      discipline: 'architecture-urbanism' as const,
      tier: 'director' as const,
      resumeFa: '۱۵ سال سابقه طراحی...',
      order: 2,
      status: 'published' as const,
    },
    {
      id: 'tm_arch_staff',
      nameFa: 'علی رضایی',
      nameEn: 'Ali Rezaei',
      roleFa: 'معمار طراح',
      roleEn: 'Architect',
      discipline: 'architecture-urbanism' as const,
      tier: 'specialist' as const,
      resumeFa: 'Should not trigger modal for specialist',
      order: 3,
      status: 'published' as const,
    },
    {
      id: 'tm_energy_ceo',
      nameFa: 'مهندس نیما تهرانی',
      nameEn: 'Nima Tehrani',
      roleFa: 'مدیرعامل دپارتمان انرژی',
      roleEn: 'Energy Managing Director',
      discipline: 'energy-mep' as const,
      tier: 'director' as const,
      bioFa: 'متخصص شبیه‌سازی انرژی',
      order: 4,
      status: 'published' as const,
    },
    {
      id: 'tm_draft_hidden',
      nameFa: 'عضو پیش‌نویس',
      nameEn: 'Draft Member',
      roleFa: 'مهندس سازه',
      roleEn: 'Structural Engineer',
      discipline: 'structure-seismic' as const,
      tier: 'specialist' as const,
      order: 5,
      status: 'draft' as const,
    },
  ];

  assert.equal(resolveMemberTier(sample[0]), 'ceo');
  assert.equal(resolveMemberTier(sample[1]), 'board');
  assert.equal(resolveMemberTier(sample[2]), 'specialist');
  assert.equal(hasPublicResume(sample[1]), true);
  assert.equal(hasPublicResume(sample[2]), false);
  assert.equal(hasPublicResume(sample[3]), true);

  const tree = buildTeamHierarchy(sample);
  assert.equal(tree.totalPublished, 4);
  assert.equal(tree.ceo.length, 1);
  assert.equal(tree.executiveBoard.length, 1);
  assert.equal(tree.departments.length, 3);
  assert.equal(tree.departments[0].slug, 'architecture-urbanism');
  assert.equal(tree.departments[0].board.length, 1);
  assert.equal(tree.departments[0].directors.length, 1);
  assert.equal(tree.departments[0].specialists.length, 1);
  assert.equal(tree.departments[0].skillGroups.length, 1);
  assert.equal(tree.departments[1].slug, 'energy-mep');
  assert.equal(tree.departments[1].board.length, 1);
  assert.equal(tree.departments[1].specialists.length, 0);
  assert.equal(tree.departments[2].slug, 'structure-seismic');
  assert.equal(tree.departments[2].totalCount, 0);

  assert.equal(getMemberMonogram('مهندس سارا کریمی'), 'سک');
  assert.equal(getMemberMonogram('Dr. Mehran Alavi'), 'MA');
});

test('IsbIcons provides all 68 bespoke minimal icons cleanly without lucide-react fallback', async () => {
  const { ISB_ICON_REGISTRY } = await import('../components/icons/IsbIcons.tsx');
  const entries = Object.entries(ISB_ICON_REGISTRY);
  assert.equal(entries.length, 68);
  for (const [name, IconComponent] of entries) {
    assert.equal(typeof IconComponent, 'function', `Icon ${name} must be a React component`);
  }
});

test('account route and accountLogic validate profiles, tickets, orders, completeness, and tracking codes', async () => {
  const faAccount = parseLocationPath('/fa/account');
  assert.equal(faAccount.locale, 'fa');
  assert.deepEqual(faAccount.route, { page: 'account' });
  assert.equal(buildPath('en', { page: 'account' }), '/en/account');
  assert.equal(switchLocaleInPath('/fa/account', 'en'), '/en/account');

  const {
    computeProfileCompleteness,
    formatTomanAmount,
    generateTrackingCode,
    validateAdminOrderForm,
    validateTicketForm,
    validateTicketReply,
    validateUserProfileForm,
  } = await import('./accountLogic.ts');

  const partial = computeProfileCompleteness({ fullName: 'سارا محمدی' });
  assert.equal(partial.percent, 20);
  assert.equal(partial.isCheckoutReady, false);

  const ready = computeProfileCompleteness({
    fullName: 'سارا محمدی',
    phone: '09151234567',
    city: 'مشهد',
    profession: 'معمار / طراح',
    nationalId: '0921234567',
    billingAddress: 'مشهد، بلوار سجاد، پلاک ۲۴',
  });
  assert.equal(ready.percent, 100);
  assert.equal(ready.isCheckoutReady, true);
  assert.equal(ready.missingFields.length, 0);

  const badProfile = validateUserProfileForm(
    {
      fullName: 'ا',
      phone: 'abc',
      nationalId: '12345',
      city: '',
      organization: '',
      profession: '',
      billingAddress: '',
    },
    'fa'
  );
  assert.equal(hasErrors(badProfile), true);
  assert.ok(badProfile.fullName);
  assert.ok(badProfile.phone);
  assert.ok(badProfile.nationalId);

  const goodProfile = validateUserProfileForm(
    {
      fullName: 'آرش کریمی',
      phone: '۰۹۱۵۱۲۳۴۵۶۷',
      nationalId: '۰۹۲۱۲۳۴۵۶۷',
      city: 'مشهد',
      organization: 'دفتر معماری پایدار',
      profession: 'معمار / طراح',
      billingAddress: 'مشهد، بلوار وکیل‌آباد',
    },
    'fa'
  );
  assert.equal(hasErrors(goodProfile), false);

  const badTicket = validateTicketForm(
    { subject: 'ab', category: 'courses', priority: 'normal', orderNumber: '', message: 'hi' },
    'en'
  );
  assert.equal(hasErrors(badTicket), true);
  assert.ok(badTicket.subject);
  assert.ok(badTicket.message);
  assert.ok(validateTicketReply(' ', 'fa'));
  assert.equal(validateTicketReply('ممنون از پاسخ شما', 'fa'), null);

  const badOrder = validateAdminOrderForm(
    {
      userId: '',
      itemType: 'course',
      titleFa: '',
      titleEn: '',
      amountToman: '-100',
      paymentStatus: 'pending',
      paymentGateway: 'manual',
      paymentRef: '',
      accessUrl: 'javascript:alert(1)',
      notes: '',
    },
    'fa'
  );
  assert.equal(hasErrors(badOrder), true);
  assert.ok(badOrder.userId);
  assert.ok(badOrder.amountToman);
  assert.ok(badOrder.accessUrl);

  assert.match(generateTrackingCode('ISB-TK'), /^ISB-TK-[A-Z0-9]{6}$/);
  assert.match(generateTrackingCode('ISB-OR'), /^ISB-OR-[A-Z0-9]{6}$/);
  assert.equal(formatTomanAmount(0, 'fa'), 'رایگان');
  assert.ok(formatTomanAmount(4500000, 'en').includes('4,500,000 Toman'));
});

test('courses route, search index, and admin-only studio visibility guard work accurately', async () => {
  const faCourses = parseLocationPath('/fa/courses');
  assert.equal(faCourses.locale, 'fa');
  assert.deepEqual(faCourses.route, { page: 'courses' });
  assert.equal(buildPath('en', { page: 'courses' }), '/en/courses');
  assert.equal(switchLocaleInPath('/fa/courses', 'en'), '/en/courses');

  const faCourseSearch = searchPublishedContent('دوره‌ها', 'fa', DISCIPLINES, SEED_PROJECTS, []);
  assert.ok(faCourseSearch.some((item) => item.id === 'page-courses'));

  const enCourseSearch = searchPublishedContent('academy', 'en', DISCIPLINES, SEED_PROJECTS, []);
  assert.ok(enCourseSearch.some((item) => item.id === 'page-courses'));

  const { isStudioAdminUser, STUDIO_ADMIN_EMAIL } = await import('./accountLogic.ts');
  assert.equal(STUDIO_ADMIN_EMAIL, 'isbgroup58@gmail.com');
  assert.equal(isStudioAdminUser(null), false);
  assert.equal(isStudioAdminUser({ email: 'visitor@gmail.com', emailVerified: true }), false);
  assert.equal(isStudioAdminUser({ email: 'isbgroup58@gmail.com', emailVerified: false }), false);
  assert.equal(isStudioAdminUser({ email: 'isbgroup58@gmail.com', emailVerified: true }), true);
  assert.equal(isStudioAdminUser({ email: ' ISBGroup58@gmail.com ', emailVerified: true }), true);
});

test('mergeCatalogCourses overrides seeds, hides deleted seeds, filters drafts, and validates course/checkout inputs', async () => {
  const { SEED_COURSES } = await import('../data/seedContent.ts');
  const {
    mergeCatalogCourses,
    parseSyllabusLines,
    validateCourseForm,
    validateMemberCheckoutForm,
    validatePaymentRefInput,
  } = await import('./accountLogic.ts');

  assert.equal(SEED_COURSES.length, 3);

  const editedSeed = {
    ...SEED_COURSES[0],
    id: SEED_COURSES[0].slug,
    titleFa: 'شبیه‌سازی انرژی و نور روز (نسخه ۱۴۰۵)',
    priceToman: 5200000,
    featuredOrder: 5,
    isSeedDefault: false,
  };
  const customPublished = {
    ...SEED_COURSES[1],
    id: 'crs_custom_1',
    slug: 'parametric-facade-design',
    titleFa: 'طراحی پارامتریک نما و اقلیم',
    titleEn: 'Parametric Climate Facade Design',
    featuredOrder: 0,
    status: 'published' as const,
    isSeedDefault: false,
  };
  const customDraft = {
    ...SEED_COURSES[2],
    id: 'crs_draft_1',
    slug: 'internal-draft-workshop',
    titleFa: 'کارگاه پیش‌نویس داخلی',
    titleEn: 'Internal Draft Workshop',
    featuredOrder: 9,
    status: 'draft' as const,
    isSeedDefault: false,
  };

  const publicMerged = mergeCatalogCourses(
    [editedSeed, customPublished, customDraft],
    SEED_COURSES,
    [SEED_COURSES[2].slug],
    false
  );
  assert.equal(publicMerged.length, 3);
  assert.equal(publicMerged[0].slug, 'parametric-facade-design');
  assert.equal(publicMerged[1].slug, SEED_COURSES[1].slug);
  assert.equal(publicMerged[2].slug, SEED_COURSES[0].slug);
  assert.equal(publicMerged[2].priceToman, 5200000);
  assert.equal(publicMerged.some((c) => c.slug === SEED_COURSES[2].slug), false);
  assert.equal(publicMerged.some((c) => c.slug === 'internal-draft-workshop'), false);

  const adminMerged = mergeCatalogCourses(
    [editedSeed, customPublished, customDraft],
    SEED_COURSES,
    [SEED_COURSES[2].slug],
    true
  );
  assert.equal(adminMerged.length, 4);
  assert.equal(adminMerged.some((c) => c.slug === 'internal-draft-workshop'), true);

  assert.deepEqual(
    parseSyllabusLines('فصل اول\n\n  فصل دوم  \nفصل سوم'),
    ['فصل اول', 'فصل دوم', 'فصل سوم']
  );

  const badCourse = validateCourseForm(
    {
      slug: 'دوره فارسی!',
      titleFa: 'ا',
      titleEn: '',
      summaryFa: 'کو',
      summaryEn: '',
      department: 'energy-mep',
      format: 'online-live',
      instructorFa: '',
      instructorEn: '',
      durationFa: '',
      durationEn: '',
      scheduleFa: '',
      scheduleEn: '',
      priceToman: '-500',
      originalPriceToman: '',
      coverImage: 'javascript:alert(1)',
      paymentUrl: 'javascript:void(0)',
      paymentNoteFa: '',
      paymentNoteEn: '',
      accessUrl: 'data:text/html,bad',
      syllabusFaText: '',
      syllabusEnText: '',
      capacity: '0',
      featuredOrder: 1,
      status: 'published',
    },
    'fa'
  );
  assert.equal(hasErrors(badCourse), true);
  assert.ok(badCourse.slug);
  assert.ok(badCourse.titleFa);
  assert.ok(badCourse.priceToman);
  assert.ok(badCourse.coverImage);
  assert.ok(badCourse.paymentUrl);
  assert.ok(badCourse.accessUrl);
  assert.ok(badCourse.capacity);

  const goodCourse = validateCourseForm(
    {
      slug: 'energy-modeling-pro',
      titleFa: 'دوره جامع مدلسازی انرژی',
      titleEn: 'Comprehensive Energy Modeling',
      summaryFa: 'آموزش عملی شبیه‌سازی انرژی، نور روز و آسایش حرارتی در پروژه‌های واقعی.',
      summaryEn: 'Hands-on building energy, daylight, and thermal comfort simulation workshop.',
      department: 'energy-mep',
      format: 'online-live',
      instructorFa: 'دکتر سارا آتشی گلستان',
      instructorEn: 'Dr. Sara Atashi Golestan',
      durationFa: '۳۲ ساعت',
      durationEn: '32 Hours',
      scheduleFa: 'پنجشنبه‌ها ۱۸ تا ۲۱',
      scheduleEn: 'Thursdays 18:00–21:00',
      priceToman: '۴۸۰۰۰۰۰',
      originalPriceToman: '۵۵۰۰۰۰۰',
      coverImage: '/assets/aistudio/energy-hero.webp',
      paymentUrl: 'https://zarinp.al/isb-energy-course',
      paymentNoteFa: 'پس از واریز، کد پیگیری را در همین صفحه ثبت کنید.',
      paymentNoteEn: 'Submit your transaction reference right after payment.',
      accessUrl: 'https://meet.google.com/abc-defg-hij',
      syllabusFaText: 'مبانی اقلیم\nمدلسازی EnergyPlus',
      syllabusEnText: 'Climate fundamentals\nEnergyPlus modeling',
      capacity: '25',
      featuredOrder: 1,
      status: 'published',
    },
    'fa'
  );
  assert.equal(hasErrors(goodCourse), false);

  const badCheckout = validateMemberCheckoutForm(
    {
      fullName: 'ا',
      phone: '123',
      city: '',
      organization: '',
      nationalId: '1234',
      notes: '',
    },
    'fa'
  );
  assert.equal(hasErrors(badCheckout), true);
  assert.ok(badCheckout.fullName);
  assert.ok(badCheckout.phone);
  assert.ok(badCheckout.city);
  assert.ok(badCheckout.nationalId);

  const goodCheckout = validateMemberCheckoutForm(
    {
      fullName: 'مهندس آرش حسینی',
      phone: '۰۹۱۵۱۲۳۴۵۶۷',
      city: 'مشهد',
      organization: 'دفتر فنی پایدار',
      nationalId: '۰۹۲۱۲۳۴۵۶۷',
      notes: 'درخواست صدور فاکتور رسمی',
    },
    'fa'
  );
  assert.equal(hasErrors(goodCheckout), false);

  assert.ok(validatePaymentRefInput('12', 'fa'));
  assert.equal(validatePaymentRefInput('۹۸۴۷۱۲۳۴۵۶', 'fa'), null);
  assert.equal(validatePaymentRefInput('ZP-883421', 'en'), null);
});

test('multi-provider auth helpers (Phone E.164, Email/Password, OTP, Password Strength) and 4-tier seed hierarchy work accurately', async () => {
  assert.equal(DEFAULT_SITE_SETTINGS.brandNameFa, 'گروه ساختمانی پایدار ایران زمین');

  const {
    evaluatePasswordStrength,
    mapMemberAuthError,
    normalizeIranPhoneToE164,
    validateEmailPasswordSignIn,
    validateEmailPasswordSignUp,
    validateOtpCode,
  } = await import('./accountLogic.ts');

  // Iran mobile normalization (Persian digits, 09..., 9..., 0098..., +98...)
  assert.equal(normalizeIranPhoneToE164('۰۹۱۵۱۲۱۳۰۰۵'), '+989151213005');
  assert.equal(normalizeIranPhoneToE164('0933 903 9563'), '+989339039563');
  assert.equal(normalizeIranPhoneToE164('9151213005'), '+989151213005');
  assert.equal(normalizeIranPhoneToE164('00989151213005'), '+989151213005');
  assert.equal(normalizeIranPhoneToE164('+989151213005'), '+989151213005');
  assert.equal(normalizeIranPhoneToE164('12345'), null);

  // OTP validation
  assert.equal(validateOtpCode('۱۲۳۴۵۶', 'fa'), null);
  assert.ok(validateOtpCode('1234', 'fa'));
  assert.ok(validateOtpCode('abcdef', 'en'));

  // Email/Password Sign-Up & Sign-In validation
  const badSignUp = validateEmailPasswordSignUp(
    {
      fullName: 'ا',
      email: 'not-email',
      password: '123',
      confirmPassword: '456',
      phone: '123',
    },
    'fa'
  );
  assert.equal(hasErrors(badSignUp), true);
  assert.ok(badSignUp.fullName);
  assert.ok(badSignUp.email);
  assert.ok(badSignUp.password);
  assert.ok(badSignUp.confirmPassword);
  assert.ok(badSignUp.phone);

  const goodSignUp = validateEmailPasswordSignUp(
    {
      fullName: 'مهندس سارا رضایی',
      email: 'sara.rezaei@example.com',
      password: 'IsbPassword2026!',
      confirmPassword: 'IsbPassword2026!',
      phone: '۰۹۱۵۱۲۳۴۵۶۷',
    },
    'fa'
  );
  assert.equal(hasErrors(goodSignUp), false);

  const badSignIn = validateEmailPasswordSignIn({ email: 'bad', password: '' }, 'en');
  assert.equal(hasErrors(badSignIn), true);
  assert.equal(
    hasErrors(validateEmailPasswordSignIn({ email: 'user@isb.ir', password: 'secret' }, 'en')),
    false
  );

  // Password strength meter
  assert.equal(evaluatePasswordStrength('').score, 0);
  assert.equal(evaluatePasswordStrength('abcdef').score, 1);
  assert.equal(evaluatePasswordStrength('StrongPass2026!').score, 4);

  // Auth error mapping for new providers
  assert.ok(mapMemberAuthError('auth/operation-not-allowed', 'fa').includes('کنسول Firebase'));
  assert.ok(mapMemberAuthError('auth/invalid-verification-code', 'en').includes('verification code'));
  assert.ok(mapMemberAuthError('auth/email-already-in-use', 'fa').includes('قبلاً'));

  // SEED_TEAM_MEMBERS verification: 1 Board/CEO, 4 Department Senior Leads, 2 Specialists, 1 Advisor, 1 Department Staff
  const { buildTeamHierarchy, resolveMemberTier } = await import('./teamTree.ts');
  const tree = buildTeamHierarchy(SEED_TEAM_MEMBERS);
  assert.equal(tree.ceo.length, 1);
  assert.equal(tree.totalBoard, 4);
  assert.equal(tree.totalSpecialists, 2);
  assert.equal(tree.totalAdvisors, 1);
  assert.equal(tree.totalStaff, 1);
  assert.equal(tree.departments[0].staff.length, 1);
  assert.equal(tree.departments[1].skillGroups.length, 1);
  assert.equal(tree.departments[1].advisors.length, 1);
  assert.equal(tree.departments[1].advisors[0].id, 'somayeh-amini-nasab');

  // Legacy Firestore override where CEO was saved under discipline='energy-mep' & tier=undefined
  const legacyCeoRecord = {
    ...SEED_TEAM_MEMBERS[0],
    id: 'tm_legacy_ceo',
    nameFa: 'دکتر آتشی گلستان',
    roleFa: 'مدیر عامل',
    roleEn: 'CEO',
    discipline: 'energy-mep' as const,
    tier: undefined,
  };
  const legacySpecialistRecord = {
    id: 'tm_legacy_ramezani',
    nameFa: 'زهرا رمضانی',
    nameEn: 'Zahra Ramezani',
    roleFa: 'ارشد معماری',
    roleEn: 'Senior Architect',
    discipline: 'energy-mep' as const,
    tier: undefined,
    order: 8,
    status: 'published' as const,
  };
  assert.equal(resolveMemberTier(legacyCeoRecord), 'ceo');
  const mergedWithLegacyCeo = mergeTeamMembers(SEED_TEAM_MEMBERS, [
    legacyCeoRecord,
    legacySpecialistRecord,
  ]);
  const legacyTree = buildTeamHierarchy(mergedWithLegacyCeo);
  assert.equal(legacyTree.ceo.length, 1);
  assert.equal(legacyTree.ceo[0].nameFa, 'دکتر آتشی گلستان');
  assert.equal(
    legacyTree.departments[1].board.some((m) => m.nameFa.includes('آتشی')),
    false
  );
  assert.equal(
    legacyTree.departments[1].specialists.some((m) => m.nameFa.includes('زهرا رمضانی')),
    true
  );
});

test('partner logo validation and catalog merge support custom uploads, overrides, hiding seeds, and draft filtering', () => {
  assert.equal(SEED_PARTNER_LOGOS.length, 16);

  const badPartner = validatePartnerLogoForm(
    {
      nameFa: 'ا',
      nameEn: '',
      descriptionFa: 'ت'.repeat(245),
      descriptionEn: 'a'.repeat(245),
      logoUrl: 'javascript:alert(1)',
      websiteUrl: 'javascript:void(0)',
      order: -1,
    },
    'fa'
  );
  assert.equal(hasErrors(badPartner), true);
  assert.ok(badPartner.nameFa);
  assert.ok(badPartner.nameEn);
  assert.ok(badPartner.descriptionFa);
  assert.ok(badPartner.descriptionEn);
  assert.ok(badPartner.logoUrl);
  assert.ok(badPartner.websiteUrl);
  assert.ok(badPartner.order);

  const goodPartner = validatePartnerLogoForm(
    {
      nameFa: 'گروه مهندسی آرمان',
      nameEn: 'Arman Engineering Group',
      descriptionFa: 'همکار مهندسی در بهینه‌سازی انرژی و طراحی سیستم‌های تأسیسات ساختمانی.',
      descriptionEn: 'Engineering partner for energy optimization and building MEP design.',
      logoUrl: 'media://med_1710000000_logo01',
      websiteUrl: 'https://arman-eng.ir',
      order: 1,
    },
    'fa'
  );
  assert.equal(hasErrors(goodPartner), false);

  const mergedPublic = mergePartnerLogos(
    SEED_PARTNER_LOGOS,
    [
      {
        id: 'isoletco',
        nameFa: 'ایزولتکو (لوگوی رسمی)',
        nameEn: 'ISOLETCO Official',
        logoUrl: 'media://med_isoletco_png',
        order: 1,
        status: 'published',
      },
      {
        id: 'ptn_custom_new',
        nameFa: 'شرکت جدید همکار',
        nameEn: 'New Partner Co',
        logoUrl: 'media://med_new_logo',
        order: 0,
        status: 'published',
      },
      {
        id: 'ptn_draft_only',
        nameFa: 'حامی پیش‌نویس',
        nameEn: 'Draft Sponsor',
        order: 99,
        status: 'draft',
      },
    ],
    ['parin-beton'],
    false
  );

  // 16 seeds - 1 hidden ('parin-beton') + 1 new published ('ptn_custom_new') = 16; draft excluded
  assert.equal(mergedPublic.length, 16);
  assert.equal(mergedPublic[0].id, 'ptn_custom_new');
  assert.equal(mergedPublic[1].id, 'isoletco');
  assert.equal(mergedPublic[1].logoUrl, 'media://med_isoletco_png');
  assert.equal(mergedPublic[1].isSeedDefault, false);
  // Seed descriptions remain preserved when Firestore override omits them
  assert.ok((mergedPublic[1].descriptionFa ?? '').length > 10);
  assert.ok((mergedPublic[1].descriptionEn ?? '').length > 10);
  assert.equal(
    mergedPublic.some((p) => p.id === 'parin-beton'),
    false
  );
  assert.equal(
    mergedPublic.some((p) => p.id === 'ptn_draft_only'),
    false
  );

  const mergedAdmin = mergePartnerLogos(
    SEED_PARTNER_LOGOS,
    [
      {
        id: 'ptn_draft_only',
        nameFa: 'حامی پیش‌نویس',
        nameEn: 'Draft Sponsor',
        order: 99,
        status: 'draft',
      },
    ],
    ['parin-beton'],
    true
  );
  assert.equal(mergedAdmin.length, 16);
  assert.equal(
    mergedAdmin.some((p) => p.id === 'ptn_draft_only'),
    true
  );
});

test('lifetime course classroom access resolver retains links permanently for paid orders while strictly gating unpaid orders', async () => {
  const {
    formatAccessUrlDisplay,
    resolveOrderCourse,
    resolveOrderLifetimeAccessUrl,
  } = await import('./accountLogic.ts');

  const catalog = [
    {
      id: 'crs_energy_19',
      slug: 'energy-code-19',
      titleFa: 'دوره جامع شبیه‌سازی انرژی و مبحث ۱۹',
      titleEn: 'Building Energy Simulation & Code 19',
      summaryFa: 'آموزش جامع انرژی',
      summaryEn: 'Comprehensive energy training',
      department: 'energy-mep' as const,
      format: 'online-live' as const,
      instructorFa: 'دکتر سارا آتشی گلستان',
      instructorEn: 'Dr. Sara Atashi Golestan',
      durationFa: '۲۴ ساعت',
      durationEn: '24 Hours',
      priceToman: 0,
      coverImage: '/assets/aistudio/energy-hero.webp',
      accessUrl: 'https://meet.google.com/isb-energy-class',
      syllabusFa: [],
      syllabusEn: [],
      featuredOrder: 1,
      status: 'published' as const,
    },
    {
      id: 'crs_seismic_pro',
      slug: 'seismic-retrofitting',
      titleFa: 'کارگاه بهسازی لرزه‌ای سازه‌ها',
      titleEn: 'Seismic Retrofitting Workshop',
      summaryFa: 'بهسازی لرزه‌ای',
      summaryEn: 'Seismic retrofitting',
      department: 'structure-seismic' as const,
      format: 'recorded' as const,
      instructorFa: 'دکتر حمیدرضا قربانی',
      instructorEn: 'Dr. Hamidreza Ghorbani',
      durationFa: '۱۶ ساعت',
      durationEn: '16 Hours',
      priceToman: 4500000,
      coverImage: '/assets/aistudio/seismic-hero.webp',
      accessUrl: 'https://skyroom.online/ch/isbgroup/seismic-pro',
      syllabusFa: [],
      syllabusEn: [],
      featuredOrder: 2,
      status: 'published' as const,
    },
  ];

  // 1. Existing paid order WITHOUT order.accessUrl (e.g. free course or pre-fix paid order) -> resolves live course link permanently!
  assert.equal(
    resolveOrderLifetimeAccessUrl(
      {
        paymentStatus: 'paid',
        courseId: 'crs_energy_19',
        titleFa: 'دوره جامع شبیه‌سازی انرژی و مبحث ۱۹',
        titleEn: 'Building Energy Simulation & Code 19',
      },
      catalog
    ),
    'https://meet.google.com/isb-energy-class'
  );

  // 2. Legacy paid order lacking BOTH courseId and order.accessUrl -> matches by normalized titleFa/titleEn!
  assert.equal(
    resolveOrderLifetimeAccessUrl(
      {
        paymentStatus: 'paid',
        titleFa: 'کارگاه بهسازی لرزه ای سازه ها',
        titleEn: 'Seismic Retrofitting Workshop',
      },
      catalog
    ),
    'https://skyroom.online/ch/isbgroup/seismic-pro'
  );

  // 3. Persisted order.accessUrl survives even when course is later removed/unpublished from catalog!
  assert.equal(
    resolveOrderLifetimeAccessUrl(
      {
        paymentStatus: 'paid',
        accessUrl: 'https://lms.isbgroup.ir/archive/cohort-04',
        courseId: 'crs_deleted_course',
        titleFa: 'دوره آرشیو شده',
        titleEn: 'Archived Course',
      },
      catalog
    ),
    'https://lms.isbgroup.ir/archive/cohort-04'
  );

  // 4. Unpaid orders (pending / cancelled / refunded) NEVER expose classroom access URLs
  for (const blockedStatus of ['pending', 'cancelled', 'refunded'] as const) {
    assert.equal(
      resolveOrderLifetimeAccessUrl(
        {
          paymentStatus: blockedStatus,
          accessUrl: 'https://meet.google.com/should-not-leak',
          courseId: 'crs_energy_19',
          titleFa: 'دوره جامع شبیه‌سازی انرژی و مبحث ۱۹',
          titleEn: 'Building Energy Simulation & Code 19',
        },
        catalog
      ),
      undefined
    );
  }

  // 5. Rejects unsafe javascript: URLs even on paid orders and falls back to safe course link
  assert.equal(
    resolveOrderLifetimeAccessUrl(
      {
        paymentStatus: 'paid',
        accessUrl: 'javascript:alert(1)',
        courseId: 'crs_energy_19',
        titleFa: 'دوره جامع شبیه‌سازی انرژی و مبحث ۱۹',
        titleEn: 'Building Energy Simulation & Code 19',
      },
      catalog
    ),
    'https://meet.google.com/isb-energy-class'
  );

  // 6. Course lookup by slug & display URL formatting
  assert.equal(
    resolveOrderCourse(
      { courseId: 'seismic-retrofitting', titleFa: 'عنوان دیگر', titleEn: 'Other' },
      catalog
    )?.id,
    'crs_seismic_pro'
  );
  assert.equal(
    formatAccessUrlDisplay('https://meet.google.com/isb-energy-class'),
    'meet.google.com/isb-energy-class'
  );
});

test('validateAssessmentForm accepts Persian/Arabic floor area digits and assessmentGoalOptions include concise labels and briefs', async () => {
  const { getCopy } = await import('../data/translations.ts');

  const persianAreaValid = validateAssessmentForm(
    {
      fullName: 'مهندس سارا کریمی',
      email: 'sara@studio.ir',
      phone: '',
      organization: '',
      projectType: 'office',
      city: 'مشهد',
      approximateFloorAreaSqm: '۴٬۵۰۰',
      projectStage: 'schematic',
      assessmentGoals: ['daylight', 'saro-sabz'],
      notes: '',
    },
    'fa'
  );
  assert.equal(hasErrors(persianAreaValid), false);

  const persianAreaTooSmall = validateAssessmentForm(
    {
      fullName: 'مهندس سارا کریمی',
      email: 'sara@studio.ir',
      phone: '',
      organization: '',
      projectType: 'office',
      city: 'مشهد',
      approximateFloorAreaSqm: '۵',
      projectStage: 'schematic',
      assessmentGoals: ['daylight'],
      notes: '',
    },
    'fa'
  );
  assert.equal(hasErrors(persianAreaTooSmall), true);
  assert.ok(persianAreaTooSmall.approximateFloorAreaSqm);

  for (const loc of ['fa', 'en'] as const) {
    const opts = getCopy(loc).assessmentGoalOptions;
    assert.equal(opts.length, 6);
    for (const opt of opts) {
      assert.ok(opt.label.trim().length > 0 && opt.label.trim().length <= 24);
      assert.ok(opt.brief.trim().length >= 15 && opt.brief.trim().length <= 160);
    }
  }
});

test('teamTree resolves 3 CEOs, 2 Inspectors (explicit and role-inferred), and vertical department seniorLeads + departmentMembers', async () => {
  const { buildTeamHierarchy, hasPublicResume, resolveMemberTier } = await import('./teamTree.ts');

  const roster = [
    {
      id: 'ceo-1',
      nameFa: 'مدیرعامل اول',
      nameEn: 'CEO One',
      roleFa: 'مدیرعامل',
      roleEn: 'Chief Executive Officer',
      discipline: 'leadership' as const,
      tier: 'ceo' as const,
      bioFa: 'سابقه مدیریت اجرایی',
      order: 1,
      status: 'published' as const,
    },
    {
      id: 'ceo-2',
      nameFa: 'مدیرعامل دوم',
      nameEn: 'CEO Two',
      roleFa: 'مدیرعامل',
      roleEn: 'Chief Executive Officer',
      discipline: 'leadership' as const,
      tier: 'ceo' as const,
      order: 2,
      status: 'published' as const,
    },
    {
      id: 'ceo-3',
      nameFa: 'مدیرعامل سوم',
      nameEn: 'CEO Three',
      roleFa: 'مدیرعامل',
      roleEn: 'Chief Executive Officer',
      discipline: 'leadership' as const,
      tier: 'ceo' as const,
      order: 3,
      status: 'published' as const,
    },
    {
      id: 'insp-1',
      nameFa: 'بازرس اول',
      nameEn: 'Inspector One',
      roleFa: 'بازرس',
      roleEn: 'Inspector',
      discipline: 'leadership' as const,
      tier: 'inspector' as const,
      bioFa: 'بازرس قانونی شرکت',
      order: 4,
      status: 'published' as const,
    },
    {
      id: 'insp-2',
      nameFa: 'بازرس دوم',
      nameEn: 'Inspector Two',
      roleFa: 'بازرس علی‌البدل',
      roleEn: 'Alternate Inspector',
      discipline: 'leadership' as const,
      tier: undefined,
      order: 5,
      status: 'published' as const,
    },
    {
      id: 'arch-lead',
      nameFa: 'راهبر معماری',
      nameEn: 'Architecture Senior Lead',
      roleFa: 'راهبر ارشد دپارتمان معماری',
      roleEn: 'Senior Architecture Lead',
      discipline: 'architecture-urbanism' as const,
      tier: 'board' as const,
      resumeFa: 'سوابق معماری',
      order: 6,
      status: 'published' as const,
    },
    {
      id: 'arch-sp',
      nameFa: 'متخصص معماری',
      nameEn: 'Architecture Specialist',
      roleFa: 'متخصص BIM',
      roleEn: 'BIM Specialist',
      discipline: 'architecture-urbanism' as const,
      tier: 'specialist' as const,
      order: 7,
      status: 'published' as const,
    },
    {
      id: 'arch-mem',
      nameFa: 'عضو معماری',
      nameEn: 'Architecture Member',
      roleFa: 'کارشناس معماری',
      roleEn: 'Architectural Designer',
      discipline: 'architecture-urbanism' as const,
      tier: 'member' as const,
      order: 8,
      status: 'published' as const,
    },
    {
      id: 'arch-adv',
      nameFa: 'مشاور معماری',
      nameEn: 'Architecture Advisor',
      roleFa: 'مشاور تخصصی نمای سبز',
      roleEn: 'Facade Sustainability Advisor',
      discipline: 'architecture-urbanism' as const,
      tier: 'advisor' as const,
      bioFa: 'مشاور ارشد اقلیم و نمای پایدار',
      order: 9,
      status: 'published' as const,
    },
    {
      id: 'grp-adv',
      nameFa: 'مشاور حقوقی گروه',
      nameEn: 'Group Legal Advisor',
      roleFa: 'مشاور قراردادهای فنی',
      roleEn: 'Technical Contracts Consultant',
      discipline: 'leadership' as const,
      tier: undefined,
      order: 10,
      status: 'published' as const,
    },
  ];

  assert.equal(resolveMemberTier(roster[3]), 'inspector');
  assert.equal(resolveMemberTier(roster[4]), 'inspector');
  assert.equal(resolveMemberTier(roster[8]), 'advisor');
  assert.equal(resolveMemberTier(roster[9]), 'advisor');
  assert.equal(hasPublicResume(roster[0]), true);
  assert.equal(hasPublicResume(roster[3]), true);
  assert.equal(hasPublicResume(roster[5]), true);
  assert.equal(hasPublicResume(roster[7]), false);
  assert.equal(hasPublicResume(roster[8]), true);

  const tree = buildTeamHierarchy(roster);
  assert.equal(tree.ceos.length, 3);
  assert.equal(tree.inspectors.length, 2);
  assert.equal(tree.totalInspectors, 2);
  assert.equal(tree.totalAdvisors, 2);
  assert.equal(tree.departments[0].seniorLeads.length, 1);
  assert.equal(tree.departments[0].departmentMembers.length, 2);
  assert.equal(tree.departments[0].departmentMembers[0].id, 'arch-sp');
  assert.equal(tree.departments[0].departmentMembers[1].id, 'arch-mem');
  assert.equal(tree.departments[0].advisors.length, 1);
  assert.equal(tree.departments[0].advisors[0].id, 'arch-adv');
  assert.equal(tree.generalAdvisors.length, 1);
  assert.equal(tree.generalAdvisors[0].id, 'grp-adv');
});

test('partner portrait slider window shows 5 cards per view on desktop and keeps final slide full without gaps', async () => {
  const { computePartnerSliderWindow, resolvePartnerCardsPerView } = await import('./teamTree.ts');

  assert.equal(resolvePartnerCardsPerView(1440), 5);
  assert.equal(resolvePartnerCardsPerView(1024), 5);
  assert.equal(resolvePartnerCardsPerView(820), 3);
  assert.equal(resolvePartnerCardsPerView(600), 2);
  assert.equal(resolvePartnerCardsPerView(390), 1);

  // 16 partners, 5 per view -> 4 slides; final slide anchors at [11..16) so 5 cards always fill the row
  const s0 = computePartnerSliderWindow(16, 5, 0);
  assert.deepEqual(s0, {
    totalPages: 4,
    pageIndex: 0,
    startIndex: 0,
    endIndex: 5,
    canPrev: false,
    canNext: true,
  });

  const s1 = computePartnerSliderWindow(16, 5, 1);
  assert.equal(s1.startIndex, 5);
  assert.equal(s1.endIndex, 10);
  assert.equal(s1.canPrev, true);
  assert.equal(s1.canNext, true);

  const sLast = computePartnerSliderWindow(16, 5, 99);
  assert.deepEqual(sLast, {
    totalPages: 4,
    pageIndex: 3,
    startIndex: 11,
    endIndex: 16,
    canPrev: true,
    canNext: false,
  });

  // 20 partners, 5 per view -> 4 exact pages
  const s20Last = computePartnerSliderWindow(20, 5, 3);
  assert.equal(s20Last.totalPages, 4);
  assert.equal(s20Last.startIndex, 15);
  assert.equal(s20Last.endIndex, 20);

  // Fewer items than perView -> single page, no navigation arrows
  const sSmall = computePartnerSliderWindow(3, 5, 0);
  assert.equal(sSmall.totalPages, 1);
  assert.equal(sSmall.startIndex, 0);
  assert.equal(sSmall.endIndex, 3);
  assert.equal(sSmall.canPrev, false);
  assert.equal(sSmall.canNext, false);
});

test('seo engine generates unique bilingual metadata, hreflang paths, robots directives, and Schema.org JSON-LD graphs per route', async () => {
  const { buildRouteSeoMetadata } = await import('./seo.ts');
  const { SEED_COURSES, SEED_INSIGHTS } = await import('../data/seedContent.ts');
  const origin = 'https://isbgroup.ir';

  const homeFa = buildRouteSeoMetadata({
    locale: 'fa',
    route: { page: 'home' },
    origin,
    settings: DEFAULT_SITE_SETTINGS,
    projects: SEED_PROJECTS,
    insights: SEED_INSIGHTS,
    courses: SEED_COURSES,
  });
  assert.equal(homeFa.canonicalPath, '/fa');
  assert.equal(homeFa.faPath, '/fa');
  assert.equal(homeFa.enPath, '/en');
  assert.equal(homeFa.ogLocale, 'fa_IR');
  assert.equal(homeFa.ogAlternateLocale, 'en_US');
  assert.match(homeFa.robots, /index, follow/);
  const homeGraph = homeFa.jsonLd['@graph'] as Array<Record<string, unknown>>;
  assert.ok(homeGraph.some((n) => n['@type'] === 'ProfessionalService'));
  assert.ok(homeGraph.some((n) => n['@type'] === 'WebSite'));

  const aboutEn = buildRouteSeoMetadata({
    locale: 'en',
    route: { page: 'about' },
    origin,
    settings: DEFAULT_SITE_SETTINGS,
    projects: SEED_PROJECTS,
    insights: SEED_INSIGHTS,
    courses: SEED_COURSES,
  });
  assert.equal(aboutEn.canonicalPath, '/en/about');
  assert.equal(aboutEn.faPath, '/fa/about');
  assert.equal(aboutEn.ogLocale, 'en_US');
  assert.notEqual(aboutEn.description, homeFa.description);
  const aboutGraph = aboutEn.jsonLd['@graph'] as Array<Record<string, unknown>>;
  assert.ok(aboutGraph.some((n) => n['@type'] === 'BreadcrumbList'));

  const projMeta = buildRouteSeoMetadata({
    locale: 'fa',
    route: { page: 'project-detail', slug: SEED_PROJECTS[0].slug },
    origin,
    settings: DEFAULT_SITE_SETTINGS,
    projects: SEED_PROJECTS,
    insights: SEED_INSIGHTS,
    courses: SEED_COURSES,
  });
  assert.ok(projMeta.title.includes(SEED_PROJECTS[0].titleFa));
  assert.ok(projMeta.description.length > 20 && projMeta.description.length <= 160);
  const projGraph = projMeta.jsonLd['@graph'] as Array<Record<string, unknown>>;
  assert.ok(projGraph.some((n) => n['@type'] === 'CreativeWork'));

  const coursesMeta = buildRouteSeoMetadata({
    locale: 'fa',
    route: { page: 'courses' },
    origin,
    settings: DEFAULT_SITE_SETTINGS,
    projects: SEED_PROJECTS,
    insights: SEED_INSIGHTS,
    courses: SEED_COURSES,
  });
  const coursesGraph = coursesMeta.jsonLd['@graph'] as Array<Record<string, unknown>>;
  assert.ok(coursesGraph.some((n) => n['@type'] === 'ItemList'));

  const sampleInsight = {
    id: 'ins-sample-1',
    slug: 'passive-cooling-mashhad',
    titleFa: 'اصول سرمایش غیرفعال در اقلیم سرد و خشک مشهد',
    titleEn: 'Passive Cooling Principles in Semi-Arid Mashhad Climate',
    excerptFa: 'بررسی راهکارهای کاهش بار سرمایشی با طراحی پوسته و سایه‌بان اقلیمی.',
    excerptEn: 'Reducing cooling loads through envelope optimization and solar shading.',
    bodyFa: 'متن کامل مقاله فنی.',
    bodyEn: 'Full technical article body.',
    topic: 'energy-mep' as const,
    publishedDate: '2026-02-15',
    status: 'published' as const,
  };

  const insightMeta = buildRouteSeoMetadata({
    locale: 'fa',
    route: { page: 'insight-detail', slug: sampleInsight.slug },
    origin,
    settings: DEFAULT_SITE_SETTINGS,
    projects: SEED_PROJECTS,
    insights: [sampleInsight],
    courses: SEED_COURSES,
  });
  assert.equal(insightMeta.ogType, 'article');
  const insightGraph = insightMeta.jsonLd['@graph'] as Array<Record<string, unknown>>;
  assert.ok(insightGraph.some((n) => n['@type'] === 'Article'));

  const accountMeta = buildRouteSeoMetadata({
    locale: 'fa',
    route: { page: 'account' },
    origin,
    settings: DEFAULT_SITE_SETTINGS,
    projects: SEED_PROJECTS,
    insights: SEED_INSIGHTS,
    courses: SEED_COURSES,
  });
  assert.equal(accountMeta.robots, 'noindex, nofollow');

  const studioMeta = buildRouteSeoMetadata({
    locale: 'en',
    route: { page: 'studio' },
    origin,
    settings: DEFAULT_SITE_SETTINGS,
    projects: SEED_PROJECTS,
    insights: SEED_INSIGHTS,
    courses: SEED_COURSES,
  });
  assert.equal(studioMeta.robots, 'noindex, nofollow');
});

test('insightBlocks editorial engine sanitizes media, computes Telegram mosaics, parses formatting, and merges catalogs', async () => {
  const { SEED_INSIGHTS } = await import('../data/seedContent.ts');
  const {
    computeTelegramMosaicLayout,
    countInsightMedia,
    createInsightBlock,
    createTemplateBlocks,
    estimateReadingTimeMinutes,
    extractPlainTextFromBlocks,
    extractTableOfContents,
    mergeCatalogInsights,
    parseFormattedText,
    sanitizeInsightBlocks,
  } = await import('./insightBlocks.ts');

  // 1. Flagship seed articles have rich blocks, covers, and valid Telegram mosaics
  assert.equal(SEED_INSIGHTS.length, 2);
  assert.equal(SEED_INSIGHTS[0].featured, true);
  assert.ok((SEED_INSIGHTS[0].blocks?.length ?? 0) >= 6);
  assert.ok(countInsightMedia(SEED_INSIGHTS[0]) >= 4);
  assert.ok(estimateReadingTimeMinutes(SEED_INSIGHTS[0], 'fa') >= 1);

  const toc = extractTableOfContents(SEED_INSIGHTS[0].blocks, 'fa');
  assert.equal(toc.length, 2);
  assert.equal(toc[0].indexLabel, '01');
  assert.equal(toc[1].indexLabel, '02');

  // 2. Templates and block factories
  assert.equal(createTemplateBlocks('blank').length, 1);
  assert.equal(createTemplateBlocks('telegram-report').length, 5);
  assert.equal(createTemplateBlocks('slide-deck').length, 4);
  assert.equal(createInsightBlock('telegram-media-post').mediaLayout, 'mosaic');
  assert.equal(createInsightBlock('telegram-media-post').textPosition, 'below');

  // 3. Sanitization strips XSS/SVG image URLs and caps media items cleanly
  const dirtyBlocks = [
    {
      id: 'tg-dirty',
      type: 'telegram-media-post',
      headingFa: 'گزارش تصویری',
      bodyFa: 'متن همراه **تصاویر**',
      mediaLayout: 'mosaic',
      textPosition: 'above',
      media: [
        { url: 'javascript:alert(1)', captionFa: 'bad' },
        { url: 'data:image/svg+xml;base64,PHN2Zz4=', captionFa: 'svg bad' },
        { url: 'media://med_1710000000_ok01', captionFa: 'تصویر اول' },
        { url: '/assets/aistudio/catalogue/mehregan-cover.webp', captionFa: 'تصویر دوم' },
      ],
    },
    {
      id: 'empty-drop',
      type: 'rich-text',
      bodyFa: '   ',
      bodyEn: '',
    },
  ];
  const sanitized = sanitizeInsightBlocks(dirtyBlocks);
  assert.equal(sanitized.length, 1);
  assert.equal(sanitized[0].media?.length, 2);
  assert.equal(sanitized[0].textPosition, 'above');

  // 4. Plain-text extraction strips markdown markers
  const plainFa = extractPlainTextFromBlocks(sanitized, 'fa');
  assert.ok(plainFa.includes('گزارش تصویری'));
  assert.ok(plainFa.includes('متن همراه تصاویر'));
  assert.equal(plainFa.includes('**'), false);

  // 5. Telegram mosaic layout math covers 1..6 items across all 3 layout presets
  for (let n = 1; n <= 6; n += 1) {
    const mosaic = computeTelegramMosaicLayout(n, 'mosaic');
    assert.equal(mosaic.itemClasses.length, n);
    const feature = computeTelegramMosaicLayout(n, 'feature-split');
    assert.equal(feature.itemClasses.length, n);
    const strip = computeTelegramMosaicLayout(n, 'filmstrip');
    assert.equal(strip.itemClasses.length, n);
  }
  assert.ok(computeTelegramMosaicLayout(3, 'mosaic').itemClasses[0].includes('sm:row-span-2'));

  // 6. Safe inline formatting tokenizer handles bold, italic, and bullet lists
  const segments = parseFormattedText('پاراگراف با **متن بولد** و *ایتالیک*.\n- مورد اول با **تأکید**\n- مورد دوم');
  assert.equal(segments.length, 2);
  assert.equal(segments[0].kind, 'paragraph');
  if (segments[0].kind === 'paragraph') {
    assert.ok(segments[0].runs.some((r) => r.bold && r.text === 'متن بولد'));
    assert.ok(segments[0].runs.some((r) => r.italic && r.text === 'ایتالیک'));
  }
  assert.equal(segments[1].kind, 'bullet-list');
  if (segments[1].kind === 'bullet-list') {
    assert.equal(segments[1].items.length, 2);
  }

  // 7. Catalog merge overrides seeds, hides deleted seeds, filters drafts, and ranks featured first
  const draftCustom = {
    ...SEED_INSIGHTS[1],
    id: 'ins_draft',
    slug: 'internal-draft-note',
    titleFa: 'پیش‌نویس داخلی',
    featured: false,
    status: 'draft' as const,
  };
  const publicMerged = mergeCatalogInsights(
    SEED_INSIGHTS,
    [draftCustom],
    [SEED_INSIGHTS[1].slug],
    false
  );
  assert.equal(publicMerged.length, 1);
  assert.equal(publicMerged[0].slug, SEED_INSIGHTS[0].slug);

  const adminMerged = mergeCatalogInsights(
    SEED_INSIGHTS,
    [draftCustom],
    [SEED_INSIGHTS[1].slug],
    true
  );
  assert.equal(adminMerged.length, 2);
  assert.equal(adminMerged[0].featured, true);
  assert.ok(adminMerged.some((a) => a.slug === 'internal-draft-note'));

  // 8. Rich insight form validation accepts valid cover + blocks and rejects unsafe cover
  const badCover = validateInsightForm(
    {
      slug: 'rich-study',
      titleFa: 'عنوان مقاله',
      titleEn: 'Article Title',
      excerptFa: 'چکیده فارسی مقاله',
      excerptEn: 'Article excerpt',
      bodyFa: '',
      bodyEn: '',
      coverImage: 'javascript:alert(1)',
      hasRichBlocks: true,
    },
    'fa'
  );
  assert.equal(hasErrors(badCover), true);
  assert.ok(badCover.coverImage);

  const goodRich = validateInsightForm(
    {
      slug: 'rich-study',
      titleFa: 'عنوان مقاله',
      titleEn: 'Article Title',
      excerptFa: 'چکیده فارسی مقاله',
      excerptEn: 'Article excerpt',
      bodyFa: 'متن',
      bodyEn: 'Body',
      coverImage: 'media://med_1710000000_cover',
      hasRichBlocks: true,
    },
    'fa'
  );
  assert.equal(hasErrors(goodRich), false);
});

test('Telegraph fast-track helpers auto-fill slug/excerpt for Persian-only posts, preserve translations, and insert/move blocks', async () => {
  const {
    createInsightBlock,
    insertBlockAt,
    moveBlockByOffset,
    prepareTelegraphInsightDraft,
    stripInlineMarkdown,
  } = await import('./insightBlocks.ts');

  assert.equal(
    stripInlineMarkdown('**نور روز** و *بهره‌وری*:\n- نکته اول\n- نکته دوم'),
    'نور روز و بهره‌وری: نکته اول نکته دوم'
  );

  // 1. Single-language Persian fast publish (no slug, no English, no excerpt)
  const b1 = {
    ...createInsightBlock('rich-text'),
    bodyFa: 'پوسته **عایق حرارتی** مصرف انرژی ساختمان را تا ۶۰ درصد کاهش می‌دهد.',
  };
  const b2 = {
    ...createInsightBlock('telegram-media-post'),
    media: [{ url: '/assets/gallery-1.webp', captionFa: 'نمای پروژه' }],
    bodyFa: 'گزارش تصویری پروژه مهرگان',
  };

  const fastFa = prepareTelegraphInsightDraft(
    {
      slug: '',
      titleFa: 'راهنمای سریع معماری پایدار در مشهد',
      titleEn: '',
      subtitleFa: '',
      subtitleEn: '',
      excerptFa: '',
      excerptEn: '',
      bodyFa: '',
      bodyEn: '',
      coverImage: '',
      publishedDate: '2026-11-24',
      blocks: [b1, b2],
    },
    'x9k2'
  );

  assert.equal(fastFa.slug, 'article-20261124-x9k2');
  assert.equal(fastFa.titleFa, 'راهنمای سریع معماری پایدار در مشهد');
  assert.equal(fastFa.titleEn, 'راهنمای سریع معماری پایدار در مشهد');
  assert.ok(fastFa.excerptFa.includes('پوسته عایق حرارتی'));
  assert.equal(fastFa.excerptFa.includes('**'), false);
  assert.equal(fastFa.hasAnyContent, true);
  assert.equal(fastFa.cleanBlocks.length, 2);

  // Must pass strict validateInsightForm without any manual English/slug filling
  const validation = validateInsightForm(
    {
      slug: fastFa.slug,
      titleFa: fastFa.titleFa,
      titleEn: fastFa.titleEn,
      excerptFa: fastFa.excerptFa,
      excerptEn: fastFa.excerptEn,
      bodyFa: fastFa.bodyFa,
      bodyEn: fastFa.bodyEn,
      hasRichBlocks: fastFa.cleanBlocks.length > 0,
    },
    'fa'
  );
  assert.equal(hasErrors(validation), false);

  // 2. Explicit bilingual inputs & English slug derivation are preserved
  const bilingual = prepareTelegraphInsightDraft({
    slug: '',
    titleFa: 'معماری صنعتی پایدار',
    titleEn: 'Sustainable Industrial Architecture',
    subtitleFa: 'زیرعنوان فارسی',
    subtitleEn: 'English subtitle',
    excerptFa: 'چکیده دقیق فارسی',
    excerptEn: 'Exact English excerpt',
    bodyFa: '',
    bodyEn: '',
    coverImage: '',
    publishedDate: '2026-11-24',
    blocks: [b1],
  });
  assert.equal(bilingual.slug, 'sustainable-industrial-architecture');
  assert.equal(bilingual.titleEn, 'Sustainable Industrial Architecture');
  assert.equal(bilingual.excerptEn, 'Exact English excerpt');

  // 3. Inline insertion and block reordering
  const b3 = createInsightBlock('quote');
  const inserted = insertBlockAt([b1, b2], 1, b3);
  assert.equal(inserted.length, 3);
  assert.equal(inserted[1].id, b3.id);

  const movedUp = moveBlockByOffset(inserted, 1, -1);
  assert.equal(movedUp[0].id, b3.id);
  assert.equal(movedUp[1].id, b1.id);

  // Out-of-bounds move is a safe no-op
  const noopMove = moveBlockByOffset(movedUp, 0, -1);
  assert.equal(noopMove[0].id, b3.id);
});

test('Modern Materials & Technologies division keeps 3 core disciplines isolated, supports certificates/catalogs CRUD, has zero sponsor or CAD detail copy, and curates partner brands', async () => {
  const { buildRouteSeoMetadata } = await import('./seo.ts');
  const { SEED_COURSES, SEED_INSIGHTS } = await import('../data/seedContent.ts');
  const {
    MATERIAL_CATEGORIES,
    MATERIALS_DEPARTMENT_META,
    SEED_MATERIALS,
    deriveMaterialSlug,
    filterMaterialSystems,
    getBrandCertificates,
    getMaterialsForBrand,
    mergeCatalogMaterials,
    selectMaterialPartnerBrands,
    validateMaterialForm,
  } = await import('./materialsCatalog.ts');

  // 1. Strict 3-discipline isolation — never pollutes HomePage 3-disciplines or TeamOrgTree
  assert.equal(DISCIPLINES.length, 3);
  assert.equal(
    DISCIPLINES.some((d) => (d.slug as string) === 'materials-technologies'),
    false
  );

  // 1b. Zero "اسپانسر"/"Sponsor" and zero "دیتیل"/"CAD" wording in department metadata
  const metaBlob = JSON.stringify(MATERIALS_DEPARTMENT_META);
  assert.equal(metaBlob.includes('اسپانسر'), false);
  assert.equal(/sponsor/i.test(metaBlob), false);
  assert.equal(metaBlob.includes('دیتیل'), false);
  assert.equal(/\bcad\b/i.test(metaBlob), false);

  // 2. Bilingual routing & locale switching
  const faRoute = parseLocationPath('/fa/expertise/materials-technologies');
  assert.equal(faRoute.locale, 'fa');
  assert.deepEqual(faRoute.route, { page: 'materials-technologies' });

  const enRoute = parseLocationPath('/en/expertise/materials-technologies');
  assert.equal(enRoute.locale, 'en');
  assert.deepEqual(enRoute.route, { page: 'materials-technologies' });

  assert.equal(buildPath('fa', { page: 'materials-technologies' }), '/fa/expertise/materials-technologies');
  assert.equal(buildPath('en', { page: 'materials-technologies' }), '/en/expertise/materials-technologies');
  assert.equal(
    switchLocaleInPath('/fa/expertise/materials-technologies', 'en'),
    '/en/expertise/materials-technologies'
  );

  // 3. SEO metadata & CollectionPage JSON-LD (zero sponsor or CAD detail wording)
  const seoMeta = buildRouteSeoMetadata({
    locale: 'fa',
    route: { page: 'materials-technologies' },
    origin: 'https://isbgroup.ir',
    settings: DEFAULT_SITE_SETTINGS,
    projects: SEED_PROJECTS,
    insights: SEED_INSIGHTS,
    courses: SEED_COURSES,
  });
  assert.equal(seoMeta.canonicalPath, '/fa/expertise/materials-technologies');
  assert.equal(seoMeta.enPath, '/en/expertise/materials-technologies');
  assert.ok(seoMeta.title.includes(MATERIALS_DEPARTMENT_META.title.fa));
  assert.equal(seoMeta.title.includes('اسپانسر'), false);
  assert.equal(seoMeta.description.includes('اسپانسر'), false);
  assert.equal(seoMeta.description.includes('دیتیل'), false);
  const graph = seoMeta.jsonLd['@graph'] as Array<Record<string, unknown>>;
  assert.ok(graph.some((n) => n['@type'] === 'CollectionPage'));

  // 4. Visual material catalog, certificate photos, search/filters & brand certificate aggregation
  assert.equal(MATERIAL_CATEGORIES.length, 5);
  assert.equal(filterMaterialSystems('all').length, SEED_MATERIALS.length);
  for (const mat of SEED_MATERIALS) {
    assert.ok(mat.coverImage.startsWith('/src/assets/images/'));
    assert.ok(Array.isArray(mat.certificates) && mat.certificates.length >= 1);
    assert.ok(Boolean(mat.catalogLabelFa));
  }
  const thermal = filterMaterialSystems('thermal-envelope');
  assert.ok(thermal.length >= 2);
  assert.ok(thermal.every((item) => item.category === 'thermal-envelope'));

  const searched = filterMaterialSystems('all', SEED_MATERIALS, { searchQuery: 'ETICS' });
  assert.ok(searched.some((m) => m.id === 'etics-thermal-envelope'));

  const certifiedOnly = filterMaterialSystems('all', SEED_MATERIALS, { onlyCertified: true });
  assert.equal(certifiedOnly.length, SEED_MATERIALS.length);

  assert.ok(getMaterialsForBrand('iran-etics').length >= 2);
  const iranEticsCerts = getBrandCertificates('iran-etics');
  assert.ok(iranEticsCerts.length >= 2);

  // 5. Merge logic (Firestore overrides, hidden seed IDs, draft filtering) & form validation
  const customMat = {
    ...SEED_MATERIALS[0],
    id: 'mat_custom_solar_glass',
    slug: 'custom-solar-glass',
    titleFa: 'شیشه فتوولتائیک نما',
    titleEn: 'BIPV Solar Facade Glass',
    catalogUrl: 'https://example.com/bipv-catalog.pdf',
    order: 0,
    status: 'published' as const,
    isSeedDefault: false,
  };
  const draftMat = {
    ...customMat,
    id: 'mat_draft_item',
    slug: 'draft-material',
    status: 'draft' as const,
  };
  const mergedPublic = mergeCatalogMaterials(
    SEED_MATERIALS,
    [customMat, draftMat],
    ['eco-acoustic-materials'],
    false
  );
  assert.equal(mergedPublic[0].id, 'mat_custom_solar_glass');
  assert.equal(mergedPublic.some((m) => m.id === 'mat_draft_item'), false);
  assert.equal(mergedPublic.some((m) => m.id === 'eco-acoustic-materials'), false);

  const mergedAdmin = mergeCatalogMaterials(
    SEED_MATERIALS,
    [customMat, draftMat],
    ['eco-acoustic-materials'],
    true
  );
  assert.equal(mergedAdmin.some((m) => m.id === 'mat_draft_item'), true);

  const withCatalogOnly = filterMaterialSystems('all', mergedPublic, { onlyWithCatalog: true });
  assert.equal(withCatalogOnly.length, 1);
  assert.equal(withCatalogOnly[0].id, 'mat_custom_solar_glass');

  assert.equal(deriveMaterialSlug('', 'Graphite EPS Panel', 'abc'), 'graphite-eps-panel');
  assert.equal(deriveMaterialSlug('', '', 'xyz'), 'material-xyz');

  const invalidErrors = validateMaterialForm(
    {
      slug: 'BAD SLUG!',
      titleFa: 'ا',
      titleEn: '',
      subtitleFa: '',
      subtitleEn: '',
      summaryFa: '',
      summaryEn: '',
      category: 'thermal-envelope',
      brandNameFa: '',
      brandNameEn: '',
      performanceMetric: '',
      performanceLabelFa: '',
      performanceLabelEn: '',
      standardRefFa: '',
      standardRefEn: '',
      applicationFa: '',
      applicationEn: '',
      coverImage: '',
      certificates: [],
      catalogUrl: 'javascript:alert(1)',
      catalogLabelFa: '',
      catalogLabelEn: '',
      partnerIds: [],
      featured: false,
      order: -1,
      status: 'published',
    },
    'fa'
  );
  assert.ok(invalidErrors.titleFa);
  assert.ok(invalidErrors.coverImage);
  assert.ok(invalidErrors.catalogUrl);
  assert.ok(invalidErrors.order);

  // 6. Partner curation includes material seed brands + newly uploaded custom brands, excludes drafts
  const customBrand = {
    id: 'ptn_custom_glass_brand',
    nameFa: 'شیشه هوشمند آفتاب',
    nameEn: 'Aftab Smart Glass',
    order: 0,
    status: 'published' as const,
    isSeedDefault: false,
  };
  const draftBrand = {
    id: 'ptn_draft_brand',
    nameFa: 'برند پیش‌نویس',
    nameEn: 'Draft Brand',
    order: 1,
    status: 'draft' as const,
    isSeedDefault: false,
  };
  const curated = selectMaterialPartnerBrands(
    [...SEED_PARTNER_LOGOS, customBrand, draftBrand],
    'materials'
  );
  assert.equal(curated[0].id, 'ptn_custom_glass_brand');
  assert.ok(curated.some((b) => b.id === 'iran-etics'));
  assert.ok(curated.some((b) => b.id === 'isoletco'));
  assert.equal(
    curated.some((b) => b.id === 'ptn_draft_brand'),
    false
  );
  assert.equal(
    curated.some((b) => b.id === 'bhrc'),
    false
  );

  const allPublished = selectMaterialPartnerBrands(
    [...SEED_PARTNER_LOGOS, customBrand, draftBrand],
    'all'
  );
  assert.equal(allPublished.length, SEED_PARTNER_LOGOS.length + 1);
  assert.ok(allPublished.some((b) => b.id === 'bhrc'));
});




