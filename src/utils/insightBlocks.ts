import type {
  Insight,
  InsightBlock,
  InsightBlockMediaItem,
  InsightBlockMetricItem,
  InsightBlockType,
  InsightCalloutTone,
  InsightMediaLayout,
  InsightMediaPosition,
  InsightSplitSide,
  Locale,
} from '../types/content';
import { isSafeImageSrc, normalizeSlug, sanitizeText, slugifyEnglish } from './validation';

export const MAX_INSIGHT_BLOCKS = 40;
export const MAX_MEDIA_PER_BLOCK = 6;
export const MAX_METRICS_PER_BLOCK = 4;

const VALID_BLOCK_TYPES = new Set<InsightBlockType>([
  'section-heading',
  'rich-text',
  'telegram-media-post',
  'text-image-split',
  'key-metrics',
  'callout',
  'quote',
]);

const VALID_MEDIA_LAYOUTS = new Set<InsightMediaLayout>(['mosaic', 'feature-split', 'filmstrip']);
const VALID_TEXT_POSITIONS = new Set<InsightMediaPosition>(['above', 'below']);
const VALID_SPLIT_SIDES = new Set<InsightSplitSide>(['start', 'end']);
const VALID_CALLOUT_TONES = new Set<InsightCalloutTone>(['insight', 'standard', 'highlight']);

export function generateBlockId(prefix = 'blk'): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}_${rand}`;
}

export function createInsightBlock(type: InsightBlockType): InsightBlock {
  const id = generateBlockId(type.slice(0, 3));
  switch (type) {
    case 'section-heading':
      return {
        id,
        type,
        kickerFa: '',
        kickerEn: '',
        headingFa: '',
        headingEn: '',
      };
    case 'rich-text':
      return {
        id,
        type,
        headingFa: '',
        headingEn: '',
        bodyFa: '',
        bodyEn: '',
        leadStyle: false,
      };
    case 'telegram-media-post':
      return {
        id,
        type,
        headingFa: '',
        headingEn: '',
        bodyFa: '',
        bodyEn: '',
        media: [],
        mediaLayout: 'mosaic',
        textPosition: 'below',
      };
    case 'text-image-split':
      return {
        id,
        type,
        headingFa: '',
        headingEn: '',
        bodyFa: '',
        bodyEn: '',
        media: [],
        splitSide: 'start',
      };
    case 'key-metrics':
      return {
        id,
        type,
        headingFa: '',
        headingEn: '',
        metrics: [
          { value: '', unit: '', labelFa: '', labelEn: '' },
          { value: '', unit: '', labelFa: '', labelEn: '' },
        ],
      };
    case 'callout':
      return {
        id,
        type,
        tone: 'insight',
        headingFa: '',
        headingEn: '',
        bodyFa: '',
        bodyEn: '',
      };
    case 'quote':
      return {
        id,
        type,
        bodyFa: '',
        bodyEn: '',
        attributionFa: '',
        attributionEn: '',
      };
  }
}

export function createTemplateBlocks(template: 'blank' | 'telegram-report' | 'slide-deck'): InsightBlock[] {
  if (template === 'blank') {
    return [createInsightBlock('rich-text')];
  }
  if (template === 'telegram-report') {
    return [
      {
        ...createInsightBlock('section-heading'),
        kickerFa: 'بخش اول',
        kickerEn: 'PART 01',
        headingFa: 'مقدمه و مسئله فنی پروژه',
        headingEn: 'Technical Context & Problem Statement',
      },
      {
        ...createInsightBlock('rich-text'),
        leadStyle: true,
        bodyFa: '',
        bodyEn: '',
      },
      {
        ...createInsightBlock('telegram-media-post'),
        headingFa: 'مستندات تصویری و تحلیل اجرایی',
        headingEn: 'Visual Documentation & Field Notes',
        mediaLayout: 'mosaic',
        textPosition: 'below',
      },
      {
        ...createInsightBlock('key-metrics'),
        headingFa: 'شاخص‌های کلیدی عملکرد',
        headingEn: 'Key Performance Benchmarks',
      },
      {
        ...createInsightBlock('callout'),
        tone: 'standard',
        headingFa: 'جمع‌بندی استاندارد و الزامات اجرایی',
        headingEn: 'Code Compliance & Implementation Takeaway',
      },
    ];
  }

  return [
    {
      ...createInsightBlock('section-heading'),
      kickerFa: 'اسلاید ۱',
      kickerEn: 'SLIDE 01',
      headingFa: 'چشم‌انداز و مبانی طراحی',
      headingEn: 'Design Strategy & Core Principles',
    },
    {
      ...createInsightBlock('text-image-split'),
      splitSide: 'start',
      headingFa: 'تحلیل اقلیمی و جهت‌گیری',
      headingEn: 'Climate & Solar Orientation',
    },
    {
      ...createInsightBlock('text-image-split'),
      splitSide: 'end',
      headingFa: 'جزئیات پوسته و کنترل انرژی',
      headingEn: 'Envelope & Energy Control Details',
    },
    {
      ...createInsightBlock('quote'),
      bodyFa: '',
      bodyEn: '',
    },
  ];
}

function sanitizeMediaItem(raw: unknown): InsightBlockMediaItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as Record<string, unknown>;
  const url = typeof item.url === 'string' ? sanitizeText(item.url, 500) : '';
  if (!url || !isSafeImageSrc(url)) return null;

  const clean: InsightBlockMediaItem = { url };
  const captionFa = typeof item.captionFa === 'string' ? sanitizeText(item.captionFa, 280) : '';
  const captionEn = typeof item.captionEn === 'string' ? sanitizeText(item.captionEn, 280) : '';
  const altFa = typeof item.altFa === 'string' ? sanitizeText(item.altFa, 160) : '';
  const altEn = typeof item.altEn === 'string' ? sanitizeText(item.altEn, 160) : '';

  if (captionFa) clean.captionFa = captionFa;
  if (captionEn) clean.captionEn = captionEn;
  if (altFa) clean.altFa = altFa;
  if (altEn) clean.altEn = altEn;
  return clean;
}

function sanitizeMetricItem(raw: unknown): InsightBlockMetricItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as Record<string, unknown>;
  const value = typeof item.value === 'string' ? sanitizeText(item.value, 40) : '';
  const labelFa = typeof item.labelFa === 'string' ? sanitizeText(item.labelFa, 120) : '';
  const labelEn = typeof item.labelEn === 'string' ? sanitizeText(item.labelEn, 120) : '';
  const unit = typeof item.unit === 'string' ? sanitizeText(item.unit, 32) : '';

  if (!value && !labelFa && !labelEn) return null;
  const clean: InsightBlockMetricItem = {
    value: value || '—',
    labelFa: labelFa || labelEn || 'شاخص',
    labelEn: labelEn || labelFa || 'Metric',
  };
  if (unit) clean.unit = unit;
  return clean;
}

/**
 * Sanitizes and bounds structured editorial blocks into clean Firestore-safe maps
 * (no undefined fields, safe image URLs only, bounded array lengths).
 */
export function sanitizeInsightBlocks(blocks: unknown): InsightBlock[] {
  if (!Array.isArray(blocks)) return [];

  const result: InsightBlock[] = [];
  for (const raw of blocks) {
    if (result.length >= MAX_INSIGHT_BLOCKS) break;
    if (!raw || typeof raw !== 'object') continue;
    const item = raw as Record<string, unknown>;
    const type = typeof item.type === 'string' ? (item.type as InsightBlockType) : null;
    if (!type || !VALID_BLOCK_TYPES.has(type)) continue;

    const id =
      typeof item.id === 'string' && /^[a-zA-Z0-9_-]{2,64}$/.test(item.id.trim())
        ? item.id.trim()
        : generateBlockId(type.slice(0, 3));

    const clean: InsightBlock = { id, type };

    const kickerFa = typeof item.kickerFa === 'string' ? sanitizeText(item.kickerFa, 80) : '';
    const kickerEn = typeof item.kickerEn === 'string' ? sanitizeText(item.kickerEn, 80) : '';
    const headingFa = typeof item.headingFa === 'string' ? sanitizeText(item.headingFa, 200) : '';
    const headingEn = typeof item.headingEn === 'string' ? sanitizeText(item.headingEn, 200) : '';
    const bodyFa = typeof item.bodyFa === 'string' ? sanitizeText(item.bodyFa, 4000) : '';
    const bodyEn = typeof item.bodyEn === 'string' ? sanitizeText(item.bodyEn, 4000) : '';
    const attributionFa =
      typeof item.attributionFa === 'string' ? sanitizeText(item.attributionFa, 160) : '';
    const attributionEn =
      typeof item.attributionEn === 'string' ? sanitizeText(item.attributionEn, 160) : '';

    if (kickerFa) clean.kickerFa = kickerFa;
    if (kickerEn) clean.kickerEn = kickerEn;
    if (headingFa) clean.headingFa = headingFa;
    if (headingEn) clean.headingEn = headingEn;
    if (bodyFa) clean.bodyFa = bodyFa;
    if (bodyEn) clean.bodyEn = bodyEn;
    if (attributionFa) clean.attributionFa = attributionFa;
    if (attributionEn) clean.attributionEn = attributionEn;

    if (type === 'rich-text' && item.leadStyle === true) {
      clean.leadStyle = true;
    }

    if (type === 'telegram-media-post' || type === 'text-image-split') {
      const maxMedia = type === 'text-image-split' ? 1 : MAX_MEDIA_PER_BLOCK;
      const media = Array.isArray(item.media)
        ? item.media
            .map(sanitizeMediaItem)
            .filter((m): m is InsightBlockMediaItem => m !== null)
            .slice(0, maxMedia)
        : [];
      if (media.length > 0) clean.media = media;
    }

    if (type === 'telegram-media-post') {
      clean.mediaLayout =
        typeof item.mediaLayout === 'string' &&
        VALID_MEDIA_LAYOUTS.has(item.mediaLayout as InsightMediaLayout)
          ? (item.mediaLayout as InsightMediaLayout)
          : 'mosaic';
      clean.textPosition =
        typeof item.textPosition === 'string' &&
        VALID_TEXT_POSITIONS.has(item.textPosition as InsightMediaPosition)
          ? (item.textPosition as InsightMediaPosition)
          : 'below';
    }

    if (type === 'text-image-split') {
      clean.splitSide =
        typeof item.splitSide === 'string' &&
        VALID_SPLIT_SIDES.has(item.splitSide as InsightSplitSide)
          ? (item.splitSide as InsightSplitSide)
          : 'start';
    }

    if (type === 'key-metrics') {
      const metrics = Array.isArray(item.metrics)
        ? item.metrics
            .map(sanitizeMetricItem)
            .filter((m): m is InsightBlockMetricItem => m !== null)
            .slice(0, MAX_METRICS_PER_BLOCK)
        : [];
      if (metrics.length > 0) clean.metrics = metrics;
    }

    if (type === 'callout') {
      clean.tone =
        typeof item.tone === 'string' && VALID_CALLOUT_TONES.has(item.tone as InsightCalloutTone)
          ? (item.tone as InsightCalloutTone)
          : 'insight';
    }

    // Keep only meaningful blocks (non-empty content or media or metrics)
    const hasContent = Boolean(
      clean.headingFa ||
        clean.headingEn ||
        clean.bodyFa ||
        clean.bodyEn ||
        (clean.media && clean.media.length > 0) ||
        (clean.metrics && clean.metrics.length > 0)
    );
    if (hasContent) {
      result.push(clean);
    }
  }

  return result;
}

export function extractPlainTextFromBlocks(
  blocks: InsightBlock[] | undefined,
  locale: Locale
): string {
  if (!blocks || blocks.length === 0) return '';
  const isFa = locale === 'fa';
  const parts: string[] = [];

  for (const block of blocks) {
    const heading = isFa ? block.headingFa || block.headingEn : block.headingEn || block.headingFa;
    const body = isFa ? block.bodyFa || block.bodyEn : block.bodyEn || block.bodyFa;

    if (heading) parts.push(heading.trim());
    if (body) parts.push(body.replace(/\*\*/g, '').replace(/\*/g, '').trim());

    if (block.type === 'key-metrics' && block.metrics?.length) {
      const metricLine = block.metrics
        .map((m) => {
          const label = isFa ? m.labelFa || m.labelEn : m.labelEn || m.labelFa;
          return `${label}: ${m.value}${m.unit ? ` ${m.unit}` : ''}`;
        })
        .join(' · ');
      if (metricLine) parts.push(metricLine);
    }

    if (block.type === 'quote') {
      const attr = isFa
        ? block.attributionFa || block.attributionEn
        : block.attributionEn || block.attributionFa;
      if (attr) parts.push(`— ${attr.trim()}`);
    }
  }

  return parts.filter(Boolean).join('\n\n').slice(0, 23500);
}

export function countInsightMedia(insight: Pick<Insight, 'coverImage' | 'blocks'>): number {
  let count = insight.coverImage && isSafeImageSrc(insight.coverImage) ? 1 : 0;
  if (insight.blocks) {
    for (const block of insight.blocks) {
      if (block.media?.length) {
        count += block.media.filter((m) => isSafeImageSrc(m.url)).length;
      }
    }
  }
  return count;
}

export function estimateReadingTimeMinutes(
  insight: Pick<
    Insight,
    'titleFa' | 'titleEn' | 'excerptFa' | 'excerptEn' | 'bodyFa' | 'bodyEn' | 'blocks' | 'coverImage'
  >,
  locale: Locale = 'fa'
): number {
  const blockText = extractPlainTextFromBlocks(insight.blocks, locale);
  const rawBody = locale === 'fa' ? insight.bodyFa || insight.bodyEn : insight.bodyEn || insight.bodyFa;
  const combined = [
    locale === 'fa' ? insight.titleFa : insight.titleEn,
    locale === 'fa' ? insight.excerptFa : insight.excerptEn,
    blockText || rawBody,
  ]
    .filter(Boolean)
    .join(' ');

  const words = combined
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  const mediaCount = countInsightMedia(insight);
  // Technical Persian/English reading pace ~190 wpm + ~10s per architectural figure/photo
  const minutes = words / 190 + (mediaCount * 10) / 60;
  return Math.max(1, Math.min(60, Math.round(minutes)));
}

export interface TelegramMosaicSpec {
  containerClass: string;
  itemClasses: string[];
}

/**
 * Computes balanced Telegram Premium-inspired multi-photo collage layouts
 * for 1 to 6 images with zero orphan holes.
 */
export function computeTelegramMosaicLayout(
  count: number,
  layout: InsightMediaLayout = 'mosaic'
): TelegramMosaicSpec {
  const clamped = Math.max(1, Math.min(MAX_MEDIA_PER_BLOCK, count));

  if (layout === 'filmstrip' && clamped > 1) {
    return {
      containerClass: 'grid grid-flow-col auto-cols-[82%] sm:auto-cols-[48%] lg:auto-cols-[40%] gap-2 overflow-x-auto pb-1 snap-x snap-mandatory',
      itemClasses: Array.from({ length: clamped }, () => 'aspect-[4/3] snap-start'),
    };
  }

  if (layout === 'feature-split' && clamped >= 2) {
    const thumbCols =
      clamped === 2
        ? 'grid-cols-1 sm:grid-cols-2'
        : clamped === 3
          ? 'grid-cols-2'
          : clamped === 4
            ? 'grid-cols-3'
            : clamped === 5
              ? 'grid-cols-2 sm:grid-cols-4'
              : 'grid-cols-2 sm:grid-cols-5';
    return {
      containerClass: `grid ${thumbCols} gap-2`,
      itemClasses: Array.from({ length: clamped }, (_, idx) =>
        idx === 0
          ? clamped === 2
            ? 'aspect-[4/3]'
            : 'col-span-full aspect-[16/9]'
          : 'aspect-[4/3]'
      ),
    };
  }

  // Default: Adaptive Telegram Premium Smart Mosaic
  switch (clamped) {
    case 1:
      return {
        containerClass: 'grid grid-cols-1 gap-2',
        itemClasses: ['aspect-[16/10]'],
      };
    case 2:
      return {
        containerClass: 'grid grid-cols-1 sm:grid-cols-2 gap-2',
        itemClasses: ['aspect-[4/3]', 'aspect-[4/3]'],
      };
    case 3:
      return {
        containerClass: 'grid grid-cols-2 sm:grid-cols-12 gap-2',
        itemClasses: [
          'col-span-2 sm:col-span-7 sm:row-span-2 aspect-[16/10] sm:aspect-auto sm:min-h-[340px]',
          'col-span-1 sm:col-span-5 aspect-[4/3]',
          'col-span-1 sm:col-span-5 aspect-[4/3]',
        ],
      };
    case 4:
      return {
        containerClass: 'grid grid-cols-2 gap-2',
        itemClasses: ['aspect-[4/3]', 'aspect-[4/3]', 'aspect-[4/3]', 'aspect-[4/3]'],
      };
    case 5:
      return {
        containerClass: 'grid grid-cols-6 gap-2',
        itemClasses: [
          'col-span-3 aspect-[4/3]',
          'col-span-3 aspect-[4/3]',
          'col-span-2 aspect-[4/3]',
          'col-span-2 aspect-[4/3]',
          'col-span-2 aspect-[4/3]',
        ],
      };
    default:
      return {
        containerClass: 'grid grid-cols-2 sm:grid-cols-3 gap-2',
        itemClasses: Array.from({ length: clamped }, () => 'aspect-[4/3]'),
      };
  }
}

export interface TocEntry {
  id: string;
  indexLabel: string;
  title: string;
}

export function extractTableOfContents(
  blocks: InsightBlock[] | undefined,
  locale: Locale
): TocEntry[] {
  if (!blocks || blocks.length === 0) return [];
  const isFa = locale === 'fa';
  const entries: TocEntry[] = [];

  for (const block of blocks) {
    if (block.type !== 'section-heading') continue;
    const title = (isFa ? block.headingFa || block.headingEn : block.headingEn || block.headingFa)?.trim();
    if (!title) continue;
    entries.push({
      id: `section-${block.id}`,
      indexLabel: String(entries.length + 1).padStart(2, '0'),
      title,
    });
  }

  return entries;
}

export interface InlineRun {
  text: string;
  bold?: boolean;
  italic?: boolean;
}

export type FormattedSegment =
  | { kind: 'paragraph'; runs: InlineRun[] }
  | { kind: 'bullet-list'; items: InlineRun[][] };

/**
 * Pure, XSS-safe inline formatting tokenizer supporting **bold**, *italic*,
 * and bullet lines (- or •). Never emits HTML strings.
 */
export function parseInlineRuns(line: string): InlineRun[] {
  const runs: InlineRun[] = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      runs.push({ text: line.slice(lastIndex, match.index) });
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
      runs.push({ text: token.slice(2, -2), bold: true });
    } else if (token.startsWith('*') && token.endsWith('*') && token.length > 2) {
      runs.push({ text: token.slice(1, -1), italic: true });
    } else {
      runs.push({ text: token });
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < line.length) {
    runs.push({ text: line.slice(lastIndex) });
  }

  return runs.length > 0 ? runs : [{ text: line }];
}

export function parseFormattedText(raw: string): FormattedSegment[] {
  const normalized = raw.replace(/\r\n/g, '\n').trim();
  if (!normalized) return [];

  const segments: FormattedSegment[] = [];
  const lines = normalized.split('\n');
  let currentBullets: InlineRun[][] = [];

  const flushBullets = () => {
    if (currentBullets.length > 0) {
      segments.push({ kind: 'bullet-list', items: currentBullets });
      currentBullets = [];
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushBullets();
      continue;
    }

    const bulletMatch = line.match(/^(?:[-•–*]|\d+[.)])\s+(.+)$/);
    if (bulletMatch) {
      currentBullets.push(parseInlineRuns(bulletMatch[1]));
    } else {
      flushBullets();
      segments.push({ kind: 'paragraph', runs: parseInlineRuns(line) });
    }
  }

  flushBullets();
  return segments;
}

export function mergeCatalogInsights(
  seedInsights: Insight[],
  firestoreInsights: Insight[],
  hiddenSeedSlugs: string[] = [],
  includeDrafts = false
): Insight[] {
  const hiddenSet = new Set(hiddenSeedSlugs);
  const bySlug = new Map<string, Insight>();

  for (const seed of seedInsights) {
    if (!hiddenSet.has(seed.slug)) {
      bySlug.set(seed.slug, { ...seed, isSeedDefault: true });
    }
  }

  for (const docItem of firestoreInsights) {
    bySlug.set(docItem.slug, { ...docItem, isSeedDefault: false });
  }

  return Array.from(bySlug.values())
    .filter((item) => includeDrafts || item.status === 'published')
    .sort((a, b) => {
      if (Boolean(a.featured) !== Boolean(b.featured)) {
        return a.featured ? -1 : 1;
      }
      return b.publishedDate.localeCompare(a.publishedDate);
    });
}

/**
 * Removes inline markdown markers (**bold**, *italic*, leading bullets) for clean excerpts.
 */
export function stripInlineMarkdown(raw: string): string {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/^\s*(?:[-•–*]|\d+[.)])\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Inserts a new editorial block at a specific index (clamped and bounded by MAX_INSIGHT_BLOCKS).
 */
export function insertBlockAt(
  blocks: InsightBlock[],
  index: number,
  block: InsightBlock
): InsightBlock[] {
  if (blocks.length >= MAX_INSIGHT_BLOCKS) return blocks;
  const clamped = Math.max(0, Math.min(blocks.length, index));
  const next = [...blocks];
  next.splice(clamped, 0, block);
  return next;
}

/**
 * Moves an editorial block up (-1) or down (+1) safely without mutating the input array.
 */
export function moveBlockByOffset(
  blocks: InsightBlock[],
  index: number,
  delta: -1 | 1
): InsightBlock[] {
  const target = index + delta;
  if (index < 0 || index >= blocks.length || target < 0 || target >= blocks.length) {
    return blocks;
  }
  const next = [...blocks];
  const [moved] = next.splice(index, 1);
  next.splice(target, 0, moved);
  return next;
}

export interface TelegraphDraftInput {
  slug: string;
  titleFa: string;
  titleEn: string;
  subtitleFa: string;
  subtitleEn: string;
  excerptFa: string;
  excerptEn: string;
  bodyFa: string;
  bodyEn: string;
  coverImage: string;
  publishedDate: string;
  blocks: InsightBlock[];
}

export interface PreparedTelegraphSubmission {
  slug: string;
  titleFa: string;
  titleEn: string;
  excerptFa: string;
  excerptEn: string;
  bodyFa: string;
  bodyEn: string;
  cleanBlocks: InsightBlock[];
  hasAnyContent: boolean;
}

function buildAutoExcerpt(
  subtitle: string,
  plainBody: string,
  fallbackTitle: string
): string {
  const candidate = stripInlineMarkdown(subtitle || plainBody || fallbackTitle);
  if (candidate.length <= 220) return candidate;
  const sliced = candidate.slice(0, 217);
  const lastSpace = sliced.lastIndexOf(' ');
  return `${(lastSpace > 120 ? sliced.slice(0, lastSpace) : sliced).trim()}…`;
}

/**
 * Telegraph-style zero-friction publishing normalizer:
 * Lets an admin publish with only a Persian (or English) title + blocks/photos,
 * automatically deriving valid URL slug, clean SEO excerpts, and bilingual fallbacks
 * while strictly preserving any explicit translations the admin typed.
 */
export function prepareTelegraphInsightDraft(
  draft: TelegraphDraftInput,
  randomSuffix?: string
): PreparedTelegraphSubmission {
  const cleanBlocks = sanitizeInsightBlocks(draft.blocks);
  const rawTitleFa = draft.titleFa.trim();
  const rawTitleEn = draft.titleEn.trim();

  const titleFa = rawTitleFa || rawTitleEn;
  const titleEn = rawTitleEn || rawTitleFa;

  const derivedBodyFa = extractPlainTextFromBlocks(cleanBlocks, 'fa') || draft.bodyFa.trim();
  const derivedBodyEn = extractPlainTextFromBlocks(cleanBlocks, 'en') || draft.bodyEn.trim();

  const bodyFa = derivedBodyFa || derivedBodyEn || titleFa;
  const bodyEn = derivedBodyEn || derivedBodyFa || titleEn;

  const excerptFa =
    draft.excerptFa.trim() ||
    buildAutoExcerpt(draft.subtitleFa.trim(), derivedBodyFa, titleFa);

  const excerptEn =
    draft.excerptEn.trim() ||
    buildAutoExcerpt(draft.subtitleEn.trim(), derivedBodyEn, excerptFa || titleEn);

  const rawSlug = normalizeSlug(draft.slug);
  const slugFromEn = slugifyEnglish(rawTitleEn);
  const dateStamp = (draft.publishedDate || new Date().toISOString().slice(0, 10)).replace(
    /[^0-9]/g,
    ''
  );
  const suffix = (randomSuffix ?? Math.random().toString(36).slice(2, 6))
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 6) || 'post';

  const slug =
    rawSlug ||
    (slugFromEn.length >= 2 ? slugFromEn : `article-${dateStamp || 'isb'}-${suffix}`);

  const hasCover = Boolean(draft.coverImage.trim() && isSafeImageSrc(draft.coverImage.trim()));
  const hasAnyContent = cleanBlocks.length > 0 || Boolean(draft.bodyFa.trim() || draft.bodyEn.trim() || hasCover);

  return {
    slug,
    titleFa,
    titleEn,
    excerptFa,
    excerptEn,
    bodyFa,
    bodyEn,
    cleanBlocks,
    hasAnyContent,
  };
}

