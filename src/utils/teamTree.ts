import type { DisciplineSlug, TeamMember, TeamMemberTier } from '../types/content';
import { parseSpecialtiesList } from './validation';

export interface SkillGroupBucket {
  skillFa: string;
  skillEn: string;
  members: TeamMember[];
}

export interface DepartmentBranchSpec {
  slug: DisciplineSlug;
  indexLabel: '01' | '02' | '03';
  accentHex: string;
  accentSoftHex: string;
  stemHex: string;
  /** Senior Department Leads (راهبران ارشد دپارتمان) */
  board: TeamMember[];
  /** Semantic alias for `board` */
  seniorLeads: TeamMember[];
  /** Backward-compatible alias for `board` */
  directors: TeamMember[];
  /** Specialists ordered/grouped by skill domain */
  specialists: TeamMember[];
  /** Specialists grouped by primary skill tag */
  skillGroups: SkillGroupBucket[];
  /** Department team members / staff */
  staff: TeamMember[];
  /** Combined vertical column members beneath Senior Leads (specialists + staff) */
  departmentMembers: TeamMember[];
  /** Department Advisors (مشاوران دپارتمان) positioned directly after departmentMembers */
  advisors: TeamMember[];
  totalCount: number;
}

export interface TeamHierarchy {
  /** Row 1: Board of Directors (3 equal compact square monoliths, department-independent) */
  ceo: TeamMember[];
  /** Explicit plural alias for `ceo` */
  ceos: TeamMember[];
  /** Backward-compatible alias for `ceo` */
  executiveBoard: TeamMember[];
  /** Row 2: Statutory Inspectors (2 equal compact square monoliths beneath Board of Directors) */
  inspectors: TeamMember[];
  /** Row 3+: 3 Specialized Departments with columnar Senior Leads, Members & Advisors */
  departments: DepartmentBranchSpec[];
  /** Cross-department Advisors (when discipline === 'leadership' and tier === 'advisor') */
  generalAdvisors: TeamMember[];
  totalPublished: number;
  totalInspectors: number;
  totalBoard: number;
  /** Backward-compatible alias (Board/Exec + Senior Leads) */
  totalDirectors: number;
  totalSpecialists: number;
  totalStaff: number;
  totalAdvisors: number;
}

const DEPARTMENT_ORDER: readonly {
  slug: DisciplineSlug;
  indexLabel: '01' | '02' | '03';
  accentHex: string;
  accentSoftHex: string;
  stemHex: string;
}[] = [
  {
    slug: 'architecture-urbanism',
    indexLabel: '01',
    accentHex: '#6F9BFF',
    accentSoftHex: '#223A87',
    stemHex: '#5B87EE',
  },
  {
    slug: 'energy-mep',
    indexLabel: '02',
    accentHex: '#28CF77',
    accentSoftHex: '#00A651',
    stemHex: '#18B866',
  },
  {
    slug: 'structure-seismic',
    indexLabel: '03',
    accentHex: '#93BCFF',
    accentSoftHex: '#3B68D6',
    stemHex: '#74A1F5',
  },
];

const HONORIFIC_PREFIXES =
  /^(دکتر|مهندس|استاد|سرکار خانم|جناب آقای|آقای|خانم|dr\.?|eng\.?|arch\.?|prof\.?|mr\.?|ms\.?|mrs\.?)\s+/i;

const GROUP_CEO_FA_RE = /(?:^|[\s·\-–—|،])مدیر\s*عامل(?!\s*دپارتمان)/i;
const GROUP_CEO_EN_RE = /\b(chief executive officer|group ceo)\b|^ceo$/i;
const INSPECTOR_FA_RE = /(?:^|[\s·\-–—|،])بازرس(?:\s|$|[·\-–—|،]|ان|ی|اصلی|علی)/i;
const INSPECTOR_EN_RE = /\binspector\b/i;
const ADVISOR_FA_RE = /(?:^|[\s·\-–—|،])مشاور(?:\s|$|[·\-–—|،]|ان|ه|تخصصی|علمی|ارشد)/i;
const ADVISOR_EN_RE = /\b(advisor|consultant)\b/i;

function isGroupCeoRole(roleFa?: string, roleEn?: string): boolean {
  return (
    GROUP_CEO_FA_RE.test((roleFa ?? '').trim()) ||
    GROUP_CEO_EN_RE.test((roleEn ?? '').trim())
  );
}

function isInspectorRole(roleFa?: string, roleEn?: string): boolean {
  return (
    INSPECTOR_FA_RE.test((roleFa ?? '').trim()) ||
    INSPECTOR_EN_RE.test((roleEn ?? '').trim())
  );
}

function isAdvisorRole(roleFa?: string, roleEn?: string): boolean {
  return (
    ADVISOR_FA_RE.test((roleFa ?? '').trim()) ||
    ADVISOR_EN_RE.test((roleEn ?? '').trim())
  );
}

/**
 * Resolves a member's canonical organizational tier across the ISB hierarchy:
 * 1. 'ceo' — Board of Directors (هیئت مدیره · top 3 equal squares, department-independent)
 * 2. 'inspector' — Statutory Inspectors (بازرسان · 2 equal squares beneath Board of Directors)
 * 3. 'board' (legacy 'director') — Senior Department Leads (راهبران ارشد دپارتمان)
 * 4. 'specialist' / 'member' — Department Members (اعضای دپارتمان)
 * 5. 'advisor' — Advisors (مشاوران) positioned directly after department members
 */
export function resolveMemberTier(member: TeamMember): TeamMemberTier {
  if (member.tier === 'advisor') return 'advisor';
  if (member.tier === 'inspector') return 'inspector';
  if (member.tier === 'ceo') return 'ceo';
  if (!member.tier && isInspectorRole(member.roleFa, member.roleEn)) {
    return 'inspector';
  }
  if (member.discipline === 'leadership') {
    if (isInspectorRole(member.roleFa, member.roleEn)) return 'inspector';
    if (isAdvisorRole(member.roleFa, member.roleEn)) return 'advisor';
    return 'ceo';
  }
  if ((!member.tier || member.tier === 'director') && isGroupCeoRole(member.roleFa, member.roleEn)) {
    return 'ceo';
  }
  if (member.tier === 'board' || member.tier === 'director') return 'board';
  if (member.tier === 'specialist') return 'specialist';
  if (member.tier === 'member') return 'member';
  if (isAdvisorRole(member.roleFa, member.roleEn)) return 'advisor';

  const hasExtendedProfile = Boolean(
    member.resumeFa?.trim() ||
      member.resumeEn?.trim() ||
      member.bioFa?.trim() ||
      member.bioEn?.trim()
  );
  return hasExtendedProfile ? 'board' : 'member';
}

export function isExecutiveOrBoardTier(tier: TeamMemberTier): boolean {
  return (
    tier === 'ceo' ||
    tier === 'inspector' ||
    tier === 'board' ||
    tier === 'director' ||
    tier === 'advisor'
  );
}

/**
 * Extracts a clean primary skill domain label for specialists.
 */
export function resolvePrimarySkill(member: TeamMember): { fa: string; en: string } {
  const faTags = parseSpecialtiesList(member.specialtiesFa);
  const enTags = parseSpecialtiesList(member.specialtiesEn);
  if (faTags.length > 0 || enTags.length > 0) {
    return {
      fa: faTags[0] || enTags[0] || 'متخصص تخصصی',
      en: enTags[0] || faTags[0] || 'Specialist',
    };
  }
  const faRole = member.roleFa.split(/[·\-–—|]/)[0]?.trim() || 'حوزه تخصصی';
  const enRole = member.roleEn.split(/[·\-–—|]/)[0]?.trim() || 'Specialist Domain';
  return { fa: faRole, en: enRole };
}

/**
 * Board of Directors, Inspectors, Senior Department Leads, and Advisors expose resume modals when populated.
 */
export function hasPublicResume(member: TeamMember): boolean {
  const tier = resolveMemberTier(member);
  if (!isExecutiveOrBoardTier(tier)) {
    return false;
  }
  const specialties = parseSpecialtiesList(member.specialtiesFa || member.specialtiesEn);
  return Boolean(
    member.resumeFa?.trim() ||
      member.resumeEn?.trim() ||
      member.bioFa?.trim() ||
      member.bioEn?.trim() ||
      specialties.length > 0 ||
      member.linkedinUrl?.trim()
  );
}

/**
 * Builds the architectural organizational hierarchy from flat published team records:
 * - Row 1: Board of Directors (3 equal compact square monoliths)
 * - Row 2: Inspectors (2 equal compact square monoliths)
 * - Row 3: 3 Departments, each with vertically stacked Senior Leads → Department Members → Advisors
 */
export function buildTeamHierarchy(members: TeamMember[]): TeamHierarchy {
  const published = members
    .filter((m) => m.status === 'published')
    .slice()
    .sort((a, b) => a.order - b.order);

  const ceo: TeamMember[] = [];
  const inspectors: TeamMember[] = [];
  const generalAdvisors: TeamMember[] = [];
  const deptMap = new Map<
    DisciplineSlug,
    { board: TeamMember[]; specialists: TeamMember[]; staff: TeamMember[]; advisors: TeamMember[] }
  >([
    ['architecture-urbanism', { board: [], specialists: [], staff: [], advisors: [] }],
    ['energy-mep', { board: [], specialists: [], staff: [], advisors: [] }],
    ['structure-seismic', { board: [], specialists: [], staff: [], advisors: [] }],
  ]);

  let totalBoard = 0;
  let totalSpecialists = 0;
  let totalStaff = 0;
  let totalAdvisors = 0;

  for (const member of published) {
    const tier = resolveMemberTier(member);
    if (tier === 'inspector') {
      inspectors.push(member);
      continue;
    }
    if (tier === 'advisor') {
      totalAdvisors += 1;
      if (member.discipline === 'leadership') {
        generalAdvisors.push(member);
      } else {
        const bucket = deptMap.get(member.discipline);
        if (bucket) {
          bucket.advisors.push(member);
        } else {
          generalAdvisors.push(member);
        }
      }
      continue;
    }
    if (tier === 'ceo' || member.discipline === 'leadership') {
      ceo.push(member);
      continue;
    }

    const bucket = deptMap.get(member.discipline);
    if (!bucket) continue;

    if (tier === 'board' || tier === 'director') {
      bucket.board.push(member);
      totalBoard += 1;
    } else if (tier === 'specialist') {
      bucket.specialists.push(member);
      totalSpecialists += 1;
    } else {
      bucket.staff.push(member);
      totalStaff += 1;
    }
  }

  const departments: DepartmentBranchSpec[] = DEPARTMENT_ORDER.map((spec) => {
    const bucket = deptMap.get(spec.slug)!;
    const skillMap = new Map<string, SkillGroupBucket>();
    for (const sp of bucket.specialists) {
      const skill = resolvePrimarySkill(sp);
      const key = skill.fa.toLowerCase();
      const existing = skillMap.get(key);
      if (existing) {
        existing.members.push(sp);
      } else {
        skillMap.set(key, { skillFa: skill.fa, skillEn: skill.en, members: [sp] });
      }
    }

    const departmentMembers = [...bucket.specialists, ...bucket.staff];

    return {
      ...spec,
      board: bucket.board,
      seniorLeads: bucket.board,
      directors: bucket.board,
      specialists: bucket.specialists,
      skillGroups: Array.from(skillMap.values()),
      staff: bucket.staff,
      departmentMembers,
      advisors: bucket.advisors,
      totalCount: bucket.board.length + departmentMembers.length + bucket.advisors.length,
    };
  });

  return {
    ceo,
    ceos: ceo,
    executiveBoard: ceo,
    inspectors,
    departments,
    generalAdvisors,
    totalPublished: published.length,
    totalInspectors: inspectors.length,
    totalBoard,
    totalDirectors: ceo.length + totalBoard,
    totalSpecialists,
    totalStaff,
    totalAdvisors,
  };
}

/**
 * Extracts a clean 1–2 letter monogram for portraits without an uploaded photo,
 * stripping common Persian/English honorific prefixes first.
 */
export function getMemberMonogram(fullName: string): string {
  const cleaned = fullName.trim().replace(HONORIFIC_PREFIXES, '').trim();
  const source = cleaned || fullName.trim();
  if (!source) return 'IS';
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export interface PartnerSliderWindow {
  totalPages: number;
  pageIndex: number;
  startIndex: number;
  endIndex: number;
  canPrev: boolean;
  canNext: boolean;
}

/**
 * Resolves how many 4:5 vertical partner cards fit horizontally side-by-side:
 * 5 on desktop (>=1024px), 3 on tablet, 2 on wide mobile, 1 on narrow mobile.
 */
export function resolvePartnerCardsPerView(viewportWidth: number): number {
  if (viewportWidth >= 1024) return 5;
  if (viewportWidth >= 768) return 3;
  if (viewportWidth >= 520) return 2;
  return 1;
}

/**
 * Computes a clamped horizontal slider window so every slide stays balanced
 * (e.g. final slide shows a full 5-card window when totalItems > perView).
 */
export function computePartnerSliderWindow(
  totalItems: number,
  perView: number,
  requestedPage: number
): PartnerSliderWindow {
  const safeTotal = Math.max(0, Math.floor(totalItems));
  const safePerView = Math.max(1, Math.floor(perView));
  const totalPages = Math.max(1, Math.ceil(safeTotal / safePerView));
  const pageIndex = Math.max(0, Math.min(Math.floor(requestedPage), totalPages - 1));
  const startIndex =
    safeTotal <= safePerView ? 0 : Math.min(pageIndex * safePerView, safeTotal - safePerView);
  const endIndex = Math.min(safeTotal, startIndex + safePerView);

  return {
    totalPages,
    pageIndex,
    startIndex,
    endIndex,
    canPrev: pageIndex > 0,
    canNext: pageIndex < totalPages - 1,
  };
}

