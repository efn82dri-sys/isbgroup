import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
  type Timestamp,
} from 'firebase/firestore';
import {
  DEFAULT_SITE_SETTINGS,
  SEED_COURSES,
  SEED_INSIGHTS,
  SEED_PARTNER_LOGOS,
  SEED_PROJECTS,
  SEED_TEAM_MEMBERS,
} from '../data/seedContent';
import type {
  AssessmentFormInput,
  AssessmentRecord,
  Course,
  InquiryFormInput,
  InquiryRecord,
  Insight,
  Locale,
  MaterialItem,
  PartnerLogo,
  Project,
  SiteSettings,
  TeamMember,
} from '../types/content';
import { mergeCatalogCourses } from '../utils/accountLogic';
import {
  estimateReadingTimeMinutes,
  extractPlainTextFromBlocks,
  mergeCatalogInsights,
  sanitizeInsightBlocks,
} from '../utils/insightBlocks';
import {
  deriveMaterialSlug,
  mergeCatalogMaterials,
  sanitizeMaterialCertificates,
  SEED_MATERIALS,
} from '../utils/materialsCatalog';
import {
  mergeCatalogProjects,
  mergePartnerLogos,
  mergeTeamMembers,
  normalizeSlug,
  sanitizeText,
} from '../utils/validation';
import { db, handleFirestoreError, OperationType } from './firebase';

function generateRecordId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now()}_${rand}`;
}

function formatTimestamp(ts: unknown): string | undefined {
  if (ts && typeof ts === 'object' && 'toDate' in ts && typeof (ts as Timestamp).toDate === 'function') {
    return (ts as Timestamp).toDate().toISOString();
  }
  return undefined;
}

function mapProjectDoc(id: string, data: DocumentData): Project {
  return {
    id,
    slug: String(data.slug),
    titleEn: String(data.titleEn),
    titleFa: String(data.titleFa),
    cityEn: String(data.cityEn),
    cityFa: String(data.cityFa),
    category: data.category,
    serviceEn: String(data.serviceEn),
    serviceFa: String(data.serviceFa),
    disciplines: Array.isArray(data.disciplines) ? data.disciplines : ['architecture-urbanism'],
    roleEn: data.roleEn ? String(data.roleEn) : undefined,
    roleFa: data.roleFa ? String(data.roleFa) : undefined,
    briefEn: data.briefEn ? String(data.briefEn) : undefined,
    briefFa: data.briefFa ? String(data.briefFa) : undefined,
    approachEn: data.approachEn ? String(data.approachEn) : undefined,
    approachFa: data.approachFa ? String(data.approachFa) : undefined,
    year: data.year ? String(data.year) : undefined,
    areaSqm: data.areaSqm ? String(data.areaSqm) : undefined,
    coverImage: String(data.coverImage),
    gallery: Array.isArray(data.gallery)
      ? data.gallery.map((g: unknown) => String(g)).filter(Boolean)
      : undefined,
    imageDisclosure: data.imageDisclosure === 'photograph' ? 'photograph' : 'concept',
    featuredOrder: Number(data.featuredOrder ?? 99),
    status: data.status === 'draft' ? 'draft' : 'published',
    isSeedDefault: false,
  };
}

function mapTeamMemberDoc(id: string, data: DocumentData): TeamMember {
  return {
    id,
    nameEn: String(data.nameEn),
    nameFa: String(data.nameFa),
    roleEn: String(data.roleEn),
    roleFa: String(data.roleFa),
    discipline: data.discipline,
    tier:
      data.tier === 'ceo' ||
      data.tier === 'board' ||
      data.tier === 'director' ||
      data.tier === 'specialist' ||
      data.tier === 'member'
        ? data.tier
        : undefined,
    bioEn: data.bioEn ? String(data.bioEn) : undefined,
    bioFa: data.bioFa ? String(data.bioFa) : undefined,
    specialtiesEn: data.specialtiesEn ? String(data.specialtiesEn) : undefined,
    specialtiesFa: data.specialtiesFa ? String(data.specialtiesFa) : undefined,
    resumeEn: data.resumeEn ? String(data.resumeEn) : undefined,
    resumeFa: data.resumeFa ? String(data.resumeFa) : undefined,
    linkedinUrl: data.linkedinUrl ? String(data.linkedinUrl) : undefined,
    portraitUrl: data.portraitUrl ? String(data.portraitUrl) : undefined,
    order: Number(data.order ?? 99),
    status: data.status === 'draft' ? 'draft' : 'published',
  };
}

function mapInsightDoc(id: string, data: DocumentData): Insight {
  const blocks = sanitizeInsightBlocks(data.blocks);
  return {
    id,
    slug: String(data.slug),
    titleEn: String(data.titleEn),
    titleFa: String(data.titleFa),
    subtitleEn: data.subtitleEn ? String(data.subtitleEn) : undefined,
    subtitleFa: data.subtitleFa ? String(data.subtitleFa) : undefined,
    excerptEn: String(data.excerptEn),
    excerptFa: String(data.excerptFa),
    bodyEn: String(data.bodyEn),
    bodyFa: String(data.bodyFa),
    coverImage: data.coverImage ? String(data.coverImage) : undefined,
    coverCaptionEn: data.coverCaptionEn ? String(data.coverCaptionEn) : undefined,
    coverCaptionFa: data.coverCaptionFa ? String(data.coverCaptionFa) : undefined,
    authorEn: data.authorEn ? String(data.authorEn) : undefined,
    authorFa: data.authorFa ? String(data.authorFa) : undefined,
    authorRoleEn: data.authorRoleEn ? String(data.authorRoleEn) : undefined,
    authorRoleFa: data.authorRoleFa ? String(data.authorRoleFa) : undefined,
    readingTimeMinutes:
      typeof data.readingTimeMinutes === 'number' ? data.readingTimeMinutes : undefined,
    featured: data.featured === true,
    tagsEn: Array.isArray(data.tagsEn)
      ? data.tagsEn.map((t: unknown) => String(t)).filter(Boolean)
      : undefined,
    tagsFa: Array.isArray(data.tagsFa)
      ? data.tagsFa.map((t: unknown) => String(t)).filter(Boolean)
      : undefined,
    blocks: blocks.length > 0 ? blocks : undefined,
    topic: data.topic,
    publishedDate: String(data.publishedDate),
    status: data.status === 'draft' ? 'draft' : 'published',
    isSeedDefault: false,
  };
}

function mapCourseDoc(id: string, data: DocumentData): Course {
  return {
    id,
    slug: String(data.slug),
    titleFa: String(data.titleFa),
    titleEn: String(data.titleEn),
    department: data.department,
    format: data.format,
    instructorFa: String(data.instructorFa),
    instructorEn: String(data.instructorEn),
    durationFa: String(data.durationFa),
    durationEn: String(data.durationEn),
    scheduleFa: data.scheduleFa ? String(data.scheduleFa) : undefined,
    scheduleEn: data.scheduleEn ? String(data.scheduleEn) : undefined,
    priceToman: Number(data.priceToman ?? 0),
    originalPriceToman:
      typeof data.originalPriceToman === 'number' ? data.originalPriceToman : undefined,
    capacity: typeof data.capacity === 'number' ? data.capacity : undefined,
    summaryFa: String(data.summaryFa),
    summaryEn: String(data.summaryEn),
    syllabusFa: Array.isArray(data.syllabusFa)
      ? data.syllabusFa.map((s: unknown) => String(s)).filter(Boolean)
      : undefined,
    syllabusEn: Array.isArray(data.syllabusEn)
      ? data.syllabusEn.map((s: unknown) => String(s)).filter(Boolean)
      : undefined,
    coverImage: String(data.coverImage),
    paymentUrl: data.paymentUrl ? String(data.paymentUrl) : undefined,
    paymentNoteFa: data.paymentNoteFa ? String(data.paymentNoteFa) : undefined,
    paymentNoteEn: data.paymentNoteEn ? String(data.paymentNoteEn) : undefined,
    accessUrl: data.accessUrl ? String(data.accessUrl) : undefined,
    featuredOrder: Number(data.featuredOrder ?? 10),
    status: data.status === 'draft' ? 'draft' : 'published',
    isSeedDefault: false,
  };
}

function mapPartnerLogoDoc(id: string, data: DocumentData): PartnerLogo {
  return {
    id,
    nameFa: String(data.nameFa),
    nameEn: String(data.nameEn),
    descriptionFa: data.descriptionFa ? String(data.descriptionFa) : undefined,
    descriptionEn: data.descriptionEn ? String(data.descriptionEn) : undefined,
    logoUrl: data.logoUrl ? String(data.logoUrl) : undefined,
    presetMarkId: data.presetMarkId ? String(data.presetMarkId) : undefined,
    websiteUrl: data.websiteUrl ? String(data.websiteUrl) : undefined,
    order: Number(data.order ?? 10),
    status: data.status === 'draft' ? 'draft' : 'published',
    isSeedDefault: false,
  };
}

function mapMaterialDoc(id: string, data: DocumentData): MaterialItem {
  const certificates = sanitizeMaterialCertificates(data.certificates);
  return {
    id,
    slug: String(data.slug),
    titleFa: String(data.titleFa),
    titleEn: String(data.titleEn),
    subtitleFa: data.subtitleFa ? String(data.subtitleFa) : undefined,
    subtitleEn: data.subtitleEn ? String(data.subtitleEn) : undefined,
    summaryFa: data.summaryFa ? String(data.summaryFa) : undefined,
    summaryEn: data.summaryEn ? String(data.summaryEn) : undefined,
    category: data.category,
    brandNameFa: data.brandNameFa ? String(data.brandNameFa) : undefined,
    brandNameEn: data.brandNameEn ? String(data.brandNameEn) : undefined,
    performanceMetric: data.performanceMetric ? String(data.performanceMetric) : undefined,
    performanceLabelFa: data.performanceLabelFa ? String(data.performanceLabelFa) : undefined,
    performanceLabelEn: data.performanceLabelEn ? String(data.performanceLabelEn) : undefined,
    standardRefFa: data.standardRefFa ? String(data.standardRefFa) : undefined,
    standardRefEn: data.standardRefEn ? String(data.standardRefEn) : undefined,
    applicationFa: data.applicationFa ? String(data.applicationFa) : undefined,
    applicationEn: data.applicationEn ? String(data.applicationEn) : undefined,
    coverImage: String(data.coverImage),
    certificates: certificates.length > 0 ? certificates : undefined,
    catalogUrl: data.catalogUrl ? String(data.catalogUrl) : undefined,
    catalogLabelFa: data.catalogLabelFa ? String(data.catalogLabelFa) : undefined,
    catalogLabelEn: data.catalogLabelEn ? String(data.catalogLabelEn) : undefined,
    partnerIds: Array.isArray(data.partnerIds)
      ? data.partnerIds.map((p: unknown) => String(p)).filter(Boolean)
      : undefined,
    featured: data.featured === true,
    order: Number(data.order ?? 10),
    status: data.status === 'draft' ? 'draft' : 'published',
    isSeedDefault: false,
  };
}

function withSoftTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('FIRESTORE_SOFT_TIMEOUT')), timeoutMs);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

export async function fetchPublicContent(): Promise<{
  settings: SiteSettings;
  projects: Project[];
  insights: Insight[];
  teamMembers: TeamMember[];
  courses: Course[];
  partnerLogos: PartnerLogo[];
  materials: MaterialItem[];
}> {
  let settings: SiteSettings = { ...DEFAULT_SITE_SETTINGS };
  let projects: Project[] = [...SEED_PROJECTS];
  let insights: Insight[] = [...SEED_INSIGHTS];
  let teamMembers: TeamMember[] = [...SEED_TEAM_MEMBERS];
  let courses: Course[] = [...SEED_COURSES];
  let partnerLogos: PartnerLogo[] = [...SEED_PARTNER_LOGOS];
  let materials: MaterialItem[] = [...SEED_MATERIALS];

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return { settings, projects, insights, teamMembers, courses, partnerLogos, materials };
  }

  const READ_TIMEOUT_MS = 7500;
  const [
    settingsRes,
    projRes,
    insightsRes,
    teamRes,
    coursesRes,
    partnersRes,
    materialsRes,
  ] = await Promise.allSettled([
    withSoftTimeout(getDoc(doc(db, 'siteSettings', 'main')), READ_TIMEOUT_MS),
    withSoftTimeout(
      getDocs(query(collection(db, 'projects'), where('status', '==', 'published'))),
      READ_TIMEOUT_MS
    ),
    withSoftTimeout(
      getDocs(query(collection(db, 'insights'), where('status', '==', 'published'))),
      READ_TIMEOUT_MS
    ),
    withSoftTimeout(
      getDocs(query(collection(db, 'teamMembers'), where('status', '==', 'published'))),
      READ_TIMEOUT_MS
    ),
    withSoftTimeout(
      getDocs(query(collection(db, 'courses'), where('status', '==', 'published'))),
      READ_TIMEOUT_MS
    ),
    withSoftTimeout(
      getDocs(query(collection(db, 'partnerLogos'), where('status', '==', 'published'))),
      READ_TIMEOUT_MS
    ),
    withSoftTimeout(
      getDocs(query(collection(db, 'materials'), where('status', '==', 'published'))),
      READ_TIMEOUT_MS
    ),
  ]);

  if (settingsRes.status === 'fulfilled' && settingsRes.value.exists()) {
    const data = settingsRes.value.data();
    settings = {
      brandNameEn: String(data.brandNameEn || DEFAULT_SITE_SETTINGS.brandNameEn),
      brandNameFa: String(data.brandNameFa || DEFAULT_SITE_SETTINGS.brandNameFa),
      instagramUrl: String(data.instagramUrl || DEFAULT_SITE_SETTINGS.instagramUrl),
      linkedinUrl: data.linkedinUrl ? String(data.linkedinUrl) : DEFAULT_SITE_SETTINGS.linkedinUrl,
      youtubeUrl: data.youtubeUrl ? String(data.youtubeUrl) : '',
      telegramUrl: data.telegramUrl ? String(data.telegramUrl) : '',
      whatsappUrl: data.whatsappUrl ? String(data.whatsappUrl) : '',
      publicEmail: data.publicEmail ? String(data.publicEmail) : '',
      publicPhone: data.publicPhone
        ? String(data.publicPhone)
        : DEFAULT_SITE_SETTINGS.publicPhone,
      studioCityEn: data.studioCityEn
        ? String(data.studioCityEn)
        : DEFAULT_SITE_SETTINGS.studioCityEn,
      studioCityFa: data.studioCityFa
        ? String(data.studioCityFa)
        : DEFAULT_SITE_SETTINGS.studioCityFa,
      teamCoverImage: data.teamCoverImage ? String(data.teamCoverImage) : '',
      teamCoverCaptionEn: data.teamCoverCaptionEn ? String(data.teamCoverCaptionEn) : '',
      teamCoverCaptionFa: data.teamCoverCaptionFa ? String(data.teamCoverCaptionFa) : '',
      heroTitleEn: data.heroTitleEn ? String(data.heroTitleEn) : '',
      heroTitleFa: data.heroTitleFa ? String(data.heroTitleFa) : '',
      heroSubtitleEn: data.heroSubtitleEn ? String(data.heroSubtitleEn) : '',
      heroSubtitleFa: data.heroSubtitleFa ? String(data.heroSubtitleFa) : '',
      aboutLeadEn: data.aboutLeadEn ? String(data.aboutLeadEn) : '',
      aboutLeadFa: data.aboutLeadFa ? String(data.aboutLeadFa) : '',
      hiddenSeedProjectSlugs: Array.isArray(data.hiddenSeedProjectSlugs)
        ? data.hiddenSeedProjectSlugs.map((s: unknown) => String(s))
        : [],
      hiddenSeedCourseSlugs: Array.isArray(data.hiddenSeedCourseSlugs)
        ? data.hiddenSeedCourseSlugs.map((s: unknown) => String(s))
        : [],
      hiddenSeedPartnerIds: Array.isArray(data.hiddenSeedPartnerIds)
        ? data.hiddenSeedPartnerIds.map((s: unknown) => String(s))
        : [],
      hiddenSeedInsightSlugs: Array.isArray(data.hiddenSeedInsightSlugs)
        ? data.hiddenSeedInsightSlugs.map((s: unknown) => String(s))
        : [],
      hiddenSeedMaterialIds: Array.isArray(data.hiddenSeedMaterialIds)
        ? data.hiddenSeedMaterialIds.map((s: unknown) => String(s))
        : [],
      paymentInstructionsFa: data.paymentInstructionsFa
        ? String(data.paymentInstructionsFa)
        : DEFAULT_SITE_SETTINGS.paymentInstructionsFa,
      paymentInstructionsEn: data.paymentInstructionsEn
        ? String(data.paymentInstructionsEn)
        : DEFAULT_SITE_SETTINGS.paymentInstructionsEn,
    };
  }

  const firestoreProjects: Project[] =
    projRes.status === 'fulfilled'
      ? projRes.value.docs.map((d) => mapProjectDoc(d.id, d.data()))
      : [];
  projects = mergeCatalogProjects(
    SEED_PROJECTS,
    firestoreProjects,
    settings.hiddenSeedProjectSlugs ?? []
  );

  const firestoreInsights =
    insightsRes.status === 'fulfilled'
      ? insightsRes.value.docs.map((d) => mapInsightDoc(d.id, d.data()))
      : [];
  insights = mergeCatalogInsights(
    SEED_INSIGHTS,
    firestoreInsights,
    settings.hiddenSeedInsightSlugs ?? [],
    false
  );

  const firestoreMembers =
    teamRes.status === 'fulfilled'
      ? teamRes.value.docs.map((d) => mapTeamMemberDoc(d.id, d.data()))
      : [];
  teamMembers = mergeTeamMembers(SEED_TEAM_MEMBERS, firestoreMembers).filter(
    (m) => m.status === 'published'
  );

  const firestoreCourses =
    coursesRes.status === 'fulfilled'
      ? coursesRes.value.docs.map((d) => mapCourseDoc(d.id, d.data()))
      : [];
  courses = mergeCatalogCourses(
    firestoreCourses,
    SEED_COURSES,
    settings.hiddenSeedCourseSlugs ?? [],
    false
  );

  const firestorePartners =
    partnersRes.status === 'fulfilled'
      ? partnersRes.value.docs.map((d) => mapPartnerLogoDoc(d.id, d.data()))
      : [];
  partnerLogos = mergePartnerLogos(
    SEED_PARTNER_LOGOS,
    firestorePartners,
    settings.hiddenSeedPartnerIds ?? [],
    false
  );

  const firestoreMaterials =
    materialsRes.status === 'fulfilled'
      ? materialsRes.value.docs.map((d) => mapMaterialDoc(d.id, d.data()))
      : [];
  materials = mergeCatalogMaterials(
    SEED_MATERIALS,
    firestoreMaterials,
    settings.hiddenSeedMaterialIds ?? [],
    false
  );

  return { settings, projects, insights, teamMembers, courses, partnerLogos, materials };
}

export async function submitProjectInquiry(
  input: InquiryFormInput,
  locale: Locale,
  userId: string
): Promise<{ id: string }> {
  const id = generateRecordId('inq');
  const path = `inquiries/${id}`;
  const payload: Record<string, unknown> = {
    userId,
    fullName: sanitizeText(input.fullName, 120),
    email: sanitizeText(input.email, 160),
    projectType: sanitizeText(input.projectType, 80),
    disciplines: input.disciplines.slice(0, 4),
    message: sanitizeText(input.message, 3000),
    locale,
    internalStatus: 'new',
    createdAt: serverTimestamp(),
  };

  const phone = sanitizeText(input.phone, 40);
  if (phone) payload.phone = phone;
  const organization = sanitizeText(input.organization, 140);
  if (organization) payload.organization = organization;
  const city = sanitizeText(input.city, 100);
  if (city) payload.city = city;

  try {
    await setDoc(doc(db, 'inquiries', id), payload);
    return { id };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function submitAssessmentRequest(
  input: AssessmentFormInput,
  locale: Locale,
  userId: string
): Promise<{ id: string }> {
  const id = generateRecordId('asr');
  const path = `assessmentRequests/${id}`;
  const payload: Record<string, unknown> = {
    userId,
    fullName: sanitizeText(input.fullName, 120),
    email: sanitizeText(input.email, 160),
    projectType: sanitizeText(input.projectType, 80),
    city: sanitizeText(input.city, 100),
    approximateFloorAreaSqm: Number(
      input.approximateFloorAreaSqm
        .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
        .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
        .replace(/[,\s٬]/g, '')
    ),
    projectStage: input.projectStage,
    assessmentGoals: input.assessmentGoals.slice(0, 6),
    locale,
    internalStatus: 'new',
    createdAt: serverTimestamp(),
  };

  const phone = sanitizeText(input.phone, 40);
  if (phone) payload.phone = phone;
  const organization = sanitizeText(input.organization, 140);
  if (organization) payload.organization = organization;
  const notes = sanitizeText(input.notes, 2000);
  if (notes) payload.notes = notes;

  try {
    await setDoc(doc(db, 'assessmentRequests', id), payload);
    return { id };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// =========================================================================
// Staff-only operations (enforced by Firestore security rules)
// =========================================================================

export async function fetchStaffSubmissions(): Promise<{
  inquiries: InquiryRecord[];
  assessments: AssessmentRecord[];
}> {
  try {
    const inqSnap = await getDocs(
      query(collection(db, 'inquiries'), orderBy('createdAt', 'desc'))
    );
    const asrSnap = await getDocs(
      query(collection(db, 'assessmentRequests'), orderBy('createdAt', 'desc'))
    );

    const inquiries: InquiryRecord[] = inqSnap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        userId: data.userId ? String(data.userId) : undefined,
        fullName: String(data.fullName),
        email: String(data.email),
        phone: data.phone ? String(data.phone) : undefined,
        organization: data.organization ? String(data.organization) : undefined,
        projectType: String(data.projectType),
        disciplines: Array.isArray(data.disciplines) ? data.disciplines : [],
        city: data.city ? String(data.city) : undefined,
        message: String(data.message),
        locale: data.locale === 'fa' ? 'fa' : 'en',
        internalStatus: data.internalStatus,
        adminReply: data.adminReply ? String(data.adminReply) : undefined,
        adminNotes: data.adminNotes ? String(data.adminNotes) : undefined,
        repliedAtIso: formatTimestamp(data.repliedAt),
        createdAtIso: formatTimestamp(data.createdAt),
      };
    });

    const assessments: AssessmentRecord[] = asrSnap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        userId: data.userId ? String(data.userId) : undefined,
        fullName: String(data.fullName),
        email: String(data.email),
        phone: data.phone ? String(data.phone) : undefined,
        organization: data.organization ? String(data.organization) : undefined,
        projectType: String(data.projectType),
        city: String(data.city),
        approximateFloorAreaSqm: Number(data.approximateFloorAreaSqm),
        projectStage: data.projectStage,
        assessmentGoals: Array.isArray(data.assessmentGoals) ? data.assessmentGoals : [],
        notes: data.notes ? String(data.notes) : undefined,
        locale: data.locale === 'fa' ? 'fa' : 'en',
        internalStatus: data.internalStatus,
        adminReply: data.adminReply ? String(data.adminReply) : undefined,
        adminNotes: data.adminNotes ? String(data.adminNotes) : undefined,
        repliedAtIso: formatTimestamp(data.repliedAt),
        createdAtIso: formatTimestamp(data.createdAt),
      };
    });

    return { inquiries, assessments };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'inquiries|assessmentRequests');
  }
}

export async function fetchAdminCatalog(
  hiddenSeedProjectSlugs: string[] = [],
  hiddenSeedCourseSlugs: string[] = [],
  hiddenSeedPartnerIds: string[] = [],
  hiddenSeedInsightSlugs: string[] = [],
  hiddenSeedMaterialIds: string[] = []
): Promise<{
  projects: Project[];
  teamMembers: TeamMember[];
  insights: Insight[];
  courses: Course[];
  partnerLogos: PartnerLogo[];
  materials: MaterialItem[];
}> {
  try {
    const [projSnap, teamSnap, insightSnap, coursesSnap, partnersSnap, materialsSnap] =
      await Promise.all([
        getDocs(collection(db, 'projects')),
        getDocs(collection(db, 'teamMembers')),
        getDocs(collection(db, 'insights')),
        getDocs(collection(db, 'courses')),
        getDocs(collection(db, 'partnerLogos')),
        getDocs(collection(db, 'materials')),
      ]);

    const firestoreProjects = projSnap.docs.map((d) => mapProjectDoc(d.id, d.data()));
    const projects = mergeCatalogProjects(SEED_PROJECTS, firestoreProjects, hiddenSeedProjectSlugs);
    const firestoreTeam = teamSnap.docs.map((d) => mapTeamMemberDoc(d.id, d.data()));
    const teamMembers = mergeTeamMembers(SEED_TEAM_MEMBERS, firestoreTeam);
    const firestoreInsights = insightSnap.docs.map((d) => mapInsightDoc(d.id, d.data()));
    const insights = mergeCatalogInsights(
      SEED_INSIGHTS,
      firestoreInsights,
      hiddenSeedInsightSlugs,
      true
    );
    const firestoreCourses = coursesSnap.docs.map((d) => mapCourseDoc(d.id, d.data()));
    const courses = mergeCatalogCourses(
      firestoreCourses,
      SEED_COURSES,
      hiddenSeedCourseSlugs,
      true
    );
    const firestorePartners = partnersSnap.docs.map((d) => mapPartnerLogoDoc(d.id, d.data()));
    const partnerLogos = mergePartnerLogos(
      SEED_PARTNER_LOGOS,
      firestorePartners,
      hiddenSeedPartnerIds,
      true
    );
    const firestoreMaterials = materialsSnap.docs.map((d) => mapMaterialDoc(d.id, d.data()));
    const materials = mergeCatalogMaterials(
      SEED_MATERIALS,
      firestoreMaterials,
      hiddenSeedMaterialIds,
      true
    );

    return { projects, teamMembers, insights, courses, partnerLogos, materials };
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.LIST,
      'projects|teamMembers|insights|courses|partnerLogos|materials'
    );
  }
}

export async function updateInquiryStatus(
  id: string,
  internalStatus: InquiryRecord['internalStatus']
): Promise<void> {
  const path = `inquiries/${id}`;
  try {
    await updateDoc(doc(db, 'inquiries', id), { internalStatus });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateInquiryResponse(
  id: string,
  params: {
    internalStatus: InquiryRecord['internalStatus'];
    adminReply: string;
    adminNotes: string;
    markReplied?: boolean;
  }
): Promise<void> {
  const path = `inquiries/${id}`;
  const updates: Record<string, unknown> = {
    internalStatus: params.internalStatus,
    adminReply: sanitizeText(params.adminReply, 4000),
    adminNotes: sanitizeText(params.adminNotes, 2000),
  };
  if (params.markReplied && params.adminReply.trim()) {
    updates.repliedAt = serverTimestamp();
  }
  try {
    await updateDoc(doc(db, 'inquiries', id), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteInquiry(id: string): Promise<void> {
  const path = `inquiries/${id}`;
  try {
    await deleteDoc(doc(db, 'inquiries', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function updateAssessmentStatus(
  id: string,
  internalStatus: AssessmentRecord['internalStatus']
): Promise<void> {
  const path = `assessmentRequests/${id}`;
  try {
    await updateDoc(doc(db, 'assessmentRequests', id), { internalStatus });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateAssessmentResponse(
  id: string,
  params: {
    internalStatus: AssessmentRecord['internalStatus'];
    adminReply: string;
    adminNotes: string;
    markReplied?: boolean;
  }
): Promise<void> {
  const path = `assessmentRequests/${id}`;
  const updates: Record<string, unknown> = {
    internalStatus: params.internalStatus,
    adminReply: sanitizeText(params.adminReply, 4000),
    adminNotes: sanitizeText(params.adminNotes, 2000),
  };
  if (params.markReplied && params.adminReply.trim()) {
    updates.repliedAt = serverTimestamp();
  }
  try {
    await updateDoc(doc(db, 'assessmentRequests', id), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteAssessment(id: string): Promise<void> {
  const path = `assessmentRequests/${id}`;
  try {
    await deleteDoc(doc(db, 'assessmentRequests', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveSiteSettings(settings: SiteSettings): Promise<void> {
  const path = 'siteSettings/main';
  const payload: Record<string, unknown> = {
    brandNameEn: sanitizeText(settings.brandNameEn || DEFAULT_SITE_SETTINGS.brandNameEn, 120),
    brandNameFa: sanitizeText(settings.brandNameFa || DEFAULT_SITE_SETTINGS.brandNameFa, 120),
    instagramUrl: sanitizeText(settings.instagramUrl, 240),
    linkedinUrl: sanitizeText(settings.linkedinUrl ?? '', 240),
    youtubeUrl: sanitizeText(settings.youtubeUrl ?? '', 240),
    telegramUrl: sanitizeText(settings.telegramUrl ?? '', 240),
    whatsappUrl: sanitizeText(settings.whatsappUrl ?? '', 240),
    publicEmail: sanitizeText(settings.publicEmail ?? '', 160),
    publicPhone: sanitizeText(settings.publicPhone ?? '', 60),
    studioCityEn: sanitizeText(settings.studioCityEn ?? '', 120),
    studioCityFa: sanitizeText(settings.studioCityFa ?? '', 120),
    teamCoverImage: sanitizeText(settings.teamCoverImage ?? '', 500),
    teamCoverCaptionEn: sanitizeText(settings.teamCoverCaptionEn ?? '', 200),
    teamCoverCaptionFa: sanitizeText(settings.teamCoverCaptionFa ?? '', 200),
    heroTitleEn: sanitizeText(settings.heroTitleEn ?? '', 160),
    heroTitleFa: sanitizeText(settings.heroTitleFa ?? '', 160),
    heroSubtitleEn: sanitizeText(settings.heroSubtitleEn ?? '', 400),
    heroSubtitleFa: sanitizeText(settings.heroSubtitleFa ?? '', 400),
    aboutLeadEn: sanitizeText(settings.aboutLeadEn ?? '', 800),
    aboutLeadFa: sanitizeText(settings.aboutLeadFa ?? '', 800),
    hiddenSeedProjectSlugs: (settings.hiddenSeedProjectSlugs ?? [])
      .map((s) => sanitizeText(s, 100))
      .filter(Boolean)
      .slice(0, 20),
    hiddenSeedCourseSlugs: (settings.hiddenSeedCourseSlugs ?? [])
      .map((s) => sanitizeText(s, 100))
      .filter(Boolean)
      .slice(0, 20),
    hiddenSeedPartnerIds: (settings.hiddenSeedPartnerIds ?? [])
      .map((s) => sanitizeText(s, 100))
      .filter(Boolean)
      .slice(0, 32),
    hiddenSeedInsightSlugs: (settings.hiddenSeedInsightSlugs ?? [])
      .map((s) => sanitizeText(s, 120))
      .filter(Boolean)
      .slice(0, 20),
    hiddenSeedMaterialIds: (settings.hiddenSeedMaterialIds ?? [])
      .map((s) => sanitizeText(s, 100))
      .filter(Boolean)
      .slice(0, 20),
    paymentInstructionsFa: sanitizeText(settings.paymentInstructionsFa ?? '', 600),
    paymentInstructionsEn: sanitizeText(settings.paymentInstructionsEn ?? '', 600),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'siteSettings', 'main'), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveProject(
  project: Omit<Project, 'id' | 'isSeedDefault'>,
  existingId?: string
): Promise<string> {
  const safeSlug = normalizeSlug(project.slug).replace(/[^a-z0-9-]+/g, '-').slice(0, 100);
  const id = existingId && /^[a-zA-Z0-9_-]{1,128}$/.test(existingId) ? existingId : safeSlug || generateRecordId('prj');
  const path = `projects/${id}`;

  const payload: Record<string, unknown> = {
    slug: safeSlug,
    titleEn: sanitizeText(project.titleEn, 160),
    titleFa: sanitizeText(project.titleFa, 160),
    cityEn: sanitizeText(project.cityEn, 100),
    cityFa: sanitizeText(project.cityFa, 100),
    category: project.category,
    serviceEn: sanitizeText(project.serviceEn, 100),
    serviceFa: sanitizeText(project.serviceFa, 100),
    disciplines: project.disciplines.slice(0, 3),
    coverImage: sanitizeText(project.coverImage, 500),
    imageDisclosure: project.imageDisclosure === 'photograph' ? 'photograph' : 'concept',
    featuredOrder: Math.max(0, Math.min(999, Math.round(Number(project.featuredOrder) || 10))),
    status: project.status === 'draft' ? 'draft' : 'published',
    updatedAt: serverTimestamp(),
  };

  const roleEn = sanitizeText(project.roleEn ?? '', 300);
  if (roleEn) payload.roleEn = roleEn;
  const roleFa = sanitizeText(project.roleFa ?? '', 300);
  if (roleFa) payload.roleFa = roleFa;
  const briefEn = sanitizeText(project.briefEn ?? '', 1500);
  if (briefEn) payload.briefEn = briefEn;
  const briefFa = sanitizeText(project.briefFa ?? '', 1500);
  if (briefFa) payload.briefFa = briefFa;
  const approachEn = sanitizeText(project.approachEn ?? '', 1500);
  if (approachEn) payload.approachEn = approachEn;
  const approachFa = sanitizeText(project.approachFa ?? '', 1500);
  if (approachFa) payload.approachFa = approachFa;
  const year = sanitizeText(project.year ?? '', 20);
  if (year) payload.year = year;
  const areaSqm = sanitizeText(project.areaSqm ?? '', 60);
  if (areaSqm) payload.areaSqm = areaSqm;
  const gallery = (project.gallery ?? [])
    .map((item) => sanitizeText(item, 500))
    .filter(Boolean)
    .slice(0, 8);
  if (gallery.length > 0) payload.gallery = gallery;

  try {
    await setDoc(doc(db, 'projects', id), payload);
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteProject(id: string): Promise<void> {
  const path = `projects/${id}`;
  try {
    await deleteDoc(doc(db, 'projects', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveTeamMember(
  member: Omit<TeamMember, 'id'>,
  existingId?: string
): Promise<string> {
  const id = existingId && /^[a-zA-Z0-9_-]{1,128}$/.test(existingId) ? existingId : generateRecordId('tm');
  const path = `teamMembers/${id}`;

  const payload: Record<string, unknown> = {
    nameEn: sanitizeText(member.nameEn, 120),
    nameFa: sanitizeText(member.nameFa, 120),
    roleEn: sanitizeText(member.roleEn, 140),
    roleFa: sanitizeText(member.roleFa, 140),
    discipline: member.discipline,
    order: Math.max(0, Math.min(999, Math.round(Number(member.order) || 10))),
    status: member.status === 'draft' ? 'draft' : 'published',
    updatedAt: serverTimestamp(),
  };

  if (
    member.tier === 'ceo' ||
    member.tier === 'board' ||
    member.tier === 'director' ||
    member.tier === 'specialist' ||
    member.tier === 'member'
  ) {
    payload.tier = member.tier;
  }

  // Persist specialties for CEO, Board/Directors, and Skill-Indexed Specialists
  const isStaffOnly = member.tier === 'member';
  const isExecutiveOrBoard =
    member.tier === 'ceo' || member.tier === 'board' || member.tier === 'director' || !member.tier;

  if (!isStaffOnly) {
    const specialtiesEn = sanitizeText(member.specialtiesEn ?? '', 400);
    if (specialtiesEn) payload.specialtiesEn = specialtiesEn;
    const specialtiesFa = sanitizeText(member.specialtiesFa ?? '', 400);
    if (specialtiesFa) payload.specialtiesFa = specialtiesFa;
  }

  // Only persist extended resume/bio/LinkedIn fields for CEO & Board/Department Head profiles
  if (isExecutiveOrBoard) {
    const bioEn = sanitizeText(member.bioEn ?? '', 800);
    if (bioEn) payload.bioEn = bioEn;
    const bioFa = sanitizeText(member.bioFa ?? '', 800);
    if (bioFa) payload.bioFa = bioFa;
    const resumeEn = sanitizeText(member.resumeEn ?? '', 3000);
    if (resumeEn) payload.resumeEn = resumeEn;
    const resumeFa = sanitizeText(member.resumeFa ?? '', 3000);
    if (resumeFa) payload.resumeFa = resumeFa;
    const linkedinUrl = sanitizeText(member.linkedinUrl ?? '', 240);
    if (linkedinUrl) payload.linkedinUrl = linkedinUrl;
  }
  const portraitUrl = sanitizeText(member.portraitUrl ?? '', 500);
  if (portraitUrl) payload.portraitUrl = portraitUrl;

  try {
    await setDoc(doc(db, 'teamMembers', id), payload);
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteTeamMember(id: string): Promise<void> {
  const path = `teamMembers/${id}`;
  try {
    await deleteDoc(doc(db, 'teamMembers', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveInsightArticle(
  article: Omit<Insight, 'id' | 'isSeedDefault'>,
  existingId?: string
): Promise<string> {
  const safeSlug = normalizeSlug(article.slug)
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
  const id =
    existingId && /^[a-zA-Z0-9_-]{1,128}$/.test(existingId)
      ? existingId
      : safeSlug || generateRecordId('ins');
  const path = `insights/${id}`;

  const cleanBlocks = sanitizeInsightBlocks(article.blocks);
  const derivedFa = extractPlainTextFromBlocks(cleanBlocks, 'fa');
  const derivedEn = extractPlainTextFromBlocks(cleanBlocks, 'en');

  const finalBodyFa = sanitizeText(
    derivedFa || article.bodyFa || article.excerptFa || article.titleFa,
    24000
  );
  const finalBodyEn = sanitizeText(
    derivedEn || article.bodyEn || article.excerptEn || article.titleEn,
    24000
  );

  const computedMinutes =
    article.readingTimeMinutes && Number.isFinite(article.readingTimeMinutes)
      ? Math.max(1, Math.min(120, Math.round(article.readingTimeMinutes)))
      : estimateReadingTimeMinutes(
          {
            titleFa: article.titleFa,
            titleEn: article.titleEn,
            excerptFa: article.excerptFa,
            excerptEn: article.excerptEn,
            bodyFa: finalBodyFa,
            bodyEn: finalBodyEn,
            coverImage: article.coverImage,
            blocks: cleanBlocks,
          },
          'fa'
        );

  const payload: Record<string, unknown> = {
    slug: safeSlug,
    titleEn: sanitizeText(article.titleEn, 200),
    titleFa: sanitizeText(article.titleFa, 200),
    excerptEn: sanitizeText(article.excerptEn, 600),
    excerptFa: sanitizeText(article.excerptFa, 600),
    bodyEn: finalBodyEn.length >= 2 ? finalBodyEn : sanitizeText(article.titleEn, 200),
    bodyFa: finalBodyFa.length >= 2 ? finalBodyFa : sanitizeText(article.titleFa, 200),
    topic: article.topic,
    publishedDate: sanitizeText(article.publishedDate, 30),
    readingTimeMinutes: computedMinutes,
    featured: Boolean(article.featured),
    status: article.status === 'draft' ? 'draft' : 'published',
    updatedAt: serverTimestamp(),
  };

  const subtitleEn = sanitizeText(article.subtitleEn ?? '', 300);
  if (subtitleEn) payload.subtitleEn = subtitleEn;
  const subtitleFa = sanitizeText(article.subtitleFa ?? '', 300);
  if (subtitleFa) payload.subtitleFa = subtitleFa;
  const coverImage = sanitizeText(article.coverImage ?? '', 500);
  if (coverImage) payload.coverImage = coverImage;
  const coverCaptionEn = sanitizeText(article.coverCaptionEn ?? '', 300);
  if (coverCaptionEn) payload.coverCaptionEn = coverCaptionEn;
  const coverCaptionFa = sanitizeText(article.coverCaptionFa ?? '', 300);
  if (coverCaptionFa) payload.coverCaptionFa = coverCaptionFa;
  const authorEn = sanitizeText(article.authorEn ?? '', 120);
  if (authorEn) payload.authorEn = authorEn;
  const authorFa = sanitizeText(article.authorFa ?? '', 120);
  if (authorFa) payload.authorFa = authorFa;
  const authorRoleEn = sanitizeText(article.authorRoleEn ?? '', 140);
  if (authorRoleEn) payload.authorRoleEn = authorRoleEn;
  const authorRoleFa = sanitizeText(article.authorRoleFa ?? '', 140);
  if (authorRoleFa) payload.authorRoleFa = authorRoleFa;

  const tagsFa = (article.tagsFa ?? []).map((t) => sanitizeText(t, 48)).filter(Boolean).slice(0, 8);
  if (tagsFa.length > 0) payload.tagsFa = tagsFa;
  const tagsEn = (article.tagsEn ?? []).map((t) => sanitizeText(t, 48)).filter(Boolean).slice(0, 8);
  if (tagsEn.length > 0) payload.tagsEn = tagsEn;
  if (cleanBlocks.length > 0) payload.blocks = cleanBlocks;

  try {
    await setDoc(doc(db, 'insights', id), payload);
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function publishInsightArticle(article: Omit<Insight, 'id'>): Promise<string> {
  return saveInsightArticle(article);
}

export async function deleteInsightArticle(id: string): Promise<void> {
  const path = `insights/${id}`;
  try {
    await deleteDoc(doc(db, 'insights', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveCourse(
  course: Omit<Course, 'id' | 'isSeedDefault'>,
  existingId?: string
): Promise<string> {
  const safeSlug = normalizeSlug(course.slug).replace(/[^a-z0-9-]+/g, '-').slice(0, 100);
  const id =
    existingId && /^[a-zA-Z0-9_-]{1,128}$/.test(existingId)
      ? existingId
      : safeSlug || generateRecordId('crs');
  const path = `courses/${id}`;

  const payload: Record<string, unknown> = {
    slug: safeSlug,
    titleFa: sanitizeText(course.titleFa, 160),
    titleEn: sanitizeText(course.titleEn, 160),
    department: course.department,
    format: course.format,
    instructorFa: sanitizeText(course.instructorFa, 120),
    instructorEn: sanitizeText(course.instructorEn, 120),
    durationFa: sanitizeText(course.durationFa, 80),
    durationEn: sanitizeText(course.durationEn, 80),
    priceToman: Math.max(0, Math.min(500000000, Math.round(Number(course.priceToman) || 0))),
    summaryFa: sanitizeText(course.summaryFa, 1500),
    summaryEn: sanitizeText(course.summaryEn, 1500),
    coverImage: sanitizeText(course.coverImage, 500),
    featuredOrder: Math.max(0, Math.min(999, Math.round(Number(course.featuredOrder) || 10))),
    status: course.status === 'draft' ? 'draft' : 'published',
    updatedAt: serverTimestamp(),
  };

  const scheduleFa = sanitizeText(course.scheduleFa ?? '', 160);
  if (scheduleFa) payload.scheduleFa = scheduleFa;
  const scheduleEn = sanitizeText(course.scheduleEn ?? '', 160);
  if (scheduleEn) payload.scheduleEn = scheduleEn;

  if (
    typeof course.originalPriceToman === 'number' &&
    Number.isFinite(course.originalPriceToman) &&
    course.originalPriceToman > 0
  ) {
    payload.originalPriceToman = Math.min(500000000, Math.round(course.originalPriceToman));
  }
  if (
    typeof course.capacity === 'number' &&
    Number.isFinite(course.capacity) &&
    course.capacity >= 1
  ) {
    payload.capacity = Math.min(10000, Math.round(course.capacity));
  }

  const syllabusFa = (course.syllabusFa ?? [])
    .map((s) => sanitizeText(s, 200))
    .filter(Boolean)
    .slice(0, 16);
  if (syllabusFa.length > 0) payload.syllabusFa = syllabusFa;

  const syllabusEn = (course.syllabusEn ?? [])
    .map((s) => sanitizeText(s, 200))
    .filter(Boolean)
    .slice(0, 16);
  if (syllabusEn.length > 0) payload.syllabusEn = syllabusEn;

  const paymentUrl = sanitizeText(course.paymentUrl ?? '', 500);
  if (paymentUrl) payload.paymentUrl = paymentUrl;
  const paymentNoteFa = sanitizeText(course.paymentNoteFa ?? '', 600);
  if (paymentNoteFa) payload.paymentNoteFa = paymentNoteFa;
  const paymentNoteEn = sanitizeText(course.paymentNoteEn ?? '', 600);
  if (paymentNoteEn) payload.paymentNoteEn = paymentNoteEn;
  const accessUrl = sanitizeText(course.accessUrl ?? '', 500);
  if (accessUrl) payload.accessUrl = accessUrl;

  try {
    await setDoc(doc(db, 'courses', id), payload);
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCourse(id: string): Promise<void> {
  const path = `courses/${id}`;
  try {
    await deleteDoc(doc(db, 'courses', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function savePartnerLogo(
  partner: Omit<PartnerLogo, 'id' | 'isSeedDefault'>,
  existingId?: string
): Promise<string> {
  const id =
    existingId && /^[a-zA-Z0-9_-]{1,128}$/.test(existingId)
      ? existingId
      : generateRecordId('ptn');
  const path = `partnerLogos/${id}`;

  const payload: Record<string, unknown> = {
    nameFa: sanitizeText(partner.nameFa, 120),
    nameEn: sanitizeText(partner.nameEn, 120),
    order: Math.max(0, Math.min(999, Math.round(Number(partner.order) || 10))),
    status: partner.status === 'draft' ? 'draft' : 'published',
    updatedAt: serverTimestamp(),
  };

  const descriptionFa = sanitizeText(partner.descriptionFa ?? '', 240);
  if (descriptionFa) payload.descriptionFa = descriptionFa;
  const descriptionEn = sanitizeText(partner.descriptionEn ?? '', 240);
  if (descriptionEn) payload.descriptionEn = descriptionEn;
  const logoUrl = sanitizeText(partner.logoUrl ?? '', 500);
  if (logoUrl) payload.logoUrl = logoUrl;
  const presetMarkId = sanitizeText(partner.presetMarkId ?? '', 60);
  if (presetMarkId) payload.presetMarkId = presetMarkId;
  const websiteUrl = sanitizeText(partner.websiteUrl ?? '', 240);
  if (websiteUrl) payload.websiteUrl = websiteUrl;

  try {
    await setDoc(doc(db, 'partnerLogos', id), payload);
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deletePartnerLogo(id: string): Promise<void> {
  const path = `partnerLogos/${id}`;
  try {
    await deleteDoc(doc(db, 'partnerLogos', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveMaterialItem(
  material: Omit<MaterialItem, 'id' | 'isSeedDefault'>,
  existingId?: string
): Promise<string> {
  const safeSlug = deriveMaterialSlug(material.slug, material.titleEn);
  const id =
    existingId && /^[a-zA-Z0-9_-]{1,128}$/.test(existingId)
      ? existingId
      : safeSlug || generateRecordId('mat');
  const path = `materials/${id}`;

  const titleFa = sanitizeText(material.titleFa, 160);
  const titleEn = sanitizeText(material.titleEn || material.titleFa, 160);

  const payload: Record<string, unknown> = {
    slug: safeSlug,
    titleFa,
    titleEn,
    category: material.category,
    coverImage: sanitizeText(material.coverImage, 500),
    featured: Boolean(material.featured),
    order: Math.max(0, Math.min(999, Math.round(Number(material.order) || 10))),
    status: material.status === 'draft' ? 'draft' : 'published',
    updatedAt: serverTimestamp(),
  };

  const subtitleFa = sanitizeText(material.subtitleFa ?? '', 220);
  if (subtitleFa) payload.subtitleFa = subtitleFa;
  const subtitleEn = sanitizeText(material.subtitleEn ?? '', 220);
  if (subtitleEn) payload.subtitleEn = subtitleEn;
  const summaryFa = sanitizeText(material.summaryFa ?? '', 1200);
  if (summaryFa) payload.summaryFa = summaryFa;
  const summaryEn = sanitizeText(material.summaryEn ?? '', 1200);
  if (summaryEn) payload.summaryEn = summaryEn;
  const brandNameFa = sanitizeText(material.brandNameFa ?? '', 120);
  if (brandNameFa) payload.brandNameFa = brandNameFa;
  const brandNameEn = sanitizeText(material.brandNameEn ?? '', 120);
  if (brandNameEn) payload.brandNameEn = brandNameEn;
  const performanceMetric = sanitizeText(material.performanceMetric ?? '', 40);
  if (performanceMetric) payload.performanceMetric = performanceMetric;
  const performanceLabelFa = sanitizeText(material.performanceLabelFa ?? '', 100);
  if (performanceLabelFa) payload.performanceLabelFa = performanceLabelFa;
  const performanceLabelEn = sanitizeText(material.performanceLabelEn ?? '', 100);
  if (performanceLabelEn) payload.performanceLabelEn = performanceLabelEn;
  const standardRefFa = sanitizeText(material.standardRefFa ?? '', 120);
  if (standardRefFa) payload.standardRefFa = standardRefFa;
  const standardRefEn = sanitizeText(material.standardRefEn ?? '', 120);
  if (standardRefEn) payload.standardRefEn = standardRefEn;
  const applicationFa = sanitizeText(material.applicationFa ?? '', 240);
  if (applicationFa) payload.applicationFa = applicationFa;
  const applicationEn = sanitizeText(material.applicationEn ?? '', 240);
  if (applicationEn) payload.applicationEn = applicationEn;

  const certificates = sanitizeMaterialCertificates(material.certificates);
  if (certificates.length > 0) payload.certificates = certificates;

  const catalogUrl = sanitizeText(material.catalogUrl ?? '', 500);
  if (catalogUrl) payload.catalogUrl = catalogUrl;
  const catalogLabelFa = sanitizeText(material.catalogLabelFa ?? '', 120);
  if (catalogLabelFa) payload.catalogLabelFa = catalogLabelFa;
  const catalogLabelEn = sanitizeText(material.catalogLabelEn ?? '', 120);
  if (catalogLabelEn) payload.catalogLabelEn = catalogLabelEn;

  const partnerIds = (material.partnerIds ?? [])
    .map((pid) => sanitizeText(pid, 100))
    .filter(Boolean)
    .slice(0, 8);
  if (partnerIds.length > 0) payload.partnerIds = partnerIds;

  try {
    await setDoc(doc(db, 'materials', id), payload);
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteMaterialItem(id: string): Promise<void> {
  const path = `materials/${id}`;
  try {
    await deleteDoc(doc(db, 'materials', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}



