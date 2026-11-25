import React, { useEffect, useMemo, useState } from 'react';
import {
  createAdminOrder,
  deleteAdminOrder,
  deleteAdminTicket,
  fetchAdminTicketMessages,
  postTicketReply,
  updateAdminOrderStatus,
  updateAdminTicketMeta,
} from '../../services/accountStore';
import { auth } from '../../services/firebase';
import type {
  AdminOrderFormInput,
  Course,
  Locale,
  OrderItemType,
  OrderPaymentStatus,
  SupportTicket,
  TicketMessage,
  TicketStatus,
  UserOrder,
  UserProfile,
} from '../../types/content';
import {
  computeProfileCompleteness,
  formatAccessUrlDisplay,
  formatTomanAmount,
  ORDER_STATUS_LABELS,
  ORDER_TYPE_LABELS,
  resolveOrderCourse,
  resolveOrderLifetimeAccessUrl,
  TICKET_CATEGORY_LABELS,
  TICKET_PRIORITY_LABELS,
  TICKET_STATUS_LABELS,
  validateAdminOrderForm,
  validateTicketReply,
} from '../../utils/accountLogic';
import { hasErrors, isSafeExternalUrl, type FieldErrors } from '../../utils/validation';
import {
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  ExternalLink,
  Link2,
  Loader2,
  Mail,
  MapPin,
  MessageSquareReply,
  Phone,
  Plus,
  Search,
  Send,
  ShieldCheck,
  ShoppingBag,
  Ticket,
  Trash2,
  User,
} from '../icons/IsbIcons';

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

/* ============================================================================
 * 1. ADMIN USERS DIRECTORY (Complete Member & Buyer Profile Inspector)
 * ========================================================================== */

interface AdminUsersManagerProps {
  locale: Locale;
  users: UserProfile[];
  orders: UserOrder[];
  tickets: SupportTicket[];
  onCreateOrderForUser: (userId: string) => void;
}

export function AdminUsersManager({
  locale,
  users,
  orders,
  tickets,
  onCreateOrderForUser,
}: AdminUsersManagerProps) {
  const isFa = locale === 'fa';
  const [search, setSearch] = useState('');
  const [selectedUid, setSelectedUid] = useState<string | null>(users[0]?.uid ?? null);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (!q) return true;
      return (
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone ?? '').toLowerCase().includes(q) ||
        (u.nationalId ?? '').toLowerCase().includes(q) ||
        (u.city ?? '').toLowerCase().includes(q) ||
        (u.organization ?? '').toLowerCase().includes(q)
      );
    });
  }, [users, search]);

  const selectedUser = useMemo(
    () => users.find((u) => u.uid === selectedUid) ?? filteredUsers[0] ?? null,
    [users, filteredUsers, selectedUid]
  );

  const selectedUserOrders = useMemo(
    () => (selectedUser ? orders.filter((o) => o.userId === selectedUser.uid) : []),
    [orders, selectedUser]
  );

  const selectedUserTickets = useMemo(
    () => (selectedUser ? tickets.filter((t) => t.userId === selectedUser.uid) : []),
    [tickets, selectedUser]
  );

  return (
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
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              isFa
                ? 'جستجو در نام، ایمیل، موبایل، کد ملی یا شهر...'
                : 'Search by name, email, phone, national ID, or city...'
            }
            className={`w-full rounded-xl border border-[#6F9BFF]/22 bg-[#080D16]/70 py-2 text-xs text-[#F5F8FC] ${
              isFa ? 'pr-9 pl-3' : 'pl-9 pr-3'
            }`}
          />
        </div>
        <span className="text-xs text-[#9FB0C9] font-numeric">
          {isFa ? `${filteredUsers.length} کاربر ثبت‌نام‌شده` : `${filteredUsers.length} registered users`}
        </span>
      </div>

      {users.length === 0 ? (
        <div className="glass-surface rounded-2xl p-10 text-center text-sm text-[#8B9DB7]">
          {isFa
            ? 'هنوز هیچ کاربری از طریق درگاه ورود گوگل ثبت‌نام نکرده است.'
            : 'No members have signed in via the Google gateway yet.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[380px_minmax(0,1fr)] gap-4 items-start">
          {/* Users List */}
          <div className="space-y-2 max-h-[620px] overflow-y-auto pe-1">
            {filteredUsers.map((u) => {
              const comp = computeProfileCompleteness(u);
              const uOrders = orders.filter((o) => o.userId === u.uid).length;
              const uTickets = tickets.filter((t) => t.userId === u.uid).length;
              const isSelected = selectedUser?.uid === u.uid;

              return (
                <button
                  key={u.uid}
                  type="button"
                  onClick={() => setSelectedUid(u.uid)}
                  className={`w-full text-start rounded-2xl border p-4 space-y-2 transition-colors cursor-pointer ${
                    isSelected
                      ? 'border-[#6F9BFF]/60 bg-[#223A87]/32'
                      : 'border-white/10 bg-[#0C1424]/85 hover:border-[#6F9BFF]/35'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {u.photoURL ? (
                        <img
                          src={u.photoURL}
                          alt={u.fullName}
                          referrerPolicy="no-referrer"
                          className="w-9 h-9 rounded-xl object-cover border border-white/15 shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-[#223A87]/40 border border-[#6F9BFF]/35 flex items-center justify-center text-xs font-bold text-white shrink-0">
                          {u.fullName.slice(0, 1)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#F5F8FC] truncate">{u.fullName}</p>
                        <p className="text-[11px] text-[#8B9DB7] ltr-inline truncate">{u.email}</p>
                      </div>
                    </div>
                    <span
                      className={`font-mono font-numeric text-[11px] font-semibold shrink-0 ${
                        comp.isCheckoutReady ? 'text-[#28CF77]' : 'text-amber-300'
                      }`}
                    >
                      {comp.percent}%
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#9FB0C9] font-numeric">
                    {u.phone && <span className="ltr-inline">{u.phone}</span>}
                    <span>
                      {isFa ? `${uOrders} سفارش` : `${uOrders} orders`}
                    </span>
                    <span>
                      {isFa ? `${uTickets} تیکت` : `${uTickets} tickets`}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Complete Member Profile Inspector */}
          {selectedUser && (
            <div className="glass-surface rounded-2xl p-6 space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-4">
                <div className="flex items-center gap-3.5">
                  {selectedUser.photoURL ? (
                    <img
                      src={selectedUser.photoURL}
                      alt={selectedUser.fullName}
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 rounded-2xl object-cover border border-[#6F9BFF]/35"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-[#223A87]/40 border border-[#6F9BFF]/40 flex items-center justify-center text-lg font-bold text-white">
                      {selectedUser.fullName.slice(0, 1)}
                    </div>
                  )}
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-[#F5F8FC]">
                      {selectedUser.fullName}
                    </h3>
                    <p className="text-xs text-[#9FB0C9] ltr-inline">{selectedUser.email}</p>
                    <p className="text-[11px] text-[#8B9DB7] font-mono">UID: {selectedUser.uid}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onCreateOrderForUser(selectedUser.uid)}
                  className="glass-cta-emerald min-h-[40px] inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isFa ? 'ثبت سفارش / دوره برای این کاربر' : 'Assign Course / Order'}</span>
                </button>
              </div>

              {/* Complete Contact, Identity & Billing Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                <div className="rounded-xl border border-white/10 bg-[#070B14]/60 p-3.5 space-y-1">
                  <span className="text-[#8B9DB7] flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#28CF77]" />
                    {isFa ? 'شماره موبایل' : 'Phone'}
                  </span>
                  <p className="text-sm font-numeric text-[#F5F8FC] ltr-inline">
                    {selectedUser.phone || (isFa ? 'ثبت نشده' : 'Not provided')}
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-[#070B14]/60 p-3.5 space-y-1">
                  <span className="text-[#8B9DB7] flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-[#6F9BFF]" />
                    {isFa ? 'کد ملی' : 'National ID'}
                  </span>
                  <p className="text-sm font-mono font-numeric text-[#F5F8FC] ltr-inline">
                    {selectedUser.nationalId || (isFa ? 'ثبت نشده' : 'Not provided')}
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-[#070B14]/60 p-3.5 space-y-1">
                  <span className="text-[#8B9DB7] flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#68C4F8]" />
                    {isFa ? 'شهر' : 'City'}
                  </span>
                  <p className="text-sm text-[#F5F8FC]">
                    {selectedUser.city || (isFa ? 'ثبت نشده' : 'Not provided')}
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-[#070B14]/60 p-3.5 space-y-1">
                  <span className="text-[#8B9DB7] flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#6F9BFF]" />
                    {isFa ? 'تخصص / رشته' : 'Profession'}
                  </span>
                  <p className="text-sm text-[#F5F8FC]">
                    {selectedUser.profession || (isFa ? 'ثبت نشده' : 'Not provided')}
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-[#070B14]/60 p-3.5 space-y-1">
                  <span className="text-[#8B9DB7] flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#28CF77]" />
                    {isFa ? 'سازمان / دانشگاه' : 'Organization'}
                  </span>
                  <p className="text-sm text-[#F5F8FC]">
                    {selectedUser.organization || (isFa ? 'ثبت نشده' : 'Not provided')}
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-[#070B14]/60 p-3.5 space-y-1">
                  <span className="text-[#8B9DB7] flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#8AB0FF]" />
                    {isFa ? 'آخرین ورود' : 'Last Sign-In'}
                  </span>
                  <p className="text-xs font-numeric text-[#F5F8FC]">
                    {formatShortDate(selectedUser.lastLoginAtIso, locale)}
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-[#070B14]/60 p-3.5 space-y-1 sm:col-span-2 lg:col-span-3">
                  <span className="text-[#8B9DB7]">
                    {isFa ? 'نشانی پستی / صدور فاکتور' : 'Billing / Mailing Address'}
                  </span>
                  <p className="text-sm text-[#E4EEFF] leading-relaxed">
                    {selectedUser.billingAddress || (isFa ? 'ثبت نشده' : 'Not provided')}
                  </p>
                </div>
              </div>

              {/* Quick summary of this user's orders & tickets */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-white/10">
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-[#C6D2E3] flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5 text-[#28CF77]" />
                    <span>
                      {isFa
                        ? `سفارش‌های کاربر (${selectedUserOrders.length})`
                        : `User Orders (${selectedUserOrders.length})`}
                    </span>
                  </h4>
                  {selectedUserOrders.length === 0 ? (
                    <p className="text-xs text-[#8B9DB7]">
                      {isFa ? 'سفارشی ثبت نشده است.' : 'No orders yet.'}
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {selectedUserOrders.map((o) => (
                        <div
                          key={o.id}
                          className="rounded-lg border border-white/10 bg-white/[0.025] px-3 py-2 flex items-center justify-between gap-2 text-xs"
                        >
                          <span className="truncate text-[#F5F8FC]">
                            {isFa ? o.titleFa : o.titleEn}
                          </span>
                          <span className="font-mono font-numeric text-[#28CF77] shrink-0">
                            {formatTomanAmount(o.amountToman, locale)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-[#C6D2E3] flex items-center gap-1.5">
                    <Ticket className="w-3.5 h-3.5 text-[#6F9BFF]" />
                    <span>
                      {isFa
                        ? `تیکت‌های کاربر (${selectedUserTickets.length})`
                        : `User Tickets (${selectedUserTickets.length})`}
                    </span>
                  </h4>
                  {selectedUserTickets.length === 0 ? (
                    <p className="text-xs text-[#8B9DB7]">
                      {isFa ? 'تیکتی ثبت نشده است.' : 'No tickets yet.'}
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {selectedUserTickets.map((tk) => (
                        <div
                          key={tk.id}
                          className="rounded-lg border border-white/10 bg-white/[0.025] px-3 py-2 flex items-center justify-between gap-2 text-xs"
                        >
                          <span className="truncate text-[#F5F8FC]">{tk.subject}</span>
                          <span className="text-[10.5px] text-[#9FB0C9] shrink-0">
                            {isFa ? TICKET_STATUS_LABELS[tk.status].fa : TICKET_STATUS_LABELS[tk.status].en}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ============================================================================
 * 2. ADMIN SUPPORT TICKETS QUEUE & THREADED REPLY MANAGER
 * ========================================================================== */

interface AdminTicketsManagerProps {
  locale: Locale;
  tickets: SupportTicket[];
  users: UserProfile[];
  onTicketsChange: React.Dispatch<React.SetStateAction<SupportTicket[]>>;
  onBanner: (text: string | null, tone?: 'info' | 'success' | 'error') => void;
}

export function AdminTicketsManager({
  locale,
  tickets,
  users,
  onTicketsChange,
  onBanner,
}: AdminTicketsManagerProps) {
  const isFa = locale === 'fa';
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TicketStatus>('all');
  const [selectedId, setSelectedId] = useState<string | null>(tickets[0]?.id ?? null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  const [replyBody, setReplyBody] = useState('');
  const [nextStatus, setNextStatus] = useState<TicketStatus>('answered');
  const [adminNotes, setAdminNotes] = useState('');
  const [sending, setSending] = useState(false);

  const filteredTickets = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tickets.filter((tk) => {
      if (statusFilter !== 'all' && tk.status !== statusFilter) return false;
      if (!q) return true;
      return (
        tk.ticketNumber.toLowerCase().includes(q) ||
        tk.subject.toLowerCase().includes(q) ||
        tk.userFullName.toLowerCase().includes(q) ||
        tk.userEmail.toLowerCase().includes(q)
      );
    });
  }, [tickets, search, statusFilter]);

  const selectedTicket = useMemo(
    () => tickets.find((t) => t.id === selectedId) ?? filteredTickets[0] ?? null,
    [tickets, filteredTickets, selectedId]
  );

  const ticketUser = useMemo(
    () => (selectedTicket ? users.find((u) => u.uid === selectedTicket.userId) ?? null : null),
    [users, selectedTicket]
  );

  useEffect(() => {
    if (!selectedTicket || !auth.currentUser) {
      setMessages([]);
      return;
    }
    setAdminNotes(selectedTicket.adminNotes ?? '');
    setNextStatus(selectedTicket.status === 'closed' ? 'closed' : 'answered');

    let cancelled = false;
    setLoadingMsgs(true);
    fetchAdminTicketMessages(selectedTicket.id)
      .then((list) => {
        if (!cancelled) setMessages(list);
      })
      .catch(() => {
        if (!cancelled) setMessages([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingMsgs(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedTicket]);

  const handleSendAdminReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !auth.currentUser) return;
    const err = validateTicketReply(replyBody, locale);
    if (err) {
      onBanner(err, 'error');
      return;
    }

    setSending(true);
    try {
      const msg = await postTicketReply({
        ticket: selectedTicket,
        senderUid: auth.currentUser.uid,
        senderName: isFa ? 'پشتیبانی گروه ISB' : 'ISB Group Support',
        senderRole: 'admin',
        body: replyBody,
        nextStatus,
        adminNotes,
      });
      setMessages((prev) => [...prev, msg]);
      onTicketsChange((prev) =>
        prev.map((t) =>
          t.id === selectedTicket.id
            ? {
                ...t,
                status: nextStatus,
                adminNotes,
                lastReplyBy: 'admin',
                replyCount: t.replyCount + 1,
                updatedAtIso: msg.createdAtIso,
                lastReplyAtIso: msg.createdAtIso,
              }
            : t
        )
      );
      setReplyBody('');
      onBanner(
        isFa ? 'پاسخ در تیکت کاربر ثبت شد و در پنل او نمایش داده می‌شود.' : 'Reply posted to user ticket.',
        'success'
      );
    } catch {
      onBanner(isFa ? 'خطا در ارسال پاسخ تیکت.' : 'Could not post ticket reply.', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleUpdateMetaOnly = async (newStatus: TicketStatus) => {
    if (!selectedTicket) return;
    try {
      await updateAdminTicketMeta(selectedTicket.id, { status: newStatus, adminNotes });
      onTicketsChange((prev) =>
        prev.map((t) =>
          t.id === selectedTicket.id ? { ...t, status: newStatus, adminNotes } : t
        )
      );
      onBanner(isFa ? 'وضعیت تیکت ذخیره شد.' : 'Ticket status updated.', 'success');
    } catch {
      onBanner(isFa ? 'خطا در به‌روزرسانی وضعیت تیکت.' : 'Could not update ticket.', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAdminTicket(id);
      onTicketsChange((prev) => prev.filter((t) => t.id !== id));
      setSelectedId(null);
      onBanner(isFa ? 'تیکت حذف شد.' : 'Ticket deleted.', 'success');
    } catch {
      onBanner(isFa ? 'خطا در حذف تیکت.' : 'Could not delete ticket.', 'error');
    }
  };

  return (
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
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              isFa ? 'جستجو در شماره تیکت، موضوع یا نام کاربر...' : 'Search tickets by code, subject, or user...'
            }
            className={`w-full rounded-xl border border-[#6F9BFF]/22 bg-[#080D16]/70 py-2 text-xs text-[#F5F8FC] ${
              isFa ? 'pr-9 pl-3' : 'pl-9 pr-3'
            }`}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(['all', 'open', 'in-progress', 'answered', 'closed'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#223A87] text-white border border-[#6F9BFF]/60'
                  : 'bg-white/5 text-[#C6D2E3] hover:bg-white/10'
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
      </div>

      {tickets.length === 0 ? (
        <div className="glass-surface rounded-2xl p-10 text-center text-sm text-[#8B9DB7]">
          {isFa ? 'هنوز هیچ تیکتی از کاربران ثبت نشده است.' : 'No member tickets submitted yet.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)] gap-4 items-start">
          <div className="space-y-2 max-h-[640px] overflow-y-auto pe-1">
            {filteredTickets.map((tk) => {
              const isSelected = selectedTicket?.id === tk.id;
              return (
                <button
                  key={tk.id}
                  type="button"
                  onClick={() => setSelectedId(tk.id)}
                  className={`w-full text-start rounded-2xl border p-4 space-y-1.5 transition-colors cursor-pointer ${
                    isSelected
                      ? 'border-[#6F9BFF]/60 bg-[#223A87]/32'
                      : 'border-white/10 bg-[#0C1424]/85 hover:border-[#6F9BFF]/35'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="ltr-inline font-mono text-[11px] text-[#8AB0FF]">
                      {tk.ticketNumber}
                    </span>
                    <span className="text-[10.5px] text-[#28CF77]">
                      {isFa ? TICKET_STATUS_LABELS[tk.status].fa : TICKET_STATUS_LABELS[tk.status].en}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-[#F5F8FC] line-clamp-1">{tk.subject}</p>
                  <div className="flex items-center justify-between gap-2 text-[11px] text-[#9FB0C9]">
                    <span className="truncate">{tk.userFullName}</span>
                    <span className="shrink-0">
                      {isFa ? TICKET_PRIORITY_LABELS[tk.priority].fa : TICKET_PRIORITY_LABELS[tk.priority].en}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {selectedTicket && (
            <div className="glass-surface rounded-2xl p-6 space-y-5">
              {/* Ticket Header + Member Quick Card */}
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="ltr-inline font-mono text-[#6F9BFF]">
                      {selectedTicket.ticketNumber}
                    </span>
                    <span className="text-[#9FB0C9]">
                      · {isFa ? TICKET_CATEGORY_LABELS[selectedTicket.category].fa : TICKET_CATEGORY_LABELS[selectedTicket.category].en}
                    </span>
                    {selectedTicket.orderNumber && (
                      <span className="ltr-inline font-mono text-[#28CF77]">
                        · {selectedTicket.orderNumber}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-[#F5F8FC]">{selectedTicket.subject}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#9FB0C9]">
                    <span>{selectedTicket.userFullName}</span>
                    <span className="ltr-inline inline-flex items-center gap-1">
                      <Mail className="w-3 h-3 text-[#6F9BFF]" />
                      {selectedTicket.userEmail}
                    </span>
                    {ticketUser?.phone && (
                      <span className="ltr-inline inline-flex items-center gap-1 font-numeric">
                        <Phone className="w-3 h-3 text-[#28CF77]" />
                        {ticketUser.phone}
                      </span>
                    )}
                    {ticketUser?.city && <span>· {ticketUser.city}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    aria-label={isFa ? 'وضعیت تیکت' : 'Ticket status'}
                    value={selectedTicket.status}
                    onChange={(e) => void handleUpdateMetaOnly(e.target.value as TicketStatus)}
                    className="rounded-xl border border-[#6F9BFF]/25 bg-[#0E1626] px-3 py-2 text-xs text-[#F5F8FC]"
                  >
                    {(['open', 'in-progress', 'answered', 'closed'] as const).map((st) => (
                      <option key={st} value={st}>
                        {isFa ? TICKET_STATUS_LABELS[st].fa : TICKET_STATUS_LABELS[st].en}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => void handleDelete(selectedTicket.id)}
                    aria-label={isFa ? 'حذف تیکت' : 'Delete ticket'}
                    className="p-2 rounded-xl border border-rose-400/25 text-rose-300 hover:bg-rose-500/15 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Conversation Thread */}
              <div className="space-y-3 max-h-[360px] overflow-y-auto pe-1">
                <div className="rounded-xl border border-[#6F9BFF]/25 bg-[#223A87]/18 p-4 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#DCE8FF]">
                      {selectedTicket.userFullName}
                    </span>
                    <span className="text-[11px] text-[#8B9DB7] font-numeric">
                      {formatShortDate(selectedTicket.createdAtIso, locale)}
                    </span>
                  </div>
                  <p className="text-sm text-[#F5F8FC] whitespace-pre-line leading-relaxed">
                    {selectedTicket.initialMessage}
                  </p>
                </div>

                {loadingMsgs ? (
                  <div className="py-4 flex items-center justify-center gap-2 text-xs text-[#8B9DB7]">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{isFa ? 'در حال بارگذاری...' : 'Loading thread...'}</span>
                  </div>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      className={`rounded-xl border p-4 space-y-1.5 ${
                        m.senderRole === 'admin'
                          ? 'border-[#28CF77]/35 bg-[#00A651]/14'
                          : 'border-[#6F9BFF]/25 bg-[#223A87]/18'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span
                          className={`font-semibold inline-flex items-center gap-1.5 ${
                            m.senderRole === 'admin' ? 'text-[#28CF77]' : 'text-[#DCE8FF]'
                          }`}
                        >
                          {m.senderRole === 'admin' && <ShieldCheck className="w-3.5 h-3.5" />}
                          {m.senderName}
                        </span>
                        <span className="text-[11px] text-[#8B9DB7] font-numeric">
                          {formatShortDate(m.createdAtIso, locale)}
                        </span>
                      </div>
                      <p className="text-sm text-[#F5F8FC] whitespace-pre-line leading-relaxed">
                        {m.body}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Admin Reply Composer */}
              <form onSubmit={handleSendAdminReply} className="space-y-3 border-t border-white/10 pt-4">
                <div className="space-y-1.5">
                  <label htmlFor="adm-ticket-reply" className="block text-xs font-medium text-[#DCE6F5]">
                    {isFa ? 'پاسخ مستقیم به کاربر (نمایش آنی در پنل کاربر)' : 'Reply to User (Visible in Member Portal)'}
                  </label>
                  <textarea
                    id="adm-ticket-reply"
                    rows={3}
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    placeholder={isFa ? 'متن پاسخ خود را بنویسید...' : 'Write your official response...'}
                    className="w-full rounded-xl border border-[#6F9BFF]/25 bg-[#080D16]/75 px-3.5 py-2.5 text-sm text-[#F5F8FC]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label htmlFor="adm-ticket-notes" className="block text-[11px] text-[#9FB0C9]">
                      {isFa ? 'یادداشت داخلی مدیریت (فقط برای ادمین)' : 'Internal Admin Notes'}
                    </label>
                    <input
                      id="adm-ticket-notes"
                      type="text"
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      className="w-full rounded-xl border border-white/15 bg-[#080D16]/70 px-3 py-2 text-xs text-[#F5F8FC]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="adm-ticket-nextst" className="block text-[11px] text-[#9FB0C9]">
                      {isFa ? 'وضعیت پس از ارسال پاسخ' : 'Status After Reply'}
                    </label>
                    <select
                      id="adm-ticket-nextst"
                      value={nextStatus}
                      onChange={(e) => setNextStatus(e.target.value as TicketStatus)}
                      className="w-full rounded-xl border border-white/15 bg-[#0E1626] px-3 py-2 text-xs text-[#F5F8FC]"
                    >
                      <option value="answered">{isFa ? 'پاسخ داده شد' : 'Answered'}</option>
                      <option value="in-progress">{isFa ? 'در حال بررسی' : 'In Progress'}</option>
                      <option value="closed">{isFa ? 'بسته شده' : 'Closed'}</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={sending}
                    className="glass-cta-emerald min-h-[42px] inline-flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-semibold cursor-pointer disabled:opacity-60"
                  >
                    {sending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>{isFa ? 'ارسال پاسخ در تیکت' : 'Post Reply'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ============================================================================
 * 3. ADMIN ORDERS & COURSE ENROLLMENTS MANAGER
 * ========================================================================== */

interface AdminOrdersManagerProps {
  locale: Locale;
  orders: UserOrder[];
  users: UserProfile[];
  courses?: Course[];
  preselectedUserId: string | null;
  onClearPreselectedUser: () => void;
  onOrdersChange: React.Dispatch<React.SetStateAction<UserOrder[]>>;
  onBanner: (text: string | null, tone?: 'info' | 'success' | 'error') => void;
}

export function AdminOrdersManager({
  locale,
  orders,
  users,
  courses = [],
  preselectedUserId,
  onClearPreselectedUser,
  onOrdersChange,
  onBanner,
}: AdminOrdersManagerProps) {
  const isFa = locale === 'fa';
  const [statusFilter, setStatusFilter] = useState<'all' | OrderPaymentStatus>('all');
  const [showCreateForm, setShowCreateForm] = useState(Boolean(preselectedUserId));
  const [form, setForm] = useState<AdminOrderFormInput>({
    userId: preselectedUserId ?? users[0]?.uid ?? '',
    courseId: '',
    itemType: 'course',
    titleFa: '',
    titleEn: '',
    amountToman: '',
    paymentStatus: 'pending',
    paymentGateway: 'manual',
    paymentRef: '',
    accessUrl: '',
    notes: '',
  });
  const [errors, setErrors] = useState<FieldErrors<AdminOrderFormInput>>({});
  const [saving, setSaving] = useState(false);
  const [editingAccessOrderId, setEditingAccessOrderId] = useState<string | null>(null);
  const [accessUrlDraft, setAccessUrlDraft] = useState('');
  const [savingAccessUrl, setSavingAccessUrl] = useState(false);

  useEffect(() => {
    if (preselectedUserId) {
      setShowCreateForm(true);
      setForm((prev) => ({ ...prev, userId: preselectedUserId }));
      onClearPreselectedUser();
    }
  }, [preselectedUserId, onClearPreselectedUser]);

  const filteredOrders = useMemo(
    () =>
      orders.filter((o) => (statusFilter === 'all' ? true : o.paymentStatus === statusFilter)),
    [orders, statusFilter]
  );

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateAdminOrderForm(form, locale);
    setErrors(errs);
    if (hasErrors(errs)) return;

    const targetUser = users.find((u) => u.uid === form.userId);
    if (!targetUser) {
      onBanner(isFa ? 'کاربر انتخاب‌شده یافت نشد.' : 'Selected user not found.', 'error');
      return;
    }

    setSaving(true);
    try {
      const created = await createAdminOrder(targetUser, form);
      onOrdersChange((prev) => [created, ...prev]);
      setShowCreateForm(false);
      setForm({
        userId: users[0]?.uid ?? '',
        courseId: '',
        itemType: 'course',
        titleFa: '',
        titleEn: '',
        amountToman: '',
        paymentStatus: 'pending',
        paymentGateway: 'manual',
        paymentRef: '',
        accessUrl: '',
        notes: '',
      });
      onBanner(
        isFa
          ? `سفارش ${created.orderNumber} برای ${targetUser.fullName} ثبت شد.`
          : `Order ${created.orderNumber} assigned to ${targetUser.fullName}.`,
        'success'
      );
    } catch {
      onBanner(isFa ? 'خطا در ثبت سفارش.' : 'Could not create order.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="glass-surface rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {(['all', 'pending', 'paid', 'cancelled', 'refunded'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#00A651] text-white border border-[#28CF77]/60'
                  : 'bg-white/5 text-[#C6D2E3] hover:bg-white/10'
              }`}
            >
              {st === 'all'
                ? isFa
                  ? 'همه سفارش‌ها'
                  : 'All Orders'
                : isFa
                  ? ORDER_STATUS_LABELS[st].fa
                  : ORDER_STATUS_LABELS[st].en}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShowCreateForm((prev) => !prev)}
          disabled={users.length === 0}
          className="glass-cta min-h-[38px] inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold cursor-pointer disabled:opacity-50"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{isFa ? 'ثبت سفارش / دوره جدید' : 'New Order / Enrollment'}</span>
        </button>
      </div>

      {showCreateForm && (
        <form
          onSubmit={handleCreateOrder}
          className="glass-surface rounded-2xl p-6 space-y-4 border border-[#28CF77]/35"
          noValidate
        >
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-[#F5F8FC]">
              {isFa ? 'ثبت سفارش یا دسترسی دوره برای کاربر' : 'Assign Order or Course Enrollment'}
            </h3>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="text-xs text-[#9FB0C9] hover:text-white cursor-pointer"
            >
              {isFa ? 'بستن' : 'Close'}
            </button>
          </div>

          {courses.length > 0 && (
            <div className="space-y-1">
              <label className="block text-xs text-[#9BE8BE]">
                {isFa
                  ? 'انتخاب سریع از دوره‌های آکادمی (تکمیل خودکار عنوان، مبلغ و لینک کلاس)'
                  : 'Quick-fill from Academy Course (auto-fills title, fee & lifetime classroom link)'}
              </label>
              <select
                value={form.courseId ?? ''}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  const chosen = courses.find((c) => c.id === selectedId);
                  if (!chosen) {
                    setForm((p) => ({ ...p, courseId: '' }));
                    return;
                  }
                  setForm((p) => ({
                    ...p,
                    courseId: chosen.id,
                    itemType: 'course',
                    titleFa: chosen.titleFa,
                    titleEn: chosen.titleEn,
                    amountToman: String(chosen.priceToman),
                    accessUrl: chosen.accessUrl ?? p.accessUrl,
                  }));
                }}
                className="w-full rounded-xl border border-[#28CF77]/35 bg-[#0A1820] px-3 py-2.5 text-xs text-[#F5F8FC]"
              >
                <option value="">
                  {isFa ? '— بدون انتخاب (ورود دستی) —' : '— Manual entry —'}
                </option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {isFa ? c.titleFa : c.titleEn} ({formatTomanAmount(c.priceToman, locale)})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="block text-xs text-[#DCE6F5]">
                {isFa ? 'کاربر خریدار *' : 'Registered User *'}
              </label>
              <select
                value={form.userId}
                onChange={(e) => setForm((p) => ({ ...p, userId: e.target.value }))}
                className="w-full rounded-xl border border-[#6F9BFF]/25 bg-[#0E1626] px-3 py-2.5 text-xs text-[#F5F8FC]"
              >
                <option value="">{isFa ? 'انتخاب کاربر...' : 'Select user...'}</option>
                {users.map((u) => (
                  <option key={u.uid} value={u.uid}>
                    {u.fullName} ({u.email})
                  </option>
                ))}
              </select>
              {errors.userId && <p className="text-[11px] text-amber-300">{errors.userId}</p>}
            </div>

            <div className="space-y-1">
              <label className="block text-xs text-[#DCE6F5]">{isFa ? 'نوع سفارش' : 'Item Type'}</label>
              <select
                value={form.itemType}
                onChange={(e) => setForm((p) => ({ ...p, itemType: e.target.value as OrderItemType }))}
                className="w-full rounded-xl border border-[#6F9BFF]/25 bg-[#0E1626] px-3 py-2.5 text-xs text-[#F5F8FC]"
              >
                {(['course', 'workshop', 'consultation', 'publication'] as const).map((t) => (
                  <option key={t} value={t}>
                    {isFa ? ORDER_TYPE_LABELS[t].fa : ORDER_TYPE_LABELS[t].en}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs text-[#DCE6F5]">
                {isFa ? 'مبلغ (تومان) *' : 'Amount (Toman) *'}
              </label>
              <input
                type="text"
                dir="ltr"
                value={form.amountToman}
                onChange={(e) => setForm((p) => ({ ...p, amountToman: e.target.value }))}
                placeholder="4500000"
                className="w-full rounded-xl border border-[#6F9BFF]/25 bg-[#080D16]/80 px-3 py-2.5 text-xs font-mono text-[#F5F8FC]"
              />
              {errors.amountToman && (
                <p className="text-[11px] text-amber-300">{errors.amountToman}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-xs text-[#DCE6F5]">
                {isFa ? 'عنوان فارسی دوره / خدمت *' : 'Persian Title *'}
              </label>
              <input
                type="text"
                value={form.titleFa}
                onChange={(e) => setForm((p) => ({ ...p, titleFa: e.target.value }))}
                placeholder="دوره جامع شبیه‌سازی انرژی و مبحث ۱۹"
                className="w-full rounded-xl border border-[#6F9BFF]/25 bg-[#080D16]/80 px-3 py-2.5 text-xs text-[#F5F8FC]"
              />
              {errors.titleFa && <p className="text-[11px] text-amber-300">{errors.titleFa}</p>}
            </div>

            <div className="space-y-1">
              <label className="block text-xs text-[#DCE6F5]">
                {isFa ? 'عنوان انگلیسی دوره / خدمت *' : 'English Title *'}
              </label>
              <input
                type="text"
                dir="ltr"
                value={form.titleEn}
                onChange={(e) => setForm((p) => ({ ...p, titleEn: e.target.value }))}
                placeholder="Energy Simulation & Code 19 Masterclass"
                className="w-full rounded-xl border border-[#6F9BFF]/25 bg-[#080D16]/80 px-3 py-2.5 text-xs text-[#F5F8FC]"
              />
              {errors.titleEn && <p className="text-[11px] text-amber-300">{errors.titleEn}</p>}
            </div>

            <div className="space-y-1">
              <label className="block text-xs text-[#DCE6F5]">
                {isFa ? 'وضعیت پرداخت' : 'Payment Status'}
              </label>
              <select
                value={form.paymentStatus}
                onChange={(e) =>
                  setForm((p) => ({ ...p, paymentStatus: e.target.value as OrderPaymentStatus }))
                }
                className="w-full rounded-xl border border-[#6F9BFF]/25 bg-[#0E1626] px-3 py-2.5 text-xs text-[#F5F8FC]"
              >
                {(['pending', 'paid', 'cancelled', 'refunded'] as const).map((st) => (
                  <option key={st} value={st}>
                    {isFa ? ORDER_STATUS_LABELS[st].fa : ORDER_STATUS_LABELS[st].en}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs text-[#DCE6F5]">
                {isFa ? 'کد رهگیری پرداخت (اختیاری)' : 'Payment Reference (Optional)'}
              </label>
              <input
                type="text"
                dir="ltr"
                value={form.paymentRef}
                onChange={(e) => setForm((p) => ({ ...p, paymentRef: e.target.value }))}
                placeholder="REF-884210"
                className="w-full rounded-xl border border-[#6F9BFF]/25 bg-[#080D16]/80 px-3 py-2.5 text-xs font-mono text-[#F5F8FC]"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="block text-xs text-[#DCE6F5]">
                {isFa ? 'لینک دسترسی به دوره / کلاس (اختیاری)' : 'Course Access URL (Optional)'}
              </label>
              <input
                type="url"
                dir="ltr"
                value={form.accessUrl}
                onChange={(e) => setForm((p) => ({ ...p, accessUrl: e.target.value }))}
                placeholder="https://..."
                className="w-full rounded-xl border border-[#6F9BFF]/25 bg-[#080D16]/80 px-3 py-2.5 text-xs text-[#F5F8FC]"
              />
              {errors.accessUrl && <p className="text-[11px] text-amber-300">{errors.accessUrl}</p>}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="glass-cta-emerald min-h-[40px] inline-flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-semibold cursor-pointer disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              <span>{isFa ? 'ثبت نهایی سفارش' : 'Save Order'}</span>
            </button>
          </div>
        </form>
      )}

      {filteredOrders.length === 0 ? (
        <div className="glass-surface rounded-2xl p-10 text-center text-sm text-[#8B9DB7]">
          {isFa
            ? 'هنوز سفارشی ثبت نشده است. با ثبت‌نام کاربران و انتشار دوره‌ها، تمام سفارش‌ها اینجا مدیریت می‌شوند.'
            : 'No orders recorded yet.'}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((ord) => {
            const matchedCourse = resolveOrderCourse(ord, courses);
            const activeLifetimeUrl = resolveOrderLifetimeAccessUrl(ord, courses);
            const isEditingAccess = editingAccessOrderId === ord.id;

            return (
              <div key={ord.id} className="glass-card rounded-2xl p-5 space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="ltr-inline font-mono text-[#6F9BFF]">{ord.orderNumber}</span>
                      <span className="text-[#9FB0C9]">
                        · {isFa ? ORDER_TYPE_LABELS[ord.itemType].fa : ORDER_TYPE_LABELS[ord.itemType].en}
                      </span>
                      <span className="font-mono font-numeric text-[#28CF77] font-semibold">
                        · {formatTomanAmount(ord.amountToman, locale)}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-[#F5F8FC]">
                      {isFa ? ord.titleFa : ord.titleEn}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#8B9DB7]">
                      <span>{ord.userFullName}</span>
                      <span className="ltr-inline">{ord.userEmail}</span>
                      {ord.userPhone && (
                        <span className="ltr-inline font-numeric text-[#C6D2E3]">{ord.userPhone}</span>
                      )}
                      <span className="inline-flex items-center gap-1 font-numeric">
                        <Clock className="w-3 h-3" />
                        {formatShortDate(ord.createdAtIso, locale)}
                      </span>
                      {ord.paymentRef && (
                        <span className="ltr-inline font-mono text-[#28CF77]">
                          Ref: {ord.paymentRef}
                        </span>
                      )}
                    </div>
                    {ord.notes && (
                      <p className="text-xs text-[#C6D2E3] leading-relaxed">{ord.notes}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {ord.paymentStatus === 'pending' && (
                      <button
                        type="button"
                        onClick={async () => {
                          const accessUrl = ord.accessUrl || matchedCourse?.accessUrl;
                          try {
                            await updateAdminOrderStatus(ord.id, 'paid', ord.paymentRef, accessUrl);
                            onOrdersChange((prev) =>
                              prev.map((item) =>
                                item.id === ord.id
                                  ? {
                                      ...item,
                                      paymentStatus: 'paid',
                                      accessUrl: accessUrl ?? item.accessUrl,
                                    }
                                  : item
                              )
                            );
                            onBanner(
                              isFa
                                ? 'پرداخت تأیید و دسترسی مادام‌العمر دوره برای کاربر فعال شد.'
                                : 'Payment approved and lifetime course access activated.',
                              'success'
                            );
                          } catch {
                            onBanner(
                              isFa ? 'خطا در تأیید پرداخت.' : 'Could not approve payment.',
                              'error'
                            );
                          }
                        }}
                        className="glass-cta-emerald min-h-[36px] inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isFa ? 'تأیید پرداخت' : 'Approve Payment'}</span>
                      </button>
                    )}

                    {ord.paymentStatus === 'paid' && (
                      <button
                        type="button"
                        onClick={() => {
                          if (isEditingAccess) {
                            setEditingAccessOrderId(null);
                          } else {
                            setEditingAccessOrderId(ord.id);
                            setAccessUrlDraft(
                              ord.accessUrl || matchedCourse?.accessUrl || ''
                            );
                          }
                        }}
                        className="min-h-[36px] inline-flex items-center gap-1.5 rounded-xl border border-[#28CF77]/35 bg-[#00A651]/12 px-3 py-1.5 text-xs font-medium text-[#D6FFE9] hover:bg-[#00A651]/22 transition-colors cursor-pointer"
                      >
                        <Link2 className="w-3.5 h-3.5" />
                        <span>
                          {activeLifetimeUrl
                            ? isFa
                              ? 'ویرایش لینک کلاس'
                              : 'Edit Access Link'
                            : isFa
                              ? 'ثبت لینک کلاس'
                              : 'Set Access Link'}
                        </span>
                      </button>
                    )}

                    <select
                      aria-label={isFa ? 'تغییر وضعیت پرداخت' : 'Update payment status'}
                      value={ord.paymentStatus}
                      onChange={async (e) => {
                        const next = e.target.value as OrderPaymentStatus;
                        const accessUrl =
                          next === 'paid' ? ord.accessUrl || matchedCourse?.accessUrl : undefined;
                        try {
                          await updateAdminOrderStatus(ord.id, next, undefined, accessUrl);
                          onOrdersChange((prev) =>
                            prev.map((item) =>
                              item.id === ord.id
                                ? {
                                    ...item,
                                    paymentStatus: next,
                                    accessUrl: accessUrl ?? item.accessUrl,
                                  }
                                : item
                            )
                          );
                          onBanner(
                            isFa ? 'وضعیت پرداخت سفارش به‌روزرسانی شد.' : 'Order payment status updated.',
                            'success'
                          );
                        } catch {
                          onBanner(
                            isFa ? 'خطا در تغییر وضعیت سفارش.' : 'Could not update order status.',
                            'error'
                          );
                        }
                      }}
                      className="rounded-xl border border-[#6F9BFF]/25 bg-[#0E1626] px-3 py-2 text-xs text-[#F5F8FC]"
                    >
                      {(['pending', 'paid', 'cancelled', 'refunded'] as const).map((st) => (
                        <option key={st} value={st}>
                          {isFa ? ORDER_STATUS_LABELS[st].fa : ORDER_STATUS_LABELS[st].en}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      aria-label={isFa ? 'حذف سفارش' : 'Delete order'}
                      onClick={async () => {
                        try {
                          await deleteAdminOrder(ord.id);
                          onOrdersChange((prev) => prev.filter((item) => item.id !== ord.id));
                          onBanner(isFa ? 'سفارش حذف شد.' : 'Order deleted.', 'success');
                        } catch {
                          onBanner(isFa ? 'خطا در حذف سفارش.' : 'Could not delete order.', 'error');
                        }
                      }}
                      className="p-2 rounded-xl border border-rose-400/25 text-rose-300 hover:bg-rose-500/15 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {ord.paymentStatus === 'paid' && activeLifetimeUrl && !isEditingAccess && (
                  <div className="rounded-xl border border-[#28CF77]/22 bg-[#071516]/75 px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <Link2 className="w-3.5 h-3.5 text-[#28CF77] shrink-0" />
                      <span className="text-[#9FB0C9]">
                        {isFa ? 'لینک مادام‌العمر فعال کاربر:' : 'Active lifetime link:'}
                      </span>
                      <a
                        href={activeLifetimeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        dir="ltr"
                        className="font-mono text-[#9BE8BE] hover:text-white truncate max-w-[280px] sm:max-w-[420px] inline-flex items-center gap-1"
                      >
                        <span className="truncate">{formatAccessUrlDisplay(activeLifetimeUrl)}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </div>
                    <span className="text-[11px] text-[#8B9DB7]">
                      {ord.accessUrl
                        ? isFa
                          ? 'ذخیره‌شده روی سفارش'
                          : 'Saved on order'
                        : isFa
                          ? 'متصل به لینک دوره'
                          : 'Inherited from course'}
                    </span>
                  </div>
                )}

                {ord.paymentStatus === 'paid' && isEditingAccess && (
                  <div className="rounded-xl border border-[#28CF77]/32 bg-[#08151D] p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                    <input
                      type="url"
                      dir="ltr"
                      value={accessUrlDraft}
                      onChange={(e) => setAccessUrlDraft(e.target.value)}
                      placeholder="https://meet.google.com/... or https://..."
                      className="flex-1 rounded-lg border border-[#6F9BFF]/25 bg-[#070B14] px-3 py-2 text-xs font-mono text-[#F5F8FC] focus:outline-none focus:border-[#28CF77]"
                    />
                    <button
                      type="button"
                      disabled={savingAccessUrl}
                      onClick={async () => {
                        const trimmed = accessUrlDraft.trim();
                        if (!trimmed || !isSafeExternalUrl(trimmed)) {
                          onBanner(
                            isFa
                              ? 'لینک کلاس باید آدرس معتبر https:// باشد.'
                              : 'Class access URL must be a valid https:// URL.',
                            'error'
                          );
                          return;
                        }
                        setSavingAccessUrl(true);
                        try {
                          await updateAdminOrderStatus(ord.id, 'paid', undefined, trimmed);
                          onOrdersChange((prev) =>
                            prev.map((item) =>
                              item.id === ord.id ? { ...item, accessUrl: trimmed } : item
                            )
                          );
                          setEditingAccessOrderId(null);
                          onBanner(
                            isFa
                              ? 'لینک دائمی کلاس روی سفارش کاربر ذخیره شد.'
                              : 'Lifetime classroom URL saved on this order.',
                            'success'
                          );
                        } catch {
                          onBanner(
                            isFa ? 'ذخیره لینک کلاس انجام نشد.' : 'Could not save access URL.',
                            'error'
                          );
                        } finally {
                          setSavingAccessUrl(false);
                        }
                      }}
                      className="glass-cta-emerald min-h-[36px] inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold cursor-pointer disabled:opacity-60"
                    >
                      {savingAccessUrl ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      <span>{isFa ? 'ذخیره لینک دائمی' : 'Save Lifetime Link'}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
