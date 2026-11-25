import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { ConfirmationResult, RecaptchaVerifier, User as FirebaseUser } from 'firebase/auth';
import {
  closeMemberTicket,
  confirmMemberPhoneOtp,
  createMemberTicket,
  createPhoneRecaptcha,
  fetchMyAssessments,
  fetchMyInquiries,
  fetchMyOrders,
  fetchMyProfile,
  fetchMyTickets,
  fetchTicketMessages,
  postTicketReply,
  sendMemberPasswordReset,
  sendMemberPhoneOtp,
  signInMemberWithEmail,
  signInMemberWithGoogle,
  signOutMember,
  signUpMemberWithEmail,
  submitMemberOrderPaymentRef,
  syncMemberProfileOnLogin,
  updateMyProfile,
} from '../services/accountStore';
import { auth, isFirestoreOfflineError } from '../services/firebase';
import type {
  AssessmentRecord,
  Course,
  InquiryRecord,
  Locale,
  OrderPaymentStatus,
  PageRoute,
  SupportTicket,
  TicketCategory,
  TicketFormInput,
  TicketMessage,
  TicketPriority,
  TicketStatus,
  UserOrder,
  UserProfile,
  UserProfileFormInput,
} from '../types/content';
import {
  computeProfileCompleteness,
  formatTomanAmount,
  MEMBER_ASSESSMENT_STATUS_LABELS,
  MEMBER_INQUIRY_STATUS_LABELS,
  ORDER_STATUS_LABELS,
  ORDER_TYPE_LABELS,
  PROFESSION_OPTIONS,
  resolveOrderLifetimeAccessUrl,
  TICKET_CATEGORY_LABELS,
  TICKET_PRIORITY_LABELS,
  TICKET_STATUS_LABELS,
  validatePaymentRefInput,
  validateTicketForm,
  validateTicketReply,
  validateUserProfileForm,
} from '../utils/accountLogic';
import { hasErrors, type FieldErrors } from '../utils/validation';
import { PreloaderAuthGateway } from '../components/PreloaderAuthGateway';
import {
  AlertCircle,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  ExternalLink,
  FlaskConical,
  Inbox,
  Loader2,
  LogOut,
  Mail,
  MapPin,
  MessageSquareReply,
  Phone,
  Plus,
  RefreshCw,
  Save,
  Search,
  Send,
  ShieldCheck,
  ShoppingBag,
  Sliders,
  Ticket,
  User,
} from '../components/icons/IsbIcons';

const STUDIO_ADMIN_EMAIL = 'isbgroup58@gmail.com';

type PortalTab = 'profile' | 'orders' | 'requests' | 'tickets';

function formatDateTime(iso: string | undefined, locale: Locale): string {
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

function getTicketStatusClass(status: TicketStatus): string {
  switch (status) {
    case 'answered':
      return 'border-[#28CF77]/45 bg-[#00A651]/16 text-[#28CF77]';
    case 'in-progress':
      return 'border-[#6F9BFF]/45 bg-[#223A87]/32 text-[#93BCFF]';
    case 'closed':
      return 'border-white/15 bg-white/5 text-[#8B9DB7]';
    default:
      return 'border-amber-400/40 bg-amber-500/14 text-amber-200';
  }
}

function getOrderStatusClass(status: OrderPaymentStatus): string {
  switch (status) {
    case 'paid':
      return 'border-[#28CF77]/45 bg-[#00A651]/16 text-[#28CF77]';
    case 'pending':
      return 'border-amber-400/40 bg-amber-500/14 text-amber-200';
    case 'refunded':
      return 'border-[#6F9BFF]/40 bg-[#223A87]/28 text-[#93BCFF]';
    default:
      return 'border-rose-400/35 bg-rose-500/12 text-rose-200';
  }
}

interface AccountPortalPageProps {
  locale: Locale;
  authUser: FirebaseUser | null;
  authReady: boolean;
  courses?: Course[];
  onNavigate: (route: PageRoute) => void;
}

export function AccountPortalPage({
  locale,
  authUser,
  authReady,
  courses = [],
  onNavigate,
}: AccountPortalPageProps) {
  const isFa = locale === 'fa';

  const [tab, setTab] = useState<PortalTab>(() => {
    try {
      const requested = window.sessionStorage.getItem('isb_account_initial_tab');
      if (requested === 'orders' || requested === 'requests' || requested === 'tickets') {
        window.sessionStorage.removeItem('isb_account_initial_tab');
        return requested;
      }
    } catch {
      // Ignore storage access restrictions
    }
    return 'profile';
  });
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [inquiries, setInquiries] = useState<InquiryRecord[]>([]);
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loadingPortal, setLoadingPortal] = useState(false);

  const [banner, setBanner] = useState<{ tone: 'success' | 'error' | 'info'; text: string } | null>(
    null
  );

  // Profile form state
  const [profileForm, setProfileForm] = useState<UserProfileFormInput>({
    fullName: '',
    email: '',
    phone: '',
    nationalId: '',
    city: '',
    organization: '',
    profession: '',
    billingAddress: '',
  });
  const [profileErrors, setProfileErrors] = useState<FieldErrors<UserProfileFormInput>>({});
  const [savingProfile, setSavingProfile] = useState(false);

  // Orders filter & inline payment reference submission state
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | OrderPaymentStatus>('all');
  const [editingRefOrderId, setEditingRefOrderId] = useState<string | null>(null);
  const [paymentRefDraft, setPaymentRefDraft] = useState('');
  const [savingPaymentRef, setSavingPaymentRef] = useState(false);

  // Tickets state
  const [ticketStatusFilter, setTicketStatusFilter] = useState<'all' | TicketStatus>('all');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [ticketMessages, setTicketMessages] = useState<TicketMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [composingNewTicket, setComposingNewTicket] = useState(false);

  const [newTicketForm, setNewTicketForm] = useState<TicketFormInput>({
    subject: '',
    category: 'courses',
    priority: 'normal',
    orderNumber: '',
    message: '',
  });
  const [newTicketErrors, setNewTicketErrors] = useState<FieldErrors<TicketFormInput>>({});
  const [submittingTicket, setSubmittingTicket] = useState(false);

  const [replyText, setReplyText] = useState('');
  const [replyError, setReplyError] = useState<string | null>(null);
  const [sendingReply, setSendingReply] = useState(false);

  const syncFormFromProfile = useCallback((p: UserProfile) => {
    setProfileForm({
      fullName: p.fullName ?? '',
      email: p.email ?? '',
      phone: p.phone ?? '',
      nationalId: p.nationalId ?? '',
      city: p.city ?? '',
      organization: p.organization ?? '',
      profession: p.profession ?? '',
      billingAddress: p.billingAddress ?? '',
    });
  }, []);

  const loadMemberData = useCallback(
    async (user: FirebaseUser) => {
      setLoadingPortal(true);
      try {
        let fetchedProfile = await fetchMyProfile(user.uid);
        if (!fetchedProfile) {
          fetchedProfile = await syncMemberProfileOnLogin(user, locale);
        }
        setProfile(fetchedProfile);
        syncFormFromProfile(fetchedProfile);

        const [myOrders, myTickets, myInquiries, myAssessments] = await Promise.all([
          fetchMyOrders(user.uid),
          fetchMyTickets(user.uid),
          fetchMyInquiries(user.uid).catch(() => [] as InquiryRecord[]),
          fetchMyAssessments(user.uid).catch(() => [] as AssessmentRecord[]),
        ]);
        setOrders(myOrders);
        setTickets(myTickets);
        setInquiries(myInquiries);
        setAssessments(myAssessments);
        setSelectedTicketId((prev) => {
          if (prev && myTickets.some((t) => t.id === prev)) return prev;
          return myTickets[0]?.id ?? null;
        });
      } catch (err) {
        const isOffline = isFirestoreOfflineError(err);
        setBanner({
          tone: 'error',
          text: isOffline
            ? isFa
              ? 'اتصال به سرور برقرار نشد (حالت آفلاین). لطفاً اتصال اینترنت یا فیلترشکن خود را بررسی کرده و روی «به‌روزرسانی» بزنید.'
              : 'Unable to reach the server right now (offline). Please check your network connection and click Refresh.'
            : isFa
              ? 'بارگذاری اطلاعات حساب با مشکل مواجه شد. لطفاً صفحه را تازه‌سازی کنید.'
              : 'Could not load your account data. Please refresh and try again.',
        });
      } finally {
        setLoadingPortal(false);
      }
    },
    [locale, isFa, syncFormFromProfile]
  );

  useEffect(() => {
    if (authReady && authUser) {
      void loadMemberData(authUser);
    } else if (authReady && !authUser) {
      setProfile(null);
      setOrders([]);
      setInquiries([]);
      setAssessments([]);
      setTickets([]);
      setSelectedTicketId(null);
      setTicketMessages([]);
    }
  }, [authReady, authUser, loadMemberData]);

  const handleSubmitOrderPaymentRef = async (order: UserOrder) => {
    const err = validatePaymentRefInput(paymentRefDraft, locale);
    if (err) {
      setBanner({ tone: 'error', text: err });
      return;
    }
    setSavingPaymentRef(true);
    try {
      await submitMemberOrderPaymentRef(
        order.id,
        paymentRefDraft,
        order.paymentGateway || 'bank-transfer'
      );
      setOrders((prev) =>
        prev.map((item) =>
          item.id === order.id ? { ...item, paymentRef: paymentRefDraft.trim() } : item
        )
      );
      setEditingRefOrderId(null);
      setPaymentRefDraft('');
      setBanner({
        tone: 'success',
        text: isFa
          ? 'کد پیگیری پرداخت ثبت شد. پس از بررسی مدیریت، دسترسی دوره برای شما فعال می‌شود.'
          : 'Payment reference recorded. Your course access will activate once verified by Studio Admin.',
      });
    } catch {
      setBanner({
        tone: 'error',
        text: isFa
          ? 'ثبت کد پیگیری انجام نشد. لطفاً دوباره تلاش کنید.'
          : 'Could not submit payment reference. Please try again.',
      });
    } finally {
      setSavingPaymentRef(false);
    }
  };

  const selectedTicket = useMemo(
    () => tickets.find((t) => t.id === selectedTicketId) ?? null,
    [tickets, selectedTicketId]
  );

  useEffect(() => {
    if (!selectedTicket || !authUser || !auth.currentUser) {
      setTicketMessages([]);
      return;
    }
    let cancelled = false;
    setLoadingMessages(true);
    fetchTicketMessages(selectedTicket.id, selectedTicket.userId)
      .then((msgs) => {
        if (!cancelled) setTicketMessages(msgs);
      })
      .catch(() => {
        if (!cancelled) setTicketMessages([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingMessages(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedTicket, authUser]);

  const handleGoogleSignIn = async () => {
    const result = await signInMemberWithGoogle(locale);
    setProfile(result.profile);
    syncFormFromProfile(result.profile);
  };

  const handleEmailSignIn = async (email: string, password: string) => {
    const result = await signInMemberWithEmail(email, password, locale);
    setProfile(result.profile);
    syncFormFromProfile(result.profile);
  };

  const handleEmailSignUp = async (params: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
  }) => {
    const result = await signUpMemberWithEmail(params, locale);
    setProfile(result.profile);
    syncFormFromProfile(result.profile);
  };

  const handlePasswordReset = async (email: string) => {
    await sendMemberPasswordReset(email);
  };

  const handleCreateRecaptcha = (container: HTMLElement): RecaptchaVerifier => {
    return createPhoneRecaptcha(container);
  };

  const handlePhoneSendOtp = async (
    phoneE164: string,
    verifier: RecaptchaVerifier
  ): Promise<ConfirmationResult> => {
    return sendMemberPhoneOtp(phoneE164, verifier);
  };

  const handlePhoneVerifyOtp = async (
    confirmationResult: ConfirmationResult,
    code: string,
    fullName?: string
  ) => {
    const result = await confirmMemberPhoneOtp(confirmationResult, code, fullName, locale);
    setProfile(result.profile);
    syncFormFromProfile(result.profile);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser) return;
    setBanner(null);
    const errors = validateUserProfileForm(profileForm, locale);
    setProfileErrors(errors);
    if (hasErrors(errors)) return;

    setSavingProfile(true);
    try {
      const updated = await updateMyProfile(authUser.uid, profileForm, locale);
      setProfile(updated);
      syncFormFromProfile(updated);
      setBanner({
        tone: 'success',
        text: isFa
          ? 'اطلاعات کاربری و فاکتور شما با موفقیت ذخیره شد.'
          : 'Your profile and billing details have been saved.',
      });
    } catch {
      setBanner({
        tone: 'error',
        text: isFa
          ? 'ذخیره اطلاعات انجام نشد. لطفاً دوباره تلاش کنید.'
          : 'Could not save your profile. Please try again.',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setBanner(null);
    const errors = validateTicketForm(newTicketForm, locale);
    setNewTicketErrors(errors);
    if (hasErrors(errors)) return;

    setSubmittingTicket(true);
    try {
      const created = await createMemberTicket(profile, newTicketForm, locale);
      setTickets((prev) => [created, ...prev]);
      setSelectedTicketId(created.id);
      setTicketMessages([]);
      setComposingNewTicket(false);
      setNewTicketForm({
        subject: '',
        category: 'courses',
        priority: 'normal',
        orderNumber: '',
        message: '',
      });
      setBanner({
        tone: 'success',
        text: isFa
          ? `تیکت شما با شماره پیگیری ${created.ticketNumber} ثبت شد.`
          : `Ticket ${created.ticketNumber} created successfully.`,
      });
    } catch {
      setBanner({
        tone: 'error',
        text: isFa
          ? 'ثبت تیکت با خطا مواجه شد. لطفاً دوباره تلاش کنید.'
          : 'Could not create the ticket. Please try again.',
      });
    } finally {
      setSubmittingTicket(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !authUser || !profile) return;
    setReplyError(null);
    const err = validateTicketReply(replyText, locale);
    if (err) {
      setReplyError(err);
      return;
    }

    setSendingReply(true);
    try {
      const createdMsg = await postTicketReply({
        ticket: selectedTicket,
        senderUid: authUser.uid,
        senderName: profile.fullName || profile.displayName || profile.email,
        senderRole: 'user',
        body: replyText,
        nextStatus: 'open',
      });
      setTicketMessages((prev) => [...prev, createdMsg]);
      setTickets((prev) =>
        prev.map((t) =>
          t.id === selectedTicket.id
            ? {
                ...t,
                status: 'open',
                lastReplyBy: 'user',
                replyCount: t.replyCount + 1,
                updatedAtIso: createdMsg.createdAtIso,
                lastReplyAtIso: createdMsg.createdAtIso,
              }
            : t
        )
      );
      setReplyText('');
    } catch {
      setReplyError(
        isFa
          ? 'ارسال پیام انجام نشد. لطفاً دوباره تلاش کنید.'
          : 'Could not send your reply. Please try again.'
      );
    } finally {
      setSendingReply(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!selectedTicket || selectedTicket.status === 'closed') return;
    try {
      await closeMemberTicket(selectedTicket);
      setTickets((prev) =>
        prev.map((t) => (t.id === selectedTicket.id ? { ...t, status: 'closed' } : t))
      );
      setBanner({
        tone: 'info',
        text: isFa ? 'تیکت با موفقیت بسته شد.' : 'Ticket marked as closed.',
      });
    } catch {
      setBanner({
        tone: 'error',
        text: isFa ? 'تغییر وضعیت تیکت انجام نشد.' : 'Could not close ticket.',
      });
    }
  };

  const completeness = useMemo(() => computeProfileCompleteness(profile), [profile]);

  const filteredOrders = useMemo(() => {
    const q = orderSearch.trim().toLowerCase();
    return orders.filter((ord) => {
      if (orderStatusFilter !== 'all' && ord.paymentStatus !== orderStatusFilter) return false;
      if (!q) return true;
      return (
        ord.orderNumber.toLowerCase().includes(q) ||
        ord.titleFa.toLowerCase().includes(q) ||
        ord.titleEn.toLowerCase().includes(q) ||
        (ord.paymentRef ?? '').toLowerCase().includes(q)
      );
    });
  }, [orders, orderSearch, orderStatusFilter]);

  const filteredTickets = useMemo(
    () =>
      tickets.filter((t) => (ticketStatusFilter === 'all' ? true : t.status === ticketStatusFilter)),
    [tickets, ticketStatusFilter]
  );

  // Loading auth state cleanly
  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#070B14] flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-[#A4C3FF]">
          <Loader2 className="w-5 h-5 animate-spin text-[#6F9BFF]" />
          <span>{isFa ? 'در حال بررسی وضعیت حساب...' : 'Checking account session...'}</span>
        </div>
      </div>
    );
  }

  // Signed-out users see the bespoke Preloader-style Architectural Auth Gateway
  if (!authUser) {
    return (
      <PreloaderAuthGateway
        locale={locale}
        onGoogleSignIn={handleGoogleSignIn}
        onEmailSignIn={handleEmailSignIn}
        onEmailSignUp={handleEmailSignUp}
        onPasswordReset={handlePasswordReset}
        onCreateRecaptcha={handleCreateRecaptcha}
        onPhoneSendOtp={handlePhoneSendOtp}
        onPhoneVerifyOtp={handlePhoneVerifyOtp}
        onNavigate={onNavigate}
      />
    );
  }

  const isStudioAdmin = authUser.email?.toLowerCase() === STUDIO_ADMIN_EMAIL;
  const openTicketsCount = tickets.filter((t) => t.status !== 'closed').length;
  const paidOrdersCount = orders.filter((o) => o.paymentStatus === 'paid').length;
  const pendingOrdersCount = orders.filter((o) => o.paymentStatus === 'pending').length;

  const missingFieldLabels: Record<string, string> = {
    fullName: isFa ? 'نام و نام خانوادگی' : 'Full Name',
    phone: isFa ? 'شماره موبایل' : 'Phone Number',
    city: isFa ? 'شهر' : 'City',
    profession: isFa ? 'تخصص / رشته' : 'Profession',
    nationalId: isFa ? 'کد ملی (۱۰ رقم)' : 'National ID',
    billingAddress: isFa ? 'نشانی فاکتور' : 'Billing Address',
  };

  const totalRequestsCount = inquiries.length + assessments.length;

  const navItems: {
    key: PortalTab;
    label: string;
    icon: React.ReactNode;
    count?: number;
  }[] = [
    {
      key: 'profile',
      label: isFa ? 'پروفایل و اطلاعات تکمیلی' : 'Profile & Billing Info',
      icon: <User className="w-4 h-4" />,
    },
    {
      key: 'orders',
      label: isFa ? 'سفارش‌ها و دوره‌های من' : 'My Orders & Courses',
      icon: <ShoppingBag className="w-4 h-4" />,
      count: orders.length,
    },
    {
      key: 'requests',
      label: isFa ? 'درخواست‌ها و ارزیابی‌ها' : 'Requests & Assessments',
      icon: <Inbox className="w-4 h-4" />,
      count: totalRequestsCount,
    },
    {
      key: 'tickets',
      label: isFa ? 'تیکت‌ها و پیگیری' : 'Support Tickets',
      icon: <Ticket className="w-4 h-4" />,
      count: openTicketsCount,
    },
  ];

  return (
    <div data-testid="member-account-portal" className="pt-28 pb-20 min-h-screen">
      <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-10 space-y-6">
        {/* Top Member Workspace Header (Single-Elevation SaaS Bar) */}
        <div className="rounded-2xl border border-[#6F9BFF]/20 bg-[#0C1424]/88 p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-center gap-4 min-w-0">
            {authUser.photoURL ? (
              <img
                src={authUser.photoURL}
                alt={profile?.fullName || authUser.displayName || 'User'}
                referrerPolicy="no-referrer"
                className="w-14 h-14 rounded-2xl object-cover border border-[#6F9BFF]/35 shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-[#223A87]/40 border border-[#6F9BFF]/40 flex items-center justify-center text-lg font-bold text-[#DCE8FF] shrink-0">
                {(profile?.fullName || authUser.displayName || 'U').slice(0, 1)}
              </div>
            )}

            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-semibold rtl:font-bold text-[#F5F8FC] truncate">
                  {profile?.fullName ||
                    authUser.displayName ||
                    authUser.phoneNumber ||
                    (isFa ? 'کاربر گروه ISB' : 'ISB Member')}
                </h1>
                <span className="inline-flex items-center gap-1 rounded-md border border-[#28CF77]/35 bg-[#00A651]/14 px-2 py-0.5 text-[11px] font-medium text-[#28CF77]">
                  <ShieldCheck className="w-3 h-3" />
                  <span>
                    {authUser.providerData.some((p) => p.providerId === 'google.com')
                      ? isFa
                        ? 'تأییدشده با گوگل'
                        : 'Google Verified'
                      : authUser.providerData.some((p) => p.providerId === 'phone') ||
                          Boolean(authUser.phoneNumber)
                        ? isFa
                          ? 'تأییدشده با پیامک موبایل'
                          : 'SMS Verified'
                        : isFa
                          ? 'حساب ایمیل و رمز عبور'
                          : 'Email Account'}
                  </span>
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#9FB0C9]">
                {(authUser.email || profile?.email) && (
                  <span className="ltr-inline inline-flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#6F9BFF]" />
                    {authUser.email || profile?.email}
                  </span>
                )}
                {(profile?.phone || authUser.phoneNumber) && (
                  <span className="ltr-inline inline-flex items-center gap-1.5 font-numeric">
                    <Phone className="w-3.5 h-3.5 text-[#28CF77]" />
                    {profile?.phone || authUser.phoneNumber}
                  </span>
                )}
                {profile?.city && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#68C4F8]" />
                    {profile.city}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {isStudioAdmin && (
              <button
                type="button"
                onClick={() => onNavigate({ page: 'studio' })}
                className="min-h-[40px] inline-flex items-center gap-2 rounded-xl border border-[#28CF77]/40 bg-[#00A651]/16 px-4 py-2 text-xs font-semibold text-[#D6FFE9] hover:bg-[#00A651]/28 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>{isFa ? 'ورود به پنل مدیریت سایت' : 'Open Studio Admin'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => authUser && void loadMemberData(authUser)}
              disabled={loadingPortal}
              className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl border border-[#6F9BFF]/25 bg-white/[0.03] px-3.5 py-2 text-xs text-[#C6D2E3] hover:border-[#6F9BFF]/60 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingPortal ? 'animate-spin' : ''}`} />
              <span>{isFa ? 'به‌روزرسانی' : 'Refresh'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedTicketId(null);
                setTickets([]);
                setTicketMessages([]);
                setOrders([]);
                setInquiries([]);
                setAssessments([]);
                setProfile(null);
                void signOutMember();
              }}
              className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.03] px-3.5 py-2 text-xs text-[#C6D2E3] hover:border-rose-400/50 hover:text-rose-200 transition-colors cursor-pointer whitespace-nowrap"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{isFa ? 'خروج از حساب' : 'Sign Out'}</span>
            </button>
          </div>
        </div>

        {banner && (
          <div
            role="alert"
            className={`rounded-xl border px-4 py-3 text-xs sm:text-sm flex items-center justify-between gap-3 ${
              banner.tone === 'error'
                ? 'border-amber-400/40 bg-amber-500/12 text-amber-200'
                : banner.tone === 'success'
                  ? 'border-[#28CF77]/40 bg-[#00A651]/15 text-[#D8FDE9]'
                  : 'border-[#6F9BFF]/35 bg-[#223A87]/25 text-[#DCE8FF]'
            }`}
          >
            <span>{banner.text}</span>
            <button
              type="button"
              onClick={() => setBanner(null)}
              className="text-xs opacity-75 hover:opacity-100 cursor-pointer"
            >
              {isFa ? 'بستن' : 'Dismiss'}
            </button>
          </div>
        )}

        {/* Workspace Canvas: Sidebar Rail (260px) + Main Content Viewport */}
        <div className="grid grid-cols-1 lg:grid-cols-[264px_minmax(0,1fr)] gap-6 items-start">
          {/* Sidebar Navigation & Checkout Readiness Rail */}
          <aside className="space-y-4">
            <nav
              aria-label={isFa ? 'بخش‌های پنل کاربری' : 'Account portal sections'}
              className="rounded-2xl border border-[#6F9BFF]/18 bg-[#0C1424]/88 p-2 space-y-1"
            >
              {navItems.map((item) => {
                const active = tab === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      setTab(item.key);
                      setBanner(null);
                    }}
                    className={`w-full min-h-[46px] rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs sm:text-[13px] font-medium transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#223A87]/48 text-[#FFFFFF] border border-[#6F9BFF]/50 font-semibold'
                        : 'text-[#C6D2E3] hover:bg-white/[0.04] border border-transparent'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <span className={active ? 'text-[#28CF77]' : 'text-[#8AB0FF]'}>
                        {item.icon}
                      </span>
                      <span className="truncate">{item.label}</span>
                    </span>
                    {typeof item.count === 'number' && item.count > 0 && (
                      <span className="font-mono font-numeric text-[11px] rounded-md px-1.5 py-0.5 bg-white/10 text-[#E4EEFF]">
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Billing & Future Course Readiness Indicator */}
            <div className="rounded-2xl border border-[#6F9BFF]/18 bg-[#0C1424]/88 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#F5F8FC]">
                  {isFa ? 'آمادگی ثبت‌نام دوره‌ها' : 'Course Checkout Readiness'}
                </span>
                <span
                  className={`font-mono font-numeric text-xs font-semibold ${
                    completeness.percent >= 80 ? 'text-[#28CF77]' : 'text-[#6F9BFF]'
                  }`}
                >
                  {completeness.percent}%
                </span>
              </div>

              <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#3B68D6] to-[#28CF77] transition-all duration-300"
                  style={{ width: `${completeness.percent}%` }}
                />
              </div>

              <p className="text-[11.5px] text-[#9FB0C9] leading-relaxed">
                {completeness.isCheckoutReady
                  ? isFa
                    ? 'اطلاعات پایه شما برای خرید دوره‌های آتی و صدور فاکتور آماده است.'
                    : 'Your core identity and contact fields are ready for upcoming course checkout.'
                  : isFa
                    ? 'برای فعال‌سازی سریع ثبت‌نام دوره‌ها و پرداخت آنلاین، شماره موبایل و شهر را تکمیل کنید.'
                    : 'Add your phone number and city to prepare your account for future course checkout.'}
              </p>

              {completeness.missingFields.length > 0 && (
                <div className="pt-1 border-t border-white/10 space-y-1">
                  <span className="text-[10.5px] text-[#8B9DB7]">
                    {isFa ? 'فیلدهای باقی‌مانده:' : 'Remaining fields:'}
                  </span>
                  <div className="text-[11px] text-[#C6D2E3] leading-relaxed">
                    {completeness.missingFields
                      .map((f) => missingFieldLabels[f] ?? f)
                      .join(isFa ? ' · ' : ' · ')}
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* Main Content Viewport */}
          <div className="min-w-0">
            {/* TAB 1: PROFILE & BILLING INFO */}
            {tab === 'profile' && (
              <div className="rounded-2xl border border-[#6F9BFF]/18 bg-[#0C1424]/88 p-5 sm:p-7 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
                  <div>
                    <h2 className="text-base sm:text-lg font-semibold text-[#F5F8FC]">
                      {isFa
                        ? 'اطلاعات هویتی، تماس و صدور فاکتور'
                        : 'Personal Identity, Contact & Billing Details'}
                    </h2>
                    <p className="text-xs text-[#9FB0C9] mt-1">
                      {isFa
                        ? 'این اطلاعات به‌صورت محرمانه در حساب شما ذخیره می‌شود و در زمان ثبت‌نام دوره‌ها و پرداخت به کارشناسان ISB نمایش داده خواهد شد.'
                        : 'Stored privately in your account for smooth enrollment, invoicing, and certificates when courses launch.'}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-5" noValidate>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="acc-fullname" className="block text-xs font-medium text-[#DCE6F5]">
                        {isFa ? 'نام و نام خانوادگی کامل *' : 'Full Name *'}
                      </label>
                      <input
                        id="acc-fullname"
                        type="text"
                        value={profileForm.fullName}
                        onChange={(e) =>
                          setProfileForm((prev) => ({ ...prev, fullName: e.target.value }))
                        }
                        placeholder={isFa ? 'مثال: سارا محمدی' : 'e.g. Sara Mohammadi'}
                        className="w-full rounded-xl border border-[#6F9BFF]/25 bg-[#070B14]/80 px-3.5 py-2.5 text-sm text-[#F5F8FC] focus:outline-none focus:border-[#6F9BFF]"
                      />
                      {profileErrors.fullName && (
                        <p className="text-[11px] text-amber-300">{profileErrors.fullName}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="acc-email" className="block text-xs font-medium text-[#DCE6F5]">
                        {authUser.email
                          ? isFa
                            ? 'ایمیل ثبت‌شده حساب (غیرقابل تغییر)'
                            : 'Registered Account Email'
                          : isFa
                            ? 'نشانی ایمیل (اختیاری — جهت فاکتور و اطلاع‌رسانی)'
                            : 'Contact Email (Optional — Invoices)'}
                      </label>
                      {authUser.email ? (
                        <input
                          id="acc-email"
                          type="email"
                          dir="ltr"
                          readOnly
                          value={authUser.email}
                          className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm text-[#9FB0C9] cursor-not-allowed"
                        />
                      ) : (
                        <>
                          <input
                            id="acc-email"
                            type="email"
                            dir="ltr"
                            value={profileForm.email ?? ''}
                            onChange={(e) =>
                              setProfileForm((prev) => ({ ...prev, email: e.target.value }))
                            }
                            placeholder="name@example.com"
                            className="w-full rounded-xl border border-[#6F9BFF]/25 bg-[#070B14]/80 px-3.5 py-2.5 text-sm text-[#F5F8FC] focus:outline-none focus:border-[#6F9BFF]"
                          />
                          {profileErrors.email && (
                            <p className="text-[11px] text-amber-300">{profileErrors.email}</p>
                          )}
                        </>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="acc-phone" className="block text-xs font-medium text-[#DCE6F5]">
                        {isFa ? 'شماره موبایل (برای هماهنگی دوره‌ها و فاکتور)' : 'Mobile Phone'}
                      </label>
                      <input
                        id="acc-phone"
                        type="tel"
                        dir="ltr"
                        value={profileForm.phone}
                        onChange={(e) =>
                          setProfileForm((prev) => ({ ...prev, phone: e.target.value }))
                        }
                        placeholder="09151234567"
                        className="w-full rounded-xl border border-[#6F9BFF]/25 bg-[#070B14]/80 px-3.5 py-2.5 text-sm font-numeric text-[#F5F8FC] focus:outline-none focus:border-[#6F9BFF]"
                      />
                      {profileErrors.phone && (
                        <p className="text-[11px] text-amber-300">{profileErrors.phone}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="acc-nationalid" className="block text-xs font-medium text-[#DCE6F5]">
                        {isFa ? 'کد ملی (اختیاری — برای صدور گواهینامه و فاکتور)' : 'National ID (Optional — Certificates)'}
                      </label>
                      <input
                        id="acc-nationalid"
                        type="text"
                        dir="ltr"
                        inputMode="numeric"
                        maxLength={10}
                        value={profileForm.nationalId}
                        onChange={(e) =>
                          setProfileForm((prev) => ({ ...prev, nationalId: e.target.value }))
                        }
                        placeholder="0921234567"
                        className="w-full rounded-xl border border-[#6F9BFF]/25 bg-[#070B14]/80 px-3.5 py-2.5 text-sm font-mono font-numeric text-[#F5F8FC] focus:outline-none focus:border-[#6F9BFF]"
                      />
                      {profileErrors.nationalId && (
                        <p className="text-[11px] text-amber-300">{profileErrors.nationalId}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="acc-city" className="block text-xs font-medium text-[#DCE6F5]">
                        {isFa ? 'شهر محل سکونت / فعالیت' : 'City'}
                      </label>
                      <input
                        id="acc-city"
                        type="text"
                        value={profileForm.city}
                        onChange={(e) =>
                          setProfileForm((prev) => ({ ...prev, city: e.target.value }))
                        }
                        placeholder={isFa ? 'مثال: مشهد / تهران' : 'e.g. Mashhad / Tehran'}
                        className="w-full rounded-xl border border-[#6F9BFF]/25 bg-[#070B14]/80 px-3.5 py-2.5 text-sm text-[#F5F8FC] focus:outline-none focus:border-[#6F9BFF]"
                      />
                      {profileErrors.city && (
                        <p className="text-[11px] text-amber-300">{profileErrors.city}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="acc-profession" className="block text-xs font-medium text-[#DCE6F5]">
                        {isFa ? 'تخصص / جایگاه حرفه‌ای' : 'Profession / Discipline'}
                      </label>
                      <select
                        id="acc-profession"
                        value={profileForm.profession}
                        onChange={(e) =>
                          setProfileForm((prev) => ({ ...prev, profession: e.target.value }))
                        }
                        className="w-full rounded-xl border border-[#6F9BFF]/25 bg-[#070B14]/80 px-3.5 py-2.5 text-sm text-[#F5F8FC] focus:outline-none focus:border-[#6F9BFF]"
                      >
                        <option value="">{isFa ? 'انتخاب کنید...' : 'Select profession...'}</option>
                        {PROFESSION_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {isFa ? opt.fa : opt.en}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <label htmlFor="acc-org" className="block text-xs font-medium text-[#DCE6F5]">
                        {isFa ? 'شرکت، دفتر معماری یا دانشگاه (اختیاری)' : 'Company, Studio, or University (Optional)'}
                      </label>
                      <input
                        id="acc-org"
                        type="text"
                        value={profileForm.organization}
                        onChange={(e) =>
                          setProfileForm((prev) => ({ ...prev, organization: e.target.value }))
                        }
                        placeholder={isFa ? 'نام سازمان یا دانشگاه' : 'Organization or university name'}
                        className="w-full rounded-xl border border-[#6F9BFF]/25 bg-[#070B14]/80 px-3.5 py-2.5 text-sm text-[#F5F8FC] focus:outline-none focus:border-[#6F9BFF]"
                      />
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <label htmlFor="acc-address" className="block text-xs font-medium text-[#DCE6F5]">
                        {isFa ? 'نشانی پستی / اطلاعات صدور فاکتور (اختیاری)' : 'Billing / Mailing Address (Optional)'}
                      </label>
                      <textarea
                        id="acc-address"
                        rows={3}
                        value={profileForm.billingAddress}
                        onChange={(e) =>
                          setProfileForm((prev) => ({ ...prev, billingAddress: e.target.value }))
                        }
                        placeholder={
                          isFa
                            ? 'نشانی دقیق جهت ارسال پکیج‌های آموزشی یا صدور فاکتور رسمی'
                            : 'Address for official invoices or physical course materials'
                        }
                        className="w-full rounded-xl border border-[#6F9BFF]/25 bg-[#070B14]/80 px-3.5 py-2.5 text-sm text-[#F5F8FC] focus:outline-none focus:border-[#6F9BFF] resize-y"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10">
                    <span className="text-xs text-[#8B9DB7] font-numeric">
                      {profile?.createdAtIso
                        ? isFa
                          ? `عضویت از: ${formatDateTime(profile.createdAtIso, locale)}`
                          : `Member since: ${formatDateTime(profile.createdAtIso, locale)}`
                        : ''}
                    </span>

                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="glass-cta min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-xs sm:text-sm font-semibold cursor-pointer disabled:opacity-60"
                    >
                      {savingProfile ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      <span>
                        {savingProfile
                          ? isFa
                            ? 'در حال ذخیره...'
                            : 'Saving...'
                          : isFa
                            ? 'ذخیره اطلاعات پروفایل'
                            : 'Save Profile Details'}
                      </span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 2: ORDERS & COURSES */}
            {tab === 'orders' && (
              <div className="space-y-4">
                {/* Summary KPI Strip (Tabular Numerals) */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-[#6F9BFF]/18 bg-[#0C1424]/88 p-4">
                    <span className="block text-[11px] text-[#9FB0C9]">
                      {isFa ? 'کل سفارش‌ها' : 'Total Orders'}
                    </span>
                    <span className="block mt-1 text-2xl font-mono font-numeric font-semibold text-[#F5F8FC]">
                      {orders.length}
                    </span>
                  </div>
                  <div className="rounded-2xl border border-[#28CF77]/22 bg-[#0C1424]/88 p-4">
                    <span className="block text-[11px] text-[#9FB0C9]">
                      {isFa ? 'پرداخت‌شده / فعال' : 'Paid / Active'}
                    </span>
                    <span className="block mt-1 text-2xl font-mono font-numeric font-semibold text-[#28CF77]">
                      {paidOrdersCount}
                    </span>
                  </div>
                  <div className="rounded-2xl border border-amber-400/20 bg-[#0C1424]/88 p-4">
                    <span className="block text-[11px] text-[#9FB0C9]">
                      {isFa ? 'در انتظار پرداخت' : 'Pending Payment'}
                    </span>
                    <span className="block mt-1 text-2xl font-mono font-numeric font-semibold text-amber-200">
                      {pendingOrdersCount}
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#6F9BFF]/18 bg-[#0C1424]/88 p-5 sm:p-6 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-sm">
                      <Search
                        className={`w-4 h-4 text-[#8B9DB7] absolute top-1/2 -translate-y-1/2 ${
                          isFa ? 'right-3' : 'left-3'
                        }`}
                      />
                      <input
                        type="text"
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                        placeholder={
                          isFa ? 'جستجو بر اساس کد سفارش یا نام دوره...' : 'Search by order code or title...'
                        }
                        className={`w-full rounded-xl border border-[#6F9BFF]/22 bg-[#070B14]/80 py-2 text-xs text-[#F5F8FC] focus:outline-none focus:border-[#6F9BFF] ${
                          isFa ? 'pr-9 pl-3' : 'pl-9 pr-3'
                        }`}
                      />
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {(['all', 'paid', 'pending', 'cancelled', 'refunded'] as const).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setOrderStatusFilter(st)}
                          className={`rounded-lg px-3 py-1.5 text-[11px] font-medium transition-colors cursor-pointer ${
                            orderStatusFilter === st
                              ? 'bg-[#223A87] text-white border border-[#6F9BFF]/60'
                              : 'bg-white/[0.04] text-[#C6D2E3] hover:bg-white/[0.08]'
                          }`}
                        >
                          {st === 'all'
                            ? isFa
                              ? 'همه'
                              : 'All'
                            : isFa
                              ? ORDER_STATUS_LABELS[st].fa
                              : ORDER_STATUS_LABELS[st].en}
                        </button>
                      ))}
                    </div>
                  </div>

                  {filteredOrders.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[#6F9BFF]/25 bg-[#070B14]/55 p-8 sm:p-10 text-center space-y-4">
                      <div className="w-12 h-12 mx-auto rounded-2xl bg-[#223A87]/30 border border-[#6F9BFF]/35 flex items-center justify-center">
                        <ShoppingBag className="w-5 h-5 text-[#6F9BFF]" />
                      </div>
                      <div className="space-y-1.5 max-w-md mx-auto">
                        <h3 className="text-sm sm:text-base font-semibold text-[#F5F8FC]">
                          {orders.length === 0
                            ? isFa
                              ? 'هنوز سفارشی در حساب شما ثبت نشده است'
                              : 'No orders or course enrollments yet'
                            : isFa
                              ? 'سفارشی با این فیلتر یافت نشد'
                              : 'No orders match your filter'}
                        </h3>
                        <p className="text-xs text-[#9FB0C9] leading-relaxed">
                          {isFa
                            ? 'دوره‌های تخصصی آکادمی ISB اکنون آماده ثبت‌نام مستقیم هستند. پس از ثبت‌نام، فاکتور، کد رهگیری و لینک ورود به دوره در همین بخش نمایش داده می‌شود.'
                            : 'ISB Academy courses are open for direct enrollment. Once registered, your invoices, tracking references, and course access links appear here.'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onNavigate({ page: 'courses' })}
                        className="glass-cta min-h-[40px] inline-flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-semibold cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>
                          {isFa ? 'مشاهده و ثبت‌نام دوره‌های آکادمی' : 'Browse & Enroll in Courses'}
                        </span>
                      </button>
                    </div>
                  ) : (
                    <div className="divide-y divide-white/10 border border-white/10 rounded-xl overflow-hidden">
                      {filteredOrders.map((ord) => {
                        const lifetimeAccessUrl = resolveOrderLifetimeAccessUrl(ord, courses);

                        return (
                          <div
                            key={ord.id}
                            className="p-4 sm:p-5 bg-[#070B14]/45 hover:bg-white/[0.025] transition-colors space-y-3"
                          >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="space-y-1.5 min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="ltr-inline font-mono font-numeric text-xs text-[#6F9BFF]">
                                    {ord.orderNumber}
                                  </span>
                                  <span className="text-[11px] text-[#9FB0C9]">
                                    · {isFa ? ORDER_TYPE_LABELS[ord.itemType].fa : ORDER_TYPE_LABELS[ord.itemType].en}
                                  </span>
                                  <span
                                    className={`rounded-md border px-2 py-0.5 text-[10.5px] font-medium ${getOrderStatusClass(
                                      ord.paymentStatus
                                    )}`}
                                  >
                                    {isFa
                                      ? ORDER_STATUS_LABELS[ord.paymentStatus].fa
                                      : ORDER_STATUS_LABELS[ord.paymentStatus].en}
                                  </span>
                                </div>

                                <h3 className="text-sm sm:text-[15px] font-semibold text-[#F5F8FC]">
                                  {isFa ? ord.titleFa : ord.titleEn}
                                </h3>

                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-[#8B9DB7]">
                                  <span className="inline-flex items-center gap-1 font-numeric">
                                    <Calendar className="w-3 h-3" />
                                    {formatDateTime(ord.createdAtIso, locale)}
                                  </span>
                                  {ord.paymentRef && (
                                    <span className="ltr-inline font-mono font-numeric text-[#28CF77]">
                                      Ref: {ord.paymentRef}
                                    </span>
                                  )}
                                </div>

                                {ord.notes && (
                                  <p className="text-xs text-[#C6D2E3] leading-relaxed">{ord.notes}</p>
                                )}
                              </div>

                              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                                <div className="text-end">
                                  <span className="block text-sm font-mono font-numeric font-semibold text-[#F5F8FC]">
                                    {formatTomanAmount(ord.amountToman, locale)}
                                  </span>
                                </div>

                                {ord.paymentStatus === 'pending' && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (editingRefOrderId === ord.id) {
                                        setEditingRefOrderId(null);
                                      } else {
                                        setEditingRefOrderId(ord.id);
                                        setPaymentRefDraft(ord.paymentRef ?? '');
                                      }
                                    }}
                                    className="min-h-[38px] inline-flex items-center gap-1.5 rounded-xl border border-[#28CF77]/40 bg-[#00A651]/14 px-3.5 py-1.5 text-xs font-medium text-[#D6FFE9] hover:bg-[#00A651]/25 transition-colors cursor-pointer"
                                  >
                                    <CreditCard className="w-3.5 h-3.5" />
                                    <span>
                                      {ord.paymentRef
                                        ? isFa
                                          ? 'ویرایش کد پیگیری'
                                          : 'Update Receipt'
                                        : isFa
                                          ? 'ثبت کد پیگیری پرداخت'
                                          : 'Submit Payment Ref'}
                                    </span>
                                  </button>
                                )}

                                {ord.paymentStatus === 'paid' && lifetimeAccessUrl && (
                                  <a
                                    data-testid="order-lifetime-access"
                                    href={lifetimeAccessUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="glass-cta-emerald min-h-[38px] inline-flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-xs font-semibold"
                                  >
                                    <span>
                                      {isFa ? 'ورود به کلاس / فایل‌های دوره' : 'Enter Classroom / Files'}
                                    </span>
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                )}

                                <button
                                  type="button"
                                  onClick={() => {
                                    setTab('tickets');
                                    setComposingNewTicket(true);
                                    setNewTicketForm({
                                      subject: isFa
                                        ? `پیگیری سفارش ${ord.orderNumber}`
                                        : `Order Follow-up ${ord.orderNumber}`,
                                      category: 'orders-billing',
                                      priority: 'normal',
                                      orderNumber: ord.orderNumber,
                                      message: '',
                                    });
                                  }}
                                  className="min-h-[38px] inline-flex items-center gap-1.5 rounded-xl border border-[#6F9BFF]/28 bg-white/[0.03] px-3 py-1.5 text-xs text-[#C6D2E3] hover:border-[#6F9BFF] hover:text-white transition-colors cursor-pointer"
                                >
                                  <Ticket className="w-3.5 h-3.5" />
                                  <span>{isFa ? 'پیگیری' : 'Support'}</span>
                                </button>
                              </div>
                            </div>

                            {ord.paymentStatus === 'pending' && editingRefOrderId === ord.id && (
                              <div className="rounded-xl border border-[#28CF77]/30 bg-[#0A1520] p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                                <input
                                  type="text"
                                  dir="ltr"
                                  value={paymentRefDraft}
                                  onChange={(e) => setPaymentRefDraft(e.target.value)}
                                  placeholder={
                                    isFa
                                      ? 'شماره پیگیری پرداخت / ۴ رقم آخر کارت و کد مرجع'
                                      : 'Enter bank / gateway transaction reference'
                                  }
                                  className="flex-1 rounded-lg border border-[#6F9BFF]/25 bg-[#070B14] px-3 py-2 text-xs font-mono text-[#F5F8FC] focus:outline-none focus:border-[#28CF77]"
                                />
                                <button
                                  type="button"
                                  disabled={savingPaymentRef}
                                  onClick={() => void handleSubmitOrderPaymentRef(ord)}
                                  className="glass-cta-emerald min-h-[38px] inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold cursor-pointer disabled:opacity-60"
                                >
                                  {savingPaymentRef ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  )}
                                  <span>{isFa ? 'ثبت برای تأیید' : 'Submit for Verification'}</span>
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2b: MY PROJECT INQUIRIES & SUSTAINABILITY ASSESSMENTS */}
            {tab === 'requests' && (
              <div className="space-y-5">
                <div className="rounded-2xl border border-[#6F9BFF]/18 bg-[#0C1424]/88 p-5 sm:p-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                    <div>
                      <h2 className="text-base sm:text-lg font-semibold text-[#F5F8FC]">
                        {isFa
                          ? 'درخواست‌های پروژه و ارزیابی‌های پایداری من'
                          : 'My Project Inquiries & Sustainability Assessments'}
                      </h2>
                      <p className="text-xs text-[#9FB0C9] mt-1">
                        {isFa
                          ? 'وضعیت بررسی و پاسخ مستقیم تیم مهندسی گروه ISB برای هر درخواست در همین بخش نمایش داده می‌شود.'
                          : 'Track review status and official ISB engineering replies for every submission linked to your Google account.'}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onNavigate({ page: 'contact' })}
                        className="min-h-[38px] inline-flex items-center gap-1.5 rounded-xl border border-[#6F9BFF]/35 bg-[#223A87]/24 px-3.5 py-1.5 text-xs font-medium text-[#DCE8FF] hover:border-[#6F9BFF] transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isFa ? 'درخواست پروژه جدید' : 'New Project Inquiry'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onNavigate({ page: 'sustainability-lab' })}
                        className="min-h-[38px] inline-flex items-center gap-1.5 rounded-xl border border-[#28CF77]/35 bg-[#00A651]/16 px-3.5 py-1.5 text-xs font-medium text-[#D6FFE9] hover:border-[#28CF77] transition-colors cursor-pointer"
                      >
                        <FlaskConical className="w-3.5 h-3.5" />
                        <span>{isFa ? 'ارزیابی پایداری جدید' : 'New Lab Assessment'}</span>
                      </button>
                    </div>
                  </div>

                  {totalRequestsCount === 0 ? (
                    <div className="rounded-xl border border-dashed border-[#6F9BFF]/25 bg-[#070B14]/55 p-8 text-center space-y-3">
                      <div className="w-12 h-12 mx-auto rounded-2xl bg-[#223A87]/30 border border-[#6F9BFF]/35 flex items-center justify-center">
                        <Inbox className="w-5 h-5 text-[#6F9BFF]" />
                      </div>
                      <h3 className="text-sm font-semibold text-[#F5F8FC]">
                        {isFa
                          ? 'هنوز درخواست پروژه یا ارزیابی پایداری ثبت نکرده‌اید'
                          : 'No project inquiries or lab assessments yet'}
                      </h3>
                      <p className="text-xs text-[#9FB0C9] max-w-md mx-auto leading-relaxed">
                        {isFa
                          ? 'هر درخواستی که در صفحه تماس با ما یا آزمایشگاه پایداری ثبت کنید، به‌طور خودکار در این لیست نمایش داده می‌شود و پاسخ مهندسین ISB را همین‌جا دریافت خواهید کرد.'
                          : 'Any inquiry submitted on the Contact page or Sustainability Lab automatically appears here alongside engineering responses.'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {inquiries.map((inq) => (
                        <div
                          key={inq.id}
                          className="rounded-xl border border-[#6F9BFF]/20 bg-[#070B14]/55 p-4 sm:p-5 space-y-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <span className="font-semibold text-[#8AB0FF]">
                                {isFa ? 'درخواست پروژه' : 'Project Inquiry'}
                              </span>
                              <span className="text-[#8B9DB7]">·</span>
                              <span className="text-[#C6D2E3]">{inq.projectType}</span>
                              {inq.city && (
                                <>
                                  <span className="text-[#8B9DB7]">·</span>
                                  <span className="text-[#9FB0C9]">{inq.city}</span>
                                </>
                              )}
                            </div>
                            <span
                              className={`rounded-md border px-2.5 py-0.5 text-[11px] font-medium ${
                                inq.adminReply || inq.internalStatus === 'contacted'
                                  ? 'border-[#28CF77]/45 bg-[#00A651]/15 text-[#28CF77]'
                                  : 'border-[#6F9BFF]/35 bg-[#223A87]/25 text-[#93BCFF]'
                              }`}
                            >
                              {isFa
                                ? MEMBER_INQUIRY_STATUS_LABELS[inq.internalStatus].fa
                                : MEMBER_INQUIRY_STATUS_LABELS[inq.internalStatus].en}
                            </span>
                          </div>

                          <p className="text-sm text-[#DCE6F5] leading-relaxed whitespace-pre-line">
                            {inq.message}
                          </p>

                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#8B9DB7]">
                            <span className="inline-flex items-center gap-1 font-numeric">
                              <Clock className="w-3 h-3" />
                              {formatDateTime(inq.createdAtIso, locale)}
                            </span>
                            <span className="ltr-inline font-mono">ID: {inq.id}</span>
                          </div>

                          {inq.adminReply ? (
                            <div className="rounded-xl border border-[#28CF77]/35 bg-[#00A651]/12 p-4 space-y-1.5">
                              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                                <span className="inline-flex items-center gap-1.5 font-semibold text-[#28CF77]">
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  <span>
                                    {isFa ? 'پاسخ رسمی تیم مهندسی ISB' : 'Official ISB Engineering Reply'}
                                  </span>
                                </span>
                                {inq.repliedAtIso && (
                                  <span className="text-[11px] text-[#9FB0C9] font-numeric">
                                    {formatDateTime(inq.repliedAtIso, locale)}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-[#F5F8FC] whitespace-pre-line leading-relaxed">
                                {inq.adminReply}
                              </p>
                            </div>
                          ) : (
                            <p className="text-[11.5px] text-[#8B9DB7]">
                              {isFa
                                ? 'در صف بررسی مهندسین ISB — پاسخ به‌محض ثبت در همین کادر نمایش داده می‌شود.'
                                : 'Queued for ISB engineering review — the official reply will appear here once posted.'}
                            </p>
                          )}
                        </div>
                      ))}

                      {assessments.map((asr) => (
                        <div
                          key={asr.id}
                          className="rounded-xl border border-[#28CF77]/22 bg-[#071117]/65 p-4 sm:p-5 space-y-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <span className="inline-flex items-center gap-1.5 font-semibold text-[#28CF77]">
                                <FlaskConical className="w-3.5 h-3.5" />
                                <span>{isFa ? 'ارزیابی آزمایشگاه پایداری' : 'Sustainability Lab Assessment'}</span>
                              </span>
                              <span className="text-[#8B9DB7]">·</span>
                              <span className="text-[#C6D2E3]">{asr.projectType}</span>
                              <span className="text-[#8B9DB7]">·</span>
                              <span className="text-[#9FB0C9]">
                                {asr.city} · {asr.approximateFloorAreaSqm.toLocaleString(isFa ? 'fa-IR' : 'en-US')} m²
                              </span>
                            </div>
                            <span
                              className={`rounded-md border px-2.5 py-0.5 text-[11px] font-medium ${
                                asr.adminReply || asr.internalStatus === 'completed'
                                  ? 'border-[#28CF77]/45 bg-[#00A651]/15 text-[#28CF77]'
                                  : 'border-amber-400/35 bg-amber-500/12 text-amber-200'
                              }`}
                            >
                              {isFa
                                ? MEMBER_ASSESSMENT_STATUS_LABELS[asr.internalStatus].fa
                                : MEMBER_ASSESSMENT_STATUS_LABELS[asr.internalStatus].en}
                            </span>
                          </div>

                          <p className="text-xs text-[#9FB0C9]">
                            {isFa ? 'محورهای ارزیابی: ' : 'Assessment goals: '}
                            <span className="text-[#DCE6F5]">{asr.assessmentGoals.join(' · ')}</span>
                          </p>

                          {asr.notes && (
                            <p className="text-sm text-[#DCE6F5] leading-relaxed whitespace-pre-line">
                              {asr.notes}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#8B9DB7]">
                            <span className="inline-flex items-center gap-1 font-numeric">
                              <Clock className="w-3 h-3" />
                              {formatDateTime(asr.createdAtIso, locale)}
                            </span>
                            <span className="ltr-inline font-mono">ID: {asr.id}</span>
                          </div>

                          {asr.adminReply ? (
                            <div className="rounded-xl border border-[#28CF77]/35 bg-[#00A651]/12 p-4 space-y-1.5">
                              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                                <span className="inline-flex items-center gap-1.5 font-semibold text-[#28CF77]">
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  <span>
                                    {isFa
                                      ? 'پاسخ رسمی آزمایشگاه پایداری ISB'
                                      : 'Official Sustainability Lab Reply'}
                                  </span>
                                </span>
                                {asr.repliedAtIso && (
                                  <span className="text-[11px] text-[#9FB0C9] font-numeric">
                                    {formatDateTime(asr.repliedAtIso, locale)}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-[#F5F8FC] whitespace-pre-line leading-relaxed">
                                {asr.adminReply}
                              </p>
                            </div>
                          ) : (
                            <p className="text-[11.5px] text-[#8B9DB7]">
                              {isFa
                                ? 'در صف تحلیل تیم انرژی و پایداری — پاسخ به‌محض آماده شدن در همین کادر نمایش داده می‌شود.'
                                : 'Queued for Sustainability Lab triage — the official reply will appear here once posted.'}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: SUPPORT TICKETS & THREADED TRACKING */}
            {tab === 'tickets' && (
              <div className="grid grid-cols-1 xl:grid-cols-[340px_minmax(0,1fr)] gap-4 items-start">
                {/* Left Column: Ticket Queue & Filter */}
                <div className="rounded-2xl border border-[#6F9BFF]/18 bg-[#0C1424]/88 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-sm font-semibold text-[#F5F8FC]">
                      {isFa ? `تیکت‌های من (${tickets.length})` : `My Tickets (${tickets.length})`}
                    </h2>
                    <button
                      type="button"
                      onClick={() => {
                        setComposingNewTicket(true);
                        setNewTicketErrors({});
                      }}
                      className="glass-cta min-h-[36px] inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isFa ? 'تیکت جدید' : 'New Ticket'}</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {(['all', 'open', 'in-progress', 'answered', 'closed'] as const).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setTicketStatusFilter(st)}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                          ticketStatusFilter === st
                            ? 'bg-[#223A87] text-white'
                            : 'bg-white/[0.04] text-[#9FB0C9] hover:bg-white/[0.08]'
                        }`}
                      >
                        {st === 'all'
                          ? isFa
                            ? 'همه'
                            : 'All'
                          : isFa
                            ? TICKET_STATUS_LABELS[st].fa
                            : TICKET_STATUS_LABELS[st].en}
                      </button>
                    ))}
                  </div>

                  {filteredTickets.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-white/15 p-6 text-center space-y-2">
                      <p className="text-xs text-[#9FB0C9]">
                        {isFa
                          ? 'هنوز تیکتی ثبت نکرده‌اید.'
                          : 'You have not opened any tickets yet.'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[540px] overflow-y-auto pe-1">
                      {filteredTickets.map((tk) => {
                        const isSelected = !composingNewTicket && tk.id === selectedTicketId;
                        return (
                          <button
                            key={tk.id}
                            type="button"
                            onClick={() => {
                              setComposingNewTicket(false);
                              setSelectedTicketId(tk.id);
                              setReplyError(null);
                            }}
                            className={`w-full text-start rounded-xl border p-3.5 space-y-1.5 transition-colors cursor-pointer ${
                              isSelected
                                ? 'border-[#6F9BFF]/60 bg-[#223A87]/30'
                                : 'border-white/10 bg-[#070B14]/55 hover:border-[#6F9BFF]/35'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="ltr-inline font-mono font-numeric text-[11px] text-[#8AB0FF]">
                                {tk.ticketNumber}
                              </span>
                              <span
                                className={`rounded-md border px-2 py-0.5 text-[10px] font-medium ${getTicketStatusClass(
                                  tk.status
                                )}`}
                              >
                                {isFa
                                  ? TICKET_STATUS_LABELS[tk.status].fa
                                  : TICKET_STATUS_LABELS[tk.status].en}
                              </span>
                            </div>
                            <p className="text-xs sm:text-[13px] font-semibold text-[#F5F8FC] line-clamp-1">
                              {tk.subject}
                            </p>
                            <div className="flex items-center justify-between gap-2 text-[10.5px] text-[#8B9DB7]">
                              <span>
                                {isFa
                                  ? TICKET_CATEGORY_LABELS[tk.category].fa
                                  : TICKET_CATEGORY_LABELS[tk.category].en}
                              </span>
                              <span className="font-numeric">
                                {tk.replyCount > 0
                                  ? isFa
                                    ? `${tk.replyCount} پاسخ`
                                    : `${tk.replyCount} replies`
                                  : isFa
                                    ? 'در انتظار پاسخ'
                                    : 'Awaiting reply'}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Right Column: New Ticket Composer OR Active Ticket Thread */}
                <div className="rounded-2xl border border-[#6F9BFF]/18 bg-[#0C1424]/88 p-5 sm:p-6">
                  {composingNewTicket ? (
                    <form onSubmit={handleCreateTicket} className="space-y-4" noValidate>
                      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
                        <div>
                          <h3 className="text-base font-semibold text-[#F5F8FC]">
                            {isFa ? 'ثبت تیکت پشتیبانی و پیگیری جدید' : 'Create New Support Ticket'}
                          </h3>
                          <p className="text-xs text-[#9FB0C9] mt-0.5">
                            {isFa
                              ? 'پاسخ کارشناسان گروه ISB مستقیماً در همین پنل ثبت و نمایش داده می‌شود.'
                              : 'Replies from the ISB Group team will appear directly in this thread.'}
                          </p>
                        </div>
                        {tickets.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setComposingNewTicket(false)}
                            className="text-xs text-[#9FB0C9] hover:text-white cursor-pointer"
                          >
                            {isFa ? 'انصراف' : 'Cancel'}
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5 md:col-span-2">
                          <label htmlFor="tk-subject" className="block text-xs font-medium text-[#DCE6F5]">
                            {isFa ? 'موضوع تیکت *' : 'Subject *'}
                          </label>
                          <input
                            id="tk-subject"
                            type="text"
                            value={newTicketForm.subject}
                            onChange={(e) =>
                              setNewTicketForm((prev) => ({ ...prev, subject: e.target.value }))
                            }
                            placeholder={
                              isFa
                                ? 'مثال: سؤال درباره ثبت‌نام دوره شبیه‌سازی انرژی'
                                : 'e.g. Question about Energy Simulation course enrollment'
                            }
                            className="w-full rounded-xl border border-[#6F9BFF]/25 bg-[#070B14]/80 px-3.5 py-2.5 text-sm text-[#F5F8FC] focus:outline-none focus:border-[#6F9BFF]"
                          />
                          {newTicketErrors.subject && (
                            <p className="text-[11px] text-amber-300">{newTicketErrors.subject}</p>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <label htmlFor="tk-category" className="block text-xs font-medium text-[#DCE6F5]">
                            {isFa ? 'دپارتمان / موضوع' : 'Category'}
                          </label>
                          <select
                            id="tk-category"
                            value={newTicketForm.category}
                            onChange={(e) =>
                              setNewTicketForm((prev) => ({
                                ...prev,
                                category: e.target.value as TicketCategory,
                              }))
                            }
                            className="w-full rounded-xl border border-[#6F9BFF]/25 bg-[#070B14]/80 px-3.5 py-2.5 text-sm text-[#F5F8FC]"
                          >
                            {(['courses', 'orders-billing', 'technical', 'general'] as const).map(
                              (cat) => (
                                <option key={cat} value={cat}>
                                  {isFa
                                    ? TICKET_CATEGORY_LABELS[cat].fa
                                    : TICKET_CATEGORY_LABELS[cat].en}
                                </option>
                              )
                            )}
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label htmlFor="tk-priority" className="block text-xs font-medium text-[#DCE6F5]">
                            {isFa ? 'اولویت' : 'Priority'}
                          </label>
                          <select
                            id="tk-priority"
                            value={newTicketForm.priority}
                            onChange={(e) =>
                              setNewTicketForm((prev) => ({
                                ...prev,
                                priority: e.target.value as TicketPriority,
                              }))
                            }
                            className="w-full rounded-xl border border-[#6F9BFF]/25 bg-[#070B14]/80 px-3.5 py-2.5 text-sm text-[#F5F8FC]"
                          >
                            {(['normal', 'high'] as const).map((pr) => (
                              <option key={pr} value={pr}>
                                {isFa ? TICKET_PRIORITY_LABELS[pr].fa : TICKET_PRIORITY_LABELS[pr].en}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                          <label htmlFor="tk-order" className="block text-xs font-medium text-[#DCE6F5]">
                            {isFa ? 'شماره سفارش مرتبط (اختیاری)' : 'Related Order Code (Optional)'}
                          </label>
                          <input
                            id="tk-order"
                            type="text"
                            dir="ltr"
                            value={newTicketForm.orderNumber}
                            onChange={(e) =>
                              setNewTicketForm((prev) => ({ ...prev, orderNumber: e.target.value }))
                            }
                            placeholder="ISB-OR-..."
                            className="w-full rounded-xl border border-[#6F9BFF]/25 bg-[#070B14]/80 px-3.5 py-2.5 text-sm font-mono text-[#F5F8FC]"
                          />
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                          <label htmlFor="tk-message" className="block text-xs font-medium text-[#DCE6F5]">
                            {isFa ? 'شرح کامل پیام یا درخواست *' : 'Message Details *'}
                          </label>
                          <textarea
                            id="tk-message"
                            rows={5}
                            value={newTicketForm.message}
                            onChange={(e) =>
                              setNewTicketForm((prev) => ({ ...prev, message: e.target.value }))
                            }
                            placeholder={
                              isFa
                                ? 'جزئیات سؤال، کد دوره یا مورد پیگیری خود را بنویسید...'
                                : 'Describe your question or issue in detail...'
                            }
                            className="w-full rounded-xl border border-[#6F9BFF]/25 bg-[#070B14]/80 px-3.5 py-2.5 text-sm text-[#F5F8FC] resize-y"
                          />
                          {newTicketErrors.message && (
                            <p className="text-[11px] text-amber-300">{newTicketErrors.message}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          type="submit"
                          disabled={submittingTicket}
                          className="glass-cta min-h-[44px] inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-xs sm:text-sm font-semibold cursor-pointer disabled:opacity-60"
                        >
                          {submittingTicket ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                          <span>
                            {submittingTicket
                              ? isFa
                                ? 'در حال ارسال...'
                                : 'Submitting...'
                              : isFa
                                ? 'ارسال تیکت'
                                : 'Submit Ticket'}
                          </span>
                        </button>
                      </div>
                    </form>
                  ) : selectedTicket ? (
                    <div className="space-y-5">
                      {/* Ticket Thread Header */}
                      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-4">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="ltr-inline font-mono font-numeric text-xs text-[#6F9BFF]">
                              {selectedTicket.ticketNumber}
                            </span>
                            <span
                              className={`rounded-md border px-2 py-0.5 text-[11px] font-medium ${getTicketStatusClass(
                                selectedTicket.status
                              )}`}
                            >
                              {isFa
                                ? TICKET_STATUS_LABELS[selectedTicket.status].fa
                                : TICKET_STATUS_LABELS[selectedTicket.status].en}
                            </span>
                            {selectedTicket.orderNumber && (
                              <span className="ltr-inline font-mono text-[11px] text-[#9FB0C9]">
                                · Order {selectedTicket.orderNumber}
                              </span>
                            )}
                          </div>
                          <h3 className="text-base sm:text-lg font-semibold text-[#F5F8FC]">
                            {selectedTicket.subject}
                          </h3>
                          <p className="text-xs text-[#8B9DB7] inline-flex items-center gap-1.5 font-numeric">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{formatDateTime(selectedTicket.createdAtIso, locale)}</span>
                          </p>
                        </div>

                        {selectedTicket.status !== 'closed' && (
                          <button
                            type="button"
                            onClick={() => void handleCloseTicket()}
                            className="min-h-[36px] inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.04] px-3.5 py-1.5 text-xs text-[#C6D2E3] hover:border-[#28CF77]/50 hover:text-[#28CF77] transition-colors cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{isFa ? 'بستن تیکت (حل شد)' : 'Mark Resolved'}</span>
                          </button>
                        )}
                      </div>

                      {/* Conversation Timeline */}
                      <div className="space-y-3 max-h-[420px] overflow-y-auto pe-1">
                        {/* Original User Message */}
                        <div className="rounded-xl border border-[#6F9BFF]/25 bg-[#223A87]/18 p-4 space-y-2">
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <span className="font-semibold text-[#DCE8FF]">
                              {selectedTicket.userFullName} ({isFa ? 'شما' : 'You'})
                            </span>
                            <span className="text-[11px] text-[#8B9DB7] font-numeric">
                              {formatDateTime(selectedTicket.createdAtIso, locale)}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-[#E8EEF9] whitespace-pre-line leading-relaxed">
                            {selectedTicket.initialMessage}
                          </p>
                        </div>

                        {loadingMessages ? (
                          <div className="py-6 flex items-center justify-center gap-2 text-xs text-[#8B9DB7]">
                            <Loader2 className="w-4 h-4 animate-spin text-[#6F9BFF]" />
                            <span>{isFa ? 'در حال بارگذاری گفتگو...' : 'Loading messages...'}</span>
                          </div>
                        ) : (
                          ticketMessages.map((msg) => {
                            const isAdminMsg = msg.senderRole === 'admin';
                            return (
                              <div
                                key={msg.id}
                                className={`rounded-xl border p-4 space-y-2 ${
                                  isAdminMsg
                                    ? 'border-[#28CF77]/35 bg-[#00A651]/12'
                                    : 'border-[#6F9BFF]/25 bg-[#223A87]/18'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2 text-xs">
                                  <span
                                    className={`font-semibold inline-flex items-center gap-1.5 ${
                                      isAdminMsg ? 'text-[#28CF77]' : 'text-[#DCE8FF]'
                                    }`}
                                  >
                                    {isAdminMsg && <ShieldCheck className="w-3.5 h-3.5" />}
                                    <span>
                                      {isAdminMsg
                                        ? isFa
                                          ? 'تیم پشتیبانی گروه ISB'
                                          : 'ISB Group Support'
                                        : `${msg.senderName} (${isFa ? 'شما' : 'You'})`}
                                    </span>
                                  </span>
                                  <span className="text-[11px] text-[#8B9DB7] font-numeric">
                                    {formatDateTime(msg.createdAtIso, locale)}
                                  </span>
                                </div>
                                <p className="text-xs sm:text-sm text-[#F5F8FC] whitespace-pre-line leading-relaxed">
                                  {msg.body}
                                </p>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Follow-up Reply Form (Locked if closed) */}
                      {selectedTicket.status === 'closed' ? (
                        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-[#9FB0C9] flex items-center justify-between gap-3">
                          <span>
                            {isFa
                              ? 'این تیکت بسته شده است. برای موضوع جدید می‌توانید یک تیکت جدید ثبت کنید.'
                              : 'This ticket is closed. Open a new ticket for additional inquiries.'}
                          </span>
                          <button
                            type="button"
                            onClick={() => setComposingNewTicket(true)}
                            className="text-[#6F9BFF] hover:underline font-medium shrink-0 cursor-pointer"
                          >
                            {isFa ? 'تیکت جدید' : 'New Ticket'}
                          </button>
                        </div>
                      ) : (
                        <form onSubmit={handleSendReply} className="space-y-2.5 pt-2 border-t border-white/10">
                          <label htmlFor="tk-reply" className="block text-xs font-medium text-[#DCE6F5]">
                            {isFa ? 'ارسال پاسخ یا توضیح تکمیلی' : 'Send Follow-Up Reply'}
                          </label>
                          <textarea
                            id="tk-reply"
                            rows={3}
                            value={replyText}
                            onChange={(e) => {
                              setReplyText(e.target.value);
                              if (replyError) setReplyError(null);
                            }}
                            placeholder={
                              isFa ? 'پیام خود را اینجا بنویسید...' : 'Write your follow-up message...'
                            }
                            className="w-full rounded-xl border border-[#6F9BFF]/25 bg-[#070B14]/80 px-3.5 py-2.5 text-sm text-[#F5F8FC] focus:outline-none focus:border-[#6F9BFF] resize-y"
                          />
                          {replyError && (
                            <p className="text-[11px] text-amber-300 flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>{replyError}</span>
                            </p>
                          )}
                          <div className="flex justify-end">
                            <button
                              type="submit"
                              disabled={sendingReply}
                              className="glass-cta min-h-[40px] inline-flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-semibold cursor-pointer disabled:opacity-60"
                            >
                              {sendingReply ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <MessageSquareReply className="w-3.5 h-3.5" />
                              )}
                              <span>
                                {sendingReply
                                  ? isFa
                                    ? 'در حال ارسال...'
                                    : 'Sending...'
                                  : isFa
                                    ? 'ارسال پاسخ'
                                    : 'Send Reply'}
                              </span>
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  ) : (
                    <div className="py-12 text-center space-y-4">
                      <div className="w-12 h-12 mx-auto rounded-2xl bg-[#223A87]/30 border border-[#6F9BFF]/35 flex items-center justify-center">
                        <Ticket className="w-5 h-5 text-[#6F9BFF]" />
                      </div>
                      <div className="space-y-1.5 max-w-sm mx-auto">
                        <h3 className="text-sm font-semibold text-[#F5F8FC]">
                          {isFa ? 'سیستم تیکت و پشتیبانی مستقیم ISB' : 'ISB Direct Ticket Support'}
                        </h3>
                        <p className="text-xs text-[#9FB0C9] leading-relaxed">
                          {isFa
                            ? 'سؤالات خود درباره دوره‌های آموزشی، سفارش‌ها یا مشاوره مهندسی را ثبت کنید و تمام پاسخ‌ها را یکجا پیگیری نمایید.'
                            : 'Submit questions about courses, orders, or technical consultation and follow all replies here.'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setComposingNewTicket(true)}
                        className="glass-cta min-h-[40px] inline-flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-semibold cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isFa ? 'ثبت اولین تیکت' : 'Create First Ticket'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
