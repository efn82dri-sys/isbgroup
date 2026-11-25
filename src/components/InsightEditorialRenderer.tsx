import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Images,
  Layers,
  Maximize2,
  User,
  X,
} from './icons/IsbIcons';
import { SafeImage } from './BrandMark';
import { getCopy } from '../data/translations';
import type { Insight, InsightBlock, InsightBlockMediaItem, Locale } from '../types/content';
import {
  computeTelegramMosaicLayout,
  countInsightMedia,
  estimateReadingTimeMinutes,
  extractTableOfContents,
  parseFormattedText,
  type InlineRun,
} from '../utils/insightBlocks';

interface LightboxState {
  items: InsightBlockMediaItem[];
  index: number;
}

function FormattedRuns({ runs }: { runs: InlineRun[] }) {
  return (
    <>
      {runs.map((run, idx) => {
        if (run.bold) {
          return (
            <strong key={idx} className="font-semibold text-[#F5F8FC]">
              {run.text}
            </strong>
          );
        }
        if (run.italic) {
          return (
            <em key={idx} className="italic text-[#DCE6F5]">
              {run.text}
            </em>
          );
        }
        return <React.Fragment key={idx}>{run.text}</React.Fragment>;
      })}
    </>
  );
}

function FormattedEditorialText({
  text,
  leadStyle = false,
  compact = false,
}: {
  text: string;
  leadStyle?: boolean;
  compact?: boolean;
}) {
  const segments = useMemo(() => parseFormattedText(text), [text]);
  if (segments.length === 0) return null;

  return (
    <div className={compact ? 'space-y-2.5' : 'space-y-4'}>
      {segments.map((seg, idx) => {
        if (seg.kind === 'bullet-list') {
          return (
            <ul
              key={idx}
              className="space-y-2 ps-1 text-[13.5px] sm:text-[15px] text-[#C8D4E6] leading-7 sm:leading-8 rtl:leading-[1.95]"
            >
              {seg.items.map((itemRuns, itemIdx) => (
                <li key={itemIdx} className="flex items-start gap-2.5">
                  <span
                    aria-hidden="true"
                    className="mt-[0.72em] h-1.5 w-1.5 shrink-0 rounded-full bg-[#28CF77]/80"
                  />
                  <span>
                    <FormattedRuns runs={itemRuns} />
                  </span>
                </li>
              ))}
            </ul>
          );
        }

        const isOpeningLead = leadStyle && idx === 0;
        return (
          <p
            key={idx}
            className={
              isOpeningLead
                ? 'text-[15px] sm:text-[17.5px] text-[#E8EFFA] font-normal leading-8 sm:leading-[1.95] rtl:leading-[2]'
                : 'text-[13.5px] sm:text-[15.5px] text-[#C8D4E6] leading-7 sm:leading-8 rtl:leading-[1.95]'
            }
          >
            <FormattedRuns runs={seg.runs} />
          </p>
        );
      })}
    </div>
  );
}

function LightboxModal({
  state,
  locale,
  onClose,
  onChangeIndex,
}: {
  state: LightboxState;
  locale: Locale;
  onClose: () => void;
  onChangeIndex: (nextIndex: number) => void;
}) {
  const isFa = locale === 'fa';
  const total = state.items.length;
  const current = state.items[state.index] ?? state.items[0];
  const caption = isFa
    ? current?.captionFa || current?.captionEn
    : current?.captionEn || current?.captionFa;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (total > 1 && e.key === 'ArrowRight') {
        onChangeIndex((state.index + (isFa ? -1 : 1) + total) % total);
      }
      if (total > 1 && e.key === 'ArrowLeft') {
        onChangeIndex((state.index + (isFa ? 1 : -1) + total) % total);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isFa, onChangeIndex, onClose, state.index, total]);

  if (!current) return null;

  const goPrev = () => onChangeIndex((state.index - 1 + total) % total);
  const goNext = () => onChangeIndex((state.index + 1) % total);

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isFa ? 'نمایش بزرگ‌نمایی تصویر مقاله' : 'Article image lightbox'}
      onClick={onClose}
      className="fixed inset-0 z-[9999] bg-[#04070E]/94 backdrop-blur-md flex flex-col justify-between p-3 sm:p-6"
    >
      {/* Top Bar */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex items-center justify-between gap-3 max-w-6xl w-full mx-auto"
      >
        <div className="flex items-center gap-2 text-xs text-[#C6D2E3] font-numeric tabular-nums">
          <Images className="w-4 h-4 text-[#6F9BFF]" />
          <span>
            {state.index + 1} / {total}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={isFa ? 'بستن نمایش بزرگ' : 'Close lightbox'}
          className="glass-pill min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-full text-[#F5F8FC] hover:border-[#6F9BFF]"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Stage */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex-1 flex items-center justify-center max-w-6xl w-full mx-auto my-3 min-h-0"
      >
        {total > 1 && (
          <button
            type="button"
            onClick={isFa ? goNext : goPrev}
            aria-label={isFa ? 'تصویر بعدی' : 'Previous image'}
            className="glass-pill absolute start-1 sm:start-3 z-10 w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-[#F5F8FC] hover:border-[#6F9BFF]"
          >
            {isFa ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        )}

        <figure className="max-h-full flex flex-col items-center justify-center gap-3 px-10 sm:px-16">
          <SafeImage
            src={current.url}
            alt={caption || (isFa ? `تصویر ${state.index + 1}` : `Figure ${state.index + 1}`)}
            className="max-h-[72vh] max-w-full rounded-xl sm:rounded-2xl object-contain border border-white/12 shadow-2xl"
          />
          {caption && (
            <figcaption className="text-xs sm:text-sm text-[#D6E1F0] text-center max-w-2xl leading-relaxed">
              {caption}
            </figcaption>
          )}
        </figure>

        {total > 1 && (
          <button
            type="button"
            onClick={isFa ? goPrev : goNext}
            aria-label={isFa ? 'تصویر قبلی' : 'Next image'}
            className="glass-pill absolute end-1 sm:end-3 z-10 w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-[#F5F8FC] hover:border-[#6F9BFF]"
          >
            {isFa ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        )}
      </div>

      {/* Thumbnail Strip */}
      {total > 1 && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex items-center justify-center gap-2 overflow-x-auto py-1 max-w-4xl mx-auto"
        >
          {state.items.map((item, idx) => (
            <button
              key={`${item.url}-${idx}`}
              type="button"
              onClick={() => onChangeIndex(idx)}
              aria-label={isFa ? `مشاهده تصویر ${idx + 1}` : `View image ${idx + 1}`}
              className={`w-14 h-10 sm:w-16 sm:h-11 rounded-lg overflow-hidden border transition-all shrink-0 ${
                idx === state.index
                  ? 'border-[#28CF77] ring-2 ring-[#28CF77]/35 opacity-100'
                  : 'border-white/15 opacity-55 hover:opacity-90'
              }`}
            >
              <SafeImage src={item.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}

interface InsightEditorialRendererProps {
  article: Insight;
  locale: Locale;
  isPreview?: boolean;
}

export function InsightEditorialRenderer({
  article,
  locale,
  isPreview = false,
}: InsightEditorialRendererProps) {
  const copy = getCopy(locale);
  const isFa = locale === 'fa';
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);
  const [readProgress, setReadProgress] = useState(0);

  const title = isFa ? article.titleFa || article.titleEn : article.titleEn || article.titleFa;
  const subtitle = isFa
    ? article.subtitleFa || article.subtitleEn
    : article.subtitleEn || article.subtitleFa;
  const excerpt = isFa
    ? article.excerptFa || article.excerptEn
    : article.excerptEn || article.excerptFa;
  const coverCaption = isFa
    ? article.coverCaptionFa || article.coverCaptionEn
    : article.coverCaptionEn || article.coverCaptionFa;
  const author = isFa
    ? article.authorFa || article.authorEn
    : article.authorEn || article.authorFa;
  const authorRole = isFa
    ? article.authorRoleFa || article.authorRoleEn
    : article.authorRoleEn || article.authorRoleFa;
  const tags = isFa
    ? article.tagsFa && article.tagsFa.length > 0
      ? article.tagsFa
      : article.tagsEn ?? []
    : article.tagsEn && article.tagsEn.length > 0
      ? article.tagsEn
      : article.tagsFa ?? [];

  const blocks = article.blocks && article.blocks.length > 0 ? article.blocks : [];
  const toc = useMemo(() => extractTableOfContents(blocks, locale), [blocks, locale]);
  const mediaCount = useMemo(() => countInsightMedia(article), [article]);
  const readingMinutes = useMemo(
    () => article.readingTimeMinutes || estimateReadingTimeMinutes(article, locale),
    [article, locale]
  );

  // Subtle reading depth indicator for public reader view
  useEffect(() => {
    if (isPreview) return;
    const updateProgress = () => {
      const doc = document.documentElement;
      const scrollable = Math.max(1, doc.scrollHeight - window.innerHeight);
      setReadProgress(Math.max(0, Math.min(100, (window.scrollY / scrollable) * 100)));
    };
    updateProgress();
    window.addEventListener('scroll', updateProgress, { passive: true });
    return () => window.removeEventListener('scroll', updateProgress);
  }, [isPreview]);

  const openLightbox = (items: InsightBlockMediaItem[], index: number) => {
    if (!items.length) return;
    setLightbox({ items, index });
  };

  let sectionCounter = 0;

  const renderBlock = (block: InsightBlock) => {
    const heading = isFa
      ? block.headingFa || block.headingEn
      : block.headingEn || block.headingFa;
    const kicker = isFa ? block.kickerFa || block.kickerEn : block.kickerEn || block.kickerFa;
    const body = isFa ? block.bodyFa || block.bodyEn : block.bodyEn || block.bodyFa;

    switch (block.type) {
      case 'section-heading': {
        sectionCounter += 1;
        const numLabel = String(sectionCounter).padStart(2, '0');
        return (
          <header
            key={block.id}
            id={`section-${block.id}`}
            className="scroll-mt-28 pt-5 sm:pt-7 border-t border-white/10 space-y-2"
          >
            <div className="flex items-center gap-2.5 text-[11px] uppercase tracking-[0.16em] text-[#6F9BFF] font-medium">
              <span className="font-numeric tabular-nums text-[#28CF77]">{numLabel}</span>
              {kicker && (
                <>
                  <span aria-hidden="true" className="text-white/25">
                    ·
                  </span>
                  <span>{kicker}</span>
                </>
              )}
            </div>
            {heading && (
              <h2 className="text-[19px] sm:text-[26px] font-semibold rtl:font-extrabold tracking-tight text-[#F5F8FC] leading-snug rtl:leading-[1.4]">
                {heading}
              </h2>
            )}
          </header>
        );
      }

      case 'rich-text':
        return (
          <section key={block.id} className="space-y-3">
            {heading && (
              <h3 className="text-[16px] sm:text-xl font-semibold text-[#F5F8FC] leading-snug">
                {heading}
              </h3>
            )}
            {body && <FormattedEditorialText text={body} leadStyle={block.leadStyle} />}
          </section>
        );

      case 'telegram-media-post': {
        const mediaItems = block.media ?? [];
        const mosaic = computeTelegramMosaicLayout(
          Math.max(1, mediaItems.length),
          block.mediaLayout ?? 'mosaic'
        );
        const textFirst = block.textPosition === 'above';

        const textSection = (heading || body) && (
          <div className="p-4 sm:p-6 space-y-2.5 sm:space-y-3">
            {heading && (
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-[15.5px] sm:text-lg font-semibold text-[#F5F8FC] leading-snug">
                  {heading}
                </h3>
                {mediaItems.length > 0 && (
                  <span className="shrink-0 text-[11px] text-[#8B9DB7] font-numeric tabular-nums">
                    {isFa ? `${mediaItems.length} تصویر` : `${mediaItems.length} frames`}
                  </span>
                )}
              </div>
            )}
            {body && <FormattedEditorialText text={body} compact />}
          </div>
        );

        const mediaSection = mediaItems.length > 0 && (
          <div className="p-2 sm:p-2.5">
            <div className={mosaic.containerClass}>
              {mediaItems.map((item, idx) => {
                const cap = isFa
                  ? item.captionFa || item.captionEn
                  : item.captionEn || item.captionFa;
                const alt = isFa
                  ? item.altFa || cap || heading || title
                  : item.altEn || cap || heading || title;
                return (
                  <button
                    key={`${item.url}-${idx}`}
                    type="button"
                    onClick={() => openLightbox(mediaItems, idx)}
                    className={`group relative overflow-hidden rounded-xl bg-[#070C17] border border-white/10 text-start focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6F9BFF] ${mosaic.itemClasses[idx] ?? 'aspect-[4/3]'}`}
                  >
                    <SafeImage
                      src={item.url}
                      alt={alt}
                      className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050A14]/88 via-[#050A14]/20 to-transparent opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300" />
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute top-2.5 end-2.5 w-7 h-7 rounded-full bg-black/60 backdrop-blur-md border border-white/15 flex items-center justify-center text-white/90 opacity-0 sm:group-hover:opacity-100 transition-opacity"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </span>
                    {cap && (
                      <span className="pointer-events-none hidden sm:block absolute inset-x-2.5 bottom-2.5 text-xs text-[#F2F6FC] leading-snug line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {cap}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );

        return (
          <section
            key={block.id}
            className="rounded-2xl sm:rounded-3xl border border-white/12 bg-gradient-to-b from-[#101A2E]/82 to-[#0A1120]/88 overflow-hidden shadow-[0_20px_50px_-28px_rgba(0,0,0,0.75)]"
          >
            {textFirst ? (
              <>
                {textSection}
                {textSection && mediaSection && <div className="border-t border-white/8" />}
                {mediaSection}
              </>
            ) : (
              <>
                {mediaSection}
                {mediaSection && textSection && <div className="border-t border-white/8" />}
                {textSection}
              </>
            )}
          </section>
        );
      }

      case 'text-image-split': {
        const mediaItem = block.media?.[0];
        const cap = mediaItem
          ? isFa
            ? mediaItem.captionFa || mediaItem.captionEn
            : mediaItem.captionEn || mediaItem.captionFa
          : undefined;
        const imageFirst = block.splitSide !== 'end';

        return (
          <section
            key={block.id}
            className="rounded-2xl sm:rounded-3xl border border-white/12 bg-[#0C1424]/75 p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6 items-center"
          >
            {mediaItem && (
              <div
                className={`md:col-span-6 space-y-2 ${imageFirst ? 'md:order-1' : 'md:order-2'}`}
              >
                <button
                  type="button"
                  onClick={() => openLightbox([mediaItem], 0)}
                  className="group relative block w-full overflow-hidden rounded-xl sm:rounded-2xl border border-white/12 bg-[#060B14] aspect-[4/3] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6F9BFF]"
                >
                  <SafeImage
                    src={mediaItem.url}
                    alt={cap || heading || title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute top-2.5 end-2.5 w-7 h-7 rounded-full bg-black/55 backdrop-blur-md border border-white/15 flex items-center justify-center text-white/90 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </span>
                </button>
                {cap && (
                  <p className="text-[11px] sm:text-xs text-[#91A3BE] leading-relaxed">{cap}</p>
                )}
              </div>
            )}

            <div
              className={`${
                mediaItem ? 'md:col-span-6' : 'md:col-span-12'
              } space-y-3 ${imageFirst ? 'md:order-2' : 'md:order-1'}`}
            >
              {heading && (
                <h3 className="text-[16.5px] sm:text-xl font-semibold text-[#F5F8FC] leading-snug">
                  {heading}
                </h3>
              )}
              {body && <FormattedEditorialText text={body} compact />}
            </div>
          </section>
        );
      }

      case 'key-metrics': {
        const items = block.metrics ?? [];
        if (items.length === 0) return null;
        const gridCols =
          items.length === 1
            ? 'grid-cols-1'
            : items.length === 2
              ? 'grid-cols-2'
              : items.length === 3
                ? 'grid-cols-1 sm:grid-cols-3'
                : 'grid-cols-2 lg:grid-cols-4';
        return (
          <section
            key={block.id}
            className="rounded-2xl sm:rounded-3xl border border-white/12 bg-[#0B1323]/80 p-4 sm:p-6 space-y-4"
          >
            {heading && (
              <h3 className="text-xs sm:text-sm font-semibold text-[#9EB5D8] tracking-wide">
                {heading}
              </h3>
            )}
            <div className={`grid ${gridCols} gap-3 sm:gap-4`}>
              {items.map((metric, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-white/10 bg-white/[0.025] p-3.5 sm:p-4 space-y-1.5"
                >
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-xl sm:text-2xl font-bold text-[#F5F8FC] font-numeric tabular-nums">
                      {metric.value}
                    </span>
                    {metric.unit && (
                      <span className="text-[11px] font-medium text-[#28CF77]">{metric.unit}</span>
                    )}
                  </div>
                  <p className="text-[11.5px] sm:text-xs text-[#AFC0D8] leading-snug">
                    {isFa ? metric.labelFa || metric.labelEn : metric.labelEn || metric.labelFa}
                  </p>
                </div>
              ))}
            </div>
          </section>
        );
      }

      case 'callout': {
        const tone = block.tone ?? 'insight';
        const toneClasses =
          tone === 'standard'
            ? 'border-[#28CF77]/28 bg-[#00A651]/[0.07]'
            : tone === 'highlight'
              ? 'border-[#6F9BFF]/32 bg-[#223A87]/[0.16]'
              : 'border-white/14 bg-white/[0.035]';
        const labelColor =
          tone === 'standard'
            ? 'text-[#28CF77]'
            : tone === 'highlight'
              ? 'text-[#8BB2FF]'
              : 'text-[#C6D2E3]';
        return (
          <aside
            key={block.id}
            className={`rounded-2xl border p-4 sm:p-6 space-y-2.5 ${toneClasses}`}
          >
            {heading && (
              <h3 className={`text-xs sm:text-sm font-semibold ${labelColor}`}>{heading}</h3>
            )}
            {body && <FormattedEditorialText text={body} compact />}
          </aside>
        );
      }

      case 'quote': {
        const attr = isFa
          ? block.attributionFa || block.attributionEn
          : block.attributionEn || block.attributionFa;
        return (
          <blockquote
            key={block.id}
            className="my-2 border-y border-white/12 py-6 sm:py-8 px-2 sm:px-6 text-center space-y-3"
          >
            <p className="text-[16px] sm:text-[21px] font-medium text-[#F5F8FC] leading-8 sm:leading-[1.8] rtl:leading-[1.9]">
              «{body}»
            </p>
            {attr && (
              <footer className="text-xs text-[#8FA4C2] font-medium">— {attr}</footer>
            )}
          </blockquote>
        );
      }
    }
  };

  return (
    <div className="relative">
      {/* Hairline Reading Progress Bar (public view only) */}
      {!isPreview && (
        <div
          aria-hidden="true"
          className="fixed top-0 inset-x-0 z-50 h-[2px] bg-transparent pointer-events-none"
        >
          <div
            className="h-full bg-gradient-to-r from-[#28CF77] via-[#6F9BFF] to-[#28CF77] transition-[width] duration-150"
            style={{ width: `${readProgress}%` }}
          />
        </div>
      )}

      {/* Editorial Header */}
      <header className="space-y-4 sm:space-y-5">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11.5px] sm:text-xs text-[#9BB0CC]">
          <span className="font-semibold text-[#28CF77]">{copy.topics[article.topic]}</span>
          <span aria-hidden="true" className="text-white/25">
            ·
          </span>
          <span className="inline-flex items-center gap-1 font-numeric tabular-nums">
            <Calendar className="w-3.5 h-3.5 text-[#6F9BFF]" />
            <span>{article.publishedDate}</span>
          </span>
          <span aria-hidden="true" className="text-white/25">
            ·
          </span>
          <span className="inline-flex items-center gap-1 font-numeric tabular-nums">
            <Clock className="w-3.5 h-3.5 text-[#6F9BFF]" />
            <span>
              {isFa ? `${readingMinutes} دقیقه مطالعه` : `${readingMinutes} min read`}
            </span>
          </span>
          {mediaCount > 0 && (
            <>
              <span aria-hidden="true" className="text-white/25">
                ·
              </span>
              <span className="inline-flex items-center gap-1 font-numeric tabular-nums">
                <Images className="w-3.5 h-3.5 text-[#6F9BFF]" />
                <span>{isFa ? `${mediaCount} تصویر` : `${mediaCount} visuals`}</span>
              </span>
            </>
          )}
        </div>

        <h1 className="text-[22px] sm:text-[38px] lg:text-[42px] font-semibold rtl:font-extrabold tracking-tight text-[#F5F8FC] leading-[1.24] rtl:leading-[1.35]">
          {title}
        </h1>

        {(subtitle || excerpt) && (
          <p className="text-[14px] sm:text-[17px] rtl:font-light text-[#C6D2E3] leading-relaxed rtl:leading-[1.9] max-w-3xl">
            {subtitle || excerpt}
          </p>
        )}

        {/* Author Byline (clean unboxed hairline bar) */}
        {author && (
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-white/10">
            <div className="w-9 h-9 rounded-full bg-[#223A87]/35 border border-[#6F9BFF]/35 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-[#8BB2FF]" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-semibold text-[#F5F8FC]">{author}</p>
              {authorRole && <p className="text-[11px] text-[#8FA4C2]">{authorRole}</p>}
            </div>
          </div>
        )}
      </header>

      {/* Cover Image Cinema Frame */}
      {article.coverImage && (
        <figure className="mt-6 sm:mt-8 space-y-2">
          <button
            type="button"
            onClick={() =>
              openLightbox(
                [
                  {
                    url: article.coverImage!,
                    captionFa: article.coverCaptionFa,
                    captionEn: article.coverCaptionEn,
                  },
                ],
                0
              )
            }
            className="group relative block w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-white/12 bg-[#070C17] aspect-[16/9] max-h-[540px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6F9BFF]"
          >
            <SafeImage
              src={article.coverImage}
              alt={coverCaption || title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-3 end-3 w-8 h-8 rounded-full bg-black/55 backdrop-blur-md border border-white/15 flex items-center justify-center text-white/90 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Maximize2 className="w-4 h-4" />
            </span>
          </button>
          {coverCaption && (
            <figcaption className="text-[11.5px] sm:text-xs text-[#8FA4C2] leading-relaxed">
              {coverCaption}
            </figcaption>
          )}
        </figure>
      )}

      {/* Asymmetric Reading Body + Sticky Editorial Dossier Rail */}
      <div
        className={`mt-8 sm:mt-10 grid grid-cols-1 ${
          !isPreview && (toc.length >= 2 || tags.length > 0)
            ? 'lg:grid-cols-12 gap-8 lg:gap-10 items-start'
            : ''
        }`}
      >
        {/* Main Essay Canvas */}
        <div
          className={
            !isPreview && (toc.length >= 2 || tags.length > 0)
              ? 'lg:col-span-8 space-y-6 sm:space-y-8'
              : 'space-y-6 sm:space-y-8'
          }
        >
          {blocks.length > 0 ? (
            blocks.map((block) => renderBlock(block))
          ) : (
            <div className="border-t border-white/10 pt-6">
              <FormattedEditorialText
                text={isFa ? article.bodyFa || article.bodyEn : article.bodyEn || article.bodyFa}
                leadStyle
              />
            </div>
          )}
        </div>

        {/* Sticky Dossier & Table of Contents Rail (Desktop) */}
        {!isPreview && (toc.length >= 2 || tags.length > 0) && (
          <aside className="lg:col-span-4 lg:sticky lg:top-28 space-y-5">
            {toc.length >= 2 && (
              <nav
                aria-label={isFa ? 'فهرست بخش‌های مقاله' : 'Article table of contents'}
                className="rounded-2xl border border-white/10 bg-[#0B1323]/75 p-4 sm:p-5 space-y-3"
              >
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-[#6F9BFF] font-semibold">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{isFa ? 'فهرست مطالب' : 'Contents'}</span>
                </div>
                <ol className="space-y-2 border-t border-white/8 pt-3">
                  {toc.map((entry) => (
                    <li key={entry.id}>
                      <a
                        href={`#${entry.id}`}
                        className="group flex items-baseline gap-2.5 text-xs sm:text-[13px] text-[#C6D2E3] hover:text-[#F5F8FC] transition-colors leading-relaxed"
                      >
                        <span className="font-numeric tabular-nums text-[11px] text-[#28CF77] shrink-0">
                          {entry.indexLabel}
                        </span>
                        <span className="group-hover:underline underline-offset-4">
                          {entry.title}
                        </span>
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            )}

            <div className="rounded-2xl border border-white/10 bg-[#0B1323]/65 p-4 sm:p-5 space-y-3">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-[#9EB5D8] font-semibold">
                <Layers className="w-3.5 h-3.5 text-[#28CF77]" />
                <span>{isFa ? 'شناسنامه فنی مقاله' : 'Editorial Dossier'}</span>
              </div>
              <dl className="space-y-2 border-t border-white/8 pt-3 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-[#8B9DB7]">{isFa ? 'حوزه تخصصی' : 'Discipline'}</dt>
                  <dd className="text-[#F5F8FC] font-medium">{copy.topics[article.topic]}</dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-[#8B9DB7]">{isFa ? 'زمان مطالعه' : 'Reading time'}</dt>
                  <dd className="text-[#F5F8FC] font-numeric tabular-nums">
                    {isFa ? `${readingMinutes} دقیقه` : `${readingMinutes} min`}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-[#8B9DB7]">{isFa ? 'مستندات تصویری' : 'Visual frames'}</dt>
                  <dd className="text-[#F5F8FC] font-numeric tabular-nums">{mediaCount}</dd>
                </div>
              </dl>

              {tags.length > 0 && (
                <div className="pt-3 border-t border-white/8 space-y-1.5">
                  <p className="text-[11px] text-[#8B9DB7]">{isFa ? 'کلیدواژه‌ها' : 'Keywords'}</p>
                  <p className="text-xs text-[#C8D4E6] leading-relaxed">
                    {tags.join(isFa ? ' · ' : ' · ')}
                  </p>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Interactive Full-Screen Lightbox */}
      {lightbox && (
        <LightboxModal
          state={lightbox}
          locale={locale}
          onClose={() => setLightbox(null)}
          onChangeIndex={(nextIdx) =>
            setLightbox((prev) => (prev ? { ...prev, index: nextIdx } : null))
          }
        />
      )}
    </div>
  );
}
