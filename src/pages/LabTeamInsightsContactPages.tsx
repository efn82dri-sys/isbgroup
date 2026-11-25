import React, { useMemo, useState } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Clock,
  FlaskConical,
  Images,
  InstagramIcon,
  LinkedinIcon,
  Mail,
  MapPin,
  Phone,
  TelegramIcon,
  WhatsAppIcon,
} from '../components/icons/IsbIcons';
import { ASSETS } from '../data/assets';
import { getCopy } from '../data/translations';
import type {
  Insight,
  InsightTopic,
  Locale,
  PageRoute,
  SiteSettings,
} from '../types/content';
import { buildPath } from '../utils/routing';
import { countInsightMedia, estimateReadingTimeMinutes } from '../utils/insightBlocks';
import { IsbPatternOverlay, SafeImage } from '../components/BrandMark';
import { ProjectInquiryForm, SustainabilityAssessmentForm } from '../components/Forms';
import { InsightEditorialRenderer } from '../components/InsightEditorialRenderer';

const SARO_SABZ_TIERS = [
  {
    id: 'turquoise',
    nameFa: 'سرو فیروزه‌ای',
    nameEn: 'Turquoise Saro',
    rangeFa: '۸۰٪ تا ۱۰۰٪',
    rangeEn: '80% – 100%',
    percent: 100,
    noteFa: 'تراز ممتاز پایداری و نزدیک به صفر انرژی',
    noteEn: 'Benchmark sustainability & near-zero energy',
    barClass: 'bg-[#22D3EE]',
    textClass: 'text-[#22D3EE]',
  },
  {
    id: 'gold',
    nameFa: 'سرو طلایی',
    nameEn: 'Gold Saro',
    rangeFa: '۶۵٪ تا ۷۹٪',
    rangeEn: '65% – 79%',
    percent: 78,
    noteFa: 'عملکرد برتر انرژی، اقلیم و محیط داخلی',
    noteEn: 'Superior energy, climate & indoor performance',
    barClass: 'bg-[#F59E0B]',
    textClass: 'text-[#FBBF24]',
  },
  {
    id: 'silver',
    nameFa: 'سرو نقره‌ای',
    nameEn: 'Silver Saro',
    rangeFa: '۵۰٪ تا ۶۴٪',
    rangeEn: '50% – 64%',
    percent: 62,
    noteFa: 'صرفه‌جویی مؤثر و طراحی اقلیمی یکپارچه',
    noteEn: 'Verified savings & integrated passive design',
    barClass: 'bg-[#94A3B8]',
    textClass: 'text-[#CBD5E1]',
  },
  {
    id: 'green',
    nameFa: 'سرو سبز',
    nameEn: 'Green Saro',
    rangeFa: '۳۵٪ تا ۴۹٪',
    rangeEn: '35% – 49%',
    percent: 46,
    noteFa: 'انطباق پایه با الزامات ساختمان سبز ایران',
    noteEn: 'Baseline Iran Green Building compliance',
    barClass: 'bg-[#28CF77]',
    textClass: 'text-[#28CF77]',
  },
] as const;

const SARO_SABZ_WEIGHTS = [
  { labelFa: 'انرژی و کربن', labelEn: 'Energy & Carbon', pctFa: '۲۸٪', pctEn: '28%' },
  { labelFa: 'سایت و حمل‌ونقل', labelEn: 'Site & Mobility', pctFa: '۱۸٪', pctEn: '18%' },
  { labelFa: 'مدیریت آب', labelEn: 'Water Efficiency', pctFa: '۱۵٪', pctEn: '15%' },
  { labelFa: 'مصالح و منابع', labelEn: 'Materials', pctFa: '۱۴٪', pctEn: '14%' },
  { labelFa: 'کیفیت محیط داخلی', labelEn: 'Indoor Quality', pctFa: '۱۳٪', pctEn: '13%' },
  { labelFa: 'مدیریت و نوآوری', labelEn: 'Innovation', pctFa: '۱۲٪', pctEn: '12%' },
] as const;

const CODE_19_TIERS = [
  {
    grade: 'EC++',
    savingsFa: 'بیش از ۴۵٪ صرفه‌جویی',
    savingsEn: '≥ 45% Savings',
    percent: 100,
    noteFa: 'تراز فوق‌کارآمد · هم‌راستا با سرو طلایی و فیروزه‌ای',
    noteEn: 'Ultra-efficient tier · aligned with Gold & Turquoise Saro',
    barClass: 'bg-[#28CF77]',
    textClass: 'text-[#28CF77]',
  },
  {
    grade: 'EC+',
    savingsFa: '۳۰٪ تا ۴۵٪ صرفه‌جویی',
    savingsEn: '30% – 45% Savings',
    percent: 74,
    noteFa: 'بهینه‌سازی پیشرفته پوسته حرارتی و سیستم‌های HVAC',
    noteEn: 'Advanced thermal envelope & high-efficiency HVAC',
    barClass: 'bg-[#34D399]',
    textClass: 'text-[#6EE7B7]',
  },
  {
    grade: 'EC',
    savingsFa: '۱۵٪ تا ۳۰٪ صرفه‌جویی',
    savingsEn: '15% – 30% Savings',
    percent: 50,
    noteFa: 'انطباق استاندارد عملکردی مبحث نوزدهم مقررات ملی',
    noteEn: 'Standard performance compliance under Code 19',
    barClass: 'bg-[#6F9BFF]',
    textClass: 'text-[#8AB0FF]',
  },
  {
    grade: 'Base',
    savingsFa: 'حداقل الزام قانونی',
    savingsEn: 'Code Baseline',
    percent: 28,
    noteFa: 'کنترل جداره‌ها، پنجره‌ها و پل‌های حرارتی (روش تجویزی)',
    noteEn: 'Prescriptive envelope, glazing & thermal-bridge baseline',
    barClass: 'bg-[#64748B]',
    textClass: 'text-[#9FB0C9]',
  },
] as const;

export function SustainabilityLabPage({
  locale,
  authUser,
  onNavigate,
}: {
  locale: Locale;
  authUser: FirebaseUser | null;
  onNavigate: (route: PageRoute) => void;
}) {
  const copy = getCopy(locale);
  const isFa = locale === 'fa';

  return (
    <div data-testid="sustainability-lab-page" className="pt-20 pb-12 sm:pt-28 sm:pb-20">
      <div className="max-w-[1380px] mx-auto px-3.5 sm:px-6 lg:px-10 space-y-7 sm:space-y-12">
        {/* Compact Editorial Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 lg:gap-10 items-stretch">
          <div className="lg:col-span-7 flex flex-col justify-center space-y-2.5 sm:space-y-3.5">
            <div className="inline-flex items-center gap-2 text-[10.5px] sm:text-[11px] rtl:text-[11px] sm:rtl:text-xs uppercase tracking-[0.2em] rtl:tracking-normal text-[#28CF77] font-medium">
              <FlaskConical className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>{copy.labPage.label}</span>
            </div>
            <h1 className="text-[22px] sm:text-5xl font-semibold rtl:font-extrabold tracking-tight rtl:tracking-normal leading-[1.2] rtl:leading-[1.35] sm:leading-[1.15] sm:rtl:leading-[1.3] text-[#F5F8FC] text-balance">
              {copy.labPage.title}
            </h1>
            <p className="text-[13px] sm:text-base rtl:font-light text-[#C6D2E3] leading-relaxed rtl:leading-[1.85] sm:rtl:leading-[1.9] max-w-2xl">
              {copy.labPage.lead}
            </p>
          </div>

          <div className="lg:col-span-5">
            <div className="relative rounded-[18px] sm:rounded-2xl border border-[#00A651]/28 overflow-hidden bg-[#0E1626] h-full min-h-[160px] max-h-[190px] sm:min-h-[200px] sm:max-h-[260px]">
              <SafeImage
                src={ASSETS.labAxonometric}
                alt={copy.lab.axonCaption}
                className="w-full h-full object-cover"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#070D19]/80 via-transparent to-transparent"
              />
              <span className="absolute bottom-2.5 sm:bottom-3 start-3 sm:start-3.5 text-[10.5px] sm:text-[11px] font-medium text-[#E8EFFA]">
                {copy.lab.axonCaption}
              </span>
            </div>
          </div>
        </div>

        {/* Saro Sabz & Code 19 Calibrated Framework */}
        <section
          data-testid="lab-frameworks-section"
          className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-stretch"
        >
          {/* Panel 1: Saro Sabz Green Building Rating */}
          <div className="rounded-[18px] sm:rounded-2xl border border-[#28CF77]/22 bg-[#0B1422]/90 p-4 sm:p-7 flex flex-col justify-between gap-4 sm:gap-6">
            <div className="space-y-4 sm:space-y-5">
              <div className="space-y-1 border-b border-white/10 pb-3 sm:pb-4">
                <p className="text-[10.5px] sm:text-[11px] font-medium text-[#28CF77]">
                  {isFa
                    ? 'مرکز تحقیقات راه، مسکن و شهرسازی'
                    : 'BHRC National Green Building Standard'}
                </p>
                <h2 className="text-[15.5px] sm:text-xl font-semibold text-[#F5F8FC]">
                  {isFa
                    ? 'چارچوب ارزیابی «سرو سبز»'
                    : 'Saro Sabz Green Building Framework'}
                </h2>
              </div>

              <div className="space-y-3 sm:space-y-4">
                {SARO_SABZ_TIERS.map((tier) => (
                  <div key={tier.id} className="space-y-1.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className={`text-sm font-semibold ${tier.textClass}`}>
                        {isFa ? tier.nameFa : tier.nameEn}
                      </span>
                      <span
                        className={`${isFa ? 'font-numeric' : 'font-mono'} tabular-nums text-xs font-semibold text-[#F5F8FC]`}
                      >
                        {isFa ? tier.rangeFa : tier.rangeEn}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-white/[0.07] overflow-hidden">
                      <div
                        className={`h-full rounded-full ${tier.barClass}`}
                        style={{ width: `${tier.percent}%` }}
                      />
                    </div>
                    <p className="text-[11.5px] text-[#9FB0C9]">
                      {isFa ? tier.noteFa : tier.noteEn}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-white/10 pt-4 space-y-2.5">
              <p className="text-[11px] font-medium text-[#8B9DB7]">
                {isFa ? 'وزن محورهای امتیازدهی (مجموع ۱۰۰٪)' : 'Scoring Category Weights (100%)'}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
                {SARO_SABZ_WEIGHTS.map((w) => (
                  <div
                    key={w.labelEn}
                    className="flex items-center justify-between gap-2 text-xs border-b border-white/[0.06] pb-1.5"
                  >
                    <span className="text-[#C6D2E3] truncate">
                      {isFa ? w.labelFa : w.labelEn}
                    </span>
                    <span
                      className={`${isFa ? 'font-numeric' : 'font-mono'} tabular-nums font-semibold text-[#28CF77] shrink-0`}
                    >
                      {isFa ? w.pctFa : w.pctEn}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Panel 2: National Building Code Chapter 19 */}
          <div className="rounded-[18px] sm:rounded-2xl border border-[#6F9BFF]/22 bg-[#0B1422]/90 p-4 sm:p-7 flex flex-col justify-between gap-4 sm:gap-6">
            <div className="space-y-4 sm:space-y-5">
              <div className="space-y-1 border-b border-white/10 pb-3 sm:pb-4">
                <p className="text-[10.5px] sm:text-[11px] font-medium text-[#8AB0FF]">
                  {isFa
                    ? 'مقررات ملی ساختمان ایران · صرفه‌جویی انرژی'
                    : 'Iran National Building Code · Energy Conservation'}
                </p>
                <h2 className="text-[15.5px] sm:text-xl font-semibold text-[#F5F8FC]">
                  {isFa
                    ? 'انطباق با مبحث ۱۹ (رده‌های صرفه‌جویی)'
                    : 'Code 19 Energy Compliance Tiers'}
                </h2>
              </div>

              <div className="space-y-3 sm:space-y-4">
                {CODE_19_TIERS.map((tier) => {
                  const isPersianBase = tier.grade === 'Base' && isFa;
                  return (
                    <div key={tier.grade} className="space-y-1.5">
                      <div className="flex items-baseline justify-between gap-3">
                        <span
                          dir={isPersianBase ? undefined : 'ltr'}
                          className={`${
                            isPersianBase
                              ? 'text-sm font-semibold'
                              : 'font-mono text-sm font-bold tracking-wide'
                          } ${tier.textClass}`}
                        >
                          {isPersianBase ? 'رده پایه (تجویزی)' : tier.grade}
                        </span>
                        <span
                          className={`${isFa ? 'font-numeric' : 'font-mono'} tabular-nums text-xs font-semibold text-[#F5F8FC]`}
                        >
                          {isFa ? tier.savingsFa : tier.savingsEn}
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-white/[0.07] overflow-hidden">
                        <div
                          className={`h-full rounded-full ${tier.barClass}`}
                          style={{ width: `${tier.percent}%` }}
                        />
                      </div>
                      <p className="text-[11.5px] text-[#9FB0C9]">
                        {isFa ? tier.noteFa : tier.noteEn}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-white/10 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-[#C6D2E3]">
                <div className="border-b sm:border-b-0 sm:border-e border-white/10 pb-1.5 sm:pb-0 sm:pe-3">
                  <span className="block text-[11px] text-[#8B9DB7]">
                    {isFa ? 'تحلیل عملکردی' : 'Dynamic Model'}
                  </span>
                  <span className="font-medium text-[#F5F8FC]">
                    {isFa ? (
                      <>
                        شبیه‌سازی ساعتی (<span dir="ltr" className="inline-block font-mono text-[11px]">EUI</span>)
                      </>
                    ) : (
                      'Hourly EUI'
                    )}
                  </span>
                </div>
                <div className="border-b sm:border-b-0 sm:border-e border-white/10 pb-1.5 sm:pb-0 sm:pe-3">
                  <span className="block text-[11px] text-[#8B9DB7]">
                    {isFa ? 'پوسته و بازشو' : 'Thermal Envelope'}
                  </span>
                  <span className="font-medium text-[#F5F8FC]">
                    {isFa ? (
                      <>
                        کنترل پل حرارتی و <span dir="ltr" className="inline-block font-mono text-[11px]">U-Value</span>
                      </>
                    ) : (
                      'U-Value & Bridges'
                    )}
                  </span>
                </div>
                <div>
                  <span className="block text-[11px] text-[#8B9DB7]">
                    {isFa ? 'خروجی رسمی' : 'Deliverable'}
                  </span>
                  <span className="font-medium text-[#F5F8FC]">
                    {isFa ? (
                      <>
                        پرونده انطباق{' '}
                        <span dir="ltr" className="inline-block font-mono text-[11px]">EC</span> تا{' '}
                        <span dir="ltr" className="inline-block font-mono text-[11px]">EC++</span>
                      </>
                    ) : (
                      'EC to EC++ Dossier'
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Real Sustainability Assessment Intake Form */}
        <section
          id="assessment-intake"
          className="relative overflow-hidden glass-surface rounded-2xl sm:rounded-3xl border border-[#00A651]/28 p-4 sm:p-8 lg:p-10 space-y-4 sm:space-y-6"
        >
          <IsbPatternOverlay
            color="#00A651"
            opacity={0.09}
            scale={1.05}
            maskStyle="radial-gradient(ellipse 65% 65% at 92% 12%, black 0%, transparent 72%)"
          />
          <div className="relative z-10 max-w-3xl space-y-1.5">
            <h2 className="text-[18px] sm:text-3xl font-semibold rtl:font-extrabold text-[#F5F8FC]">
              {copy.labPage.intakeTitle}
            </h2>
            <p className="text-[12.5px] sm:text-sm text-[#C6D2E3] leading-relaxed rtl:leading-[1.85]">
              {copy.labPage.intakeLead}
            </p>
          </div>
          <div className="relative z-10">
            <SustainabilityAssessmentForm
              locale={locale}
              authUser={authUser}
              onNavigate={onNavigate}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

export function InsightsIndexPage({
  locale,
  insights,
  onNavigate,
}: {
  locale: Locale;
  insights: Insight[];
  onNavigate: (route: PageRoute) => void;
}) {
  const copy = getCopy(locale);
  const [topicFilter, setTopicFilter] = useState<InsightTopic | 'all'>('all');

  const published = useMemo(
    () =>
      insights
        .filter((i) => i.status === 'published')
        .filter((i) => (topicFilter === 'all' ? true : i.topic === topicFilter)),
    [insights, topicFilter]
  );

  return (
    <div className="pt-20 pb-12 sm:pt-28 sm:pb-20">
      <div className="max-w-[1380px] mx-auto px-3.5 sm:px-6 lg:px-10 space-y-6 sm:space-y-10">
        <div className="max-w-3xl space-y-2.5 sm:space-y-4">
          <p className="text-[10.5px] sm:text-[11px] rtl:text-[11px] sm:rtl:text-xs uppercase tracking-[0.2em] text-[#6F9BFF] font-medium">
            {copy.insightsPage.label}
          </p>
          <h1 className="text-[22px] sm:text-5xl font-semibold rtl:font-extrabold tracking-tight rtl:leading-[1.35] sm:rtl:leading-[1.3] text-[#F5F8FC]">
            {copy.insightsPage.title}
          </h1>
          <p className="text-[13px] sm:text-base rtl:font-light text-[#C6D2E3] leading-relaxed rtl:leading-[1.85] sm:rtl:leading-[1.9]">{copy.insightsPage.lead}</p>
        </div>

        {/* Topic Filter Bar */}
        <div className="glass-surface rounded-2xl p-2.5 sm:p-4 flex flex-nowrap overflow-x-auto no-scrollbar sm:flex-wrap items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setTopicFilter('all')}
            aria-pressed={topicFilter === 'all'}
            className={`min-h-[38px] sm:min-h-0 whitespace-nowrap shrink-0 rounded-full px-3.5 sm:px-4 py-2 text-[11.5px] sm:text-xs font-medium transition-all active:scale-[0.98] ${
              topicFilter === 'all'
                ? 'glass-cta font-semibold'
                : 'glass-pill text-[#C6D2E3] hover:border-[#6F9BFF]/50'
            }`}
          >
            {copy.insightsPage.allTopics}
          </button>
          {(Object.keys(copy.topics) as InsightTopic[]).map((topic) => (
            <button
              key={topic}
              type="button"
              onClick={() => setTopicFilter(topic)}
              aria-pressed={topicFilter === topic}
              className={`min-h-[38px] sm:min-h-0 whitespace-nowrap shrink-0 rounded-full px-3.5 sm:px-4 py-2 text-[11.5px] sm:text-xs font-medium transition-all active:scale-[0.98] ${
                topicFilter === topic
                  ? 'glass-cta font-semibold'
                  : 'glass-pill text-[#C6D2E3] hover:border-[#6F9BFF]/50'
              }`}
            >
              {copy.topics[topic]}
            </button>
          ))}
        </div>

        {/* Published Articles — Magazine Editorial Front Page */}
        {published.length === 0 ? (
          <div className="glass-surface rounded-2xl sm:rounded-3xl p-7 sm:p-14 text-center max-w-2xl mx-auto space-y-3.5 sm:space-y-4">
            <BookOpen className="w-8 h-8 sm:w-9 sm:h-9 text-[#6F9BFF] mx-auto" strokeWidth={1.5} />
            <h2 className="text-[17px] sm:text-xl font-semibold text-[#F5F8FC]">
              {copy.insightsPage.emptyTitle}
            </h2>
            <p className="text-[13px] sm:text-sm text-[#C6D2E3] leading-relaxed">{copy.insightsPage.emptyBody}</p>
            <div className="pt-2">
              <a
                href={buildPath(locale, { page: 'contact' })}
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate({ page: 'contact' });
                }}
                className="glass-cta min-h-[44px] sm:min-h-0 inline-flex items-center rounded-full px-6 py-2.5 text-xs font-semibold transition-all active:scale-[0.98]"
              >
                {copy.contactBanner.cta}
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-6 sm:space-y-8">
            {/* Tier 1: Lead Featured Editorial Story */}
            {(() => {
              const lead = published[0];
              const leadMins = lead.readingTimeMinutes || estimateReadingTimeMinutes(lead, locale);
              const leadMedia = countInsightMedia(lead);
              const leadAuthor = locale === 'fa' ? lead.authorFa || lead.authorEn : lead.authorEn || lead.authorFa;
              return (
                <a
                  href={buildPath(locale, { page: 'insight-detail', slug: lead.slug })}
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate({ page: 'insight-detail', slug: lead.slug });
                  }}
                  className="group glass-card glass-card-hover rounded-2xl sm:rounded-3xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch transition-transform active:scale-[0.995]"
                >
                  {lead.coverImage && (
                    <div className="lg:col-span-7 relative aspect-[16/10] lg:aspect-auto lg:min-h-[340px] bg-[#070C17] overflow-hidden">
                      <SafeImage
                        src={lead.coverImage}
                        alt={locale === 'fa' ? lead.titleFa : lead.titleEn}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                      />
                    </div>
                  )}
                  <div
                    className={`${
                      lead.coverImage ? 'lg:col-span-5' : 'lg:col-span-12'
                    } p-5 sm:p-7 lg:p-8 flex flex-col justify-between gap-4`}
                  >
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] sm:text-xs text-[#9BB0CC]">
                        <span className="font-semibold text-[#28CF77]">{copy.topics[lead.topic]}</span>
                        <span aria-hidden="true" className="text-white/25">·</span>
                        <span className="font-numeric tabular-nums">{lead.publishedDate}</span>
                        <span aria-hidden="true" className="text-white/25">·</span>
                        <span className="inline-flex items-center gap-1 font-numeric tabular-nums">
                          <Clock className="w-3 h-3 text-[#6F9BFF]" />
                          {locale === 'fa' ? `${leadMins} دقیقه` : `${leadMins} min`}
                        </span>
                        {leadMedia > 0 && (
                          <>
                            <span aria-hidden="true" className="text-white/25">·</span>
                            <span className="inline-flex items-center gap-1 font-numeric tabular-nums">
                              <Images className="w-3 h-3 text-[#6F9BFF]" />
                              {locale === 'fa' ? `${leadMedia} تصویر` : `${leadMedia} visuals`}
                            </span>
                          </>
                        )}
                      </div>

                      <h2 className="text-[18px] sm:text-2xl lg:text-[26px] font-semibold rtl:font-extrabold text-[#F5F8FC] leading-snug rtl:leading-[1.38] group-hover:text-white">
                        {locale === 'fa' ? lead.titleFa : lead.titleEn}
                      </h2>

                      <p className="text-[13px] sm:text-sm text-[#C6D2E3] leading-relaxed rtl:leading-[1.85] line-clamp-3">
                        {locale === 'fa' ? lead.subtitleFa || lead.excerptFa : lead.subtitleEn || lead.excerptEn}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
                      <span className="text-[11.5px] text-[#8FA4C2] truncate">
                        {leadAuthor || (locale === 'fa' ? 'تحریریه فنی گروه ISB' : 'ISB Technical Desk')}
                      </span>
                      <span className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-[#6F9BFF] group-hover:text-[#8BB2FF]">
                        <span>{locale === 'fa' ? 'مطالعه کامل' : 'Read monograph'}</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </a>
              );
            })()}

            {/* Tier 2: Secondary Editorial Archive Grid */}
            {published.length > 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {published.slice(1).map((article) => {
                  const mins = article.readingTimeMinutes || estimateReadingTimeMinutes(article, locale);
                  const mediaCount = countInsightMedia(article);
                  const author =
                    locale === 'fa'
                      ? article.authorFa || article.authorEn
                      : article.authorEn || article.authorFa;
                  return (
                    <a
                      key={article.id}
                      href={buildPath(locale, { page: 'insight-detail', slug: article.slug })}
                      onClick={(e) => {
                        e.preventDefault();
                        onNavigate({ page: 'insight-detail', slug: article.slug });
                      }}
                      className="group glass-card glass-card-hover rounded-[18px] sm:rounded-2xl overflow-hidden flex flex-col justify-between active:scale-[0.99] transition-transform"
                    >
                      <div>
                        {article.coverImage && (
                          <div className="aspect-[16/10] bg-[#070C17] overflow-hidden border-b border-white/10">
                            <SafeImage
                              src={article.coverImage}
                              alt={locale === 'fa' ? article.titleFa : article.titleEn}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                            />
                          </div>
                        )}
                        <div className="p-4 sm:p-5 space-y-2.5">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-[#9BB0CC]">
                            <span className="font-medium text-[#28CF77]">{copy.topics[article.topic]}</span>
                            <span aria-hidden="true" className="text-white/25">·</span>
                            <span className="font-numeric tabular-nums">{article.publishedDate}</span>
                            <span aria-hidden="true" className="text-white/25">·</span>
                            <span className="font-numeric tabular-nums">
                              {locale === 'fa' ? `${mins} دقیقه` : `${mins}m`}
                            </span>
                            {mediaCount > 0 && (
                              <>
                                <span aria-hidden="true" className="text-white/25">·</span>
                                <span className="font-numeric tabular-nums">
                                  {locale === 'fa' ? `${mediaCount} تصویر` : `${mediaCount} visuals`}
                                </span>
                              </>
                            )}
                          </div>
                          <h2 className="text-[15.5px] sm:text-lg font-semibold text-[#F5F8FC] leading-snug rtl:leading-[1.45]">
                            {locale === 'fa' ? article.titleFa : article.titleEn}
                          </h2>
                          <p className="text-[12.5px] sm:text-sm text-[#C6D2E3] leading-relaxed line-clamp-3">
                            {locale === 'fa' ? article.excerptFa : article.excerptEn}
                          </p>
                        </div>
                      </div>
                      <div className="px-4 sm:px-5 py-3 border-t border-white/8 flex items-center justify-between gap-2 text-[11.5px]">
                        <span className="text-[#8B9DB7] truncate">
                          {author || (locale === 'fa' ? 'گروه ISB' : 'ISB Group')}
                        </span>
                        <span className="shrink-0 font-semibold text-[#6F9BFF]">
                          {locale === 'fa' ? 'مطالعه مقاله' : 'Read article'}
                        </span>
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function InsightDetailPage({
  locale,
  slug,
  insights,
  onNavigate,
}: {
  locale: Locale;
  slug: string;
  insights: Insight[];
  onNavigate: (route: PageRoute) => void;
}) {
  const copy = getCopy(locale);
  const isRtl = locale === 'fa';
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;
  const article = insights.find((a) => a.slug === slug && a.status === 'published');
  const related = useMemo(
    () =>
      insights
        .filter((a) => a.status === 'published' && a.slug !== slug)
        .slice(0, 3),
    [insights, slug]
  );

  if (!article) {
    return (
      <div className="pt-32 pb-24 max-w-[1380px] mx-auto px-4 text-center space-y-4">
        <h1 className="text-2xl font-semibold text-[#F5F8FC]">
          {locale === 'fa' ? 'مقاله مورد نظر یافت نشد' : 'Article not found'}
        </h1>
        <button
          type="button"
          onClick={() => onNavigate({ page: 'insights' })}
          className="glass-cta inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold"
        >
          <BackIcon className="w-4 h-4" />
          <span>{copy.insightsPage.backToInsights}</span>
        </button>
      </div>
    );
  }

  return (
    <article className="pt-20 pb-14 sm:pt-28 sm:pb-24">
      <div className="max-w-[1140px] mx-auto px-3.5 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        <a
          href={buildPath(locale, { page: 'insights' })}
          onClick={(e) => {
            e.preventDefault();
            onNavigate({ page: 'insights' });
          }}
          className="inline-flex items-center gap-1.5 min-h-[38px] text-xs text-[#8B9DB7] hover:text-[#6F9BFF] transition-colors"
        >
          <BackIcon className="w-3.5 h-3.5" />
          <span>{copy.insightsPage.backToInsights}</span>
        </a>

        <InsightEditorialRenderer article={article} locale={locale} />

        {/* Related Articles Strip */}
        {related.length > 0 && (
          <section className="pt-10 mt-10 border-t border-white/10 space-y-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base sm:text-xl font-semibold text-[#F5F8FC]">
                {locale === 'fa' ? 'سایر مقالات و یادداشت‌های فنی' : 'Further Reading from ISB Studio'}
              </h2>
              <a
                href={buildPath(locale, { page: 'insights' })}
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate({ page: 'insights' });
                }}
                className="text-xs text-[#6F9BFF] hover:text-[#8BB2FF]"
              >
                {locale === 'fa' ? 'مشاهده همه' : 'View all'}
              </a>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {related.map((item) => (
                <a
                  key={item.id}
                  href={buildPath(locale, { page: 'insight-detail', slug: item.slug })}
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate({ page: 'insight-detail', slug: item.slug });
                  }}
                  className="glass-card glass-card-hover rounded-2xl overflow-hidden flex flex-col justify-between"
                >
                  {item.coverImage && (
                    <div className="aspect-[16/9] bg-[#070C17] overflow-hidden border-b border-white/10">
                      <SafeImage
                        src={item.coverImage}
                        alt={locale === 'fa' ? item.titleFa : item.titleEn}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-4 space-y-2">
                    <div className="flex items-center gap-2 text-[11px] text-[#9BB0CC]">
                      <span className="text-[#28CF77]">{copy.topics[item.topic]}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-numeric tabular-nums">{item.publishedDate}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-[#F5F8FC] leading-snug line-clamp-2">
                      {locale === 'fa' ? item.titleFa : item.titleEn}
                    </h3>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}

export function ContactPage({
  locale,
  settings,
  authUser,
  onNavigate,
}: {
  locale: Locale;
  settings: SiteSettings;
  authUser: FirebaseUser | null;
  onNavigate: (route: PageRoute) => void;
}) {
  const copy = getCopy(locale);

  return (
    <div className="pt-20 pb-12 sm:pt-28 sm:pb-20">
      <div className="max-w-[1380px] mx-auto px-3.5 sm:px-6 lg:px-10 space-y-7 sm:space-y-12">
        <div className="max-w-3xl space-y-2.5 sm:space-y-4">
          <p className="text-[10.5px] sm:text-[11px] rtl:text-[11px] sm:rtl:text-xs uppercase tracking-[0.2em] text-[#6F9BFF] font-medium">
            {copy.contactPage.label}
          </p>
          <h1 className="text-[22px] sm:text-5xl font-semibold rtl:font-extrabold tracking-tight leading-[1.2] sm:leading-[1.12] rtl:leading-[1.35] sm:rtl:leading-[1.3] text-[#F5F8FC]">
            {copy.contactPage.title}
          </h1>
          <p className="text-[13px] sm:text-base rtl:font-light text-[#C6D2E3] leading-relaxed rtl:leading-[1.85] sm:rtl:leading-[1.9]">{copy.contactPage.lead}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 items-start">
          {/* Inquiry Form */}
          <div id="project-inquiry" className="lg:col-span-8 scroll-mt-24 glass-surface rounded-2xl sm:rounded-3xl p-4 sm:p-8">
            <ProjectInquiryForm
              locale={locale}
              authUser={authUser}
              onNavigate={onNavigate}
            />
          </div>

          {/* Configured Contact Channels */}
          <aside className="lg:col-span-4 glass-surface rounded-2xl sm:rounded-3xl p-4 sm:p-8 space-y-4 sm:space-y-6">
            <h2 className="text-[15.5px] sm:text-lg font-semibold text-[#F5F8FC]">
              {copy.contactPage.channelsTitle}
            </h2>

            <div className="space-y-2.5 sm:space-y-4 text-sm">
              {settings.instagramUrl && (
                <a
                  href={settings.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-card glass-card-hover flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 sm:px-4 sm:py-3.5 min-h-[52px] text-[#F5F8FC] active:scale-[0.99] transition-transform"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg border border-[#6F9BFF]/25 bg-[#223A87]/20 flex items-center justify-center text-[#93BCFF] shrink-0">
                      <InstagramIcon className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                    </span>
                    <div className="min-w-0">
                      <div className="text-[11px] sm:text-xs text-[#8B9DB7]">{copy.contactPage.instagramLabel}</div>
                      <div className="text-[13px] sm:text-sm font-medium mt-0.5 ltr-inline">@isb.group</div>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-[#6F9BFF] shrink-0" />
                </a>
              )}

              {settings.linkedinUrl && (
                <a
                  href={settings.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-card glass-card-hover flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 sm:px-4 sm:py-3.5 min-h-[52px] text-[#F5F8FC] active:scale-[0.99] transition-transform"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg border border-[#6F9BFF]/25 bg-[#223A87]/20 flex items-center justify-center text-[#93BCFF] shrink-0">
                      <LinkedinIcon className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                    </span>
                    <div className="min-w-0">
                      <div className="text-[11px] sm:text-xs text-[#8B9DB7]">
                        {locale === 'fa' ? 'صفحه رسمی لینکدین' : 'Official LinkedIn'}
                      </div>
                      <div className="text-[13px] sm:text-sm font-medium mt-0.5 ltr-inline">isb-sustainable</div>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-[#6F9BFF] shrink-0" />
                </a>
              )}

              {settings.telegramUrl && (
                <a
                  href={settings.telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-card glass-card-hover flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 sm:px-4 sm:py-3.5 min-h-[52px] text-[#F5F8FC] active:scale-[0.99] transition-transform"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg border border-[#6F9BFF]/25 bg-[#223A87]/20 flex items-center justify-center text-[#93BCFF] shrink-0">
                      <TelegramIcon className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                    </span>
                    <div className="min-w-0">
                      <div className="text-[11px] sm:text-xs text-[#8B9DB7]">
                        {locale === 'fa' ? 'تلگرام گروه ISB' : 'Telegram'}
                      </div>
                      <div className="text-[13px] sm:text-sm font-medium mt-0.5 ltr-inline">Telegram</div>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-[#6F9BFF] shrink-0" />
                </a>
              )}

              {settings.whatsappUrl && (
                <a
                  href={settings.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-card glass-card-hover flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 sm:px-4 sm:py-3.5 min-h-[52px] text-[#F5F8FC] active:scale-[0.99] transition-transform"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg border border-[#28CF77]/28 bg-[#00A651]/16 flex items-center justify-center text-[#28CF77] shrink-0">
                      <WhatsAppIcon className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                    </span>
                    <div className="min-w-0">
                      <div className="text-[11px] sm:text-xs text-[#8B9DB7]">
                        {locale === 'fa' ? 'واتساپ گروه ISB' : 'WhatsApp'}
                      </div>
                      <div className="text-[13px] sm:text-sm font-medium mt-0.5 ltr-inline">WhatsApp</div>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-[#28CF77] shrink-0" />
                </a>
              )}

              {settings.publicEmail && (
                <a
                  href={`mailto:${settings.publicEmail}`}
                  className="glass-card glass-card-hover flex items-center gap-3 rounded-xl px-3.5 py-2.5 sm:px-4 sm:py-3.5 min-h-[48px] text-[#F5F8FC] active:scale-[0.99] transition-transform"
                >
                  <Mail className="w-4 h-4 text-[#28CF77] shrink-0" />
                  <span className="ltr-inline text-[13px] sm:text-sm">{settings.publicEmail}</span>
                </a>
              )}

              {settings.publicPhone && (
                <a
                  href={`tel:${settings.publicPhone}`}
                  className="glass-card glass-card-hover flex items-center gap-3 rounded-xl px-3.5 py-2.5 sm:px-4 sm:py-3.5 min-h-[48px] text-[#F5F8FC] active:scale-[0.99] transition-transform"
                >
                  <Phone className="w-4 h-4 text-[#28CF77] shrink-0" />
                  <span className="ltr-inline text-[13px] sm:text-sm font-numeric">{settings.publicPhone}</span>
                </a>
              )}

              {(settings.studioCityEn || settings.studioCityFa) && (
                <div className="flex items-start gap-3 px-1 pt-2 text-[#C6D2E3]">
                  <MapPin className="w-4 h-4 text-[#6F9BFF] mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs text-[#8B9DB7]">{copy.contactPage.studioCityLabel}</div>
                    <div className="text-sm mt-0.5">
                      {locale === 'fa' ? settings.studioCityFa : settings.studioCityEn}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {!settings.publicEmail && !settings.publicPhone && (
              <p className="text-xs text-[#8B9DB7] leading-relaxed border-t border-white/10 pt-4">
                {copy.contactPage.channelsNote}
              </p>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
