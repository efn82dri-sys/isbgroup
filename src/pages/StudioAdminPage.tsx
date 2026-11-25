import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  EmailAuthProvider,
  linkWithCredential,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updatePassword,
  type User,
} from 'firebase/auth';
import {
  BookOpen,
  Building2,
  Calendar,
  CheckCircle2,
  Eye,
  EyeOff,
  FolderKanban,
  Images,
  Inbox,
  KeyRound,
  Layers,
  Leaf,
  Lock,
  LogOut,
  MapPin,
  MessageSquareReply,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sliders,
  Ticket,
  UserCheck,
  Users,
} from '../components/icons/IsbIcons';
import {
  deleteAssessment,
  deleteInquiry,
  fetchAdminCatalog,
  fetchStaffSubmissions,
  updateAssessmentResponse,
  updateAssessmentStatus,
  updateInquiryResponse,
  updateInquiryStatus,
} from '../services/contentStore';
import { fetchAdminPortalCollections } from '../services/accountStore';
import { auth, googleProvider } from '../services/firebase';
import { DISCIPLINES } from '../data/seedContent';
import type {
  AssessmentRecord,
  Course,
  InquiryRecord,
  Insight,
  Locale,
  MaterialItem,
  PartnerLogo,
  Project,
  SiteSettings,
  SupportTicket,
  TeamMember,
  UserOrder,
  UserProfile,
} from '../types/content';
import { mapStudioAuthError, validateStudioPassword } from '../utils/validation';
import { CoursesManager } from '../components/admin/CoursesManager';
import { MaterialsManager } from '../components/admin/MaterialsManager';
import { PartnersManager } from '../components/admin/PartnersManager';
import { ProjectsManager } from '../components/admin/ProjectsManager';
import {
  InsightsManager,
  SiteCustomizationManager,
} from '../components/admin/SiteAndInsightsManagers';
import {
  SubmissionDrawer,
  type SelectedSubmission,
} from '../components/admin/SubmissionDrawer';
import { TeamManager } from '../components/admin/TeamManager';
import {
  AdminOrdersManager,
  AdminTicketsManager,
  AdminUsersManager,
} from '../components/admin/MembersPortalManagers';

const STUDIO_ADMIN_EMAIL = 'isbgroup58@gmail.com';

const INQUIRY_STATUS_LABELS: Record<InquiryRecord['internalStatus'], { fa: string; en: string }> = {
  new: { fa: 'جدید', en: 'New' },
  reviewing: { fa: 'در حال بررسی', en: 'Reviewing' },
  contacted: { fa: 'تماس گرفته شد / پاسخ داده شد', en: 'Contacted / Replied' },
  archived: { fa: 'بایگانی‌شده', en: 'Archived' },
};

const ASSESSMENT_STATUS_LABELS: Record<
  AssessmentRecord['internalStatus'],
  { fa: string; en: string }
> = {
  new: { fa: 'جدید', en: 'New' },
  reviewing: { fa: 'در حال بررسی', en: 'Reviewing' },
  scheduled: { fa: 'زمان‌بندی‌شده', en: 'Scheduled' },
  completed: { fa: 'تکمیل‌شده', en: 'Completed' },
  archived: { fa: 'بایگانی‌شده', en: 'Archived' },
};

type AdminTab =
  | 'inquiries'
  | 'assessments'
  | 'users'
  | 'tickets'
  | 'orders'
  | 'courses'
  | 'projects'
  | 'materials'
  | 'team'
  | 'partners'
  | 'insights'
  | 'settings';

function getFirebaseErrorCode(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code?: unknown }).code;
    return typeof code === 'string' ? code : undefined;
  }
  return undefined;
}

function formatShortDate(iso: string | undefined, locale: Locale): string {
  if (!iso) return locale === 'fa' ? 'ثبت‌شده' : 'Recorded';
  try {
    return new Intl.DateTimeFormat(locale === 'fa' ? 'fa-IR' : 'en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 16).replace('T', ' ');
  }
}

interface StudioAdminPageProps {
  locale: Locale;
  settings: SiteSettings;
  onContentUpdated: () => Promise<void>;
}

export function StudioAdminPage({
  locale,
  settings,
  onContentUpdated,
}: StudioAdminPageProps) {
  const isFa = locale === 'fa';
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [authReady, setAuthReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  // Submissions, Members Portal & CMS catalog state
  const [inquiries, setInquiries] = useState<InquiryRecord[]>([]);
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
  const [memberUsers, setMemberUsers] = useState<UserProfile[]>([]);
  const [memberOrders, setMemberOrders] = useState<UserOrder[]>([]);
  const [memberTickets, setMemberTickets] = useState<SupportTicket[]>([]);
  const [preselectedOrderUserId, setPreselectedOrderUserId] = useState<string | null>(null);
  const [catalogProjects, setCatalogProjects] = useState<Project[]>([]);
  const [catalogMaterials, setCatalogMaterials] = useState<MaterialItem[]>([]);
  const [catalogCourses, setCatalogCourses] = useState<Course[]>([]);
  const [catalogTeam, setCatalogTeam] = useState<TeamMember[]>([]);
  const [catalogPartners, setCatalogPartners] = useState<PartnerLogo[]>([]);
  const [catalogInsights, setCatalogInsights] = useState<Insight[]>([]);

  const [tab, setTab] = useState<AdminTab>('inquiries');
  const [selectedSubmission, setSelectedSubmission] = useState<SelectedSubmission | null>(null);
  const [submissionSearch, setSubmissionSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<'info' | 'success' | 'error'>('info');

  // Password-only login state (backed by Firebase Auth Email/Password for the studio account)
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [signingInMethod, setSigningInMethod] = useState<'password' | 'google' | null>(null);

  // In-panel password setup/update state
  const [newStudioPassword, setNewStudioPassword] = useState('');
  const [confirmStudioPassword, setConfirmStudioPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{
    tone: 'success' | 'error';
    text: string;
  } | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
      if (!nextUser) {
        setInquiries([]);
        setAssessments([]);
        setMemberUsers([]);
        setMemberOrders([]);
        setMemberTickets([]);
        setSelectedSubmission(null);
        setAccessDenied(false);
      }
    });
    return unsub;
  }, []);

  const hiddenSeedKey = (settings.hiddenSeedProjectSlugs ?? []).join(',');
  const hiddenCourseKey = (settings.hiddenSeedCourseSlugs ?? []).join(',');
  const hiddenPartnerKey = (settings.hiddenSeedPartnerIds ?? []).join(',');
  const hiddenInsightKey = (settings.hiddenSeedInsightSlugs ?? []).join(',');
  const hiddenMaterialKey = (settings.hiddenSeedMaterialIds ?? []).join(',');

  const loadAdminData = useCallback(async () => {
    setLoading(true);
    setAccessDenied(false);
    try {
      const hiddenSlugs = hiddenSeedKey ? hiddenSeedKey.split(',') : [];
      const hiddenCourses = hiddenCourseKey ? hiddenCourseKey.split(',') : [];
      const hiddenPartners = hiddenPartnerKey ? hiddenPartnerKey.split(',') : [];
      const hiddenInsights = hiddenInsightKey ? hiddenInsightKey.split(',') : [];
      const hiddenMaterials = hiddenMaterialKey ? hiddenMaterialKey.split(',') : [];
      const [submissions, catalog, portalData] = await Promise.all([
        fetchStaffSubmissions(),
        fetchAdminCatalog(
          hiddenSlugs,
          hiddenCourses,
          hiddenPartners,
          hiddenInsights,
          hiddenMaterials
        ),
        fetchAdminPortalCollections(),
      ]);
      setInquiries(submissions.inquiries);
      setAssessments(submissions.assessments);
      setCatalogProjects(catalog.projects);
      setCatalogMaterials(catalog.materials);
      setCatalogCourses(catalog.courses);
      setCatalogTeam(catalog.teamMembers);
      setCatalogPartners(catalog.partnerLogos);
      setCatalogInsights(catalog.insights);
      setMemberUsers(portalData.users);
      setMemberOrders(portalData.orders);
      setMemberTickets(portalData.tickets);
    } catch {
      setAccessDenied(true);
    } finally {
      setLoading(false);
    }
  }, [hiddenSeedKey, hiddenCourseKey, hiddenPartnerKey, hiddenInsightKey, hiddenMaterialKey]);

  useEffect(() => {
    if (authReady && user) {
      void loadAdminData();
    }
  }, [authReady, user, loadAdminData]);

  const handleRefreshAll = useCallback(async () => {
    await onContentUpdated();
    await loadAdminData();
  }, [onContentUpdated, loadAdminData]);

  const setBanner = useCallback(
    (text: string | null, tone: 'info' | 'success' | 'error' = 'info') => {
      setStatusMessage(text);
      setStatusTone(tone);
    },
    []
  );

  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBanner(null);
    if (!loginPassword.trim()) {
      setBanner(
        isFa ? 'لطفاً رمز عبور مدیریت را وارد کنید.' : 'Please enter the studio admin password.',
        'error'
      );
      return;
    }

    setSigningInMethod('password');
    try {
      await signInWithEmailAndPassword(auth, STUDIO_ADMIN_EMAIL, loginPassword);
      setLoginPassword('');
    } catch (error) {
      setBanner(mapStudioAuthError(getFirebaseErrorCode(error), locale), 'error');
    } finally {
      setSigningInMethod(null);
    }
  };

  const handleGoogleSignIn = async () => {
    setBanner(null);
    setSigningInMethod('google');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      setBanner(mapStudioAuthError(getFirebaseErrorCode(error), locale), 'error');
    } finally {
      setSigningInMethod(null);
    }
  };

  const handleSaveStudioPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);
    if (!user || !user.email) return;

    const validationError = validateStudioPassword(
      newStudioPassword,
      confirmStudioPassword,
      locale
    );
    if (validationError) {
      setPasswordMessage({ tone: 'error', text: validationError });
      return;
    }

    setSavingPassword(true);
    try {
      const alreadyHasPassword = user.providerData.some((p) => p.providerId === 'password');
      if (alreadyHasPassword) {
        await updatePassword(user, newStudioPassword);
      } else {
        const credential = EmailAuthProvider.credential(user.email, newStudioPassword);
        await linkWithCredential(user, credential);
      }
      setNewStudioPassword('');
      setConfirmStudioPassword('');
      setPasswordMessage({
        tone: 'success',
        text: isFa
          ? 'رمز عبور پنل با موفقیت ثبت شد. از این پس می‌توانید مستقیم و فقط با همین رمز وارد شوید.'
          : 'Studio password saved. You can now sign in directly with this password.',
      });
    } catch (error) {
      setPasswordMessage({
        tone: 'error',
        text: mapStudioAuthError(getFirebaseErrorCode(error), locale),
      });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSendVerification = async () => {
    if (!user) return;
    setBanner(null);
    try {
      await sendEmailVerification(user);
      setVerificationSent(true);
      setBanner(
        isFa
          ? 'ایمیل تأیید ارسال شد. پس از کلیک روی لینک موجود در ایمیل، روی «بررسی مجدد دسترسی» بزنید.'
          : 'Verification email sent. After clicking the link in your inbox, click Re-check Access.',
        'success'
      );
    } catch (error) {
      setBanner(mapStudioAuthError(getFirebaseErrorCode(error), locale), 'error');
    }
  };

  const handleRecheckAccess = async () => {
    if (!user) return;
    setBanner(null);
    try {
      await user.reload();
      await user.getIdToken(true);
      setUser(auth.currentUser);
      await loadAdminData();
    } catch {
      setAccessDenied(true);
    }
  };

  const handleSaveSubmissionResponse = async (payload: {
    kind: 'inquiry' | 'assessment';
    id: string;
    internalStatus: string;
    adminReply: string;
    adminNotes: string;
    markReplied: boolean;
  }) => {
    const nowIso = new Date().toISOString();
    if (payload.kind === 'inquiry') {
      const nextStatus = payload.internalStatus as InquiryRecord['internalStatus'];
      await updateInquiryResponse(payload.id, {
        internalStatus: nextStatus,
        adminReply: payload.adminReply,
        adminNotes: payload.adminNotes,
        markReplied: payload.markReplied,
      });
      setInquiries((prev) =>
        prev.map((item) =>
          item.id === payload.id
            ? {
                ...item,
                internalStatus: nextStatus,
                adminReply: payload.adminReply,
                adminNotes: payload.adminNotes,
                repliedAtIso:
                  payload.markReplied && payload.adminReply.trim() ? nowIso : item.repliedAtIso,
              }
            : item
        )
      );
      setSelectedSubmission((prev) =>
        prev && prev.kind === 'inquiry' && prev.record.id === payload.id
          ? {
              kind: 'inquiry',
              record: {
                ...prev.record,
                internalStatus: nextStatus,
                adminReply: payload.adminReply,
                adminNotes: payload.adminNotes,
                repliedAtIso:
                  payload.markReplied && payload.adminReply.trim()
                    ? nowIso
                    : prev.record.repliedAtIso,
              },
            }
          : prev
      );
    } else {
      const nextStatus = payload.internalStatus as AssessmentRecord['internalStatus'];
      await updateAssessmentResponse(payload.id, {
        internalStatus: nextStatus,
        adminReply: payload.adminReply,
        adminNotes: payload.adminNotes,
        markReplied: payload.markReplied,
      });
      setAssessments((prev) =>
        prev.map((item) =>
          item.id === payload.id
            ? {
                ...item,
                internalStatus: nextStatus,
                adminReply: payload.adminReply,
                adminNotes: payload.adminNotes,
                repliedAtIso:
                  payload.markReplied && payload.adminReply.trim() ? nowIso : item.repliedAtIso,
              }
            : item
        )
      );
      setSelectedSubmission((prev) =>
        prev && prev.kind === 'assessment' && prev.record.id === payload.id
          ? {
              kind: 'assessment',
              record: {
                ...prev.record,
                internalStatus: nextStatus,
                adminReply: payload.adminReply,
                adminNotes: payload.adminNotes,
                repliedAtIso:
                  payload.markReplied && payload.adminReply.trim()
                    ? nowIso
                    : prev.record.repliedAtIso,
              },
            }
          : prev
      );
    }
    setBanner(
      isFa ? 'پاسخ و وضعیت درخواست در سیستم ثبت شد.' : 'Submission response and status saved.',
      'success'
    );
  };

  const handleDeleteSubmission = async (kind: 'inquiry' | 'assessment', id: string) => {
    if (kind === 'inquiry') {
      await deleteInquiry(id);
      setInquiries((prev) => prev.filter((item) => item.id !== id));
    } else {
      await deleteAssessment(id);
      setAssessments((prev) => prev.filter((item) => item.id !== id));
    }
    setSelectedSubmission(null);
    setBanner(isFa ? 'درخواست با موفقیت حذف شد.' : 'Submission deleted.', 'success');
  };

  const filteredInquiries = useMemo(() => {
    const q = submissionSearch.trim().toLowerCase();
    return inquiries.filter((inq) => {
      if (statusFilter !== 'all' && inq.internalStatus !== statusFilter) return false;
      if (!q) return true;
      return (
        inq.fullName.toLowerCase().includes(q) ||
        inq.email.toLowerCase().includes(q) ||
        (inq.phone ?? '').toLowerCase().includes(q) ||
        (inq.organization ?? '').toLowerCase().includes(q) ||
        (inq.city ?? '').toLowerCase().includes(q) ||
        inq.projectType.toLowerCase().includes(q) ||
        inq.message.toLowerCase().includes(q)
      );
    });
  }, [inquiries, submissionSearch, statusFilter]);

  const filteredAssessments = useMemo(() => {
    const q = submissionSearch.trim().toLowerCase();
    return assessments.filter((asr) => {
      if (statusFilter !== 'all' && asr.internalStatus !== statusFilter) return false;
      if (!q) return true;
      return (
        asr.fullName.toLowerCase().includes(q) ||
        asr.email.toLowerCase().includes(q) ||
        (asr.phone ?? '').toLowerCase().includes(q) ||
        (asr.organization ?? '').toLowerCase().includes(q) ||
        asr.city.toLowerCase().includes(q) ||
        asr.projectType.toLowerCase().includes(q) ||
        (asr.notes ?? '').toLowerCase().includes(q)
      );
    });
  }, [assessments, submissionSearch, statusFilter]);

  const newInquiryCount = inquiries.filter((i) => i.internalStatus === 'new').length;
  const newAssessmentCount = assessments.filter((a) => a.internalStatus === 'new').length;
  const openTicketsCount = memberTickets.filter((t) => t.status === 'open').length;

  const hasPasswordProvider = Boolean(
    user?.providerData.some((provider) => provider.providerId === 'password')
  );
  const isUnverifiedStudioAccount = Boolean(
    user && !user.emailVerified && user.email?.toLowerCase() === STUDIO_ADMIN_EMAIL
  );

  const tabs: { key: AdminTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      key: 'inquiries',
      label: isFa ? `درخواست پروژه (${inquiries.length})` : `Inquiries (${inquiries.length})`,
      icon: <Inbox className="w-3.5 h-3.5" />,
      badge: newInquiryCount,
    },
    {
      key: 'assessments',
      label: isFa ? `ارزیابی پایداری (${assessments.length})` : `Assessments (${assessments.length})`,
      icon: <Leaf className="w-3.5 h-3.5" />,
      badge: newAssessmentCount,
    },
    {
      key: 'users',
      label: isFa ? `کاربران (${memberUsers.length})` : `Users (${memberUsers.length})`,
      icon: <UserCheck className="w-3.5 h-3.5" />,
    },
    {
      key: 'tickets',
      label: isFa ? `تیکت‌ها (${memberTickets.length})` : `Tickets (${memberTickets.length})`,
      icon: <Ticket className="w-3.5 h-3.5" />,
      badge: openTicketsCount,
    },
    {
      key: 'orders',
      label: isFa ? `سفارش‌ها (${memberOrders.length})` : `Orders (${memberOrders.length})`,
      icon: <ShoppingBag className="w-3.5 h-3.5" />,
      badge: memberOrders.filter((o) => o.paymentStatus === 'pending').length,
    },
    {
      key: 'courses',
      label: isFa ? `دوره‌ها (${catalogCourses.length})` : `Courses (${catalogCourses.length})`,
      icon: <BookOpen className="w-3.5 h-3.5" />,
    },
    {
      key: 'projects',
      label: isFa ? `پروژه‌ها (${catalogProjects.length})` : `Projects (${catalogProjects.length})`,
      icon: <FolderKanban className="w-3.5 h-3.5" />,
    },
    {
      key: 'materials',
      label: isFa
        ? `مصالح و فناوری‌ها (${catalogMaterials.length})`
        : `Materials (${catalogMaterials.length})`,
      icon: <Layers className="w-3.5 h-3.5" />,
    },
    {
      key: 'team',
      label: isFa ? `تیم ما (${catalogTeam.length})` : `Team (${catalogTeam.length})`,
      icon: <Users className="w-3.5 h-3.5" />,
    },
    {
      key: 'partners',
      label: isFa ? `لوگوهای همکاران (${catalogPartners.length})` : `Partner Logos (${catalogPartners.length})`,
      icon: <Images className="w-3.5 h-3.5" />,
    },
    {
      key: 'insights',
      label: isFa ? `مقالات (${catalogInsights.length})` : `Insights (${catalogInsights.length})`,
      icon: <BookOpen className="w-3.5 h-3.5" />,
    },
    {
      key: 'settings',
      label: isFa ? 'شخصی‌سازی و رمز عبور' : 'Site & Password',
      icon: <Sliders className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <div className="pt-28 pb-20">
      <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-10 space-y-8">
        {/* Studio Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#6F9BFF] font-medium">
              {isFa ? 'پنل مدیریت جامع گروه ISB' : 'ISB GROUP STUDIO CMS'}
            </p>
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#F5F8FC] mt-1">
              {isFa
                ? 'مدیریت درخواست‌ها، پروژه‌ها، تیم و شخصی‌سازی سایت'
                : 'Requests, Projects, Team & Site Customization'}
            </h1>
          </div>

          {user && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#C6D2E3] ltr-inline">{user.email}</span>
              <button
                type="button"
                onClick={() => {
                  setMemberTickets([]);
                  setSelectedSubmission(null);
                  void signOut(auth);
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#6F9BFF]/30 px-4 py-2 text-xs text-[#F5F8FC] hover:border-[#6F9BFF]"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{isFa ? 'خروج' : 'Sign out'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Auth Gate / Access Check / Full Admin Workspace */}
        {!user ? (
          <div className="glass-surface max-w-md rounded-3xl p-7 sm:p-8 space-y-6">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[#223A87]/28 border border-[#6F9BFF]/38 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5 text-[#6F9BFF]" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-[#F5F8FC]">
                  {isFa ? 'ورود به پنل مدیریت' : 'Studio Admin Sign-In'}
                </h2>
                <p className="text-xs sm:text-sm text-[#C6D2E3] leading-relaxed">
                  {isFa
                    ? 'برای پاسخ به درخواست‌ها، آپلود پروژه‌ها، مدیریت اعضای تیم و شخصی‌سازی سایت، رمز عبور پنل را وارد کنید.'
                    : 'Enter the studio admin password to reply to submissions and manage projects, team, and site content.'}
                </p>
              </div>
            </div>

            <form onSubmit={handlePasswordSignIn} className="space-y-4" noValidate>
              <div className="space-y-2">
                <label
                  htmlFor="studio-password"
                  className="block text-xs font-medium text-[#DCE6F5]"
                >
                  {isFa ? 'رمز عبور مدیریت' : 'Admin Password'}
                </label>
                <div className="relative">
                  <input
                    id="studio-password"
                    type={showLoginPassword ? 'text' : 'password'}
                    dir="ltr"
                    autoComplete="current-password"
                    placeholder="••••••••••••"
                    value={loginPassword}
                    onChange={(e) => {
                      setLoginPassword(e.target.value);
                      if (statusMessage) setBanner(null);
                    }}
                    className={`w-full rounded-xl border border-[#6F9BFF]/24 bg-[#080D16]/75 py-3 text-sm text-[#F5F8FC] placeholder:text-[#8B9DB7]/45 focus:outline-none focus:border-[#6F9BFF] transition-colors ${
                      isFa ? 'pl-11 pr-4' : 'pl-4 pr-11'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword((prev) => !prev)}
                    aria-label={
                      showLoginPassword
                        ? isFa
                          ? 'پنهان کردن رمز عبور'
                          : 'Hide password'
                        : isFa
                          ? 'نمایش رمز عبور'
                          : 'Show password'
                    }
                    className={`absolute top-1/2 -translate-y-1/2 p-2 text-[#8B9DB7] hover:text-[#F5F8FC] transition-colors ${
                      isFa ? 'left-1.5' : 'right-1.5'
                    }`}
                  >
                    {showLoginPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={signingInMethod !== null}
                className="glass-cta w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold transition-all disabled:opacity-60"
              >
                <KeyRound className="w-4 h-4" />
                <span>
                  {signingInMethod === 'password'
                    ? isFa
                      ? 'در حال بررسی...'
                      : 'Signing in...'
                    : isFa
                      ? 'ورود با رمز عبور'
                      : 'Sign in with Password'}
                </span>
              </button>
            </form>

            {statusMessage && (
              <div
                role="alert"
                className={`rounded-2xl border px-4 py-3 text-xs leading-relaxed ${
                  statusTone === 'error'
                    ? 'border-amber-400/35 bg-amber-500/10 text-amber-200'
                    : 'border-white/15 bg-white/5 text-[#DCE6F5]'
                }`}
              >
                {statusMessage}
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-white/12" />
              <span className="text-[11px] text-[#8B9DB7]">{isFa ? 'یا' : 'or'}</span>
              <div className="h-px flex-1 bg-white/12" />
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={signingInMethod !== null}
              className="glass-pill w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-xs font-medium text-[#F5F8FC] hover:border-[#6F9BFF]/65 transition-all disabled:opacity-60"
            >
              <ShieldCheck className="w-4 h-4 text-[#28CF77]" />
              <span>
                {signingInMethod === 'google'
                  ? isFa
                    ? 'در حال اتصال به گوگل...'
                    : 'Connecting to Google...'
                  : isFa
                    ? 'ورود سریع با حساب گوگل مدیریت'
                    : 'Quick Sign-In with Studio Google Account'}
              </span>
            </button>
          </div>
        ) : accessDenied ? (
          <div className="glass-surface max-w-lg rounded-3xl border-amber-400/30 p-8 space-y-4">
            <h2 className="text-lg font-semibold text-[#F5F8FC]">
              {isUnverifiedStudioAccount
                ? isFa
                  ? 'نیاز به تأیید یک‌باره حساب'
                  : 'One-Time Account Verification Required'
                : isFa
                  ? 'دسترسی مجاز نیست'
                  : 'Staff Authorization Required'}
            </h2>
            <p className="text-sm text-[#C6D2E3] leading-relaxed">
              {isUnverifiedStudioAccount
                ? isFa
                  ? 'برای حفظ امنیت اطلاعات مشتریان، لازم است یک‌بار ایمیل حساب مدیریت تأیید شود (یا از طریق ورود گوگل وارد شوید).'
                  : 'For client data security, your studio email needs a one-time verification before accessing records (or sign in with Google).'
                : isFa
                  ? 'این حساب کاربری در فهرست مدیران مجاز گروه ISB ثبت نشده است.'
                  : 'This account is not authorized to view submitted client records or edit studio content.'}
            </p>
            {isUnverifiedStudioAccount && (
              <div className="flex flex-wrap gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleSendVerification}
                  className="glass-cta min-h-[44px] rounded-full px-5 py-2 text-xs font-semibold"
                >
                  {verificationSent
                    ? isFa
                      ? 'ارسال مجدد ایمیل تأیید'
                      : 'Resend Verification Email'
                    : isFa
                      ? 'ارسال ایمیل تأیید'
                      : 'Send Verification Email'}
                </button>
                <button
                  type="button"
                  onClick={handleRecheckAccess}
                  className="glass-pill min-h-[44px] rounded-full px-5 py-2 text-xs text-[#F5F8FC]"
                >
                  {isFa ? 'بررسی مجدد دسترسی' : 'Re-check Access'}
                </button>
              </div>
            )}
            {statusMessage && (
              <p role="alert" className="text-xs text-amber-200 leading-relaxed">
                {statusMessage}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top Navigation Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {tabs.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      setTab(item.key);
                      setStatusFilter('all');
                      setSubmissionSearch('');
                      setBanner(null);
                    }}
                    className={`min-h-[40px] inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium transition-all ${
                      tab === item.key
                        ? 'glass-cta font-semibold'
                        : 'glass-pill text-[#C6D2E3] hover:border-[#6F9BFF]/50'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                    {item.badge && item.badge > 0 ? (
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold font-numeric ${
                          tab === item.key
                            ? 'bg-white/20 text-white'
                            : 'bg-[#00A651] text-white'
                        }`}
                      >
                        {item.badge}
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleRefreshAll}
                disabled={loading}
                className="glass-pill min-h-[40px] inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs text-[#C6D2E3] hover:border-[#6F9BFF]"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>{isFa ? 'به‌روزرسانی' : 'Refresh'}</span>
              </button>
            </div>

            {statusMessage && (
              <div
                role="alert"
                className={`rounded-xl border px-4 py-3 text-sm ${
                  statusTone === 'error'
                    ? 'border-amber-400/35 bg-amber-500/10 text-amber-200'
                    : statusTone === 'success'
                      ? 'border-[#28CF77]/45 bg-[#00A651]/16 text-[#F5F8FC]'
                      : 'glass-card-active text-[#F5F8FC]'
                }`}
              >
                {statusMessage}
              </div>
            )}

            {/* TAB 1: Project Inquiries */}
            {tab === 'inquiries' && (
              <div className="space-y-4">
                <div className="glass-surface rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="relative flex-1 max-w-md">
                    <Search
                      className={`w-4 h-4 text-[#8B9DB7] absolute top-1/2 -translate-y-1/2 ${
                        isFa ? 'right-3' : 'left-3'
                      }`}
                    />
                    <input
                      type="text"
                      value={submissionSearch}
                      onChange={(e) => setSubmissionSearch(e.target.value)}
                      placeholder={
                        isFa
                          ? 'جستجو در نام، ایمیل، شهر یا متن درخواست...'
                          : 'Search by name, email, city, or message...'
                      }
                      className={`w-full rounded-xl border border-[#6F9BFF]/22 bg-[#080D16]/70 py-2 text-xs text-[#F5F8FC] ${
                        isFa ? 'pr-9 pl-3' : 'pl-9 pr-3'
                      }`}
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(['all', 'new', 'reviewing', 'contacted', 'archived'] as const).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setStatusFilter(st)}
                        className={`rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors ${
                          statusFilter === st
                            ? 'bg-[#223A87] text-white font-semibold border border-[#6F9BFF]/60'
                            : 'bg-white/5 text-[#C6D2E3] hover:bg-white/10'
                        }`}
                      >
                        {st === 'all'
                          ? isFa
                            ? 'همه'
                            : 'All'
                          : isFa
                            ? INQUIRY_STATUS_LABELS[st].fa
                            : INQUIRY_STATUS_LABELS[st].en}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredInquiries.length === 0 ? (
                  <div className="glass-surface rounded-2xl p-10 text-center text-sm text-[#8B9DB7]">
                    {inquiries.length === 0
                      ? isFa
                        ? 'هنوز درخواست پروژه‌ای ثبت نشده است.'
                        : 'No project inquiries submitted yet.'
                      : isFa
                        ? 'درخواستی با این فیلتر یافت نشد.'
                        : 'No inquiries match your filter.'}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredInquiries.map((inq) => {
                      const disciplineNames = inq.disciplines.map((slug) => {
                        const match = DISCIPLINES.find((d) => d.slug === slug);
                        return match ? match.title[locale] : slug;
                      });
                      const hasReply = Boolean(inq.adminReply?.trim());

                      return (
                        <div
                          key={inq.id}
                          onClick={() => setSelectedSubmission({ kind: 'inquiry', record: inq })}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setSelectedSubmission({ kind: 'inquiry', record: inq });
                            }
                          }}
                          className="glass-card glass-card-hover rounded-2xl p-5 space-y-3 cursor-pointer transition-all hover:border-[#6F9BFF]/55"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="space-y-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-base font-semibold text-[#F5F8FC]">
                                  {inq.fullName}
                                </span>
                                {inq.internalStatus === 'new' && (
                                  <span className="rounded-full bg-[#223A87]/40 border border-[#6F9BFF]/50 px-2 py-0.5 text-[10px] font-semibold text-[#93BCFF]">
                                    {isFa ? 'جدید' : 'New'}
                                  </span>
                                )}
                                {hasReply && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-[#00A651]/18 border border-[#28CF77]/35 px-2 py-0.5 text-[10px] font-medium text-[#28CF77]">
                                    <CheckCircle2 className="w-3 h-3" />
                                    {isFa ? 'پاسخ ثبت شده' : 'Replied'}
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#8B9DB7]">
                                <span className="ltr-inline">{inq.email}</span>
                                {inq.phone && <span className="ltr-inline">· {inq.phone}</span>}
                                {inq.organization && (
                                  <span className="inline-flex items-center gap-1">
                                    <Building2 className="w-3 h-3 text-[#6F9BFF]" />
                                    {inq.organization}
                                  </span>
                                )}
                                {inq.city && (
                                  <span className="inline-flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-[#28CF77]" />
                                    {inq.city}
                                  </span>
                                )}
                                {inq.createdAtIso && (
                                  <span className="inline-flex items-center gap-1 font-numeric">
                                    <Calendar className="w-3 h-3" />
                                    {formatShortDate(inq.createdAtIso, locale)}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div
                              className="flex flex-wrap items-center gap-2 shrink-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <select
                                aria-label={
                                  isFa ? 'تغییر وضعیت درخواست پروژه' : 'Update inquiry status'
                                }
                                value={inq.internalStatus}
                                onChange={async (e) => {
                                  const next = e.target.value as InquiryRecord['internalStatus'];
                                  try {
                                    await updateInquiryStatus(inq.id, next);
                                    setInquiries((prev) =>
                                      prev.map((item) =>
                                        item.id === inq.id ? { ...item, internalStatus: next } : item
                                      )
                                    );
                                    setBanner(
                                      isFa
                                        ? 'وضعیت درخواست به‌روزرسانی شد.'
                                        : 'Inquiry status updated.',
                                      'success'
                                    );
                                  } catch {
                                    setBanner(
                                      isFa
                                        ? 'خطا در تغییر وضعیت درخواست.'
                                        : 'Could not update inquiry status.',
                                      'error'
                                    );
                                  }
                                }}
                                className="rounded-xl border border-[#6F9BFF]/25 bg-[#0E1626] px-3 py-2 text-xs text-[#F5F8FC]"
                              >
                                {(['new', 'reviewing', 'contacted', 'archived'] as const).map(
                                  (status) => (
                                    <option key={status} value={status}>
                                      {isFa
                                        ? INQUIRY_STATUS_LABELS[status].fa
                                        : INQUIRY_STATUS_LABELS[status].en}
                                    </option>
                                  )
                                )}
                              </select>

                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedSubmission({ kind: 'inquiry', record: inq })
                                }
                                className="glass-cta min-h-[36px] inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold"
                              >
                                <MessageSquareReply className="w-3.5 h-3.5" />
                                <span>{isFa ? 'باز کردن و پاسخ' : 'Open & Reply'}</span>
                              </button>
                            </div>
                          </div>

                          <p className="text-xs text-[#28CF77]">
                            {inq.projectType}
                            {disciplineNames.length > 0 ? ` · ${disciplineNames.join('، ')}` : ''}
                          </p>
                          <p className="text-sm text-[#C6D2E3] leading-relaxed line-clamp-2">
                            {inq.message}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Sustainability Assessments */}
            {tab === 'assessments' && (
              <div className="space-y-4">
                <div className="glass-surface rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="relative flex-1 max-w-md">
                    <Search
                      className={`w-4 h-4 text-[#8B9DB7] absolute top-1/2 -translate-y-1/2 ${
                        isFa ? 'right-3' : 'left-3'
                      }`}
                    />
                    <input
                      type="text"
                      value={submissionSearch}
                      onChange={(e) => setSubmissionSearch(e.target.value)}
                      placeholder={
                        isFa
                          ? 'جستجو در نام، ایمیل، شهر یا یادداشت‌ها...'
                          : 'Search by name, email, city, or notes...'
                      }
                      className={`w-full rounded-xl border border-[#6F9BFF]/22 bg-[#080D16]/70 py-2 text-xs text-[#F5F8FC] ${
                        isFa ? 'pr-9 pl-3' : 'pl-9 pr-3'
                      }`}
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(['all', 'new', 'reviewing', 'scheduled', 'completed', 'archived'] as const).map(
                      (st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setStatusFilter(st)}
                          className={`rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors ${
                            statusFilter === st
                              ? 'bg-[#00A651] text-white font-semibold border border-[#28CF77]/60'
                              : 'bg-white/5 text-[#C6D2E3] hover:bg-white/10'
                          }`}
                        >
                          {st === 'all'
                            ? isFa
                              ? 'همه'
                              : 'All'
                            : isFa
                              ? ASSESSMENT_STATUS_LABELS[st].fa
                              : ASSESSMENT_STATUS_LABELS[st].en}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {filteredAssessments.length === 0 ? (
                  <div className="glass-surface rounded-2xl p-10 text-center text-sm text-[#8B9DB7]">
                    {assessments.length === 0
                      ? isFa
                        ? 'هنوز درخواست ارزیابی ثبت نشده است.'
                        : 'No sustainability assessment requests submitted yet.'
                      : isFa
                        ? 'ارزیابی با این فیلتر یافت نشد.'
                        : 'No assessments match your filter.'}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredAssessments.map((asr) => {
                      const hasReply = Boolean(asr.adminReply?.trim());
                      return (
                        <div
                          key={asr.id}
                          onClick={() => setSelectedSubmission({ kind: 'assessment', record: asr })}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setSelectedSubmission({ kind: 'assessment', record: asr });
                            }
                          }}
                          className="glass-card glass-card-hover rounded-2xl p-5 space-y-3 cursor-pointer transition-all hover:border-[#28CF77]/55"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="space-y-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-base font-semibold text-[#F5F8FC]">
                                  {asr.fullName} — {asr.city}
                                </span>
                                {asr.internalStatus === 'new' && (
                                  <span className="rounded-full bg-[#00A651]/22 border border-[#28CF77]/45 px-2 py-0.5 text-[10px] font-semibold text-[#28CF77]">
                                    {isFa ? 'جدید' : 'New'}
                                  </span>
                                )}
                                {hasReply && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-[#223A87]/35 border border-[#6F9BFF]/45 px-2 py-0.5 text-[10px] font-medium text-[#93BCFF]">
                                    <CheckCircle2 className="w-3 h-3" />
                                    {isFa ? 'پاسخ ثبت شده' : 'Replied'}
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#8B9DB7]">
                                <span className="ltr-inline">{asr.email}</span>
                                <span className="ltr-inline font-numeric">
                                  · {asr.approximateFloorAreaSqm.toLocaleString()} m²
                                </span>
                                {asr.createdAtIso && (
                                  <span className="inline-flex items-center gap-1 font-numeric">
                                    <Calendar className="w-3 h-3" />
                                    {formatShortDate(asr.createdAtIso, locale)}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div
                              className="flex flex-wrap items-center gap-2 shrink-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <select
                                aria-label={
                                  isFa ? 'تغییر وضعیت ارزیابی پایداری' : 'Update assessment status'
                                }
                                value={asr.internalStatus}
                                onChange={async (e) => {
                                  const next = e.target.value as AssessmentRecord['internalStatus'];
                                  try {
                                    await updateAssessmentStatus(asr.id, next);
                                    setAssessments((prev) =>
                                      prev.map((item) =>
                                        item.id === asr.id ? { ...item, internalStatus: next } : item
                                      )
                                    );
                                    setBanner(
                                      isFa
                                        ? 'وضعیت ارزیابی به‌روزرسانی شد.'
                                        : 'Assessment status updated.',
                                      'success'
                                    );
                                  } catch {
                                    setBanner(
                                      isFa
                                        ? 'خطا در تغییر وضعیت ارزیابی.'
                                        : 'Could not update assessment status.',
                                      'error'
                                    );
                                  }
                                }}
                                className="rounded-xl border border-[#6F9BFF]/25 bg-[#0E1626] px-3 py-2 text-xs text-[#F5F8FC]"
                              >
                                {(
                                  ['new', 'reviewing', 'scheduled', 'completed', 'archived'] as const
                                ).map((status) => (
                                  <option key={status} value={status}>
                                    {isFa
                                      ? ASSESSMENT_STATUS_LABELS[status].fa
                                      : ASSESSMENT_STATUS_LABELS[status].en}
                                  </option>
                                ))}
                              </select>

                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedSubmission({ kind: 'assessment', record: asr })
                                }
                                className="glass-cta-emerald min-h-[36px] inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold"
                              >
                                <MessageSquareReply className="w-3.5 h-3.5" />
                                <span>{isFa ? 'باز کردن و پاسخ' : 'Open & Reply'}</span>
                              </button>
                            </div>
                          </div>

                          <p className="text-xs text-[#28CF77]">
                            {asr.projectType} · {asr.assessmentGoals.join(', ')}
                          </p>
                          {asr.notes && (
                            <p className="text-sm text-[#C6D2E3] leading-relaxed line-clamp-2">
                              {asr.notes}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2b: Registered Users Directory */}
            {tab === 'users' && (
              <AdminUsersManager
                locale={locale}
                users={memberUsers}
                orders={memberOrders}
                tickets={memberTickets}
                onCreateOrderForUser={(uid) => {
                  setPreselectedOrderUserId(uid);
                  setTab('orders');
                }}
              />
            )}

            {/* TAB 2c: Member Support Tickets Queue */}
            {tab === 'tickets' && (
              <AdminTicketsManager
                locale={locale}
                tickets={memberTickets}
                users={memberUsers}
                onTicketsChange={setMemberTickets}
                onBanner={setBanner}
              />
            )}

            {/* TAB 2d: Member Orders & Course Enrollments */}
            {tab === 'orders' && (
              <AdminOrdersManager
                locale={locale}
                orders={memberOrders}
                users={memberUsers}
                courses={catalogCourses}
                preselectedUserId={preselectedOrderUserId}
                onClearPreselectedUser={() => setPreselectedOrderUserId(null)}
                onOrdersChange={setMemberOrders}
                onBanner={setBanner}
              />
            )}

            {/* TAB 2e: Courses CMS */}
            {tab === 'courses' && (
              <CoursesManager
                locale={locale}
                courses={catalogCourses}
                settings={settings}
                onRefresh={handleRefreshAll}
                onBanner={setBanner}
              />
            )}

            {/* TAB 3: Projects CMS */}
            {tab === 'projects' && (
              <ProjectsManager
                locale={locale}
                projects={catalogProjects}
                settings={settings}
                onRefresh={handleRefreshAll}
                onBanner={setBanner}
              />
            )}

            {/* TAB 3b: Modern Materials, Certificates & Catalogs CMS */}
            {tab === 'materials' && (
              <MaterialsManager
                locale={locale}
                materials={catalogMaterials}
                partners={catalogPartners}
                settings={settings}
                onRefresh={handleRefreshAll}
                onBanner={setBanner}
              />
            )}

            {/* TAB 4: Team & Studio Photo CMS */}
            {tab === 'team' && (
              <TeamManager
                locale={locale}
                teamMembers={catalogTeam}
                settings={settings}
                onRefresh={handleRefreshAll}
                onBanner={setBanner}
              />
            )}

            {/* TAB 4b: Partner & Sponsor Logo Ribbon CMS */}
            {tab === 'partners' && (
              <PartnersManager
                locale={locale}
                partners={catalogPartners}
                settings={settings}
                onRefresh={handleRefreshAll}
                onBanner={setBanner}
              />
            )}

            {/* TAB 5: Insights Manager */}
            {tab === 'insights' && (
              <InsightsManager
                locale={locale}
                insights={catalogInsights}
                settings={settings}
                onRefresh={handleRefreshAll}
                onBanner={setBanner}
              />
            )}

            {/* TAB 6: Site Personalization & Password */}
            {tab === 'settings' && (
              <SiteCustomizationManager
                locale={locale}
                settings={settings}
                hasPasswordProvider={hasPasswordProvider}
                newStudioPassword={newStudioPassword}
                confirmStudioPassword={confirmStudioPassword}
                showNewPassword={showNewPassword}
                savingPassword={savingPassword}
                passwordMessage={passwordMessage}
                onChangeNewPassword={setNewStudioPassword}
                onChangeConfirmPassword={setConfirmStudioPassword}
                onToggleShowNewPassword={() => setShowNewPassword((prev) => !prev)}
                onSubmitPassword={handleSaveStudioPassword}
                onRefresh={handleRefreshAll}
                onBanner={setBanner}
              />
            )}
          </div>
        )}
      </div>

      {/* Interactive Detail & Reply Drawer for Requests */}
      <SubmissionDrawer
        locale={locale}
        item={selectedSubmission}
        onClose={() => setSelectedSubmission(null)}
        onSaveResponse={handleSaveSubmissionResponse}
        onDelete={handleDeleteSubmission}
      />
    </div>
  );
}
