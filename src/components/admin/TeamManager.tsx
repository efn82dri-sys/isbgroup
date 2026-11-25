import React, { useEffect, useState } from 'react';
import {
  Edit3,
  FileText,
  Save,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  X,
} from '../icons/IsbIcons';
import { ASSETS } from '../../data/assets';
import {
  deleteTeamMember,
  saveSiteSettings,
  saveTeamMember,
} from '../../services/contentStore';
import type {
  DisciplineSlug,
  Locale,
  SiteSettings,
  TeamMember,
  TeamMemberTier,
} from '../../types/content';
import { getMemberMonogram, isExecutiveOrBoardTier, resolveMemberTier } from '../../utils/teamTree';
import {
  hasErrors,
  validateTeamMemberForm,
  type FieldErrors,
  type TeamMemberFormInput,
} from '../../utils/validation';
import { SafeImage } from '../BrandMark';
import { ImageUploaderField } from './ImageUploaderField';

const DISCIPLINE_OPTIONS: {
  value: DisciplineSlug | 'leadership';
  fa: string;
  en: string;
  accent: string;
}[] = [
  {
    value: 'leadership',
    fa: 'هیئت مدیره، بازرسان و مشاوران کلان (مستقل از دپارتمان)',
    en: 'Board, Inspectors & Group Advisors (Department-Independent)',
    accent: '#28CF77',
  },
  {
    value: 'architecture-urbanism',
    fa: '۰۱ · دپارتمان معماری و شهرسازی',
    en: '01 · Architecture & Urbanism',
    accent: '#6F9BFF',
  },
  {
    value: 'energy-mep',
    fa: '۰۲ · دپارتمان انرژی و تأسیسات',
    en: '02 · Energy & MEP',
    accent: '#28CF77',
  },
  {
    value: 'structure-seismic',
    fa: '۰۳ · دپارتمان سازه و مهندسی زلزله',
    en: '03 · Structure & Seismic',
    accent: '#93BCFF',
  },
];

interface MemberEditorState {
  existingId?: string;
  nameFa: string;
  nameEn: string;
  roleFa: string;
  roleEn: string;
  discipline: DisciplineSlug | 'leadership';
  tier: TeamMemberTier;
  bioFa: string;
  bioEn: string;
  specialtiesFa: string;
  specialtiesEn: string;
  resumeFa: string;
  resumeEn: string;
  linkedinUrl: string;
  portraitUrl: string;
  order: number;
  status: 'draft' | 'published';
}

function createEmptyMember(
  nextOrder: number,
  initialTier: TeamMemberTier = 'member'
): MemberEditorState {
  const isTopGovernance = initialTier === 'ceo' || initialTier === 'inspector';
  return {
    nameFa: '',
    nameEn: '',
    roleFa:
      initialTier === 'ceo'
        ? 'عضو هیئت مدیره'
        : initialTier === 'inspector'
          ? 'بازرس'
          : initialTier === 'advisor'
            ? 'مشاور تخصصی'
            : '',
    roleEn:
      initialTier === 'ceo'
        ? 'Board Member'
        : initialTier === 'inspector'
          ? 'Inspector'
          : initialTier === 'advisor'
            ? 'Advisor'
            : '',
    discipline: isTopGovernance ? 'leadership' : 'architecture-urbanism',
    tier: initialTier,
    bioFa: '',
    bioEn: '',
    specialtiesFa: '',
    specialtiesEn: '',
    resumeFa: '',
    resumeEn: '',
    linkedinUrl: '',
    portraitUrl: '',
    order: nextOrder,
    status: 'published',
  };
}

function memberToEditor(m: TeamMember): MemberEditorState {
  return {
    existingId: m.id,
    nameFa: m.nameFa,
    nameEn: m.nameEn,
    roleFa: m.roleFa,
    roleEn: m.roleEn,
    discipline: m.discipline,
    tier: resolveMemberTier(m),
    bioFa: m.bioFa ?? '',
    bioEn: m.bioEn ?? '',
    specialtiesFa: m.specialtiesFa ?? '',
    specialtiesEn: m.specialtiesEn ?? '',
    resumeFa: m.resumeFa ?? '',
    resumeEn: m.resumeEn ?? '',
    linkedinUrl: m.linkedinUrl ?? '',
    portraitUrl: m.portraitUrl ?? '',
    order: m.order,
    status: m.status,
  };
}

interface TeamManagerProps {
  locale: Locale;
  teamMembers: TeamMember[];
  settings: SiteSettings;
  onRefresh: () => Promise<void>;
  onBanner: (text: string, tone?: 'info' | 'success' | 'error') => void;
}

export function TeamManager({
  locale,
  teamMembers,
  settings,
  onRefresh,
  onBanner,
}: TeamManagerProps) {
  const isFa = locale === 'fa';

  // Main Team Group Photo state
  const [groupImage, setGroupImage] = useState(settings.teamCoverImage ?? '');
  const [groupCaptionFa, setGroupCaptionFa] = useState(settings.teamCoverCaptionFa ?? '');
  const [groupCaptionEn, setGroupCaptionEn] = useState(settings.teamCoverCaptionEn ?? '');
  const [savingBanner, setSavingBanner] = useState(false);

  useEffect(() => {
    setGroupImage(settings.teamCoverImage ?? '');
    setGroupCaptionFa(settings.teamCoverCaptionFa ?? '');
    setGroupCaptionEn(settings.teamCoverCaptionEn ?? '');
  }, [settings]);

  // Member Editor state
  const [editor, setEditor] = useState<MemberEditorState | null>(null);
  const [errors, setErrors] = useState<FieldErrors<TeamMemberFormInput>>({});
  const [savingMember, setSavingMember] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleSaveTeamBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBanner(true);
    try {
      await saveSiteSettings({
        ...settings,
        teamCoverImage: groupImage,
        teamCoverCaptionFa: groupCaptionFa,
        teamCoverCaptionEn: groupCaptionEn,
      });
      await onRefresh();
      onBanner(
        isFa
          ? 'تصویر اصلی تیم با موفقیت ذخیره و در صفحه اصلی و صفحه تیم اعمال شد.'
          : 'Main team group photo updated on Home and Team pages.',
        'success'
      );
    } catch {
      onBanner(
        isFa ? 'خطا در ذخیره تصویر اصلی تیم.' : 'Could not save main team photo.',
        'error'
      );
    } finally {
      setSavingBanner(false);
    }
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editor) return;

    const effectiveTier: TeamMemberTier =
      editor.tier === 'ceo'
        ? 'ceo'
        : editor.tier === 'inspector'
          ? 'inspector'
          : editor.tier === 'advisor'
            ? 'advisor'
            : editor.discipline === 'leadership'
              ? 'ceo'
              : editor.tier === 'director'
                ? 'board'
                : editor.tier;
    const isTopGovernance = effectiveTier === 'ceo' || effectiveTier === 'inspector';
    const effectiveDiscipline: DisciplineSlug | 'leadership' = isTopGovernance
      ? 'leadership'
      : effectiveTier === 'advisor'
        ? editor.discipline
        : editor.discipline === 'leadership'
          ? 'architecture-urbanism'
          : editor.discipline;
    const isExecOrBoard = isExecutiveOrBoardTier(effectiveTier);
    const keepSpecialties = isExecOrBoard || effectiveTier === 'specialist';

    const validationErrors = validateTeamMemberForm(
      !isExecOrBoard
        ? {
            nameFa: editor.nameFa,
            nameEn: editor.nameEn,
            roleFa: editor.roleFa,
            roleEn: editor.roleEn,
            portraitUrl: editor.portraitUrl,
          }
        : editor,
      locale
    );
    setErrors(validationErrors);
    if (hasErrors(validationErrors)) {
      onBanner(
        isFa
          ? 'لطفاً فیلدهای مشخص‌شده پروفایل عضو تیم را تکمیل کنید.'
          : 'Please complete the highlighted team member fields.',
        'error'
      );
      return;
    }

    setSavingMember(true);
    try {
      await saveTeamMember(
        {
          nameFa: editor.nameFa,
          nameEn: editor.nameEn,
          roleFa: editor.roleFa,
          roleEn: editor.roleEn,
          discipline: effectiveDiscipline,
          tier: effectiveTier,
          bioFa: isExecOrBoard ? editor.bioFa : '',
          bioEn: isExecOrBoard ? editor.bioEn : '',
          specialtiesFa: keepSpecialties ? editor.specialtiesFa : '',
          specialtiesEn: keepSpecialties ? editor.specialtiesEn : '',
          resumeFa: isExecOrBoard ? editor.resumeFa : '',
          resumeEn: isExecOrBoard ? editor.resumeEn : '',
          linkedinUrl: isExecOrBoard ? editor.linkedinUrl : '',
          portraitUrl: editor.portraitUrl,
          order: editor.order,
          status: editor.status,
        },
        editor.existingId
      );
      await onRefresh();
      setEditor(null);
      setErrors({});
      onBanner(
        isFa ? 'پروفایل عضو تیم با موفقیت ذخیره شد.' : 'Team member profile saved.',
        'success'
      );
    } catch {
      onBanner(
        isFa ? 'خطا در ذخیره پروفایل عضو تیم.' : 'Could not save team member.',
        'error'
      );
    } finally {
      setSavingMember(false);
    }
  };

  const handleDeleteMember = async (id: string) => {
    try {
      await deleteTeamMember(id);
      setConfirmDeleteId(null);
      await onRefresh();
      onBanner(isFa ? 'عضو تیم حذف شد.' : 'Team member deleted.', 'success');
    } catch {
      onBanner(isFa ? 'خطا در حذف عضو تیم.' : 'Could not delete team member.', 'error');
    }
  };

  const effectiveEditorTier: TeamMemberTier =
    editor?.tier === 'ceo'
      ? 'ceo'
      : editor?.tier === 'inspector'
        ? 'inspector'
        : editor?.tier === 'advisor'
          ? 'advisor'
          : editor?.discipline === 'leadership'
            ? 'ceo'
            : editor?.tier === 'director'
              ? 'board'
              : editor?.tier ?? 'member';
  const editorIsTopGovernance =
    effectiveEditorTier === 'ceo' || effectiveEditorTier === 'inspector';
  const editorIsExecOrBoard = isExecutiveOrBoardTier(effectiveEditorTier);

  return (
    <div className="space-y-8">
      {/* 1. Main Studio / Group Photo Card */}
      <form
        onSubmit={handleSaveTeamBanner}
        className="glass-surface rounded-3xl p-6 sm:p-7 space-y-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#223A87]/28 border border-[#6F9BFF]/38 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-[#6F9BFF]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#F5F8FC]">
                {isFa ? 'تصویر اصلی تیم و فضای استودیو' : 'Main Team & Studio Cover Photo'}
              </h2>
              <p className="text-xs text-[#8B9DB7] mt-0.5">
                {isFa
                  ? 'این تصویر در بخش «تیم ما» صفحه اصلی و بالای صفحه تیم نمایش داده می‌شود.'
                  : 'Displayed on the Home page Team section and the top banner of the Team page.'}
              </p>
            </div>
          </div>
        </div>

        <ImageUploaderField
          locale={locale}
          label={isFa ? 'عکس گروهی تیم / استودیو' : 'Team Group Photo'}
          value={groupImage || ASSETS.teamStudio}
          preset="team-banner"
          aspectClass="aspect-[16/9]"
          onChange={(url) => setGroupImage(url)}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="space-y-1.5 text-xs text-[#C6D2E3]">
            <span>{isFa ? 'زیرنویس تصویر (فارسی - اختیاری)' : 'Caption (FA - optional)'}</span>
            <input
              type="text"
              dir="rtl"
              value={groupCaptionFa}
              onChange={(e) => setGroupCaptionFa(e.target.value)}
              placeholder="مثال: تیم چندرشته‌ای گروه ISB — دفتر مشهد"
              className="w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2.5 text-sm text-[#F5F8FC]"
            />
          </label>
          <label className="space-y-1.5 text-xs text-[#C6D2E3]">
            <span>{isFa ? 'زیرنویس تصویر (انگلیسی - اختیاری)' : 'Caption (EN - optional)'}</span>
            <input
              type="text"
              dir="ltr"
              value={groupCaptionEn}
              onChange={(e) => setGroupCaptionEn(e.target.value)}
              placeholder="e.g. ISB Group Interdisciplinary Studio — Mashhad"
              className="w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2.5 text-sm text-[#F5F8FC]"
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={savingBanner}
            className="glass-cta min-h-[42px] inline-flex items-center gap-2 rounded-full px-6 py-2 text-xs font-semibold disabled:opacity-60"
          >
            <Save className="w-3.5 h-3.5" />
            <span>
              {savingBanner
                ? isFa
                  ? 'در حال ذخیره...'
                  : 'Saving...'
                : isFa
                  ? 'ذخیره تصویر اصلی تیم'
                  : 'Save Main Team Photo'}
            </span>
          </button>
          {groupImage && (
            <button
              type="button"
              onClick={() => setGroupImage('')}
              className="glass-pill min-h-[42px] rounded-full px-4 py-2 text-xs text-[#C6D2E3]"
            >
              {isFa ? 'بازگردانی به تصویر پیش‌فرض' : 'Reset to Default'}
            </button>
          )}
        </div>
      </form>

      {/* 2. Organizational Tree Roster Section */}
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[#F5F8FC]">
              {isFa
                ? `ساختار درختی اعضای تیم (${teamMembers.length})`
                : `Team Organizational Tree (${teamMembers.length})`}
            </h2>
            <p className="text-xs text-[#8B9DB7] mt-0.5">
              {isFa
                ? '۳ عضو هیئت مدیره در ردیف اول، ۲ بازرس در ردیف دوم و سپس راهبران ارشد، اعضای دپارتمان و مشاوران هر ۳ دپارتمان را مدیریت کنید.'
                : 'Manage Board of Directors, Inspectors, and each department’s Senior Leads, Members, and Advisors.'}
            </p>
          </div>
          {!editor && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setErrors({});
                  setEditor(createEmptyMember(teamMembers.length + 1, 'ceo'));
                }}
                className="glass-cta-emerald min-h-[40px] inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>{isFa ? 'افزودن عضو هیئت مدیره' : 'Add Board Member'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setErrors({});
                  setEditor(createEmptyMember(teamMembers.length + 1, 'inspector'));
                }}
                className="glass-pill min-h-[40px] inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-[#93BCFF] border border-[#93BCFF]/40"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>{isFa ? 'افزودن بازرس' : 'Add Inspector'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setErrors({});
                  setEditor(createEmptyMember(teamMembers.length + 1, 'board'));
                }}
                className="glass-cta min-h-[40px] inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>{isFa ? 'افزودن راهبر ارشد' : 'Add Senior Lead'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setErrors({});
                  setEditor(createEmptyMember(teamMembers.length + 1, 'member'));
                }}
                className="glass-pill min-h-[40px] inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-[#F5F8FC]"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{isFa ? 'افزودن عضو دپارتمان' : 'Add Member'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setErrors({});
                  setEditor(createEmptyMember(teamMembers.length + 1, 'advisor'));
                }}
                className="glass-pill min-h-[40px] inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-[#28CF77] border border-[#28CF77]/35"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{isFa ? 'افزودن مشاور' : 'Add Advisor'}</span>
              </button>
            </div>
          )}
        </div>

        {editor ? (
          <form
            onSubmit={handleSaveMember}
            noValidate
            className="glass-surface rounded-3xl p-6 sm:p-8 space-y-6"
          >
            <div className="flex items-center justify-between gap-3 border-b border-white/12 pb-4">
              <h3 className="text-base font-semibold text-[#F5F8FC]">
                {editor.existingId
                  ? isFa
                    ? 'ویرایش پروفایل عضو تیم'
                    : 'Edit Team Member'
                  : isFa
                    ? 'افزودن عضو جدید به ساختار چهارسطحی تیم'
                    : 'New Team Member Profile'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setEditor(null);
                  setErrors({});
                }}
                className="glass-pill min-h-[36px] inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs text-[#C6D2E3]"
              >
                <X className="w-3.5 h-3.5" />
                <span>{isFa ? 'بازگشت' : 'Back'}</span>
              </button>
            </div>

            {/* Organizational Tier Selector */}
            <div className="space-y-2.5">
              <span className="text-xs font-semibold text-[#C6D2E3]">
                {isFa ? 'جایگاه سازمانی در ساختار تیم *' : 'Organizational Tier *'}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
                {(
                  [
                    {
                      tier: 'ceo' as TeamMemberTier,
                      titleFa: 'هیئت مدیره',
                      titleEn: 'Board of Directors',
                      descFa: '۳ مربع ردیف بالا (مستقل از دپارتمان).',
                      descEn: 'Top 3 equal squares.',
                    },
                    {
                      tier: 'inspector' as TeamMemberTier,
                      titleFa: 'بازرس',
                      titleEn: 'Inspector',
                      descFa: '۲ مربع زیر هیئت مدیره.',
                      descEn: '2 squares beneath Board.',
                    },
                    {
                      tier: 'board' as TeamMemberTier,
                      titleFa: 'راهبر ارشد دپارتمان',
                      titleEn: 'Senior Lead',
                      descFa: 'بالای ستون دپارتمان با رزومه.',
                      descEn: 'Top of department column.',
                    },
                    {
                      tier: 'specialist' as TeamMemberTier,
                      titleFa: 'متخصص دپارتمان',
                      titleEn: 'Specialist',
                      descFa: 'در بخش اعضای دپارتمان.',
                      descEn: 'Department specialist.',
                    },
                    {
                      tier: 'member' as TeamMemberTier,
                      titleFa: 'عضو دپارتمان',
                      titleEn: 'Member',
                      descFa: 'در بخش اعضای دپارتمان.',
                      descEn: 'Department member.',
                    },
                    {
                      tier: 'advisor' as TeamMemberTier,
                      titleFa: 'مشاور',
                      titleEn: 'Advisor',
                      descFa: 'در بخش مشاوران پس از اعضا.',
                      descEn: 'Advisors section after members.',
                    },
                  ] as const
                ).map((item) => {
                  const active = effectiveEditorTier === item.tier;
                  return (
                    <button
                      key={item.tier}
                      type="button"
                      onClick={() => {
                        const nextIsTop = item.tier === 'ceo' || item.tier === 'inspector';
                        setEditor({
                          ...editor,
                          tier: item.tier,
                          discipline: nextIsTop
                            ? 'leadership'
                            : item.tier === 'advisor'
                              ? editor.discipline
                              : editor.discipline === 'leadership'
                                ? 'architecture-urbanism'
                                : editor.discipline,
                          roleFa:
                            !editor.roleFa.trim() && item.tier === 'ceo'
                              ? 'عضو هیئت مدیره'
                              : !editor.roleFa.trim() && item.tier === 'inspector'
                                ? 'بازرس'
                                : !editor.roleFa.trim() && item.tier === 'advisor'
                                  ? 'مشاور تخصصی'
                                  : editor.roleFa,
                          roleEn:
                            !editor.roleEn.trim() && item.tier === 'ceo'
                              ? 'Board Member'
                              : !editor.roleEn.trim() && item.tier === 'inspector'
                                ? 'Inspector'
                                : !editor.roleEn.trim() && item.tier === 'advisor'
                                  ? 'Advisor'
                                  : editor.roleEn,
                        });
                      }}
                      className={`rounded-2xl border p-3 text-start transition-all cursor-pointer ${
                        active
                          ? 'border-[#28CF77] bg-[#00A651]/20 text-white'
                          : 'border-white/12 bg-black/25 text-[#C6D2E3] hover:border-white/25'
                      }`}
                    >
                      <span className="block text-xs font-bold">{isFa ? item.titleFa : item.titleEn}</span>
                      <p className="text-[11px] text-[#9BB0CC] mt-1 leading-relaxed">
                        {isFa ? item.descFa : item.descEn}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <ImageUploaderField
              locale={locale}
              label={isFa ? 'عکس پرتره شخص' : 'Member Portrait Photo'}
              value={editor.portraitUrl}
              preset="portrait"
              aspectClass="aspect-square max-w-[200px]"
              error={errors.portraitUrl}
              onChange={(url) => {
                setEditor({ ...editor, portraitUrl: url });
                if (errors.portraitUrl) setErrors({ ...errors, portraitUrl: undefined });
              }}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <label className="space-y-1.5 text-xs text-[#C6D2E3]">
                <span>{isFa ? 'نام و نام خانوادگی (فارسی) *' : 'Full Name (FA) *'}</span>
                <input
                  type="text"
                  dir="rtl"
                  value={editor.nameFa}
                  onChange={(e) => {
                    setEditor({ ...editor, nameFa: e.target.value });
                    if (errors.nameFa) setErrors({ ...errors, nameFa: undefined });
                  }}
                  placeholder="مثال: مهندس آرش رضایی"
                  className="w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2.5 text-sm text-[#F5F8FC]"
                />
                {errors.nameFa && <p className="text-[11px] text-amber-300">{errors.nameFa}</p>}
              </label>

              <label className="space-y-1.5 text-xs text-[#C6D2E3]">
                <span>{isFa ? 'نام و نام خانوادگی (انگلیسی) *' : 'Full Name (EN) *'}</span>
                <input
                  type="text"
                  dir="ltr"
                  value={editor.nameEn}
                  onChange={(e) => {
                    setEditor({ ...editor, nameEn: e.target.value });
                    if (errors.nameEn) setErrors({ ...errors, nameEn: undefined });
                  }}
                  placeholder="e.g. Arash Rezaei"
                  className="w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2.5 text-sm text-[#F5F8FC]"
                />
                {errors.nameEn && <p className="text-[11px] text-amber-300">{errors.nameEn}</p>}
              </label>

              <label className="space-y-1.5 text-xs text-[#C6D2E3]">
                <span>{isFa ? 'دپارتمان / شاخه سازمانی' : 'Department Branch'}</span>
                <select
                  value={editorIsTopGovernance ? 'leadership' : editor.discipline}
                  disabled={editorIsTopGovernance}
                  onChange={(e) => {
                    const nextDisc = e.target.value as DisciplineSlug | 'leadership';
                    setEditor({
                      ...editor,
                      discipline: nextDisc,
                      tier:
                        nextDisc === 'leadership'
                          ? editor.tier === 'inspector'
                            ? 'inspector'
                            : 'ceo'
                          : editor.tier === 'ceo' || editor.tier === 'inspector'
                            ? 'board'
                            : editor.tier,
                    });
                  }}
                  className="w-full rounded-xl border border-white/15 bg-[#0E1626] px-3 py-2.5 text-sm text-[#F5F8FC] disabled:opacity-65"
                >
                  {DISCIPLINE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {isFa ? opt.fa : opt.en}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1.5 text-xs text-[#C6D2E3]">
                <span>{isFa ? 'سمت / عنوان شغلی (فارسی) *' : 'Role Title (FA) *'}</span>
                <input
                  type="text"
                  dir="rtl"
                  value={editor.roleFa}
                  onChange={(e) => {
                    setEditor({ ...editor, roleFa: e.target.value });
                    if (errors.roleFa) setErrors({ ...errors, roleFa: undefined });
                  }}
                  placeholder={
                    editorIsExecOrBoard
                      ? 'مثال: عضو هیئت مدیره و راهبر معماری'
                      : 'مثال: کارشناس شبیه‌سازی انرژی'
                  }
                  className="w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2.5 text-sm text-[#F5F8FC]"
                />
                {errors.roleFa && <p className="text-[11px] text-amber-300">{errors.roleFa}</p>}
              </label>

              <label className="space-y-1.5 text-xs text-[#C6D2E3]">
                <span>{isFa ? 'سمت / عنوان شغلی (انگلیسی) *' : 'Role Title (EN) *'}</span>
                <input
                  type="text"
                  dir="ltr"
                  value={editor.roleEn}
                  onChange={(e) => {
                    setEditor({ ...editor, roleEn: e.target.value });
                    if (errors.roleEn) setErrors({ ...errors, roleEn: undefined });
                  }}
                  placeholder={
                    editorIsExecOrBoard
                      ? 'e.g. Board Member & Architecture Lead'
                      : 'e.g. Energy Simulation Specialist'
                  }
                  className="w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2.5 text-sm text-[#F5F8FC]"
                />
                {errors.roleEn && <p className="text-[11px] text-amber-300">{errors.roleEn}</p>}
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1.5 text-xs text-[#C6D2E3]">
                  <span>{isFa ? 'ترتیب نمایش' : 'Order'}</span>
                  <input
                    type="number"
                    min={0}
                    max={999}
                    value={editor.order}
                    onChange={(e) => setEditor({ ...editor, order: Number(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2.5 text-sm text-[#F5F8FC]"
                  />
                </label>
                <label className="space-y-1.5 text-xs text-[#C6D2E3]">
                  <span>{isFa ? 'وضعیت' : 'Status'}</span>
                  <select
                    value={editor.status}
                    onChange={(e) =>
                      setEditor({ ...editor, status: e.target.value as 'draft' | 'published' })
                    }
                    className="w-full rounded-xl border border-white/15 bg-[#0E1626] px-3 py-2.5 text-xs text-[#F5F8FC]"
                  >
                    <option value="published">{isFa ? 'منتشرشده' : 'Published'}</option>
                    <option value="draft">{isFa ? 'پیش‌نویس' : 'Draft'}</option>
                  </select>
                </label>
              </div>
            </div>

            {/* Extended Resume & Specialties — CEO & Board tiers; Skill domain for Specialist tier */}
            {editorIsExecOrBoard ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/10">
                <div className="md:col-span-2">
                  <p className="text-xs font-semibold text-[#6F9BFF]">
                    {isFa
                      ? 'اطلاعات تکمیلی و رزومه رسمی (نمایش در پنجره رزومه)'
                      : 'Executive / Board Credentials & Full Resume (Displayed in CV Modal)'}
                  </p>
                </div>

                <label className="space-y-1.5 text-xs text-[#C6D2E3]">
                  <span>
                    {isFa
                      ? 'تخصص‌ها و مهارت‌ها (فارسی - با ویرگول جدا کنید)'
                      : 'Specialties (FA - comma separated)'}
                  </span>
                  <input
                    type="text"
                    dir="rtl"
                    value={editor.specialtiesFa}
                    onChange={(e) => setEditor({ ...editor, specialtiesFa: e.target.value })}
                    placeholder="طراحی اقلیمی، مدل‌سازی انرژی، BIM، معماری پایدار"
                    className="w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2.5 text-sm text-[#F5F8FC]"
                  />
                </label>
                <label className="space-y-1.5 text-xs text-[#C6D2E3]">
                  <span>
                    {isFa
                      ? 'تخصص‌ها و مهارت‌ها (انگلیسی - با کاما جدا کنید)'
                      : 'Specialties (EN - comma separated)'}
                  </span>
                  <input
                    type="text"
                    dir="ltr"
                    value={editor.specialtiesEn}
                    onChange={(e) => setEditor({ ...editor, specialtiesEn: e.target.value })}
                    placeholder="Climate Design, Energy Modeling, BIM, Sustainable Architecture"
                    className="w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2.5 text-sm text-[#F5F8FC]"
                  />
                </label>

                <label className="space-y-1.5 text-xs text-[#C6D2E3]">
                  <span>{isFa ? 'معرفی کوتاه (فارسی)' : 'Short Bio (FA)'}</span>
                  <textarea
                    rows={3}
                    dir="rtl"
                    value={editor.bioFa}
                    onChange={(e) => setEditor({ ...editor, bioFa: e.target.value })}
                    placeholder="خلاصه‌ای کوتاه که زیر نام نمایش داده می‌شود..."
                    className="w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2.5 text-sm text-[#F5F8FC]"
                  />
                </label>
                <label className="space-y-1.5 text-xs text-[#C6D2E3]">
                  <span>{isFa ? 'معرفی کوتاه (انگلیسی)' : 'Short Bio (EN)'}</span>
                  <textarea
                    rows={3}
                    dir="ltr"
                    value={editor.bioEn}
                    onChange={(e) => setEditor({ ...editor, bioEn: e.target.value })}
                    placeholder="Brief executive bio shown on the node..."
                    className="w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2.5 text-sm text-[#F5F8FC]"
                  />
                </label>

                <label className="space-y-1.5 text-xs text-[#C6D2E3]">
                  <span>
                    {isFa
                      ? 'رزومه، تحصیلات و سوابق حرفه‌ای کامل (فارسی)'
                      : 'Full Resume, Education & Experience (FA)'}
                  </span>
                  <textarea
                    rows={5}
                    dir="rtl"
                    value={editor.resumeFa}
                    onChange={(e) => setEditor({ ...editor, resumeFa: e.target.value })}
                    placeholder="تحصیلات دانشگاهی، سوابق اجرایی، پروژه‌های شاخص، گواهینامه‌ها و افتخارات..."
                    className="w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2.5 text-sm text-[#F5F8FC] leading-relaxed"
                  />
                  {errors.resumeFa && <p className="text-[11px] text-amber-300">{errors.resumeFa}</p>}
                </label>

                <label className="space-y-1.5 text-xs text-[#C6D2E3]">
                  <span>
                    {isFa
                      ? 'رزومه، تحصیلات و سوابق حرفه‌ای کامل (انگلیسی)'
                      : 'Full Resume, Education & Experience (EN)'}
                  </span>
                  <textarea
                    rows={5}
                    dir="ltr"
                    value={editor.resumeEn}
                    onChange={(e) => setEditor({ ...editor, resumeEn: e.target.value })}
                    placeholder="Education, career experience, key projects, certifications..."
                    className="w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2.5 text-sm text-[#F5F8FC] leading-relaxed"
                  />
                  {errors.resumeEn && <p className="text-[11px] text-amber-300">{errors.resumeEn}</p>}
                </label>

                <label className="space-y-1.5 text-xs text-[#C6D2E3] md:col-span-2">
                  <span>{isFa ? 'لینک لینکدین یا پورتفولیو (اختیاری)' : 'LinkedIn / Portfolio URL (optional)'}</span>
                  <input
                    type="url"
                    dir="ltr"
                    value={editor.linkedinUrl}
                    onChange={(e) => setEditor({ ...editor, linkedinUrl: e.target.value })}
                    placeholder="https://www.linkedin.com/in/..."
                    className="w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2.5 text-sm text-[#F5F8FC]"
                  />
                  {errors.linkedinUrl && (
                    <p className="text-[11px] text-amber-300">{errors.linkedinUrl}</p>
                  )}
                </label>
              </div>
            ) : effectiveEditorTier === 'specialist' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/10">
                <div className="md:col-span-2">
                  <p className="text-xs font-semibold text-[#28CF77]">
                    {isFa
                      ? 'حوزه مهارت اصلی (برای دسته‌بندی سطح ۰۳ در نمودار سازمانی)'
                      : 'Primary Skill Domain (Used to Group Level 03 Specialists)'}
                  </p>
                </div>
                <label className="space-y-1.5 text-xs text-[#C6D2E3]">
                  <span>{isFa ? 'مهارت / حوزه تخصصی (فارسی)' : 'Skill Domain (FA)'}</span>
                  <input
                    type="text"
                    dir="rtl"
                    value={editor.specialtiesFa}
                    onChange={(e) => setEditor({ ...editor, specialtiesFa: e.target.value })}
                    placeholder="مثال: شبیه‌سازی انرژی و نور روز"
                    className="w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2.5 text-sm text-[#F5F8FC]"
                  />
                </label>
                <label className="space-y-1.5 text-xs text-[#C6D2E3]">
                  <span>{isFa ? 'مهارت / حوزه تخصصی (انگلیسی)' : 'Skill Domain (EN)'}</span>
                  <input
                    type="text"
                    dir="ltr"
                    value={editor.specialtiesEn}
                    onChange={(e) => setEditor({ ...editor, specialtiesEn: e.target.value })}
                    placeholder="e.g. Energy & Daylight Simulation"
                    className="w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2.5 text-sm text-[#F5F8FC]"
                  />
                </label>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/12 bg-white/[0.03] px-4 py-3 text-xs text-[#C6D2E3] leading-relaxed">
                {isFa
                  ? 'این شخص به‌عنوان «عضو دپارتمان (سطح ۰۴)» با پروفایل ساده (عکس، نام و سمت) در بخش اعضای دپارتمان نمایش داده می‌شود.'
                  : 'This person will appear in the Level 04 Department Staff roster (portrait, name, and role only).'}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={savingMember}
                className="glass-cta min-h-[44px] inline-flex items-center gap-2 rounded-full px-7 py-2.5 text-xs font-semibold disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                <span>
                  {savingMember
                    ? isFa
                      ? 'در حال ذخیره...'
                      : 'Saving...'
                    : isFa
                      ? 'ذخیره پروفایل عضو'
                      : 'Save Member Profile'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditor(null);
                  setErrors({});
                }}
                className="glass-pill min-h-[44px] rounded-full px-5 py-2.5 text-xs text-[#C6D2E3]"
              >
                {isFa ? 'انصراف' : 'Cancel'}
              </button>
            </div>
          </form>
        ) : teamMembers.length === 0 ? (
          <div className="glass-surface rounded-2xl p-10 text-center space-y-3">
            <p className="text-sm text-[#C6D2E3]">
              {isFa
                ? 'هنوز پروفایل عضوی ثبت نشده است. برای ساخت نمودار درختی تیم، ابتدا مدیر هر دپارتمان و سپس اعضای تیم را اضافه کنید.'
                : 'No team member profiles yet. Start by adding each Department Director and then their Specialists.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {DISCIPLINE_OPTIONS.map((dept) => {
              const tierRank: Record<TeamMemberTier, number> = {
                ceo: 0,
                inspector: 1,
                board: 2,
                director: 2,
                specialist: 3,
                member: 4,
                advisor: 5,
              };
              const deptMembers = teamMembers
                .filter((m) => {
                  const t = resolveMemberTier(m);
                  if (dept.value === 'leadership') {
                    return t === 'ceo' || t === 'inspector' || m.discipline === 'leadership';
                  }
                  return m.discipline === dept.value && t !== 'ceo' && t !== 'inspector';
                })
                .sort((a, b) => {
                  const rankA = tierRank[resolveMemberTier(a)] ?? 5;
                  const rankB = tierRank[resolveMemberTier(b)] ?? 5;
                  if (rankA !== rankB) return rankA - rankB;
                  return a.order - b.order;
                });

              if (deptMembers.length === 0) return null;

              return (
                <div key={dept.value} className="space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <h3 className="text-sm font-semibold" style={{ color: dept.accent }}>
                      {isFa ? dept.fa : dept.en}
                    </h3>
                    <span className="text-xs text-[#8B9DB7] font-numeric">
                      {isFa ? `${deptMembers.length} نفر` : `${deptMembers.length} members`}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {deptMembers.map((member) => {
                      const tier = resolveMemberTier(member);
                      const isExec = isExecutiveOrBoardTier(tier);
                      const displayName = isFa ? member.nameFa : member.nameEn;
                      const tierLabel =
                        tier === 'ceo'
                          ? isFa
                            ? 'هیئت مدیره'
                            : 'Board of Directors'
                          : tier === 'inspector'
                            ? isFa
                              ? 'بازرس'
                              : 'Inspector'
                            : tier === 'board' || tier === 'director'
                              ? isFa
                                ? 'راهبر ارشد دپارتمان'
                                : 'Senior Lead'
                              : tier === 'advisor'
                                ? isFa
                                  ? 'مشاور'
                                  : 'Advisor'
                                : tier === 'specialist'
                                  ? isFa
                                    ? 'متخصص دپارتمان'
                                    : 'Specialist'
                                  : isFa
                                    ? 'عضو دپارتمان'
                                    : 'Member';

                      return (
                        <div
                          key={member.id}
                          className={`glass-card rounded-2xl p-4 flex flex-col justify-between gap-4 border ${
                            isExec ? 'border-[#6F9BFF]/32' : 'border-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-3.5">
                            <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/15 bg-black/40 shrink-0">
                              {member.portraitUrl ? (
                                <SafeImage
                                  src={member.portraitUrl}
                                  alt={displayName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-sm font-bold text-[#6F9BFF]">
                                  {getMemberMonogram(displayName)}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 text-[11px]">
                                <span
                                  className={
                                    tier === 'ceo'
                                      ? 'text-[#28CF77] font-bold'
                                      : isExec
                                        ? 'text-[#6F9BFF] font-semibold'
                                        : tier === 'specialist'
                                          ? 'text-[#93BCFF] font-medium'
                                          : 'text-[#9FB0C9] font-medium'
                                  }
                                >
                                  {tierLabel}
                                </span>
                                {member.status === 'draft' && (
                                  <>
                                    <span className="text-white/25">·</span>
                                    <span className="text-amber-300">
                                      {isFa ? 'پیش‌نویس' : 'Draft'}
                                    </span>
                                  </>
                                )}
                              </div>
                              <h4 className="text-sm font-semibold text-[#F5F8FC] truncate mt-0.5">
                                {displayName}
                              </h4>
                              <p className="text-xs text-[#9BB0CC] truncate">
                                {isFa ? member.roleFa : member.roleEn}
                              </p>
                              {isExec && (member.resumeFa || member.resumeEn) && (
                                <p className="text-[11px] text-[#6F9BFF] inline-flex items-center gap-1 mt-1">
                                  <FileText className="w-3 h-3" />
                                  <span>{isFa ? 'دارای رزومه رسمی' : 'Resume attached'}</span>
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setErrors({});
                                setEditor(memberToEditor(member));
                              }}
                              className="glass-pill min-h-[36px] inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium text-[#F5F8FC] hover:border-[#6F9BFF]"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-[#6F9BFF]" />
                              <span>{isFa ? 'ویرایش' : 'Edit'}</span>
                            </button>

                            {confirmDeleteId === member.id ? (
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => void handleDeleteMember(member.id)}
                                  className="rounded-full bg-rose-500/85 hover:bg-rose-500 px-3 py-1 text-[11px] font-semibold text-white"
                                >
                                  {isFa ? 'حذف' : 'Delete'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="px-2 py-1 text-[11px] text-[#C6D2E3]"
                                >
                                  {isFa ? 'لغو' : 'Cancel'}
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(member.id)}
                                aria-label={isFa ? 'حذف عضو' : 'Delete member'}
                                className="p-2 rounded-full text-rose-300/75 hover:text-rose-200 hover:bg-rose-500/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
