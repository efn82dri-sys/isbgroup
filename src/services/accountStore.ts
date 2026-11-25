import {
  createUserWithEmailAndPassword,
  RecaptchaVerifier,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
  signOut,
  updateProfile,
  type ConfirmationResult,
  type User,
} from 'firebase/auth';
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
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import type {
  AdminOrderFormInput,
  AssessmentRecord,
  Course,
  InquiryRecord,
  Locale,
  MemberCheckoutInput,
  OrderPaymentStatus,
  SupportTicket,
  TicketFormInput,
  TicketMessage,
  TicketStatus,
  UserOrder,
  UserProfile,
  UserProfileFormInput,
} from '../types/content';
import { generateTrackingCode, normalizeDigits } from '../utils/accountLogic';
import { sanitizeText } from '../utils/validation';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  isFirestoreOfflineError,
  OperationType,
  withOfflineRetry,
} from './firebase';

function timestampToIso(value: unknown): string | undefined {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  return undefined;
}

function stripEmptyOptional<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== '') {
      out[k] = v;
    }
  }
  return out;
}

function mapUserProfile(id: string, data: Record<string, unknown>): UserProfile {
  return {
    uid: typeof data.uid === 'string' ? data.uid : id,
    email: typeof data.email === 'string' ? data.email : '',
    fullName: typeof data.fullName === 'string' ? data.fullName : '',
    displayName: typeof data.displayName === 'string' ? data.displayName : undefined,
    photoURL: typeof data.photoURL === 'string' ? data.photoURL : undefined,
    phone: typeof data.phone === 'string' ? data.phone : undefined,
    nationalId: typeof data.nationalId === 'string' ? data.nationalId : undefined,
    city: typeof data.city === 'string' ? data.city : undefined,
    organization: typeof data.organization === 'string' ? data.organization : undefined,
    profession: typeof data.profession === 'string' ? data.profession : undefined,
    billingAddress: typeof data.billingAddress === 'string' ? data.billingAddress : undefined,
    locale: data.locale === 'en' ? 'en' : 'fa',
    role: data.role === 'admin' ? 'admin' : 'member',
    createdAtIso: timestampToIso(data.createdAt),
    updatedAtIso: timestampToIso(data.updatedAt),
    lastLoginAtIso: timestampToIso(data.lastLoginAt),
  };
}

function mapUserOrder(id: string, data: Record<string, unknown>): UserOrder {
  return {
    id,
    orderNumber: typeof data.orderNumber === 'string' ? data.orderNumber : id,
    userId: typeof data.userId === 'string' ? data.userId : '',
    userEmail: typeof data.userEmail === 'string' ? data.userEmail : '',
    userFullName: typeof data.userFullName === 'string' ? data.userFullName : '',
    userPhone: typeof data.userPhone === 'string' ? data.userPhone : undefined,
    courseId: typeof data.courseId === 'string' ? data.courseId : undefined,
    itemType:
      data.itemType === 'workshop' ||
      data.itemType === 'consultation' ||
      data.itemType === 'publication'
        ? data.itemType
        : 'course',
    titleFa: typeof data.titleFa === 'string' ? data.titleFa : '',
    titleEn: typeof data.titleEn === 'string' ? data.titleEn : '',
    amountToman: typeof data.amountToman === 'number' ? data.amountToman : 0,
    paymentStatus:
      data.paymentStatus === 'paid' ||
      data.paymentStatus === 'cancelled' ||
      data.paymentStatus === 'refunded'
        ? data.paymentStatus
        : 'pending',
    paymentGateway: typeof data.paymentGateway === 'string' ? data.paymentGateway : undefined,
    paymentRef: typeof data.paymentRef === 'string' ? data.paymentRef : undefined,
    notes: typeof data.notes === 'string' ? data.notes : undefined,
    accessUrl: typeof data.accessUrl === 'string' ? data.accessUrl : undefined,
    createdAtIso: timestampToIso(data.createdAt),
    updatedAtIso: timestampToIso(data.updatedAt),
    paidAtIso: timestampToIso(data.paidAt),
  };
}

function mapSupportTicket(id: string, data: Record<string, unknown>): SupportTicket {
  return {
    id,
    ticketNumber: typeof data.ticketNumber === 'string' ? data.ticketNumber : id,
    userId: typeof data.userId === 'string' ? data.userId : '',
    userEmail: typeof data.userEmail === 'string' ? data.userEmail : '',
    userFullName: typeof data.userFullName === 'string' ? data.userFullName : '',
    subject: typeof data.subject === 'string' ? data.subject : '',
    category:
      data.category === 'courses' ||
      data.category === 'orders-billing' ||
      data.category === 'technical'
        ? data.category
        : 'general',
    priority: data.priority === 'high' ? 'high' : 'normal',
    status:
      data.status === 'in-progress' || data.status === 'answered' || data.status === 'closed'
        ? data.status
        : 'open',
    initialMessage: typeof data.initialMessage === 'string' ? data.initialMessage : '',
    orderNumber: typeof data.orderNumber === 'string' ? data.orderNumber : undefined,
    lastReplyBy: data.lastReplyBy === 'admin' ? 'admin' : 'user',
    replyCount: typeof data.replyCount === 'number' ? data.replyCount : 0,
    adminNotes: typeof data.adminNotes === 'string' ? data.adminNotes : undefined,
    locale: data.locale === 'en' ? 'en' : 'fa',
    createdAtIso: timestampToIso(data.createdAt),
    updatedAtIso: timestampToIso(data.updatedAt),
    lastReplyAtIso: timestampToIso(data.lastReplyAt),
  };
}

function mapTicketMessage(id: string, data: Record<string, unknown>): TicketMessage {
  return {
    id,
    ticketId: typeof data.ticketId === 'string' ? data.ticketId : '',
    ticketOwnerId: typeof data.ticketOwnerId === 'string' ? data.ticketOwnerId : '',
    senderUid: typeof data.senderUid === 'string' ? data.senderUid : '',
    senderName: typeof data.senderName === 'string' ? data.senderName : '',
    senderRole: data.senderRole === 'admin' ? 'admin' : 'user',
    body: typeof data.body === 'string' ? data.body : '',
    createdAtIso: timestampToIso(data.createdAt),
  };
}

/**
 * Ensures any signed-in user (Google, Email/Password, or Phone SMS OTP) has a synchronized
 * /users/{uid} Firestore record, preserving existing billing/contact fields while updating lastLoginAt.
 */
export async function syncMemberProfileOnLogin(
  user: User,
  locale: Locale,
  overrides?: { fullName?: string; phone?: string }
): Promise<UserProfile> {
  const path = `users/${user.uid}`;
  const ref = doc(db, 'users', user.uid);
  const safeEmail = sanitizeText(user.email ?? '', 160);
  const safePhone = sanitizeText(
    normalizeDigits(overrides?.phone?.trim() || user.phoneNumber || ''),
    40
  );
  const fallbackName = sanitizeText(
    overrides?.fullName?.trim() ||
      user.displayName?.trim() ||
      (safeEmail ? safeEmail.split('@')[0] : '') ||
      safePhone ||
      'ISB Member',
    120
  );
  const ensuredFullName = fallbackName.length >= 2 ? fallbackName : 'ISB Member';

  try {
    const existingSnap = await withOfflineRetry(() => getDoc(ref));
    if (existingSnap.exists()) {
      const existingData = existingSnap.data();
      const updatePayload: Record<string, unknown> = {
        lastLoginAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        locale,
      };
      if (safeEmail) {
        updatePayload.email = safeEmail;
      }
      if (safePhone && !existingData.phone) {
        updatePayload.phone = safePhone;
      }
      if (overrides?.fullName?.trim() && (!existingData.fullName || existingData.fullName === 'ISB Member')) {
        updatePayload.fullName = ensuredFullName;
      }
      if (user.displayName?.trim()) {
        updatePayload.displayName = sanitizeText(user.displayName, 120);
      }
      if (user.photoURL?.trim()) {
        updatePayload.photoURL = sanitizeText(user.photoURL, 500);
      }
      await updateDoc(ref, updatePayload);
      return mapUserProfile(user.uid, {
        ...existingData,
        ...updatePayload,
      });
    }

    const createPayload: Record<string, unknown> = {
      ...stripEmptyOptional({
        uid: user.uid,
        fullName: ensuredFullName,
        displayName: user.displayName ? sanitizeText(user.displayName, 120) : undefined,
        photoURL: user.photoURL ? sanitizeText(user.photoURL, 500) : undefined,
        phone: safePhone || undefined,
        locale,
        role: 'member',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      }),
      // Always keep required `email` key (may be '' for Phone SMS OTP members)
      email: safeEmail,
    };

    await setDoc(ref, createPayload);
    const freshSnap = await withOfflineRetry(() => getDoc(ref));
    return mapUserProfile(user.uid, freshSnap.data() ?? createPayload);
  } catch (error) {
    if (isFirestoreOfflineError(error)) {
      throw new Error('FIRESTORE_OFFLINE');
    }
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function signInMemberWithGoogle(locale: Locale): Promise<{
  user: User;
  profile: UserProfile;
}> {
  googleProvider.setCustomParameters({ prompt: 'select_account' });
  const credential = await signInWithPopup(auth, googleProvider);
  const profile = await syncMemberProfileOnLogin(credential.user, locale);
  return { user: credential.user, profile };
}

export async function signUpMemberWithEmail(
  params: { fullName: string; email: string; password: string; phone?: string },
  locale: Locale
): Promise<{ user: User; profile: UserProfile }> {
  const cleanName = sanitizeText(params.fullName, 120);
  const cleanEmail = sanitizeText(params.email, 160).toLowerCase();
  const cleanPhone = params.phone ? sanitizeText(normalizeDigits(params.phone), 40) : undefined;

  const credential = await createUserWithEmailAndPassword(auth, cleanEmail, params.password);
  if (cleanName) {
    await updateProfile(credential.user, { displayName: cleanName }).catch(() => {
      // Non-blocking displayName sync
    });
  }
  // Send verification link asynchronously without blocking onboarding
  void sendEmailVerification(credential.user).catch(() => {
    // Non-blocking email verification dispatch
  });

  const profile = await syncMemberProfileOnLogin(credential.user, locale, {
    fullName: cleanName,
    phone: cleanPhone,
  });
  return { user: credential.user, profile };
}

export async function signInMemberWithEmail(
  email: string,
  password: string,
  locale: Locale
): Promise<{ user: User; profile: UserProfile }> {
  const cleanEmail = sanitizeText(email, 160).toLowerCase();
  const credential = await signInWithEmailAndPassword(auth, cleanEmail, password);
  const profile = await syncMemberProfileOnLogin(credential.user, locale);
  return { user: credential.user, profile };
}

export async function sendMemberPasswordReset(email: string): Promise<void> {
  const cleanEmail = sanitizeText(email, 160).toLowerCase();
  await sendPasswordResetEmail(auth, cleanEmail);
}

export function createPhoneRecaptcha(containerElement: HTMLElement): RecaptchaVerifier {
  return new RecaptchaVerifier(auth, containerElement, {
    size: 'invisible',
  });
}

export async function sendMemberPhoneOtp(
  phoneE164: string,
  verifier: RecaptchaVerifier
): Promise<ConfirmationResult> {
  return signInWithPhoneNumber(auth, phoneE164, verifier);
}

export async function confirmMemberPhoneOtp(
  confirmationResult: ConfirmationResult,
  code: string,
  fullName: string | undefined,
  locale: Locale
): Promise<{ user: User; profile: UserProfile }> {
  const cleanCode = normalizeDigits(code).replace(/\s+/g, '');
  const credential = await confirmationResult.confirm(cleanCode);
  const cleanName = fullName?.trim() ? sanitizeText(fullName, 120) : undefined;
  if (cleanName && !credential.user.displayName) {
    await updateProfile(credential.user, { displayName: cleanName }).catch(() => {
      // Non-blocking displayName sync
    });
  }
  const profile = await syncMemberProfileOnLogin(credential.user, locale, {
    fullName: cleanName,
    phone: credential.user.phoneNumber ?? undefined,
  });
  return { user: credential.user, profile };
}

export async function signOutMember(): Promise<void> {
  await signOut(auth);
}

export async function fetchMyProfile(uid: string): Promise<UserProfile | null> {
  if (!uid || !auth.currentUser || auth.currentUser.uid !== uid) {
    return null;
  }
  const path = `users/${uid}`;
  try {
    const snap = await withOfflineRetry(() => getDoc(doc(db, 'users', uid)));
    if (!snap.exists()) return null;
    return mapUserProfile(snap.id, snap.data());
  } catch (error) {
    if (!auth.currentUser || auth.currentUser.uid !== uid) {
      return null;
    }
    if (isFirestoreOfflineError(error)) {
      throw new Error('FIRESTORE_OFFLINE');
    }
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function updateMyProfile(
  uid: string,
  input: UserProfileFormInput,
  locale: Locale
): Promise<UserProfile> {
  const path = `users/${uid}`;
  const ref = doc(db, 'users', uid);
  const payload: Record<string, unknown> = {
    fullName: sanitizeText(input.fullName, 120),
    phone: sanitizeText(normalizeDigits(input.phone), 40),
    nationalId: sanitizeText(normalizeDigits(input.nationalId), 20),
    city: sanitizeText(input.city, 100),
    organization: sanitizeText(input.organization, 140),
    profession: sanitizeText(input.profession, 120),
    billingAddress: sanitizeText(input.billingAddress, 500),
    locale,
    updatedAt: serverTimestamp(),
  };
  if (input.email !== undefined) {
    payload.email = sanitizeText(input.email, 160);
  }

  try {
    await updateDoc(ref, payload);
    const fresh = await getDoc(ref);
    return mapUserProfile(uid, fresh.data() ?? payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function fetchMyOrders(uid: string): Promise<UserOrder[]> {
  if (!uid || !auth.currentUser || auth.currentUser.uid !== uid) return [];
  try {
    const snap = await withOfflineRetry(() =>
      getDocs(query(collection(db, 'orders'), where('userId', '==', uid)))
    );
    return snap.docs
      .map((d) => mapUserOrder(d.id, d.data()))
      .sort((a, b) => (b.createdAtIso ?? '').localeCompare(a.createdAtIso ?? ''));
  } catch (error) {
    if (!auth.currentUser || auth.currentUser.uid !== uid) return [];
    if (isFirestoreOfflineError(error)) throw new Error('FIRESTORE_OFFLINE');
    handleFirestoreError(error, OperationType.LIST, 'orders');
  }
}

export async function fetchMyInquiries(uid: string): Promise<InquiryRecord[]> {
  if (!uid || !auth.currentUser || auth.currentUser.uid !== uid) return [];
  try {
    const snap = await withOfflineRetry(() =>
      getDocs(query(collection(db, 'inquiries'), where('userId', '==', uid)))
    );
    return snap.docs
      .map((d) => {
        const data = d.data();
        return {
          id: d.id,
          userId: typeof data.userId === 'string' ? data.userId : uid,
          fullName: String(data.fullName ?? ''),
          email: String(data.email ?? ''),
          phone: data.phone ? String(data.phone) : undefined,
          organization: data.organization ? String(data.organization) : undefined,
          projectType: String(data.projectType ?? ''),
          disciplines: Array.isArray(data.disciplines) ? data.disciplines : [],
          city: data.city ? String(data.city) : undefined,
          message: String(data.message ?? ''),
          locale: data.locale === 'fa' ? 'fa' : 'en',
          internalStatus: data.internalStatus ?? 'new',
          adminReply: data.adminReply ? String(data.adminReply) : undefined,
          repliedAtIso: timestampToIso(data.repliedAt),
          createdAtIso: timestampToIso(data.createdAt),
        } as InquiryRecord;
      })
      .sort((a, b) => (b.createdAtIso ?? '').localeCompare(a.createdAtIso ?? ''));
  } catch (error) {
    if (!auth.currentUser || auth.currentUser.uid !== uid) return [];
    if (isFirestoreOfflineError(error)) throw new Error('FIRESTORE_OFFLINE');
    handleFirestoreError(error, OperationType.LIST, 'inquiries');
  }
}

export async function fetchMyAssessments(uid: string): Promise<AssessmentRecord[]> {
  if (!uid || !auth.currentUser || auth.currentUser.uid !== uid) return [];
  try {
    const snap = await withOfflineRetry(() =>
      getDocs(query(collection(db, 'assessmentRequests'), where('userId', '==', uid)))
    );
    return snap.docs
      .map((d) => {
        const data = d.data();
        return {
          id: d.id,
          userId: typeof data.userId === 'string' ? data.userId : uid,
          fullName: String(data.fullName ?? ''),
          email: String(data.email ?? ''),
          phone: data.phone ? String(data.phone) : undefined,
          organization: data.organization ? String(data.organization) : undefined,
          projectType: String(data.projectType ?? ''),
          city: String(data.city ?? ''),
          approximateFloorAreaSqm: Number(data.approximateFloorAreaSqm ?? 0),
          projectStage: data.projectStage ?? 'concept',
          assessmentGoals: Array.isArray(data.assessmentGoals) ? data.assessmentGoals : [],
          notes: data.notes ? String(data.notes) : undefined,
          locale: data.locale === 'fa' ? 'fa' : 'en',
          internalStatus: data.internalStatus ?? 'new',
          adminReply: data.adminReply ? String(data.adminReply) : undefined,
          repliedAtIso: timestampToIso(data.repliedAt),
          createdAtIso: timestampToIso(data.createdAt),
        } as AssessmentRecord;
      })
      .sort((a, b) => (b.createdAtIso ?? '').localeCompare(a.createdAtIso ?? ''));
  } catch (error) {
    if (!auth.currentUser || auth.currentUser.uid !== uid) return [];
    if (isFirestoreOfflineError(error)) throw new Error('FIRESTORE_OFFLINE');
    handleFirestoreError(error, OperationType.LIST, 'assessmentRequests');
  }
}

export async function createMemberCourseOrder(
  profile: UserProfile,
  course: Course,
  checkout: MemberCheckoutInput
): Promise<UserOrder> {
  // First keep member's profile up-to-date so Studio Admin sees complete contact/billing details
  const cleanFullName = sanitizeText(checkout.fullName || profile.fullName, 120);
  const cleanPhone = sanitizeText(normalizeDigits(checkout.phone), 40);
  const cleanCity = sanitizeText(checkout.city, 100);
  const cleanNationalId = sanitizeText(normalizeDigits(checkout.nationalId), 20);
  const cleanOrg = sanitizeText(checkout.organization, 140);

  await updateMyProfile(
    profile.uid,
    {
      fullName: cleanFullName,
      phone: cleanPhone,
      nationalId: cleanNationalId || profile.nationalId || '',
      city: cleanCity,
      organization: cleanOrg || profile.organization || '',
      profession: profile.profession || '',
      billingAddress: profile.billingAddress || '',
    },
    profile.locale ?? 'fa'
  );

  const id = `ord_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const path = `orders/${id}`;
  const orderNumber = generateTrackingCode('ISB-OR');

  // Instant 'paid' status is strictly permitted by Firestore rules only for verified free Firestore courses
  const isInstantFreeFirestoreCourse = !course.isSeedDefault && course.priceToman === 0;
  const gatewayLabel = isInstantFreeFirestoreCourse
    ? 'free-enrollment'
    : course.paymentUrl
      ? 'online-gateway'
      : 'bank-transfer';

  const cleanCourseAccessUrl =
    isInstantFreeFirestoreCourse && course.accessUrl && /^https?:\/\//i.test(course.accessUrl.trim())
      ? sanitizeText(course.accessUrl.trim(), 500)
      : undefined;

  const validCourseId = /^[a-zA-Z0-9_-]{1,128}$/.test(course.id) ? course.id : undefined;

  const payload: Record<string, unknown> = {
    ...stripEmptyOptional({
      orderNumber,
      userId: profile.uid,
      userFullName: cleanFullName.length >= 2 ? cleanFullName : 'ISB Member',
      userPhone: cleanPhone || undefined,
      courseId: isInstantFreeFirestoreCourse
        ? validCourseId
        : validCourseId,
      itemType: 'course',
      titleFa: sanitizeText(course.titleFa, 180),
      titleEn: sanitizeText(course.titleEn, 180),
      amountToman: Math.max(0, Math.round(course.priceToman)),
      paymentStatus: isInstantFreeFirestoreCourse ? 'paid' : 'pending',
      paymentGateway: gatewayLabel,
      accessUrl: cleanCourseAccessUrl,
      notes: checkout.notes.trim() ? sanitizeText(checkout.notes, 1500) : undefined,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      paidAt: isInstantFreeFirestoreCourse ? serverTimestamp() : undefined,
    }),
    userEmail: sanitizeText(profile.email ?? '', 160),
  };

  try {
    await setDoc(doc(db, 'orders', id), payload);
    const snap = await getDoc(doc(db, 'orders', id));
    return mapUserOrder(id, snap.data() ?? payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function submitMemberOrderPaymentRef(
  orderId: string,
  paymentRef: string,
  paymentGateway = 'bank-transfer',
  notes?: string
): Promise<void> {
  const path = `orders/${orderId}`;
  const payload: Record<string, unknown> = {
    paymentRef: sanitizeText(normalizeDigits(paymentRef), 120),
    paymentGateway: sanitizeText(paymentGateway, 60),
    updatedAt: serverTimestamp(),
  };
  if (notes && notes.trim()) {
    payload.notes = sanitizeText(notes, 1500);
  }
  try {
    await updateDoc(doc(db, 'orders', orderId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function fetchMyTickets(uid: string): Promise<SupportTicket[]> {
  if (!uid || !auth.currentUser || auth.currentUser.uid !== uid) return [];
  try {
    const snap = await withOfflineRetry(() =>
      getDocs(query(collection(db, 'tickets'), where('userId', '==', uid)))
    );
    return snap.docs
      .map((d) => mapSupportTicket(d.id, d.data()))
      .sort((a, b) => (b.updatedAtIso ?? '').localeCompare(a.updatedAtIso ?? ''));
  } catch (error) {
    if (!auth.currentUser || auth.currentUser.uid !== uid) return [];
    if (isFirestoreOfflineError(error)) throw new Error('FIRESTORE_OFFLINE');
    handleFirestoreError(error, OperationType.LIST, 'tickets');
  }
}

export async function fetchTicketMessages(
  ticketId: string,
  ticketOwnerId: string
): Promise<TicketMessage[]> {
  if (!ticketId || !ticketOwnerId || !auth.currentUser || auth.currentUser.uid !== ticketOwnerId) {
    return [];
  }
  const path = `tickets/${ticketId}/messages`;
  try {
    const snap = await withOfflineRetry(() =>
      getDocs(
        query(
          collection(db, 'tickets', ticketId, 'messages'),
          where('ticketOwnerId', '==', ticketOwnerId)
        )
      )
    );
    return snap.docs
      .map((d) => mapTicketMessage(d.id, d.data()))
      .sort((a, b) => (a.createdAtIso ?? '').localeCompare(b.createdAtIso ?? ''));
  } catch (error) {
    if (!auth.currentUser || auth.currentUser.uid !== ticketOwnerId) {
      return [];
    }
    if (isFirestoreOfflineError(error)) {
      throw new Error('FIRESTORE_OFFLINE');
    }
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function createMemberTicket(
  profile: UserProfile,
  input: TicketFormInput,
  locale: Locale
): Promise<SupportTicket> {
  const id = `tk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const path = `tickets/${id}`;
  const ticketNumber = generateTrackingCode('ISB-TK');

  const payload: Record<string, unknown> = {
    ...stripEmptyOptional({
      ticketNumber,
      userId: profile.uid,
      userFullName: sanitizeText(profile.fullName || profile.displayName || 'ISB Member', 120),
      subject: sanitizeText(input.subject, 160),
      category: input.category,
      priority: input.priority,
      status: 'open',
      initialMessage: sanitizeText(input.message, 3000),
      orderNumber: input.orderNumber.trim() ? sanitizeText(input.orderNumber, 40) : undefined,
      lastReplyBy: 'user',
      replyCount: 0,
      locale,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
    userEmail: sanitizeText(profile.email ?? '', 160),
  };

  try {
    await setDoc(doc(db, 'tickets', id), payload);
    const snap = await getDoc(doc(db, 'tickets', id));
    return mapSupportTicket(id, snap.data() ?? payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function postTicketReply(params: {
  ticket: SupportTicket;
  senderUid: string;
  senderName: string;
  senderRole: 'user' | 'admin';
  body: string;
  nextStatus?: TicketStatus;
  adminNotes?: string;
}): Promise<TicketMessage> {
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const msgPath = `tickets/${params.ticket.id}/messages/${messageId}`;
  const cleanBody = sanitizeText(params.body, 3000);
  const cleanName = sanitizeText(params.senderName, 120) || 'ISB User';

  const msgPayload = {
    ticketId: params.ticket.id,
    ticketOwnerId: params.ticket.userId,
    senderUid: params.senderUid,
    senderName: cleanName.length >= 2 ? cleanName : 'ISB User',
    senderRole: params.senderRole,
    body: cleanBody,
    createdAt: serverTimestamp(),
  };

  const resolvedStatus: TicketStatus =
    params.nextStatus ?? (params.senderRole === 'admin' ? 'answered' : 'open');

  const ticketUpdate: Record<string, unknown> = {
    status: resolvedStatus,
    lastReplyBy: params.senderRole,
    replyCount: params.ticket.replyCount + 1,
    lastReplyAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (params.senderRole === 'admin' && params.adminNotes !== undefined) {
    ticketUpdate.adminNotes = sanitizeText(params.adminNotes, 2000);
  }

  try {
    const batch = writeBatch(db);
    batch.set(doc(db, 'tickets', params.ticket.id, 'messages', messageId), msgPayload);
    batch.update(doc(db, 'tickets', params.ticket.id), ticketUpdate);
    await batch.commit();
    return {
      id: messageId,
      ticketId: params.ticket.id,
      ticketOwnerId: params.ticket.userId,
      senderUid: params.senderUid,
      senderName: msgPayload.senderName,
      senderRole: params.senderRole,
      body: cleanBody,
      createdAtIso: new Date().toISOString(),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, msgPath);
  }
}

export async function closeMemberTicket(ticket: SupportTicket): Promise<void> {
  const path = `tickets/${ticket.id}`;
  try {
    await updateDoc(doc(db, 'tickets', ticket.id), {
      status: 'closed',
      lastReplyBy: 'user',
      replyCount: ticket.replyCount,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/* ============================================================================
 * ADMIN PORTAL MANAGEMENT (Registered Users, Orders/Courses & Support Tickets)
 * ========================================================================== */

export async function fetchAdminPortalCollections(): Promise<{
  users: UserProfile[];
  orders: UserOrder[];
  tickets: SupportTicket[];
}> {
  if (!auth.currentUser) {
    return { users: [], orders: [], tickets: [] };
  }
  try {
    const [usersSnap, ordersSnap, ticketsSnap] = await withOfflineRetry(() =>
      Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'orders')),
        getDocs(collection(db, 'tickets')),
      ])
    );

    const users = usersSnap.docs
      .map((d) => mapUserProfile(d.id, d.data()))
      .sort((a, b) => (b.lastLoginAtIso ?? '').localeCompare(a.lastLoginAtIso ?? ''));

    const orders = ordersSnap.docs
      .map((d) => mapUserOrder(d.id, d.data()))
      .sort((a, b) => (b.createdAtIso ?? '').localeCompare(a.createdAtIso ?? ''));

    const tickets = ticketsSnap.docs
      .map((d) => mapSupportTicket(d.id, d.data()))
      .sort((a, b) => (b.updatedAtIso ?? '').localeCompare(a.updatedAtIso ?? ''));

    return { users, orders, tickets };
  } catch (error) {
    if (!auth.currentUser) {
      return { users: [], orders: [], tickets: [] };
    }
    if (isFirestoreOfflineError(error)) {
      throw new Error('FIRESTORE_OFFLINE');
    }
    handleFirestoreError(error, OperationType.LIST, 'users|orders|tickets');
  }
}

export async function fetchAdminTicketMessages(ticketId: string): Promise<TicketMessage[]> {
  if (!ticketId || !auth.currentUser) {
    return [];
  }
  const path = `tickets/${ticketId}/messages`;
  try {
    const snap = await withOfflineRetry(() =>
      getDocs(query(collection(db, 'tickets', ticketId, 'messages'), orderBy('createdAt', 'asc')))
    );
    return snap.docs.map((d) => mapTicketMessage(d.id, d.data()));
  } catch (error) {
    if (!auth.currentUser) {
      return [];
    }
    if (isFirestoreOfflineError(error)) {
      throw new Error('FIRESTORE_OFFLINE');
    }
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function updateAdminTicketMeta(
  ticketId: string,
  updates: { status: TicketStatus; adminNotes?: string }
): Promise<void> {
  const path = `tickets/${ticketId}`;
  const payload: Record<string, unknown> = {
    status: updates.status,
    updatedAt: serverTimestamp(),
  };
  if (updates.adminNotes !== undefined) {
    payload.adminNotes = sanitizeText(updates.adminNotes, 2000);
  }
  try {
    await updateDoc(doc(db, 'tickets', ticketId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteAdminTicket(ticketId: string): Promise<void> {
  const path = `tickets/${ticketId}`;
  try {
    await deleteDoc(doc(db, 'tickets', ticketId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function createAdminOrder(
  targetUser: UserProfile,
  input: AdminOrderFormInput
): Promise<UserOrder> {
  const id = `ord_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const path = `orders/${id}`;
  const orderNumber = generateTrackingCode('ISB-OR');
  const amountNum = Number(normalizeDigits(input.amountToman.replace(/[,\s٬]/g, ''))) || 0;

  const validAdminCourseId =
    input.courseId && /^[a-zA-Z0-9_-]{1,128}$/.test(input.courseId) ? input.courseId : undefined;

  const payload: Record<string, unknown> = {
    ...stripEmptyOptional({
      orderNumber,
      userId: targetUser.uid,
      userFullName: sanitizeText(targetUser.fullName || targetUser.displayName || 'ISB Member', 120),
      userPhone: targetUser.phone ? sanitizeText(targetUser.phone, 40) : undefined,
      courseId: validAdminCourseId,
      itemType: input.itemType,
      titleFa: sanitizeText(input.titleFa, 180),
      titleEn: sanitizeText(input.titleEn, 180),
      amountToman: Math.max(0, Math.round(amountNum)),
      paymentStatus: input.paymentStatus,
      paymentGateway: sanitizeText(input.paymentGateway || 'manual', 60),
      paymentRef: input.paymentRef.trim() ? sanitizeText(input.paymentRef, 120) : undefined,
      accessUrl: input.accessUrl.trim() ? sanitizeText(input.accessUrl, 500) : undefined,
      notes: input.notes.trim() ? sanitizeText(input.notes, 1500) : undefined,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      paidAt: input.paymentStatus === 'paid' ? serverTimestamp() : undefined,
    }),
    userEmail: sanitizeText(targetUser.email ?? '', 160),
  };

  try {
    await setDoc(doc(db, 'orders', id), payload);
    const snap = await getDoc(doc(db, 'orders', id));
    return mapUserOrder(id, snap.data() ?? payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateAdminOrderStatus(
  orderId: string,
  paymentStatus: OrderPaymentStatus,
  paymentRef?: string,
  accessUrl?: string
): Promise<void> {
  const path = `orders/${orderId}`;
  const payload: Record<string, unknown> = {
    paymentStatus,
    updatedAt: serverTimestamp(),
  };
  if (paymentStatus === 'paid') {
    payload.paidAt = serverTimestamp();
  }
  if (paymentRef !== undefined) {
    payload.paymentRef = sanitizeText(paymentRef, 120);
  }
  if (accessUrl !== undefined && accessUrl.trim()) {
    payload.accessUrl = sanitizeText(accessUrl, 500);
  }
  try {
    await updateDoc(doc(db, 'orders', orderId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteAdminOrder(orderId: string): Promise<void> {
  const path = `orders/${orderId}`;
  try {
    await deleteDoc(doc(db, 'orders', orderId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
