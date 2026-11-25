import React, { useMemo, useState } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  CreditCard,
  Search,
  ShieldCheck,
  User,
} from '../components/icons/IsbIcons';
import { IsbPatternOverlay, SafeImage } from '../components/BrandMark';
import { CourseCheckoutModal } from '../components/CourseCheckoutModal';
import type {
  Course,
  CourseDepartment,
  Locale,
  PageRoute,
  SiteSettings,
} from '../types/content';
import {
  COURSE_DEPARTMENT_LABELS,
  COURSE_FORMAT_LABELS,
  formatTomanAmount,
} from '../utils/accountLogic';

interface CoursesPageProps {
  locale: Locale;
  authUser: FirebaseUser | null;
  courses: Course[];
  settings: SiteSettings;
  onNavigate: (route: PageRoute) => void;
}

const DEPT_FILTERS: ('all' | CourseDepartment)[] = [
  'all',
  'architecture-urbanism',
  'energy-mep',
  'structure-seismic',
  'multidisciplinary',
];

function getDepartmentAccent(dept: CourseDepartment): string {
  switch (dept) {
    case 'energy-mep':
      return 'text-[#28CF77]';
    case 'structure-seismic':
      return 'text-[#68C4F8]';
    case 'multidisciplinary':
      return 'text-[#A6BEFF]';
    default:
      return 'text-[#8AB0FF]';
  }
}

export function CoursesPage({
  locale,
  authUser,
  courses,
  settings,
  onNavigate,
}: CoursesPageProps) {
  const isFa = locale === 'fa';
  const ArrowIcon = isFa ? ArrowLeft : ArrowRight;

  const [deptFilter, setDeptFilter] = useState<'all' | CourseDepartment>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSyllabusId, setExpandedSyllabusId] = useState<string | null>(null);
  const [checkoutCourse, setCheckoutCourse] = useState<Course | null>(null);

  const visibleCourses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return courses.filter((course) => {
      if (deptFilter !== 'all' && course.department !== deptFilter) return false;
      if (!q) return true;
      return (
        course.titleFa.toLowerCase().includes(q) ||
        course.titleEn.toLowerCase().includes(q) ||
        course.summaryFa.toLowerCase().includes(q) ||
        course.summaryEn.toLowerCase().includes(q) ||
        course.instructorFa.toLowerCase().includes(q) ||
        course.instructorEn.toLowerCase().includes(q)
      );
    });
  }, [courses, deptFilter, searchQuery]);

  return (
    <div data-testid="courses-page" className="pt-20 pb-14 sm:pt-28 sm:pb-24 min-h-screen">
      <div className="max-w-[1380px] mx-auto px-3.5 sm:px-6 lg:px-10 space-y-7 sm:space-y-12">
        {/* Editorial Hero Header */}
        <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[#6F9BFF]/22 bg-[#0B1322]/90 p-4 sm:p-11 lg:p-14">
          <IsbPatternOverlay
            color="#00A651"
            opacity={0.09}
            scale={1.08}
            maskStyle="radial-gradient(ellipse 68% 68% at 88% 18%, black 0%, transparent 72%)"
          />
          <div className="relative z-10 max-w-3xl space-y-3 sm:space-y-5">
            <div className="flex items-center gap-2 text-[10.5px] sm:text-[11px] rtl:text-[11px] sm:rtl:text-xs font-medium uppercase tracking-[0.2em] rtl:tracking-normal text-[#28CF77]">
              <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>
                {isFa
                  ? 'آکادمی تخصصی گروه ساختمانی پایدار ایران زمین'
                  : 'ISB Group Technical Academy'}
              </span>
            </div>

            <h1 className="text-[21px] sm:text-5xl font-semibold rtl:font-extrabold tracking-tight rtl:tracking-normal leading-[1.2] sm:leading-[1.15] rtl:leading-[1.35] sm:rtl:leading-[1.32] text-[#F5F8FC]">
              {isFa
                ? 'دوره‌های تخصصی معماری، انرژی و سازه'
                : 'Applied Courses in Architecture, Energy & Seismic Design'}
            </h1>

            <p className="text-[12.5px] sm:text-base rtl:font-light text-[#C6D2E3] leading-relaxed rtl:leading-[1.85] sm:rtl:leading-[1.9] max-w-2xl">
              {isFa
                ? 'آموزش‌های پروژه‌محور مبتنی بر تجربه واقعی دفتر مهندسی ISB. دوره مورد نظر خود را انتخاب کنید، مستقیم ثبت‌نام و پرداخت را انجام دهید و تمامی سوابق و دسترسی‌های کلاس را از پنل کاربری خود مدیریت کنید.'
                : 'Project-based studio courses grounded in real ISB engineering practice. Select any course below to enroll directly, complete payment, and manage course access from your Member Portal.'}
            </p>

            <div className="flex flex-wrap items-center gap-x-4 sm:gap-x-6 gap-y-1.5 sm:gap-y-2 pt-0.5 sm:pt-1 text-[11px] sm:text-xs text-[#9FB0C9]">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#28CF77]" />
                <span>
                  {isFa ? 'ثبت‌نام آنی متصل به پنل کاربری' : 'Direct portal-linked enrollment'}
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-[#6F9BFF]" />
                <span>
                  {isFa ? 'صدور کد سفارش و پیگیری پرداخت' : 'Tracked invoices & payment confirmation'}
                </span>
              </span>
              <button
                type="button"
                onClick={() => onNavigate({ page: 'account' })}
                className="min-h-[38px] sm:min-h-0 inline-flex items-center gap-1 text-[#8AB0FF] hover:text-white transition-colors cursor-pointer"
              >
                <span>
                  {authUser
                    ? isFa
                      ? 'مشاهده دوره‌های ثبت‌نام‌شده من'
                      : 'View My Enrolled Courses'
                    : isFa
                      ? 'ورود به پنل کاربری'
                      : 'Sign In to Member Portal'}
                </span>
                <ArrowIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </section>

        {/* Filter & Search Bar */}
        <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
          <div className="flex flex-nowrap overflow-x-auto no-scrollbar sm:flex-wrap items-center gap-1.5 sm:gap-2 -mx-0.5 px-0.5">
            {DEPT_FILTERS.map((dept) => {
              const active = deptFilter === dept;
              const label =
                dept === 'all'
                  ? isFa
                    ? `همه دوره‌ها (${new Intl.NumberFormat('fa-IR').format(courses.length)})`
                    : `All Courses (${courses.length})`
                  : isFa
                    ? COURSE_DEPARTMENT_LABELS[dept].fa
                    : COURSE_DEPARTMENT_LABELS[dept].en;
              return (
                <button
                  key={dept}
                  type="button"
                  onClick={() => setDeptFilter(dept)}
                  className={`min-h-[38px] sm:min-h-[40px] whitespace-nowrap shrink-0 rounded-xl px-3 sm:px-4 py-1.5 sm:py-2 text-[11.5px] sm:text-xs font-medium transition-all active:scale-[0.98] cursor-pointer ${
                    active
                      ? 'bg-[#223A87]/65 text-white border border-[#6F9BFF]/65 font-semibold'
                      : 'border border-white/10 bg-[#0C1424]/80 text-[#C6D2E3] hover:border-[#6F9BFF]/45 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="relative w-full lg:w-72">
            <Search
              className={`w-4 h-4 text-[#8B9DB7] absolute top-1/2 -translate-y-1/2 ${
                isFa ? 'right-3.5' : 'left-3.5'
              }`}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isFa ? 'جستجو در عنوان یا مدرس دوره...' : 'Search courses or instructors...'}
              className={`min-h-[42px] sm:min-h-0 w-full rounded-xl border border-[#6F9BFF]/22 bg-[#0C1424]/85 py-2.5 text-[13px] sm:text-xs text-[#F5F8FC] placeholder:text-[#8B9DB7]/80 focus:outline-none focus:border-[#6F9BFF] ${
                isFa ? 'pr-10 pl-3.5' : 'pl-10 pr-3.5'
              }`}
            />
          </div>
        </section>

        {/* Courses Catalog Grid */}
        {visibleCourses.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#6F9BFF]/25 bg-[#0B1322]/75 p-12 text-center space-y-3">
            <BookOpen className="w-8 h-8 text-[#6F9BFF] mx-auto" />
            <h2 className="text-base font-semibold text-[#F5F8FC]">
              {isFa ? 'دوره‌ای با این فیلتر یافت نشد' : 'No courses match this filter'}
            </h2>
            <p className="text-xs text-[#9FB0C9]">
              {isFa
                ? 'فیلتر دپارتمان یا عبارت جستجو را تغییر دهید تا همه دوره‌های فعال نمایش داده شوند.'
                : 'Clear your department filter or search query to view all active academy courses.'}
            </p>
            <button
              type="button"
              onClick={() => {
                setDeptFilter('all');
                setSearchQuery('');
              }}
              className="glass-pill mt-2 inline-flex items-center rounded-xl px-4 py-2 text-xs text-[#F5F8FC] cursor-pointer"
            >
              {isFa ? 'نمایش همه دوره‌ها' : 'Show All Courses'}
            </button>
          </div>
        ) : (
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 items-stretch">
            {visibleCourses.map((course) => {
              const title = isFa ? course.titleFa : course.titleEn;
              const summary = isFa ? course.summaryFa : course.summaryEn;
              const instructor = isFa ? course.instructorFa : course.instructorEn;
              const duration = isFa ? course.durationFa : course.durationEn;
              const schedule = isFa ? course.scheduleFa : course.scheduleEn;
              const syllabus = isFa ? course.syllabusFa : course.syllabusEn;
              const hasSyllabus = Boolean(syllabus && syllabus.length > 0);
              const isSyllabusOpen = expandedSyllabusId === course.id;
              const hasDiscount =
                typeof course.originalPriceToman === 'number' &&
                course.originalPriceToman > course.priceToman &&
                course.priceToman > 0;
              const discountPct = hasDiscount && course.originalPriceToman
                ? Math.round(
                    ((course.originalPriceToman - course.priceToman) / course.originalPriceToman) *
                      100
                  )
                : 0;

              return (
                <article
                  key={course.id}
                  data-testid={`course-card-${course.slug}`}
                  className="group rounded-2xl sm:rounded-3xl border border-[#6F9BFF]/18 bg-[#0C1424]/92 hover:border-[#6F9BFF]/45 transition-all duration-300 overflow-hidden flex flex-col"
                >
                  {/* 16:9 Mobile / 16:10 Desktop Full-bleed Cover */}
                  <div className="relative aspect-[16/9] sm:aspect-[16/10] w-full overflow-hidden bg-[#080D16] border-b border-white/8">
                    <SafeImage
                      src={course.coverImage}
                      alt={title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    />
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0C1424] via-[#0C1424]/18 to-transparent"
                    />
                  </div>

                  {/* Card Body */}
                  <div className="p-4 sm:p-6 flex-1 flex flex-col space-y-3 sm:space-y-4">
                    {/* Unboxed Metadata Line (Zero-Pill Discipline) */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] sm:text-[11.5px]">
                      <span className={`font-semibold ${getDepartmentAccent(course.department)}`}>
                        {isFa
                          ? COURSE_DEPARTMENT_LABELS[course.department].fa
                          : COURSE_DEPARTMENT_LABELS[course.department].en}
                      </span>
                      <span className="text-[#8B9DB7]">·</span>
                      <span className="text-[#C6D2E3]">
                        {isFa
                          ? COURSE_FORMAT_LABELS[course.format].fa
                          : COURSE_FORMAT_LABELS[course.format].en}
                      </span>
                      {hasDiscount && discountPct > 0 && (
                        <>
                          <span className="text-[#8B9DB7]">·</span>
                          <span className="font-numeric font-semibold text-[#28CF77]">
                            {isFa
                              ? `${new Intl.NumberFormat('fa-IR').format(discountPct)}٪ تخفیف ثبت‌نام زودهنگام`
                              : `${discountPct}% Off`}
                          </span>
                        </>
                      )}
                    </div>

                    <h2 className="text-[15.5px] sm:text-lg font-semibold rtl:font-bold text-[#F5F8FC] leading-snug rtl:leading-[1.45]">
                      {title}
                    </h2>

                    <p className="text-[12px] sm:text-[13px] text-[#9FB0C9] leading-relaxed rtl:leading-[1.8] sm:rtl:leading-[1.85] line-clamp-3">
                      {summary}
                    </p>

                    {/* Clean Technical Specs */}
                    <div className="space-y-1.5 pt-2 border-t border-white/8 text-[11.5px] sm:text-xs text-[#C6D2E3]">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-[#6F9BFF] shrink-0" />
                        <span className="truncate">{instructor}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-[#28CF77] shrink-0" />
                        <span>{duration}</span>
                      </div>
                      {schedule && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-[#68C4F8] shrink-0" />
                          <span className="text-[#9FB0C9]">{schedule}</span>
                        </div>
                      )}
                    </div>

                    {/* Expandable Syllabus Accordion */}
                    {hasSyllabus && syllabus && (
                      <div className="pt-1">
                        <button
                          type="button"
                          data-testid={`toggle-syllabus-${course.slug}`}
                          aria-expanded={isSyllabusOpen}
                          onClick={() =>
                            setExpandedSyllabusId(isSyllabusOpen ? null : course.id)
                          }
                          className="w-full min-h-[40px] flex items-center justify-between gap-2 py-2 text-xs font-medium text-[#8AB0FF] hover:text-white transition-colors cursor-pointer border-t border-white/8"
                        >
                          <span>
                            {isFa
                              ? `سرفصل‌های آموزشی دوره (${new Intl.NumberFormat('fa-IR').format(syllabus.length)} محور)`
                              : `Course Syllabus (${syllabus.length} modules)`}
                          </span>
                          <ChevronDown
                            className={`w-4 h-4 transition-transform duration-200 ${
                              isSyllabusOpen ? 'rotate-180' : ''
                            }`}
                          />
                        </button>

                        {isSyllabusOpen && (
                          <ol className="mt-2 space-y-2 rounded-xl bg-[#070C16]/85 border border-white/8 p-3.5 text-xs text-[#C6D2E3] leading-relaxed">
                            {syllabus.map((item, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="font-mono font-numeric text-[11px] text-[#28CF77] shrink-0 mt-0.5">
                                  {String(idx + 1).padStart(2, '0')}.
                                </span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ol>
                        )}
                      </div>
                    )}

                    {/* Bottom Pricing & Direct Enrollment CTA */}
                    <div className="mt-auto pt-4 border-t border-white/10 flex items-end justify-between gap-3">
                      <div className="space-y-0.5">
                        {hasDiscount && course.originalPriceToman && (
                          <span className="block text-[11px] font-mono font-numeric text-[#8B9DB7] line-through">
                            {formatTomanAmount(course.originalPriceToman, locale)}
                          </span>
                        )}
                        <span className="block text-base sm:text-lg font-mono font-numeric font-bold text-[#F5F8FC]">
                          {formatTomanAmount(course.priceToman, locale)}
                        </span>
                      </div>

                      <button
                        type="button"
                        data-testid={`enroll-course-${course.slug}`}
                        onClick={() => setCheckoutCourse(course)}
                        className="glass-cta-emerald min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl px-4 sm:px-5 py-2.5 text-xs sm:text-[13px] font-semibold cursor-pointer shrink-0"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>
                          {course.priceToman === 0
                            ? isFa
                              ? 'ثبت‌نام رایگان'
                              : 'Enroll Free'
                            : isFa
                              ? 'ثبت‌نام و پرداخت'
                              : 'Enroll & Pay'}
                        </span>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        {/* Concise 3-Step Direct Enrollment Roadmap */}
        <section className="rounded-2xl sm:rounded-3xl border border-white/10 bg-[#0B1322]/75 p-4 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="space-y-2">
              <span className="font-mono text-xs text-[#6F9BFF]">01</span>
              <h3 className="text-sm font-semibold text-[#F5F8FC]">
                {isFa ? 'انتخاب دوره و ورود با جیمیل' : 'Choose Course & Sign In'}
              </h3>
              <p className="text-xs text-[#9FB0C9] leading-relaxed rtl:leading-[1.8]">
                {isFa
                  ? 'روی «ثبت‌نام و پرداخت» کلیک کنید و با یک کلیک با حساب گوگل خود وارد شوید تا سوابق و فاکتور به نام شما ثبت شود.'
                  : 'Select your course and sign in with Google in one click to bind your invoice and enrollment.'}
              </p>
            </div>
            <div className="space-y-2">
              <span className="font-mono text-xs text-[#28CF77]">02</span>
              <h3 className="text-sm font-semibold text-[#F5F8FC]">
                {isFa ? 'پرداخت امن و ثبت کد پیگیری' : 'Pay & Submit Reference'}
              </h3>
              <p className="text-xs text-[#9FB0C9] leading-relaxed rtl:leading-[1.8]">
                {isFa
                  ? 'پرداخت را از طریق لینک درگاه پرداخت یا مشخصات اعلام‌شده انجام دهید و شماره پیگیری را در همان پنجره ثبت نمایید.'
                  : 'Complete payment through the course gateway link or transfer instructions and record your tracking reference.'}
              </p>
            </div>
            <div className="space-y-2">
              <span className="font-mono text-xs text-[#68C4F8]">03</span>
              <h3 className="text-sm font-semibold text-[#F5F8FC]">
                {isFa ? 'فعال‌سازی و دسترسی در پنل کاربری' : 'Instant Portal Access'}
              </h3>
              <p className="text-xs text-[#9FB0C9] leading-relaxed rtl:leading-[1.8]">
                {isFa
                  ? 'به‌محض تأیید پرداخت، لینک کلاس و فایل‌های آموزشی در بخش «سفارش‌ها و دوره‌های من» فعال خواهد شد.'
                  : 'Once verified, your classroom link, materials, and order receipt unlock inside your Member Portal.'}
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Direct Course Checkout & Enrollment Modal */}
      <CourseCheckoutModal
        course={checkoutCourse}
        locale={locale}
        authUser={authUser}
        settings={settings}
        onClose={() => setCheckoutCourse(null)}
        onNavigate={onNavigate}
      />
    </div>
  );
}
