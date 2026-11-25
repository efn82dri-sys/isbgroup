import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Building2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  Layers,
  Leaf,
  ShieldCheck,
  UserCheck,
  Users,
  X,
} from './icons/IsbIcons';
import { DISCIPLINES, SEED_PARTNER_LOGOS } from '../data/seedContent';
import type {
  DisciplineSlug,
  Locale,
  PartnerLogo,
  SiteSettings,
  TeamMember,
} from '../types/content';
import { ARCHITECTURAL_EASE } from '../utils/motionMath';
import {
  buildTeamHierarchy,
  computePartnerSliderWindow,
  getMemberMonogram,
  hasPublicResume,
  resolveMemberTier,
  resolvePartnerCardsPerView,
  type DepartmentBranchSpec,
} from '../utils/teamTree';
import { isSafeExternalUrl, parseSpecialtiesList } from '../utils/validation';
import { SafeImage } from './BrandMark';
import { ArchitecturalTiltCard, type TiltTheme } from './MotionPrimitives';
import { renderPartnerPresetMark } from './PartnerLogos';

interface TeamOrgTreeProps {
  locale: Locale;
  settings: SiteSettings;
  teamMembers: TeamMember[];
  partnerLogos?: PartnerLogo[];
}

function DepartmentIcon({ slug, className }: { slug: DisciplineSlug; className?: string }) {
  if (slug === 'energy-mep') return <Leaf className={className} strokeWidth={1.65} />;
  if (slug === 'structure-seismic') return <Layers className={className} strokeWidth={1.65} />;
  return <Building2 className={className} strokeWidth={1.65} />;
}

/**
 * Subtle architectural drafting corner crosshairs for compact governance square monoliths.
 */
function DraftingCorners({ color }: { color: string }) {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 w-full h-full opacity-40 group-hover:opacity-80 transition-opacity duration-500"
      viewBox="0 0 220 220"
      fill="none"
      preserveAspectRatio="none"
    >
      <path d="M 12 22 L 12 12 L 22 12" stroke={color} strokeWidth="1.15" />
      <path d="M 198 12 L 208 12 L 208 22" stroke={color} strokeWidth="1.15" />
      <path d="M 12 198 L 12 208 L 22 208" stroke={color} strokeWidth="1.15" />
      <path d="M 198 208 L 208 208 L 208 198" stroke={color} strokeWidth="1.15" />
    </svg>
  );
}

/**
 * Architectural Resume & Biography Modal for Board of Directors, Inspectors, Senior Leads, and Advisors.
 */
function MemberResumeModal({
  member,
  locale,
  onClose,
}: {
  member: TeamMember;
  locale: Locale;
  onClose: () => void;
}) {
  const isRtl = locale === 'fa';
  const name = isRtl ? member.nameFa : member.nameEn;
  const bio = (isRtl ? member.bioFa : member.bioEn)?.trim() ?? '';
  const resume = (isRtl ? member.resumeFa : member.resumeEn)?.trim() ?? '';
  const specialties = parseSpecialtiesList(isRtl ? member.specialtiesFa : member.specialtiesEn);
  const monogram = getMemberMonogram(name);
  const hasPhoto = Boolean(member.portraitUrl?.trim());
  const tier = resolveMemberTier(member);

  const disciplineObj = DISCIPLINES.find((d) => d.slug === member.discipline);
  const accentHex =
    tier === 'ceo'
      ? '#28CF77'
      : tier === 'inspector'
        ? '#93BCFF'
        : member.discipline === 'energy-mep'
          ? '#28CF77'
          : member.discipline === 'structure-seismic'
            ? '#93BCFF'
            : '#6F9BFF';

  const tierTitle =
    tier === 'ceo'
      ? isRtl
        ? 'هیئت مدیره'
        : 'Board of Directors'
      : tier === 'inspector'
        ? isRtl
          ? 'بازرس'
          : 'Inspector'
        : tier === 'advisor'
          ? isRtl
            ? 'مشاور تخصصی'
            : 'Advisor'
          : isRtl
            ? 'راهبر ارشد دپارتمان'
            : 'Senior Department Lead';

  const displayRole =
    tier === 'ceo'
      ? isRtl
        ? 'عضو هیئت مدیره'
        : 'Board Member'
      : tier === 'inspector'
        ? isRtl
          ? 'بازرس'
          : 'Inspector'
        : isRtl
          ? member.roleFa
          : member.roleEn;

  const departmentLabel =
    tier === 'ceo' || tier === 'inspector' || member.discipline === 'leadership'
      ? ''
      : disciplineObj
        ? disciplineObj.title[locale]
        : '';

  const resumeLines = resume
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  const modalNode = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="member-resume-title"
      data-testid="member-resume-modal"
      dir={isRtl ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-[#030711]/84 backdrop-blur-lg"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: ARCHITECTURAL_EASE }}
        className="relative w-full max-w-2xl max-h-[86svh] sm:max-h-[88vh] overflow-y-auto rounded-t-[22px] sm:rounded-[28px] border border-[#93BCFF]/25 bg-gradient-to-b from-[#0E1930]/96 via-[#0A1324]/98 to-[#070D19] shadow-[0_34px_96px_-22px_rgba(0,0,0,0.95)]"
      >
        <div
          aria-hidden="true"
          className="h-[2px] w-full"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${accentHex} 50%, transparent 100%)`,
          }}
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 inset-x-0 h-44 opacity-40"
          style={{
            background: `radial-gradient(ellipse 68% 95% at 50% 0%, ${accentHex}38 0%, transparent 72%)`,
          }}
        />

        <div className="sticky top-0 z-20 flex items-center justify-between gap-3 sm:gap-4 px-4 py-3 sm:px-6 sm:py-4 border-b border-white/10 bg-[#0B1426]/92 backdrop-blur-xl">
          <div className="flex items-center gap-2 sm:gap-2.5 text-[11.5px] sm:text-xs text-[#C6D2E3] min-w-0">
            <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" style={{ color: accentHex }} />
            <span className="font-semibold text-[#F5F8FC] truncate">{tierTitle}</span>
            {departmentLabel && (
              <>
                <span className="text-white/25" aria-hidden="true">
                  ·
                </span>
                <span className="text-[#9AB1D0] truncate">{departmentLabel}</span>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={isRtl ? 'بستن پنجره رزومه' : 'Close resume modal'}
            className="w-10 h-10 sm:w-9 sm:h-9 rounded-full border border-white/14 bg-white/[0.05] text-[#C6D2E3] hover:text-white hover:border-[#6F9BFF]/60 hover:bg-white/[0.1] active:scale-[0.95] flex items-center justify-center transition-all shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="relative z-10 p-4 pb-6 sm:p-8 space-y-4 sm:space-y-6">
          <div className="flex items-center gap-3.5 sm:gap-5">
            <div className="relative shrink-0">
              <div
                aria-hidden="true"
                className="absolute -inset-2 rounded-[26px] blur-md opacity-40"
                style={{
                  background: `radial-gradient(circle, ${accentHex}66 0%, transparent 72%)`,
                }}
              />
              <div
                className="relative w-16 h-16 sm:w-28 sm:h-28 rounded-[16px] sm:rounded-[22px] overflow-hidden border bg-[#0E182B] flex items-center justify-center shadow-2xl"
                style={{ borderColor: `${accentHex}66` }}
              >
                {hasPhoto ? (
                  <SafeImage
                    src={member.portraitUrl!}
                    alt={name}
                    className="w-full h-full object-cover object-top"
                  />
                ) : (
                  <span
                    className="text-lg sm:text-2xl font-bold tracking-wider"
                    style={{ color: accentHex }}
                  >
                    {monogram}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-1 sm:space-y-2 min-w-0">
              <h2
                id="member-resume-title"
                className="text-[17px] sm:text-2xl font-bold text-[#F5F8FC] leading-snug"
              >
                {name}
              </h2>
              <p className="text-[12.5px] sm:text-sm font-medium leading-relaxed" style={{ color: accentHex }}>
                {displayRole}
              </p>
              {specialties.length > 0 && (
                <p className="text-[11px] sm:text-xs text-[#A8BAD4] leading-relaxed pt-0.5 sm:pt-1">
                  {specialties.join(' · ')}
                </p>
              )}
            </div>
          </div>

          {bio && (
            <div className="rounded-xl sm:rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 sm:p-5 space-y-1.5 sm:space-y-2">
              <p className="text-[10.5px] sm:text-[11px] font-semibold uppercase text-[#8B9DB7]">
                {isRtl ? 'معرفی حرفه‌ای' : 'Executive Summary'}
              </p>
              <p className="text-[12.5px] sm:text-sm text-[#D6E1F0] leading-relaxed rtl:leading-[1.85] sm:rtl:leading-[1.95] whitespace-pre-line">
                {bio}
              </p>
            </div>
          )}

          {resumeLines.length > 0 && (
            <div className="space-y-2.5 sm:space-y-3">
              <p className="text-[10.5px] sm:text-[11px] font-semibold uppercase text-[#8B9DB7] flex items-center gap-2">
                <FileText className="w-3.5 h-3.5" style={{ color: accentHex }} />
                <span>
                  {isRtl ? 'سوابق علمی، اجرایی و حرفه‌ای' : 'Academic & Professional Credentials'}
                </span>
              </p>
              <ul className="space-y-2 sm:space-y-2.5">
                {resumeLines.map((line, idx) => {
                  const cleaned = line.replace(/^[•\-–—*]\s*/, '');
                  return (
                    <li
                      key={idx}
                      className="flex items-start gap-2.5 sm:gap-3 text-[12.5px] sm:text-sm text-[#DCE5F2] leading-relaxed rtl:leading-[1.8] sm:rtl:leading-[1.85]"
                    >
                      <span
                        className="mt-2.5 w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: accentHex }}
                      />
                      <span>{cleaned}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {isSafeExternalUrl(member.linkedinUrl) && (
            <div className="pt-3 border-t border-white/10 flex justify-end">
              <a
                href={member.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-[#6F9BFF]/45 bg-[#223A87]/35 px-4 py-2 text-xs font-medium text-[#F5F8FC] hover:border-[#6F9BFF] hover:bg-[#223A87]/55 transition-colors"
              >
                <span>{isRtl ? 'مشاهده پروفایل لینکدین' : 'View LinkedIn Profile'}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalNode, document.body) : modalNode;
}

/**
 * Compact Equal Square Monolith for Board of Directors (3 squares) and Inspectors (2 squares).
 * ~Half the prior footprint, zero numbering, zero department favoritism.
 */
function GovernanceSquareMonolith({
  variant,
  member,
  slotIndex,
  locale,
  onSelectResume,
}: {
  variant: 'ceo' | 'inspector';
  member?: TeamMember;
  slotIndex: number;
  locale: Locale;
  onSelectResume: (member: TeamMember) => void;
}) {
  const isRtl = locale === 'fa';
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;
  const isBoard = variant === 'ceo';
  const accentHex = isBoard ? '#28CF77' : '#93BCFF';
  const accentSoftHex = isBoard ? '#00A651' : '#3B68D6';
  const tiltTheme: TiltTheme = isBoard ? 'energy' : 'structure';

  const uniformTitle = isBoard
    ? isRtl
      ? 'عضو هیئت مدیره'
      : 'Board Member'
    : isRtl
      ? 'بازرس'
      : 'Inspector';

  if (!member) {
    return (
      <div
        data-testid={`team-${variant}-slot-${slotIndex}`}
        className={`group relative overflow-hidden border border-dashed bg-gradient-to-b from-[#0C172B]/72 via-[#091223]/84 to-[#060C18]/92 flex transition-colors duration-300 ${
          isBoard
            ? 'flex-row items-center gap-3 p-3 rounded-[16px] text-start sm:aspect-[4/3] sm:flex-col sm:justify-center sm:text-center sm:rounded-[22px] sm:p-6 sm:gap-4'
            : 'aspect-square flex-col items-center justify-center text-center rounded-[16px] sm:rounded-[20px] p-3 sm:p-4 gap-2 sm:gap-3'
        }`}
        style={{ borderColor: `${accentHex}30` }}
      >
        <DraftingCorners color={accentHex} />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 inset-x-7 h-px opacity-55"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${accentHex} 50%, transparent 100%)`,
          }}
        />

        <div
          className={`relative z-10 border flex items-center justify-center bg-[#0B1528]/80 shrink-0 ${
            isBoard
              ? 'w-12 h-12 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-[12px] sm:rounded-[22px]'
              : 'w-11 h-11 sm:w-16 sm:h-16 rounded-[12px] sm:rounded-[16px]'
          }`}
          style={{ borderColor: `${accentHex}36` }}
        >
          <svg
            viewBox="0 0 80 80"
            fill="none"
            aria-hidden="true"
            className={isBoard ? 'w-7 h-7 sm:w-14 sm:h-14 opacity-65' : 'w-7 h-7 sm:w-10 sm:h-10 opacity-65'}
          >
            <circle
              cx="40"
              cy="31"
              r="9.5"
              stroke={accentHex}
              strokeOpacity="0.82"
              strokeWidth="1.4"
            />
            <path
              d="M 22 61 C 25 50 32 45 40 45 C 48 45 55 50 58 61"
              stroke={accentHex}
              strokeOpacity="0.82"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <div className="relative z-10 space-y-0.5 sm:space-y-1">
          <h3 className={isBoard ? 'text-[13px] sm:text-base font-bold text-[#E6EFFA]' : 'text-[12px] sm:text-sm font-bold text-[#E6EFFA]'}>
            {uniformTitle}
          </h3>
          <p className={isBoard ? 'text-[10.5px] sm:text-xs text-[#889EBC]' : 'text-[10px] sm:text-[11px] text-[#889EBC]'}>
            {isRtl ? 'قابل تکمیل از پنل مدیریت' : 'Editable in Studio Admin'}
          </p>
        </div>
      </div>
    );
  }

  const name = isRtl ? member.nameFa : member.nameEn;
  const monogram = getMemberMonogram(name);
  const hasPhoto = Boolean(member.portraitUrl?.trim());
  const canOpenResume = hasPublicResume(member);

  return (
    <ArchitecturalTiltCard
      theme={tiltTheme}
      maxTilt={3.2}
      className={isBoard ? 'rounded-[18px] sm:rounded-[22px] h-full' : 'rounded-[16px] sm:rounded-[20px] h-full'}
    >
      <article
        data-testid={`team-${variant}-card`}
        className={`group relative overflow-hidden border bg-gradient-to-b from-[#101F3B]/92 via-[#0A1427]/96 to-[#060D1A]/98 shadow-[0_20px_52px_-24px_rgba(0,0,0,0.92)] transition-all duration-300 ${
          isBoard
            ? 'flex flex-row items-center justify-between text-start gap-3 p-3 rounded-[18px] sm:aspect-[4/3] sm:flex-col sm:justify-center sm:text-center sm:rounded-[22px] sm:p-6 sm:gap-3.5'
            : 'aspect-square flex flex-col items-center justify-center text-center rounded-[16px] sm:rounded-[20px] p-2.5 sm:p-4 gap-2 sm:gap-2.5'
        }`}
        style={{ borderColor: `${accentHex}3A` }}
      >
        <DraftingCorners color={accentHex} />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 inset-x-6 h-[1.5px] opacity-85"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${accentHex} 50%, transparent 100%)`,
          }}
        />

        <div
          aria-hidden="true"
          className={`pointer-events-none absolute top-5 left-1/2 -translate-x-1/2 rounded-full opacity-25 group-hover:opacity-50 blur-xl transition-opacity duration-500 ${
            isBoard ? 'w-32 h-32 sm:w-40 sm:h-40' : 'w-20 h-20 sm:w-28 sm:h-28'
          }`}
          style={{
            background: `radial-gradient(circle, ${accentHex}66 0%, transparent 72%)`,
          }}
        />

        {/* Portrait + Name Wrapper (Horizontal pair on mobile Board, stacked centered on desktop) */}
        <div
          className={
            isBoard
              ? 'relative z-10 flex flex-row sm:flex-col items-center gap-3 sm:gap-3.5 min-w-0 flex-1 sm:flex-initial sm:w-full'
              : 'relative z-10 flex flex-col items-center gap-2 sm:gap-2.5 min-w-0 w-full'
          }
        >
          {/* Portrait Plinth (Compact horizontal on mobile Board, Executive large on desktop Board, compact square for Inspectors) */}
          <div
            className={`p-[1.5px] shadow-[0_14px_30px_-12px_rgba(0,0,0,0.9)] shrink-0 ${
              isBoard
                ? 'w-14 h-14 sm:w-[116px] sm:h-[116px] lg:w-[132px] lg:h-[132px] rounded-[14px] sm:rounded-[22px]'
                : 'w-12 h-12 sm:w-[82px] sm:h-[82px] rounded-[12px] sm:rounded-[16px]'
            }`}
            style={{
              background: `linear-gradient(145deg, ${accentHex}CC, ${accentSoftHex}55 55%, rgba(255,255,255,0.14))`,
            }}
          >
            <div
              className={`w-full h-full overflow-hidden bg-[#0A1326] flex items-center justify-center ${
                isBoard ? 'rounded-[12.5px] sm:rounded-[20.5px]' : 'rounded-[10.5px] sm:rounded-[14.5px]'
              }`}
            >
              {hasPhoto ? (
                <SafeImage
                  src={member.portraitUrl!}
                  alt={name}
                  className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.04]"
                />
              ) : (
                <span
                  className={
                    isBoard
                      ? 'text-base sm:text-2xl lg:text-3xl font-extrabold tracking-wider'
                      : 'text-sm sm:text-xl font-extrabold tracking-wider'
                  }
                  style={{ color: accentHex }}
                >
                  {monogram}
                </span>
              )}
            </div>
          </div>

          {/* Name & Uniform Governance Role */}
          <div className={isBoard ? 'space-y-0.5 sm:space-y-1 min-w-0 sm:max-w-[94%]' : 'space-y-0.5 sm:space-y-1 max-w-[96%]'}>
            <h3
              className={`font-extrabold text-[#F5F8FC] leading-snug line-clamp-1 ${
                isBoard ? 'text-[13.5px] sm:text-base lg:text-[17px]' : 'text-[12px] sm:text-[15px]'
              }`}
            >
              {name}
            </h3>
            <p
              className={isBoard ? 'text-[11px] sm:text-xs font-semibold' : 'text-[10px] sm:text-[11px] font-semibold'}
              style={{ color: accentHex }}
            >
              {uniformTitle}
            </p>
          </div>
        </div>

        {/* Resume Link (Tactile >=38px touch button on mobile) */}
        {canOpenResume && (
          <button
            type="button"
            onClick={() => onSelectResume(member)}
            className={`relative z-10 inline-flex items-center justify-center gap-1 sm:gap-1.5 font-medium text-[#C9D8EE] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6F9BFF] rounded-full border border-white/12 bg-white/[0.04] hover:border-white/25 active:scale-[0.96] transition-all cursor-pointer shrink-0 ${
              isBoard
                ? 'min-h-[38px] sm:min-h-0 text-[11px] sm:text-xs px-3 py-1.5 sm:px-3.5 sm:py-1'
                : 'min-h-[32px] sm:min-h-0 text-[10px] sm:text-[11px] px-2.5 py-1 sm:py-0.5'
            }`}
          >
            <span>{isRtl ? 'رزومه' : 'Resume'}</span>
            <ArrowIcon className="w-3 h-3" />
          </button>
        )}
      </article>
    </ArchitecturalTiltCard>
  );
}

/**
 * Bespoke Architectural Blueprint Load-Transfer Truss:
 * 45°-chamfered dual-rail structural joinery with gusset brackets, anchor baseplates,
 * and a centered architectural keystone linking 3 Board monoliths to 2 Inspector monoliths.
 */
function GovernanceToInspectorConduit() {
  return (
    <div
      aria-hidden="true"
      data-testid="governance-structural-conduit"
      className="hidden sm:block relative w-full mx-auto h-16 select-none"
    >
      <svg
        viewBox="0 0 1200 64"
        fill="none"
        className="w-full h-full overflow-visible"
      >
        {/* Subtle Secondary Parallel Datum Trace (architectural twin-rail feel) */}
        <path
          d="M 197 4 V 17 L 207 26 H 993 L 1003 17 V 4"
          stroke="#93BCFF"
          strokeOpacity="0.16"
          strokeWidth="1"
          strokeDasharray="2.5 3.5"
        />

        {/* Primary 45°-Chamfered Structural Transfer Beam (Full-width Board centers: 192, 600, 1008) */}
        <path
          d="M 192 2 V 18 L 204 30 H 996 L 1008 18 V 2"
          stroke="#8CA7CE"
          strokeOpacity="0.58"
          strokeWidth="1.25"
        />
        {/* Center Board vertical load axis into keystone */}
        <line
          x1="600"
          y1="2"
          x2="600"
          y2="22"
          stroke="#8CA7CE"
          strokeOpacity="0.62"
          strokeWidth="1.25"
        />

        {/* Structural Drop Columns to 2 Compact Inspector centers (492, 708) with 45° gusset brackets */}
        <line
          x1="492"
          y1="30"
          x2="492"
          y2="60"
          stroke="#8CA7CE"
          strokeOpacity="0.58"
          strokeWidth="1.25"
        />
        <path
          d="M 484 30 L 492 38 L 500 30"
          stroke="#93BCFF"
          strokeOpacity="0.48"
          strokeWidth="1.05"
        />

        <line
          x1="708"
          y1="30"
          x2="708"
          y2="60"
          stroke="#8CA7CE"
          strokeOpacity="0.58"
          strokeWidth="1.25"
        />
        <path
          d="M 700 30 L 708 38 L 716 30"
          stroke="#93BCFF"
          strokeOpacity="0.48"
          strokeWidth="1.05"
        />

        {/* Subtle Calibrated Datum Ticks along Transfer Beam */}
        {[288, 390, 810, 912].map((tx) => (
          <line
            key={tx}
            x1={tx}
            y1="27"
            x2={tx}
            y2="33"
            stroke="#8CA7CE"
            strokeOpacity="0.34"
            strokeWidth="1"
          />
        ))}

        {/* Upper Board Anchor Baseplates (192, 600, 1008) */}
        {[192, 600, 1008].map((ax) => (
          <g key={`top-anchor-${ax}`}>
            <line
              x1={ax - 9}
              y1="2"
              x2={ax + 9}
              y2="2"
              stroke="#8CA7CE"
              strokeOpacity="0.55"
              strokeWidth="1.2"
            />
            <circle cx={ax} cy="2" r="2.6" fill="#070E1C" stroke="#28CF77" strokeWidth="1.2" />
          </g>
        ))}

        {/* Lower Inspector Anchor Baseplates (492, 708) */}
        {[492, 708].map((bx) => (
          <g key={`bot-anchor-${bx}`}>
            <line
              x1={bx - 8}
              y1="60"
              x2={bx + 8}
              y2="60"
              stroke="#8CA7CE"
              strokeOpacity="0.55"
              strokeWidth="1.2"
            />
            <circle cx={bx} cy="60" r="2.5" fill="#070E1C" stroke="#93BCFF" strokeWidth="1.2" />
          </g>
        ))}

        {/* Precision Junction Collars above Inspectors */}
        {[492, 708].map((jx) => (
          <rect
            key={`junc-${jx}`}
            x={jx - 3}
            y={27}
            width="6"
            height="6"
            fill="#070E1C"
            stroke="#93BCFF"
            strokeWidth="1.15"
          />
        ))}

        {/* Central Sculptural Architectural Keystone (600, 30) */}
        <g>
          <path
            d="M 600 21 L 609 30 L 600 39 L 591 30 Z"
            fill="#070E1C"
            stroke="#8CA7CE"
            strokeOpacity="0.8"
            strokeWidth="1.2"
          />
          <circle cx="600" cy="30" r="2.5" fill="#28CF77" />
        </g>
      </svg>
    </div>
  );
}

/**
 * Calibrated Architectural Scale-Rule & Chamfered Structural Span Divider:
 * Replaces flat gradient dividers with blueprint graduation ticks, a notched architectural
 * datum cartouche, and an optional 45°-chamfered 3-column structural distribution truss.
 */
function ArchitecturalSectionDivider({
  label,
  showThreeBranchManifold = false,
  testId,
}: {
  label: string;
  showThreeBranchManifold?: boolean;
  testId?: string;
}) {
  return (
    <div data-testid={testId} className="relative pt-3 sm:pt-4 pb-1 select-none">
      {/* Calibrated Horizontal Elevation Rule + Chamfered Datum Cartouche */}
      <div className="flex items-center gap-3 sm:gap-5">
        {/* Right/Start Calibrated Scale Wing */}
        <div
          aria-hidden="true"
          className="relative flex-1 h-4 flex items-center"
        >
          <div className="w-full flex items-center">
            <span className="w-1.5 h-1.5 rotate-45 border border-[#8CA7CE]/45 shrink-0" />
            <div className="relative flex-1 h-px bg-[#8CA7CE]/30">
              {/* Architectural micro-graduation ticks */}
              <div
                className="absolute inset-x-3 -top-[3px] h-[7px] opacity-35"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(90deg, rgba(148,179,224,0.85) 0px, rgba(148,179,224,0.85) 1px, transparent 1px, transparent 22px)',
                }}
              />
            </div>
            <span className="h-2.5 w-px bg-[#8CA7CE]/55 shrink-0" />
          </div>
        </div>

        {/* Center Notched Architectural Cartouche */}
        <div className="relative shrink-0 px-3 sm:px-5 py-1 sm:py-1.5 border border-[#8CA7CE]/28 bg-[#0A1426]/95 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.9)]">
          {/* Corner CAD Brackets */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -top-px -left-px w-2 h-2 border-t border-l border-[#28CF77]/75"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -top-px -right-px w-2 h-2 border-t border-r border-[#6F9BFF]/75"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-px -left-px w-2 h-2 border-b border-l border-[#6F9BFF]/75"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-px -right-px w-2 h-2 border-b border-r border-[#28CF77]/75"
          />

          <div className="flex items-center gap-2 sm:gap-2.5">
            <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-[#28CF77]" />
            <span className="text-[11px] sm:text-[13px] font-bold tracking-wide text-[#EDF3FC]">
              {label}
            </span>
            <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-[#6F9BFF]" />
          </div>
        </div>

        {/* Left/End Calibrated Scale Wing */}
        <div
          aria-hidden="true"
          className="relative flex-1 h-4 flex items-center"
        >
          <div className="w-full flex items-center">
            <span className="h-2.5 w-px bg-[#8CA7CE]/55 shrink-0" />
            <div className="relative flex-1 h-px bg-[#8CA7CE]/30">
              <div
                className="absolute inset-x-3 -top-[3px] h-[7px] opacity-35"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(90deg, rgba(148,179,224,0.85) 0px, rgba(148,179,224,0.85) 1px, transparent 1px, transparent 22px)',
                }}
              />
            </div>
            <span className="w-1.5 h-1.5 rotate-45 border border-[#8CA7CE]/45 shrink-0" />
          </div>
        </div>
      </div>

      {/* 45°-Chamfered 3-Department Structural Span Truss */}
      {showThreeBranchManifold && (
        <div
          aria-hidden="true"
          data-testid="departments-structural-truss"
          className="hidden lg:block w-full h-14 mt-1"
        >
          <svg
            viewBox="0 0 1260 56"
            fill="none"
            className="w-full h-full overflow-visible"
          >
            {/* Upper Secondary Parallel Blueprint Guide Chord */}
            <path
              d="M 214 36 L 224 21 H 1036 L 1046 36"
              stroke="#8CA7CE"
              strokeOpacity="0.16"
              strokeWidth="0.9"
              strokeDasharray="3 4"
            />

            {/* Primary 45°-Chamfered Structural Span Beam to Left (205) & Right (1055) Columns */}
            <path
              d="M 205 54 V 36 L 217 24 H 1043 L 1055 36 V 54"
              stroke="#8CA7CE"
              strokeOpacity="0.54"
              strokeWidth="1.2"
            />

            {/* Central Keystone Vertical Spine (630) */}
            <line
              x1="630"
              y1="0"
              x2="630"
              y2="54"
              stroke="#8CA7CE"
              strokeOpacity="0.58"
              strokeWidth="1.2"
            />

            {/* Architectural Gusset Braces flanking the Central Keystone */}
            <path
              d="M 616 24 L 630 10 L 644 24"
              stroke="#8CA7CE"
              strokeOpacity="0.34"
              strokeWidth="1"
            />
            <path
              d="M 622 24 L 630 32 L 638 24"
              stroke="#28CF77"
              strokeOpacity="0.45"
              strokeWidth="1"
            />

            {/* Calibrated Span Ticks along the Structural Beam */}
            {[312, 418, 524, 736, 842, 948].map((tx) => (
              <line
                key={tx}
                x1={tx}
                y1="21"
                x2={tx}
                y2="27"
                stroke="#8CA7CE"
                strokeOpacity="0.32"
                strokeWidth="0.9"
              />
            ))}

            {/* Central Keystone Datum Diamond (630, 24) */}
            <g>
              <path
                d="M 630 16 L 638 24 L 630 32 L 622 24 Z"
                fill="#070E1C"
                stroke="#8CA7CE"
                strokeOpacity="0.82"
                strokeWidth="1.15"
              />
              <circle cx="630" cy="24" r="2.3" fill="#28CF77" />
            </g>

            {/* Left & Right Elbow Corner Reticles */}
            <circle cx="217" cy="24" r="2.2" fill="#070E1C" stroke="#93BCFF" strokeWidth="1.1" />
            <circle cx="1043" cy="24" r="2.2" fill="#070E1C" stroke="#6F9BFF" strokeWidth="1.1" />

            {/* 3 Department Column Capital Mounting Sockets (205, 630, 1055) */}
            {[
              { x: 205, color: '#93BCFF' },
              { x: 630, color: '#28CF77' },
              { x: 1055, color: '#6F9BFF' },
            ].map((node) => (
              <g key={`dept-socket-${node.x}`}>
                <line
                  x1={node.x - 10}
                  y1="54"
                  x2={node.x + 10}
                  y2="54"
                  stroke="#8CA7CE"
                  strokeOpacity="0.58"
                  strokeWidth="1.15"
                />
                <rect
                  x={node.x - 3}
                  y={51}
                  width="6"
                  height="6"
                  fill="#070E1C"
                  stroke={node.color}
                  strokeWidth="1.15"
                />
              </g>
            ))}
          </svg>
        </div>
      )}
    </div>
  );
}

/**
 * Miniature Architectural Column Coupler locking each Department Header onto its stack body.
 */
function DepartmentColumnCoupler({ accentHex }: { accentHex: string }) {
  return (
    <div className="flex justify-center" aria-hidden="true">
      <svg width="36" height="28" viewBox="0 0 36 28" fill="none" className="overflow-visible">
        {/* Upper & Lower Mounting Flanges */}
        <line x1="10" y1="1" x2="26" y2="1" stroke="#8CA7CE" strokeOpacity="0.45" strokeWidth="1.1" />
        <line x1="10" y1="27" x2="26" y2="27" stroke="#8CA7CE" strokeOpacity="0.45" strokeWidth="1.1" />
        {/* Twin Tension Guides */}
        <line
          x1="14"
          y1="3"
          x2="14"
          y2="25"
          stroke="#8CA7CE"
          strokeOpacity="0.18"
          strokeWidth="0.9"
          strokeDasharray="2 2"
        />
        <line
          x1="22"
          y1="3"
          x2="22"
          y2="25"
          stroke="#8CA7CE"
          strokeOpacity="0.18"
          strokeWidth="0.9"
          strokeDasharray="2 2"
        />
        {/* Central Structural Axis */}
        <line x1="18" y1="1" x2="18" y2="27" stroke="#8CA7CE" strokeOpacity="0.55" strokeWidth="1.15" />
        {/* Centered Structural Pin Diamond */}
        <path
          d="M 18 9 L 23 14 L 18 19 L 13 14 Z"
          fill="#070E1C"
          stroke={accentHex}
          strokeOpacity="0.85"
          strokeWidth="1.1"
        />
        <circle cx="18" cy="14" r="1.5" fill={accentHex} />
      </svg>
    </div>
  );
}

/**
 * Blueprint Dashed Datum Seam separating tiers inside each Department Column.
 */
function ColumnTierSeam({ accentHex }: { accentHex: string }) {
  return (
    <div className="flex items-center gap-2.5 py-0.5" aria-hidden="true">
      <span className="h-2 w-px bg-[#8CA7CE]/35 shrink-0" />
      <span className="flex-1 border-t border-dashed border-[#8CA7CE]/24" />
      <svg width="20" height="10" viewBox="0 0 20 10" fill="none" className="shrink-0">
        <line x1="0" y1="5" x2="5" y2="5" stroke="#8CA7CE" strokeOpacity="0.45" strokeWidth="1" />
        <line x1="15" y1="5" x2="20" y2="5" stroke="#8CA7CE" strokeOpacity="0.45" strokeWidth="1" />
        <path
          d="M 10 1 L 14 5 L 10 9 L 6 5 Z"
          fill="#070E1C"
          stroke={accentHex}
          strokeOpacity="0.8"
          strokeWidth="1"
        />
      </svg>
      <span className="flex-1 border-t border-dashed border-[#8CA7CE]/24" />
      <span className="h-2 w-px bg-[#8CA7CE]/35 shrink-0" />
    </div>
  );
}

/**
 * Crisp Architectural Elevation End-Brackets flanking Board & Inspectors titles.
 */
function GovernanceHeadingBracket({
  side,
  accentHex,
}: {
  side: 'start' | 'end';
  accentHex: string;
}) {
  const isStart = side === 'start';
  return (
    <svg
      width="56"
      height="10"
      viewBox="0 0 56 10"
      fill="none"
      aria-hidden="true"
      className="w-10 sm:w-14 h-2.5 shrink-0"
    >
      {isStart ? (
        <>
          <line x1="1" y1="2" x2="1" y2="8" stroke="#8CA7CE" strokeOpacity="0.5" strokeWidth="1.1" />
          <line x1="1" y1="5" x2="46" y2="5" stroke="#8CA7CE" strokeOpacity="0.38" strokeWidth="1" />
          <path d="M 51 2 L 54 5 L 51 8 L 48 5 Z" fill="#070E1C" stroke={accentHex} strokeWidth="1" />
        </>
      ) : (
        <>
          <path d="M 5 2 L 8 5 L 5 8 L 2 5 Z" fill="#070E1C" stroke={accentHex} strokeWidth="1" />
          <line x1="10" y1="5" x2="55" y2="5" stroke="#8CA7CE" strokeOpacity="0.38" strokeWidth="1" />
          <line x1="55" y1="2" x2="55" y2="8" stroke="#8CA7CE" strokeOpacity="0.5" strokeWidth="1.1" />
        </>
      )}
    </svg>
  );
}

/**
 * Single Vertical Department Column:
 * 1. Sculpted Department Header Card (clean, zero awkward numbers)
 * 2. راهبران ارشد دپارتمان (Senior Department Leads)
 * 3. اعضای دپارتمان (Department Members)
 * 4. مشاوران (Advisors) directly beneath Department Members
 */
function DepartmentVerticalColumn({
  branch,
  locale,
  isHovered,
  onHover,
  onSelectResume,
}: {
  branch: DepartmentBranchSpec;
  locale: Locale;
  isHovered: boolean;
  onHover: (slug: DisciplineSlug | null) => void;
  onSelectResume: (member: TeamMember) => void;
}) {
  const isRtl = locale === 'fa';
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;
  const disciplineInfo = DISCIPLINES.find((d) => d.slug === branch.slug);
  const titleFa = disciplineInfo?.title.fa ?? branch.slug;
  const titleEn = disciplineInfo?.title.en ?? branch.slug;
  const primaryTitle = isRtl ? titleFa : titleEn;
  const secondaryTitle = isRtl ? titleEn : titleFa;

  return (
    <motion.section
      id={`dept-${branch.slug}`}
      data-testid={`team-dept-${branch.slug}`}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.5, ease: ARCHITECTURAL_EASE }}
      onMouseEnter={() => onHover(branch.slug)}
      onMouseLeave={() => onHover(null)}
      className="flex flex-col items-stretch scroll-mt-28"
    >
      {/* 1. Department Header Card (Zero Numbers) */}
      <header
        className="relative overflow-hidden rounded-[18px] sm:rounded-[22px] border p-3.5 sm:p-5 transition-all duration-300"
        style={{
          borderColor: isHovered ? `${branch.accentHex}7A` : `${branch.accentHex}34`,
          background: isHovered
            ? `linear-gradient(155deg, ${branch.accentSoftHex}44 0%, rgba(11,20,38,0.95) 75%)`
            : 'linear-gradient(155deg, rgba(16,28,54,0.82) 0%, rgba(8,14,28,0.96) 100%)',
          boxShadow: isHovered
            ? `0 22px 54px -26px ${branch.accentHex}55`
            : '0 20px 48px -30px rgba(0,0,0,0.88)',
        }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 inset-x-6 h-[2px]"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${branch.accentHex} 50%, transparent 100%)`,
          }}
        />

        <div className="relative z-10 flex items-center gap-3 sm:gap-3.5">
          <div
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-[12px] sm:rounded-[15px] border flex items-center justify-center shrink-0"
            style={{
              borderColor: `${branch.accentHex}4D`,
              background: `linear-gradient(145deg, ${branch.accentSoftHex}52, rgba(9,16,32,0.9))`,
            }}
          >
            <DepartmentIcon slug={branch.slug} className="w-4 h-4 sm:w-5 sm:h-5 text-[#F5F8FC]" />
          </div>

          <div className="min-w-0 flex-1 space-y-0.5">
            <p className="text-[10px] sm:text-[11px] font-semibold" style={{ color: branch.accentHex }}>
              {isRtl ? 'دپارتمان تخصصی' : 'Department'}
            </p>
            <h3 className="text-[15px] sm:text-[1.15rem] font-extrabold text-[#F5F8FC] leading-snug">
              {primaryTitle}
            </h3>
            <p className="text-[10px] sm:text-[11px] text-[#8FA5C4] ltr-inline truncate">{secondaryTitle}</p>
          </div>
        </div>
      </header>

      {/* Architectural Column Coupler Joint */}
      <DepartmentColumnCoupler accentHex={branch.accentHex} />

      {/* Columnar Stack Container */}
      <div className="rounded-[18px] sm:rounded-[22px] border border-white/[0.09] bg-gradient-to-b from-[#0C162A]/84 via-[#091223]/90 to-[#070E1C]/94 p-3 sm:p-5 space-y-4 sm:space-y-5">
        {branch.totalCount === 0 ? (
          <div className="py-5 sm:py-7 px-3 text-center space-y-2">
            <div
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border mx-auto flex items-center justify-center bg-[#0B1528]"
              style={{ borderColor: `${branch.accentHex}38` }}
            >
              <DepartmentIcon slug={branch.slug} className="w-4 h-4 opacity-75 text-[#C6D2E3]" />
            </div>
            <p className="text-xs font-semibold text-[#D6E2F3]">
              {isRtl ? 'آماده تکمیل اعضا و مشاوران' : 'Ready for Leads, Members & Advisors'}
            </p>
            <p className="text-[11px] text-[#8DA3C2] leading-relaxed rtl:leading-[1.85]">
              {isRtl
                ? 'پروفایل‌های این دپارتمان از طریق پنل مدیریت به صورت مستقیم در همین ستون نمایش داده می‌شوند.'
                : 'Profiles added in Studio Admin will appear vertically in this column.'}
            </p>
          </div>
        ) : (
          <>
            {/* Section A — راهبران ارشد دپارتمان */}
            {branch.seniorLeads.length > 0 && (
              <div className="space-y-2.5 sm:space-y-3" data-testid={`team-dept-leads-${branch.slug}`}>
                <div className="flex items-center gap-2 pb-1.5 sm:pb-2 border-b border-white/[0.08] text-[11.5px] sm:text-xs font-bold text-[#E7F0FC]">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" style={{ color: branch.accentHex }} />
                  <span>{isRtl ? 'راهبران ارشد دپارتمان' : 'Senior Department Leads'}</span>
                </div>

                <div className="space-y-2.5 sm:space-y-3">
                  {branch.seniorLeads.map((lead) => {
                    const leadName = isRtl ? lead.nameFa : lead.nameEn;
                    const leadRole = isRtl ? lead.roleFa : lead.roleEn;
                    const hasPhoto = Boolean(lead.portraitUrl?.trim());
                    const canOpenResume = hasPublicResume(lead);

                    return (
                      <article
                        key={lead.id}
                        className="group relative overflow-hidden rounded-[14px] sm:rounded-[16px] border bg-gradient-to-br from-[#122241]/85 via-[#0B162C]/92 to-[#081020]/96 p-3 sm:p-3.5 space-y-2 sm:space-y-2.5 transition-colors duration-300"
                        style={{ borderColor: `${branch.accentHex}34` }}
                      >
                        <div className="flex items-center gap-2.5 sm:gap-3">
                          <div
                            className="w-11 h-11 sm:w-13 sm:h-13 rounded-[12px] sm:rounded-[14px] overflow-hidden border bg-[#0B1528] flex items-center justify-center shrink-0"
                            style={{ borderColor: `${branch.accentHex}52` }}
                          >
                            {hasPhoto ? (
                              <SafeImage
                                src={lead.portraitUrl!}
                                alt={leadName}
                                className="w-full h-full object-cover object-top"
                              />
                            ) : (
                              <span
                                className="text-xs sm:text-sm font-bold tracking-wider"
                                style={{ color: branch.accentHex }}
                              >
                                {getMemberMonogram(leadName)}
                              </span>
                            )}
                          </div>

                          <div className="min-w-0 flex-1 space-y-0.5">
                            <h4 className="text-[13px] sm:text-sm font-bold text-[#F5F8FC] leading-snug">
                              {leadName}
                            </h4>
                            <p className="text-[11px] sm:text-xs text-[#AFC2DC] leading-relaxed line-clamp-2">
                              {leadRole}
                            </p>
                          </div>
                        </div>

                        {canOpenResume && (
                          <div className="pt-1.5 sm:pt-2 border-t border-white/[0.08] flex justify-end">
                            <button
                              type="button"
                              onClick={() => onSelectResume(lead)}
                              className="inline-flex items-center gap-1.5 min-h-[36px] sm:min-h-0 px-2 py-1 sm:p-0 text-[11px] font-semibold transition-colors cursor-pointer hover:text-white"
                              style={{ color: branch.accentHex }}
                            >
                              <span>{isRtl ? 'مشاهده رزومه و سوابق' : 'View Resume'}</span>
                              <ArrowIcon className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Divider between Senior Leads and Department Members */}
            {branch.seniorLeads.length > 0 && branch.departmentMembers.length > 0 && (
              <ColumnTierSeam accentHex={branch.accentHex} />
            )}

            {/* Section B — اعضای دپارتمان */}
            {branch.departmentMembers.length > 0 && (
              <div className="space-y-2.5 sm:space-y-3" data-testid={`team-dept-members-${branch.slug}`}>
                <div className="flex items-center gap-2 pb-1.5 sm:pb-2 border-b border-white/[0.08] text-[11.5px] sm:text-xs font-semibold text-[#C8D5E8]">
                  <UserCheck className="w-3.5 h-3.5 shrink-0" style={{ color: branch.accentHex }} />
                  <span>{isRtl ? 'اعضای دپارتمان' : 'Department Members'}</span>
                </div>

                <div className="space-y-2 sm:space-y-2.5">
                  {branch.departmentMembers.map((member) => {
                    const memberName = isRtl ? member.nameFa : member.nameEn;
                    const memberRole = isRtl ? member.roleFa : member.roleEn;
                    const hasPhoto = Boolean(member.portraitUrl?.trim());
                    return (
                      <div
                        key={member.id}
                        className="rounded-[12px] sm:rounded-[14px] border border-white/[0.08] bg-white/[0.025] hover:border-white/[0.16] px-2.5 py-2 sm:px-3.5 sm:py-2.5 flex items-center gap-2.5 sm:gap-3 transition-colors"
                      >
                        <div
                          className="w-9 h-9 sm:w-10 sm:h-10 rounded-[10px] sm:rounded-[11px] overflow-hidden border bg-[#0E1930] flex items-center justify-center shrink-0"
                          style={{ borderColor: `${branch.accentHex}42` }}
                        >
                          {hasPhoto ? (
                            <SafeImage
                              src={member.portraitUrl!}
                              alt={memberName}
                              className="w-full h-full object-cover object-top"
                            />
                          ) : (
                            <span
                              className="text-[11px] sm:text-xs font-bold"
                              style={{ color: branch.accentHex }}
                            >
                              {getMemberMonogram(memberName)}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] sm:text-sm font-semibold text-[#F5F8FC] truncate">
                            {memberName}
                          </p>
                          <p className="text-[11px] sm:text-xs text-[#9BB0CC] leading-relaxed line-clamp-2">
                            {memberRole}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Divider before Advisors */}
            {(branch.seniorLeads.length > 0 || branch.departmentMembers.length > 0) &&
              branch.advisors.length > 0 && <ColumnTierSeam accentHex={branch.accentHex} />}

            {/* Section C — مشاوران (Directly after اعضای دپارتمان) */}
            {branch.advisors.length > 0 && (
              <div className="space-y-2.5 sm:space-y-3" data-testid={`team-dept-advisors-${branch.slug}`}>
                <div className="flex items-center gap-2 pb-1.5 sm:pb-2 border-b border-white/[0.08] text-[11.5px] sm:text-xs font-semibold text-[#D6E4F7]">
                  <BookOpen className="w-3.5 h-3.5 shrink-0" style={{ color: branch.accentHex }} />
                  <span>{isRtl ? 'مشاوران' : 'Advisors'}</span>
                </div>

                <div className="space-y-2 sm:space-y-2.5">
                  {branch.advisors.map((advisor) => {
                    const advisorName = isRtl ? advisor.nameFa : advisor.nameEn;
                    const advisorRole = isRtl ? advisor.roleFa : advisor.roleEn;
                    const hasPhoto = Boolean(advisor.portraitUrl?.trim());
                    const canOpenResume = hasPublicResume(advisor);
                    return (
                      <article
                        key={advisor.id}
                        className="rounded-[12px] sm:rounded-[14px] border border-dashed bg-white/[0.02] hover:bg-white/[0.04] px-2.5 py-2 sm:px-3.5 sm:py-2.5 space-y-1.5 sm:space-y-2 transition-colors"
                        style={{ borderColor: `${branch.accentHex}38` }}
                      >
                        <div className="flex items-center gap-2.5 sm:gap-3">
                          <div
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-[10px] sm:rounded-[11px] overflow-hidden border bg-[#0E1930] flex items-center justify-center shrink-0"
                            style={{ borderColor: `${branch.accentHex}48` }}
                          >
                            {hasPhoto ? (
                              <SafeImage
                                src={advisor.portraitUrl!}
                                alt={advisorName}
                                className="w-full h-full object-cover object-top"
                              />
                            ) : (
                              <span
                                className="text-[11px] sm:text-xs font-bold"
                                style={{ color: branch.accentHex }}
                              >
                                {getMemberMonogram(advisorName)}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] sm:text-sm font-semibold text-[#F5F8FC] truncate">
                              {advisorName}
                            </p>
                            <p className="text-[11px] sm:text-xs text-[#9BB0CC] leading-relaxed line-clamp-2">
                              {advisorRole}
                            </p>
                          </div>
                        </div>

                        {canOpenResume && (
                          <div className="pt-1.5 border-t border-white/[0.07] flex justify-end">
                            <button
                              type="button"
                              onClick={() => onSelectResume(advisor)}
                              className="inline-flex items-center gap-1.5 min-h-[36px] sm:min-h-0 px-2 py-1 sm:p-0 text-[11px] font-semibold transition-colors cursor-pointer hover:text-white"
                              style={{ color: branch.accentHex }}
                            >
                              <span>{isRtl ? 'مشاهده رزومه' : 'View Resume'}</span>
                              <ArrowIcon className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </motion.section>
  );
}

/**
 * Editorial Row-by-Row Directory of Partners & Affiliated Companies (~20 entries).
 * Clean horizontal rows with dedicated logo stage, company name, concise description, and optional link.
 */
function PartnersAffiliatesDirectory({
  locale,
  partners,
}: {
  locale: Locale;
  partners: PartnerLogo[];
}) {
  const isRtl = locale === 'fa';
  const publishedPartners = useMemo(
    () =>
      partners
        .filter((p) => p.status === 'published')
        .slice()
        .sort((a, b) => a.order - b.order),
    [partners]
  );

  const [perView, setPerView] = useState<number>(() =>
    typeof window !== 'undefined' ? resolvePartnerCardsPerView(window.innerWidth) : 5
  );
  const [pageIndex, setPageIndex] = useState(0);
  const [slideDir, setSlideDir] = useState<1 | -1>(1);
  const touchStartXRef = useRef<number | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setPerView(resolvePartnerCardsPerView(window.innerWidth));
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const sliderWindow = useMemo(
    () => computePartnerSliderWindow(publishedPartners.length, perView, pageIndex),
    [publishedPartners.length, perView, pageIndex]
  );

  useEffect(() => {
    if (pageIndex !== sliderWindow.pageIndex) {
      setPageIndex(sliderWindow.pageIndex);
    }
  }, [pageIndex, sliderWindow.pageIndex]);

  if (publishedPartners.length === 0) return null;

  const visiblePartners = publishedPartners.slice(sliderWindow.startIndex, sliderWindow.endIndex);

  const goToPage = (nextPage: number) => {
    const clamped = Math.max(0, Math.min(nextPage, sliderWindow.totalPages - 1));
    if (clamped === sliderWindow.pageIndex) return;
    setSlideDir(clamped > sliderWindow.pageIndex ? 1 : -1);
    setPageIndex(clamped);
  };

  const handlePrev = () => {
    if (!sliderWindow.canPrev) return;
    setSlideDir(-1);
    setPageIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    if (!sliderWindow.canNext) return;
    setSlideDir(1);
    setPageIndex((prev) => Math.min(sliderWindow.totalPages - 1, prev + 1));
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartXRef.current = e.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartXRef.current === null) return;
    const deltaX = (e.changedTouches[0]?.clientX ?? touchStartXRef.current) - touchStartXRef.current;
    touchStartXRef.current = null;
    if (Math.abs(deltaX) < 42) return;
    // In RTL: swiping right advances to next slide; swiping left returns to previous
    if (isRtl) {
      if (deltaX > 0) handleNext();
      else handlePrev();
    } else {
      if (deltaX < 0) handleNext();
      else handlePrev();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (isRtl) handleNext();
      else handlePrev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (isRtl) handlePrev();
      else handleNext();
    }
  };

  const PrevIcon = isRtl ? ChevronRight : ChevronLeft;
  const NextIcon = isRtl ? ChevronLeft : ChevronRight;
  const slideOffsetPx = (isRtl ? -1 : 1) * slideDir * 36;

  const gridClass =
    perView >= 5
      ? 'grid-cols-5'
      : perView === 3
        ? 'grid-cols-3'
        : perView === 2
          ? 'grid-cols-2'
          : 'grid-cols-1 max-w-[280px] mx-auto';

  return (
    <section
      data-testid="team-partners-directory"
      className="space-y-4 sm:space-y-6"
      aria-labelledby="partners-directory-heading"
    >
      <ArchitecturalSectionDivider
        label={isRtl ? 'همکاران و شرکت‌های وابسته' : 'Partners & Affiliated Companies'}
      />

      <div
        className="space-y-4 sm:space-y-5 outline-none"
        tabIndex={0}
        role="region"
        aria-roledescription="carousel"
        aria-label={isRtl ? 'اسلایدر همکاران و شرکت‌های وابسته' : 'Partners and Affiliated Companies slider'}
        onKeyDown={handleKeyDown}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Header & Slider Controls */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 px-1">
          <div className="space-y-0.5 sm:space-y-1">
            <h2
              id="partners-directory-heading"
              className="text-[15px] sm:text-xl font-bold text-[#F5F8FC]"
            >
              {isRtl
                ? 'شبکه همکاران، مشاوران صنعتی و شرکت‌های وابسته'
                : 'Affiliated Companies & Collaborating Partners'}
            </h2>
            <p className="text-[11.5px] sm:text-[13px] text-[#90A6C5]">
              {isRtl
                ? 'مجموعه‌های همکار در پژوهش، طراحی، تأمین مصالح پایدار و اجرای پروژه‌ها'
                : 'Collaborating organizations across research, design, sustainable materials, and delivery'}
            </p>
          </div>

          {sliderWindow.totalPages > 1 && (
            <div className="hidden sm:flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                data-testid="partners-slider-prev"
                onClick={handlePrev}
                disabled={!sliderWindow.canPrev}
                aria-label={isRtl ? 'مجموعه قبلی' : 'Previous slide'}
                className="w-10 h-10 rounded-xl border border-white/[0.12] bg-[#0B1528]/90 text-[#DCE8FA] flex items-center justify-center transition-all hover:border-[#6F9BFF]/55 hover:bg-[#122240] hover:text-white active:scale-[0.95] disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
              >
                <PrevIcon className="w-4 h-4" />
              </button>
              <button
                type="button"
                data-testid="partners-slider-next"
                onClick={handleNext}
                disabled={!sliderWindow.canNext}
                aria-label={isRtl ? 'مجموعه بعدی' : 'Next slide'}
                className="w-10 h-10 rounded-xl border border-white/[0.12] bg-[#0B1528]/90 text-[#DCE8FA] flex items-center justify-center transition-all hover:border-[#28CF77]/55 hover:bg-[#102736] hover:text-white active:scale-[0.95] disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
              >
                <NextIcon className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* 5-Across Vertical 4:5 (1080×1350) Portrait Cards Track */}
        <div className="overflow-hidden py-1">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`partner-slide-${sliderWindow.pageIndex}-${perView}`}
              initial={{ opacity: 0, x: slideOffsetPx }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -slideOffsetPx }}
              transition={{ duration: 0.32, ease: ARCHITECTURAL_EASE }}
              data-testid="partners-slider-track"
              className={`grid ${gridClass} gap-3 sm:gap-4`}
            >
              {visiblePartners.map((partner) => {
                const primaryName = isRtl ? partner.nameFa : partner.nameEn;
                const secondaryName = isRtl ? partner.nameEn : partner.nameFa;
                const description = (
                  isRtl ? partner.descriptionFa : partner.descriptionEn
                )?.trim();
                const hasUploadedLogo = Boolean(partner.logoUrl?.trim());
                const safeWebsite =
                  partner.websiteUrl?.trim() && isSafeExternalUrl(partner.websiteUrl)
                    ? partner.websiteUrl.trim()
                    : null;

                return (
                  <article
                    key={partner.id}
                    data-testid="team-partner-card"
                    className="group relative min-h-[238px] sm:min-h-0 sm:aspect-[4/5] rounded-[18px] sm:rounded-[22px] border border-white/[0.1] bg-gradient-to-b from-[#0D182E]/95 via-[#091224]/98 to-[#060C18] p-3.5 sm:p-4 flex flex-col overflow-hidden transition-all duration-300 hover:border-[#6F9BFF]/45 hover:-translate-y-1 shadow-[0_20px_50px_-28px_rgba(0,0,0,0.92)]"
                  >
                    {/* Subtle Top Accent Hairline */}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute top-0 inset-x-0 h-[1.5px] opacity-40 group-hover:opacity-95 transition-opacity"
                      style={{
                        background:
                          'linear-gradient(90deg, transparent 10%, #28CF77 50%, #6F9BFF 85%, transparent 100%)',
                      }}
                    />

                    {/* Upper Portrait Stage — Logo Showcase */}
                    <div className="h-[92px] sm:h-[42%] sm:min-h-[104px] rounded-xl sm:rounded-2xl border border-white/[0.08] bg-[#060C18]/90 px-3 sm:px-3.5 flex flex-col items-center justify-center gap-1.5 sm:gap-2 shrink-0 group-hover:border-[#6F9BFF]/30 transition-colors">
                      {hasUploadedLogo ? (
                        <SafeImage
                          src={partner.logoUrl!}
                          alt={primaryName}
                          className="max-h-11 sm:max-h-14 max-w-[84%] object-contain opacity-92 group-hover:opacity-100 transition-opacity"
                        />
                      ) : (
                        <>
                          {renderPartnerPresetMark(
                            partner.presetMarkId ?? partner.id,
                            'w-8 h-8 sm:w-9 sm:h-9 text-[#6F9BFF] group-hover:text-[#28CF77] transition-colors'
                          )}
                          <span className="text-[9.5px] sm:text-[10px] font-semibold tracking-[0.14em] uppercase text-[#8CA4C7] group-hover:text-[#D9E6F9] transition-colors truncate max-w-full ltr-inline">
                            {partner.nameEn}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Lower Editorial Stage — Name & Description */}
                    <div className="flex-1 flex flex-col pt-2.5 sm:pt-3.5 min-h-0">
                      <h3 className="text-[13.5px] sm:text-[15px] font-bold text-[#F5F8FC] leading-snug line-clamp-2">
                        {primaryName}
                      </h3>
                      {secondaryName && secondaryName !== primaryName && (
                        <p
                          className={`text-[10px] sm:text-[10.5px] text-[#7E95B5] truncate mt-0.5 ${
                            isRtl ? 'text-right' : 'text-left'
                          }`}
                        >
                          <span className={isRtl ? 'ltr-inline' : ''}>{secondaryName}</span>
                        </p>
                      )}

                      <div
                        aria-hidden="true"
                        className="w-6 sm:w-7 h-px bg-[#28CF77]/55 my-2 sm:my-2.5 shrink-0 group-hover:w-11 transition-all duration-300"
                      />

                      <p className="text-[11px] sm:text-xs text-[#B9C8DF] leading-[1.72] sm:leading-[1.78] line-clamp-4">
                        {description ||
                          (isRtl
                            ? 'همکار تخصصی و مجموعه وابسته در اجرای پروژه‌های ساختمانی پایدار گروه ISB.'
                            : 'Specialized industry partner collaborating on ISB sustainable building commissions.')}
                      </p>

                      {safeWebsite && (
                        <a
                          href={safeWebsite}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={isRtl ? `وب‌سایت ${primaryName}` : `${primaryName} website`}
                          className="mt-auto pt-1.5 sm:pt-2 inline-flex items-center gap-1.5 min-h-[32px] sm:min-h-0 text-[11px] font-medium text-[#7FA8FF] hover:text-white transition-colors self-start"
                        >
                          <span>{isRtl ? 'وب‌سایت' : 'Website'}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </article>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Minimal Interactive Slide Progress Controls + Mobile Thumb-Reach Prev/Next */}
        {sliderWindow.totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-1">
            <button
              type="button"
              onClick={handlePrev}
              disabled={!sliderWindow.canPrev}
              aria-label={isRtl ? 'مجموعه قبلی' : 'Previous slide'}
              className="sm:hidden w-10 h-10 rounded-xl border border-white/[0.12] bg-[#0B1528]/90 text-[#DCE8FA] flex items-center justify-center transition-all active:scale-[0.94] disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer shrink-0"
            >
              <PrevIcon className="w-4 h-4" />
            </button>

            {sliderWindow.totalPages <= 8 ? (
              <div className="flex items-center justify-center gap-1" role="tablist">
                {Array.from({ length: sliderWindow.totalPages }, (_, idx) => {
                  const isActive = idx === sliderWindow.pageIndex;
                  return (
                    <button
                      key={`partner-page-${idx}`}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      aria-label={isRtl ? `اسلاید ${idx + 1}` : `Slide ${idx + 1}`}
                      data-testid="partners-slider-dot"
                      onClick={() => goToPage(idx)}
                      className="py-2 px-1 inline-flex items-center justify-center cursor-pointer"
                    >
                      <span
                        className={`block h-1.5 rounded-full transition-all duration-300 ${
                          isActive
                            ? 'w-9 bg-gradient-to-r from-[#28CF77] to-[#6F9BFF]'
                            : 'w-3 bg-white/[0.18] hover:bg-white/[0.38]'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <div className="w-36 sm:w-44 h-1.5 rounded-full bg-white/[0.12] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#28CF77] to-[#6F9BFF] transition-all duration-300"
                    style={{
                      width: `${Math.round(((sliderWindow.pageIndex + 1) / sliderWindow.totalPages) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleNext}
              disabled={!sliderWindow.canNext}
              aria-label={isRtl ? 'مجموعه بعدی' : 'Next slide'}
              className="sm:hidden w-10 h-10 rounded-xl border border-white/[0.12] bg-[#0B1528]/90 text-[#DCE8FA] flex items-center justify-center transition-all active:scale-[0.94] disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer shrink-0"
            >
              <NextIcon className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * ISB Architectural Governance, Columnar Departments, Advisors & Partners Directory:
 * - Row 1: 3 Compact Equal Square Monoliths — هیئت مدیره (zero numbers, zero department labels)
 * - Row 2: 2 Compact Equal Square Monoliths — بازرسان (centered directly below)
 * - Clean Architectural Horizontal Divider Line + 3-Branch Manifold
 * - Row 3: 3 Vertical Department Columns (Senior Leads → Department Members → Advisors)
 * - Optional Cross-Department Advisors row (if any)
 * - Row-by-Row Partners & Affiliated Companies Directory (~20 companies with logos & concise descriptions)
 */
export function TeamOrgTree({ locale, teamMembers, partnerLogos }: TeamOrgTreeProps) {
  const isRtl = locale === 'fa';
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;
  const [hoveredDept, setHoveredDept] = useState<DisciplineSlug | null>(null);
  const [selectedResumeMember, setSelectedResumeMember] = useState<TeamMember | null>(null);

  const hierarchy = useMemo(() => buildTeamHierarchy(teamMembers), [teamMembers]);
  const partnersSource = partnerLogos && partnerLogos.length > 0 ? partnerLogos : SEED_PARTNER_LOGOS;

  // 3 compact equal squares for Board of Directors & 2 compact equal squares for Inspectors
  const boardSlots: (TeamMember | undefined)[] = useMemo(() => {
    const count = Math.max(3, hierarchy.ceos.length);
    return Array.from({ length: count }, (_, idx) => hierarchy.ceos[idx]);
  }, [hierarchy.ceos]);

  const inspectorSlots: (TeamMember | undefined)[] = useMemo(() => {
    const count = Math.max(2, hierarchy.inspectors.length);
    return Array.from({ length: count }, (_, idx) => hierarchy.inspectors[idx]);
  }, [hierarchy.inspectors]);

  if (hierarchy.totalPublished === 0) {
    return (
      <div className="glass-surface rounded-3xl p-12 text-center space-y-3">
        <Users className="w-9 h-9 text-[#6F9BFF] mx-auto" strokeWidth={1.5} />
        <h3 className="text-lg font-semibold text-[#F5F8FC]">
          {isRtl ? 'ساختار تیم در حال تکمیل است' : 'Team Architecture Coming Soon'}
        </h3>
      </div>
    );
  }

  return (
    <div data-testid="team-org-architecture" className="space-y-5 sm:space-y-9">
      {/* =====================================================================
          COMPACT ARCHITECTURAL GOVERNANCE STAGE
          Row 1: 3 Compact Equal Squares — هیئت مدیره
          Row 2: 2 Compact Equal Squares — بازرسان
         ===================================================================== */}
      <section
        data-testid="team-governance-stage"
        className="relative overflow-hidden rounded-[20px] sm:rounded-[26px] border border-white/[0.09] bg-gradient-to-b from-[#0A1324]/92 via-[#08101F]/95 to-[#060C18]/98 px-3 py-4 sm:px-7 sm:py-7 shadow-[0_24px_64px_-28px_rgba(1,5,18,0.92)]"
      >
        <div className="relative z-10">
          {/* ROW 1 — 3 Compact Equal Board of Directors (Horizontal executive cards on mobile, 3 equal squares on sm+) */}
          <div className="space-y-3 sm:space-y-4" data-testid="team-board-row">
            <div className="flex items-center justify-center gap-2.5 sm:gap-3">
              <GovernanceHeadingBracket side={isRtl ? 'end' : 'start'} accentHex="#28CF77" />
              <h2 className="text-[13px] sm:text-[15px] font-bold text-[#F5F8FC] tracking-wide">
                {isRtl ? 'هیئت مدیره' : 'Board of Directors'}
              </h2>
              <GovernanceHeadingBracket side={isRtl ? 'start' : 'end'} accentHex="#28CF77" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-5 lg:gap-6 w-full mx-auto">
              {boardSlots.map((boardMember, idx) => (
                <GovernanceSquareMonolith
                  key={boardMember ? boardMember.id : `board-slot-${idx + 1}`}
                  variant="ceo"
                  member={boardMember}
                  slotIndex={idx + 1}
                  locale={locale}
                  onSelectResume={setSelectedResumeMember}
                />
              ))}
            </div>
          </div>

          {/* Precision Architectural Load-Transfer Truss: 3 Board Squares → 2 Inspector Squares */}
          <GovernanceToInspectorConduit />

          <div className="sm:hidden h-4" aria-hidden="true" />

          {/* ROW 2 — 2 Compact Equal Inspector Squares Centered Directly Below (Side-by-side 2-up on mobile too!) */}
          <div className="space-y-3 sm:space-y-4" data-testid="team-inspectors-row">
            <div className="flex items-center justify-center gap-2.5 sm:gap-3">
              <GovernanceHeadingBracket side={isRtl ? 'end' : 'start'} accentHex="#93BCFF" />
              <h2 className="text-[13px] sm:text-[15px] font-bold text-[#E6EFFA] tracking-wide">
                {isRtl ? 'بازرسان' : 'Inspectors'}
              </h2>
              <GovernanceHeadingBracket side={isRtl ? 'start' : 'end'} accentHex="#93BCFF" />
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:gap-4 max-w-[340px] sm:max-w-[432px] mx-auto">
              {inspectorSlots.map((inspectorMember, idx) => (
                <GovernanceSquareMonolith
                  key={inspectorMember ? inspectorMember.id : `inspector-slot-${idx + 1}`}
                  variant="inspector"
                  member={inspectorMember}
                  slotIndex={idx + 1}
                  locale={locale}
                  onSelectResume={setSelectedResumeMember}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          FULL-WIDTH ARCHITECTURAL SCALE-RULE DIVIDER & 3-DEPARTMENT STRUCTURAL TRUSS
          ROW 3 — 3 SPECIALIZED DEPARTMENTS IN 3 VERTICAL COLUMNS
         ===================================================================== */}
      <div className="space-y-3.5 sm:space-y-4 lg:space-y-0">
        <ArchitecturalSectionDivider
          testId="team-governance-divider"
          label={isRtl ? 'دپارتمان‌های تخصصی گروه' : 'Specialized Departments'}
          showThreeBranchManifold
        />

        <div
          data-testid="team-departments-columns"
          className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-7 items-start"
        >
          {hierarchy.departments.map((branch) => (
            <DepartmentVerticalColumn
              key={branch.slug}
              branch={branch}
              locale={locale}
              isHovered={hoveredDept === branch.slug}
              onHover={setHoveredDept}
              onSelectResume={setSelectedResumeMember}
            />
          ))}
        </div>
      </div>

      {/* Optional Cross-Department Group Advisors (when assigned without a specific department) */}
      {hierarchy.generalAdvisors.length > 0 && (
        <section
          data-testid="team-general-advisors"
          className="rounded-[24px] border border-white/[0.1] bg-[#091325]/90 p-5 sm:p-6 space-y-4"
        >
          <div className="flex items-center gap-2 text-sm font-bold text-[#E7F0FC] border-b border-white/[0.08] pb-3">
            <BookOpen className="w-4 h-4 text-[#28CF77]" />
            <span>{isRtl ? 'مشاوران گروه' : 'Group Advisors'}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {hierarchy.generalAdvisors.map((advisor) => {
              const advisorName = isRtl ? advisor.nameFa : advisor.nameEn;
              const advisorRole = isRtl ? advisor.roleFa : advisor.roleEn;
              const hasPhoto = Boolean(advisor.portraitUrl?.trim());
              const canOpenResume = hasPublicResume(advisor);
              return (
                <article
                  key={advisor.id}
                  className="rounded-[16px] border border-white/[0.09] bg-white/[0.025] p-3.5 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-[12px] overflow-hidden border border-[#28CF77]/40 bg-[#0E1930] flex items-center justify-center shrink-0">
                      {hasPhoto ? (
                        <SafeImage
                          src={advisor.portraitUrl!}
                          alt={advisorName}
                          className="w-full h-full object-cover object-top"
                        />
                      ) : (
                        <span className="text-xs font-bold text-[#28CF77]">
                          {getMemberMonogram(advisorName)}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#F5F8FC] truncate">{advisorName}</p>
                      <p className="text-xs text-[#9BB0CC] line-clamp-1">{advisorRole}</p>
                    </div>
                  </div>
                  {canOpenResume && (
                    <button
                      type="button"
                      onClick={() => setSelectedResumeMember(advisor)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#28CF77] hover:text-white shrink-0 cursor-pointer"
                    >
                      <span>{isRtl ? 'رزومه' : 'CV'}</span>
                      <ArrowIcon className="w-3 h-3" />
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* =====================================================================
          ROW 4 — PARTNERS & AFFILIATED COMPANIES (ROW-BY-ROW DIRECTORY)
         ===================================================================== */}
      <PartnersAffiliatesDirectory locale={locale} partners={partnersSource} />

      {/* Resume Modal */}
      {selectedResumeMember && (
        <MemberResumeModal
          member={selectedResumeMember}
          locale={locale}
          onClose={() => setSelectedResumeMember(null)}
        />
      )}
    </div>
  );
}
