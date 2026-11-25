export type Locale = 'en' | 'fa';

export type DisciplineSlug = 'architecture-urbanism' | 'energy-mep' | 'structure-seismic';

export type ProjectCategory =
  | 'administrative'
  | 'residential'
  | 'urban-park'
  | 'mixed-use'
  | 'cultural'
  | 'industrial'
  | 'educational';

export type InsightTopic =
  | 'architecture'
  | 'energy-mep'
  | 'structure-seismic'
  | 'sustainability-lab';

export type ProjectStage =
  | 'concept'
  | 'schematic'
  | 'detailed'
  | 'construction'
  | 'existing';

export interface BilingualText {
  en: string;
  fa: string;
}

export interface SiteSettings {
  brandNameEn: string;
  brandNameFa: string;
  instagramUrl: string;
  linkedinUrl?: string;
  youtubeUrl?: string;
  telegramUrl?: string;
  whatsappUrl?: string;
  publicEmail?: string;
  publicPhone?: string;
  studioCityEn?: string;
  studioCityFa?: string;
  teamCoverImage?: string;
  teamCoverCaptionEn?: string;
  teamCoverCaptionFa?: string;
  heroTitleEn?: string;
  heroTitleFa?: string;
  heroSubtitleEn?: string;
  heroSubtitleFa?: string;
  aboutLeadEn?: string;
  aboutLeadFa?: string;
  hiddenSeedProjectSlugs?: string[];
  hiddenSeedCourseSlugs?: string[];
  hiddenSeedPartnerIds?: string[];
  hiddenSeedInsightSlugs?: string[];
  hiddenSeedMaterialIds?: string[];
  paymentInstructionsFa?: string;
  paymentInstructionsEn?: string;
}

export interface Discipline {
  slug: DisciplineSlug;
  indexLabel: '01' | '02' | '03';
  title: BilingualText;
  shortSubtitle: BilingualText;
  cardSummary: BilingualText;
  heroAnnotation: BilingualText;
  coverImage: string;
  heroAnchor: {
    cardLeftPct: number;
    cardTopPct: number;
    targetX: number;
    targetY: number;
  };
  overview: BilingualText;
  scope: BilingualText[];
  services: {
    name: BilingualText;
    description: BilingualText;
  }[];
  deliverables: BilingualText[];
}

export interface ProjectVerifiedMetric {
  label: BilingualText;
  value: string;
  basis: BilingualText;
  isTarget?: boolean;
}

export interface Project {
  id: string;
  slug: string;
  titleEn: string;
  titleFa: string;
  cityEn: string;
  cityFa: string;
  category: ProjectCategory;
  serviceEn: string;
  serviceFa: string;
  disciplines: DisciplineSlug[];
  roleEn?: string;
  roleFa?: string;
  briefEn?: string;
  briefFa?: string;
  approachEn?: string;
  approachFa?: string;
  year?: string;
  areaSqm?: string;
  coverImage: string;
  gallery?: string[];
  imageDisclosure: 'concept' | 'photograph';
  verifiedMetrics?: ProjectVerifiedMetric[];
  featuredOrder: number;
  status: 'draft' | 'published';
  isSeedDefault?: boolean;
}

export type InsightBlockType =
  | 'section-heading'
  | 'rich-text'
  | 'telegram-media-post'
  | 'text-image-split'
  | 'key-metrics'
  | 'callout'
  | 'quote';

export type InsightMediaLayout = 'mosaic' | 'feature-split' | 'filmstrip';
export type InsightMediaPosition = 'above' | 'below';
export type InsightSplitSide = 'start' | 'end';
export type InsightCalloutTone = 'insight' | 'standard' | 'highlight';

export interface InsightBlockMediaItem {
  url: string;
  captionFa?: string;
  captionEn?: string;
  altFa?: string;
  altEn?: string;
}

export interface InsightBlockMetricItem {
  value: string;
  unit?: string;
  labelFa: string;
  labelEn: string;
}

export interface InsightBlock {
  id: string;
  type: InsightBlockType;
  kickerFa?: string;
  kickerEn?: string;
  headingFa?: string;
  headingEn?: string;
  bodyFa?: string;
  bodyEn?: string;
  leadStyle?: boolean;
  media?: InsightBlockMediaItem[];
  mediaLayout?: InsightMediaLayout;
  textPosition?: InsightMediaPosition;
  splitSide?: InsightSplitSide;
  metrics?: InsightBlockMetricItem[];
  tone?: InsightCalloutTone;
  attributionFa?: string;
  attributionEn?: string;
}

export interface Insight {
  id: string;
  slug: string;
  titleEn: string;
  titleFa: string;
  subtitleEn?: string;
  subtitleFa?: string;
  excerptEn: string;
  excerptFa: string;
  bodyEn: string;
  bodyFa: string;
  topic: InsightTopic;
  publishedDate: string;
  coverImage?: string;
  coverCaptionEn?: string;
  coverCaptionFa?: string;
  authorEn?: string;
  authorFa?: string;
  authorRoleEn?: string;
  authorRoleFa?: string;
  readingTimeMinutes?: number;
  featured?: boolean;
  tagsEn?: string[];
  tagsFa?: string[];
  blocks?: InsightBlock[];
  status: 'draft' | 'published';
  isSeedDefault?: boolean;
}

export type TeamMemberTier =
  | 'ceo'
  | 'inspector'
  | 'board'
  | 'director'
  | 'specialist'
  | 'member'
  | 'advisor';

export interface TeamMember {
  id: string;
  nameEn: string;
  nameFa: string;
  roleEn: string;
  roleFa: string;
  discipline: DisciplineSlug | 'leadership';
  tier?: TeamMemberTier;
  bioEn?: string;
  bioFa?: string;
  specialtiesEn?: string;
  specialtiesFa?: string;
  resumeEn?: string;
  resumeFa?: string;
  linkedinUrl?: string;
  portraitUrl?: string;
  order: number;
  status: 'draft' | 'published';
  isSeedDefault?: boolean;
}

export interface PartnerLogo {
  id: string;
  nameFa: string;
  nameEn: string;
  descriptionFa?: string;
  descriptionEn?: string;
  logoUrl?: string;
  presetMarkId?: string;
  websiteUrl?: string;
  order: number;
  status: 'draft' | 'published';
  isSeedDefault?: boolean;
}

export type MaterialCategory =
  | 'thermal-envelope'
  | 'lightweight-structure'
  | 'facade-glazing'
  | 'smart-energy';

export interface MaterialCertificate {
  imageUrl: string;
  titleFa?: string;
  titleEn?: string;
  issuerFa?: string;
  issuerEn?: string;
}

export interface MaterialItem {
  id: string;
  slug: string;
  titleFa: string;
  titleEn: string;
  subtitleFa?: string;
  subtitleEn?: string;
  summaryFa?: string;
  summaryEn?: string;
  category: MaterialCategory;
  brandNameFa?: string;
  brandNameEn?: string;
  performanceMetric?: string;
  performanceLabelFa?: string;
  performanceLabelEn?: string;
  standardRefFa?: string;
  standardRefEn?: string;
  applicationFa?: string;
  applicationEn?: string;
  coverImage: string;
  certificates?: MaterialCertificate[];
  catalogUrl?: string;
  catalogLabelFa?: string;
  catalogLabelEn?: string;
  partnerIds?: string[];
  featured?: boolean;
  order: number;
  status: 'draft' | 'published';
  isSeedDefault?: boolean;
}

export type CourseDepartment = DisciplineSlug | 'multidisciplinary';
export type CourseFormat = 'online-live' | 'recorded' | 'in-person' | 'hybrid';

export interface Course {
  id: string;
  slug: string;
  titleFa: string;
  titleEn: string;
  department: CourseDepartment;
  format: CourseFormat;
  instructorFa: string;
  instructorEn: string;
  durationFa: string;
  durationEn: string;
  scheduleFa?: string;
  scheduleEn?: string;
  priceToman: number;
  originalPriceToman?: number;
  capacity?: number;
  summaryFa: string;
  summaryEn: string;
  syllabusFa?: string[];
  syllabusEn?: string[];
  coverImage: string;
  paymentUrl?: string;
  paymentNoteFa?: string;
  paymentNoteEn?: string;
  accessUrl?: string;
  featuredOrder: number;
  status: 'draft' | 'published';
  isSeedDefault?: boolean;
}

export interface CourseFormInput {
  slug: string;
  titleFa: string;
  titleEn: string;
  department: CourseDepartment;
  format: CourseFormat;
  instructorFa: string;
  instructorEn: string;
  durationFa: string;
  durationEn: string;
  scheduleFa: string;
  scheduleEn: string;
  priceToman: string;
  originalPriceToman: string;
  capacity: string;
  summaryFa: string;
  summaryEn: string;
  syllabusFaText: string;
  syllabusEnText: string;
  coverImage: string;
  paymentUrl: string;
  paymentNoteFa: string;
  paymentNoteEn: string;
  accessUrl: string;
  featuredOrder: number;
  status: 'draft' | 'published';
}

export interface MemberCheckoutInput {
  fullName: string;
  phone: string;
  city: string;
  nationalId: string;
  organization: string;
  notes: string;
}

export interface LabMetric {
  id: 'sda' | 'eui' | 'co2' | 'saro-sabz';
  label: BilingualText;
  valueDisplay: BilingualText | null;
  unitOrContext: BilingualText;
  progressPct: number | null;
  isIllustrative: boolean;
  methodologySummary: BilingualText;
}

export interface InquiryFormInput {
  fullName: string;
  email: string;
  phone: string;
  organization: string;
  projectType: string;
  disciplines: DisciplineSlug[];
  city: string;
  message: string;
}

export interface AssessmentFormInput {
  fullName: string;
  email: string;
  phone: string;
  organization: string;
  projectType: string;
  city: string;
  approximateFloorAreaSqm: string;
  projectStage: ProjectStage;
  assessmentGoals: string[];
  notes: string;
}

export interface InquiryRecord {
  id: string;
  userId?: string;
  fullName: string;
  email: string;
  phone?: string;
  organization?: string;
  projectType: string;
  disciplines: DisciplineSlug[];
  city?: string;
  message: string;
  locale: Locale;
  internalStatus: 'new' | 'reviewing' | 'contacted' | 'archived';
  adminReply?: string;
  adminNotes?: string;
  repliedAtIso?: string;
  createdAtIso?: string;
}

export interface AssessmentRecord {
  id: string;
  userId?: string;
  fullName: string;
  email: string;
  phone?: string;
  organization?: string;
  projectType: string;
  city: string;
  approximateFloorAreaSqm: number;
  projectStage: ProjectStage;
  assessmentGoals: string[];
  notes?: string;
  locale: Locale;
  internalStatus: 'new' | 'reviewing' | 'scheduled' | 'completed' | 'archived';
  adminReply?: string;
  adminNotes?: string;
  repliedAtIso?: string;
  createdAtIso?: string;
}

export type UserRole = 'member' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  displayName?: string;
  photoURL?: string;
  phone?: string;
  nationalId?: string;
  city?: string;
  organization?: string;
  profession?: string;
  billingAddress?: string;
  locale?: Locale;
  role: UserRole;
  createdAtIso?: string;
  updatedAtIso?: string;
  lastLoginAtIso?: string;
}

export interface UserProfileFormInput {
  fullName: string;
  email?: string;
  phone: string;
  nationalId: string;
  city: string;
  organization: string;
  profession: string;
  billingAddress: string;
}

export type OrderItemType = 'course' | 'workshop' | 'consultation' | 'publication';
export type OrderPaymentStatus = 'pending' | 'paid' | 'cancelled' | 'refunded';

export interface UserOrder {
  id: string;
  orderNumber: string;
  userId: string;
  userEmail: string;
  userFullName: string;
  userPhone?: string;
  courseId?: string;
  itemType: OrderItemType;
  titleFa: string;
  titleEn: string;
  amountToman: number;
  paymentStatus: OrderPaymentStatus;
  paymentGateway?: string;
  paymentRef?: string;
  notes?: string;
  accessUrl?: string;
  createdAtIso?: string;
  updatedAtIso?: string;
  paidAtIso?: string;
}

export interface AdminOrderFormInput {
  userId: string;
  courseId?: string;
  itemType: OrderItemType;
  titleFa: string;
  titleEn: string;
  amountToman: string;
  paymentStatus: OrderPaymentStatus;
  paymentGateway: string;
  paymentRef: string;
  accessUrl: string;
  notes: string;
}

export type TicketCategory = 'courses' | 'orders-billing' | 'technical' | 'general';
export type TicketPriority = 'normal' | 'high';
export type TicketStatus = 'open' | 'in-progress' | 'answered' | 'closed';

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  userId: string;
  userEmail: string;
  userFullName: string;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  initialMessage: string;
  orderNumber?: string;
  lastReplyBy: 'user' | 'admin';
  replyCount: number;
  adminNotes?: string;
  locale: Locale;
  createdAtIso?: string;
  updatedAtIso?: string;
  lastReplyAtIso?: string;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  ticketOwnerId: string;
  senderUid: string;
  senderName: string;
  senderRole: 'user' | 'admin';
  body: string;
  createdAtIso?: string;
}

export interface TicketFormInput {
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  orderNumber: string;
  message: string;
}

export type PageRoute =
  | { page: 'home' }
  | { page: 'not-found' }
  | { page: 'about' }
  | { page: 'expertise' }
  | { page: 'discipline'; slug: DisciplineSlug }
  | { page: 'materials-technologies' }
  | { page: 'projects' }
  | { page: 'project-detail'; slug: string }
  | { page: 'sustainability-lab' }
  | { page: 'insights' }
  | { page: 'insight-detail'; slug: string }
  | { page: 'courses' }
  | { page: 'contact' }
  | { page: 'account' }
  | { page: 'studio' };
