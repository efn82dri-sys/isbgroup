import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Copy,
  Edit3,
  Eye,
  FilePlus2,
  ImagePlus,
  Images,
  Layers,
  Loader2,
  Save,
  Search,
  Sliders,
  Trash2,
} from '../icons/IsbIcons';
import {
  deleteInsightArticle,
  saveInsightArticle,
  saveSiteSettings,
} from '../../services/contentStore';
import { deleteStudioImage, isMediaRef, uploadStudioImage } from '../../services/mediaStore';
import type {
  Insight,
  InsightBlock,
  InsightBlockType,
  InsightTopic,
  Locale,
  SiteSettings,
} from '../../types/content';
import {
  countInsightMedia,
  createInsightBlock,
  createTemplateBlocks,
  estimateReadingTimeMinutes,
  generateBlockId,
  insertBlockAt,
  MAX_INSIGHT_BLOCKS,
  moveBlockByOffset,
  prepareTelegraphInsightDraft,
} from '../../utils/insightBlocks';
import {
  hasErrors,
  parseSpecialtiesList,
  validateInsightForm,
  type FieldErrors,
  type InsightFormInput,
} from '../../utils/validation';
import { SafeImage } from '../BrandMark';
import { InsightEditorialRenderer } from '../InsightEditorialRenderer';
import {
  AutoGrowTextarea,
  InlineTelegraphInserter,
  TelegraphBlockItem,
  type TelegraphLangMode,
} from './TelegraphBlockCanvas';
import { PublishSettingsDrawer } from './PublishSettingsDrawer';

interface InsightEditorState {
  existingId?: string;
  isSeedDefault?: boolean;
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
  coverCaptionFa: string;
  coverCaptionEn: string;
  authorFa: string;
  authorEn: string;
  authorRoleFa: string;
  authorRoleEn: string;
  tagsFaText: string;
  tagsEnText: string;
  topic: InsightTopic;
  publishedDate: string;
  featured: boolean;
  status: 'draft' | 'published';
  blocks: InsightBlock[];
}

function insightToEditorState(article: Insight): InsightEditorState {
  const blocks =
    article.blocks && article.blocks.length > 0
      ? article.blocks.map((b) => ({
          ...b,
          media: b.media ? b.media.map((m) => ({ ...m })) : undefined,
          metrics: b.metrics ? b.metrics.map((m) => ({ ...m })) : undefined,
        }))
      : [
          {
            ...createInsightBlock('rich-text'),
            leadStyle: true,
            bodyFa: article.bodyFa,
            bodyEn: article.bodyEn,
          },
        ];

  return {
    existingId: article.isSeedDefault ? article.slug : article.id,
    isSeedDefault: article.isSeedDefault,
    slug: article.slug,
    titleFa: article.titleFa,
    titleEn: article.titleEn,
    subtitleFa: article.subtitleFa ?? '',
    subtitleEn: article.subtitleEn ?? '',
    excerptFa: article.excerptFa,
    excerptEn: article.excerptEn,
    bodyFa: article.bodyFa,
    bodyEn: article.bodyEn,
    coverImage: article.coverImage ?? '',
    coverCaptionFa: article.coverCaptionFa ?? '',
    coverCaptionEn: article.coverCaptionEn ?? '',
    authorFa: article.authorFa ?? '',
    authorEn: article.authorEn ?? '',
    authorRoleFa: article.authorRoleFa ?? '',
    authorRoleEn: article.authorRoleEn ?? '',
    tagsFaText: (article.tagsFa ?? []).join('، '),
    tagsEnText: (article.tagsEn ?? []).join(', '),
    topic: article.topic,
    publishedDate: article.publishedDate,
    featured: Boolean(article.featured),
    status: article.status,
    blocks,
  };
}

function emptyTelegraphState(template: 'blank' | 'telegram-report' | 'slide-deck'): InsightEditorState {
  return {
    slug: '',
    titleFa: '',
    titleEn: '',
    subtitleFa: '',
    subtitleEn: '',
    excerptFa: '',
    excerptEn: '',
    bodyFa: '',
    bodyEn: '',
    coverImage: '',
    coverCaptionFa: '',
    coverCaptionEn: '',
    authorFa: 'تیم تحریریه فنی گروه ISB',
    authorEn: 'ISB Group Technical Editorial Team',
    authorRoleFa: 'آزمایشگاه پایداری و طراحی معماری',
    authorRoleEn: 'Sustainability Lab & Architecture Studio',
    tagsFaText: '',
    tagsEnText: '',
    topic: 'sustainability-lab',
    publishedDate: new Date().toISOString().slice(0, 10),
    featured: false,
    status: 'published',
    blocks: createTemplateBlocks(template),
  };
}

interface InsightBlockComposerProps {
  locale: Locale;
  insights: Insight[];
  settings?: SiteSettings;
  onRefresh: () => Promise<void>;
  onBanner: (text: string, tone?: 'info' | 'success' | 'error') => void;
}

export function InsightBlockComposer({
  locale,
  insights,
  settings,
  onRefresh,
  onBanner,
}: InsightBlockComposerProps) {
  const isFa = locale === 'fa';
  const [editor, setEditor] = useState<InsightEditorState | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [langMode, setLangMode] = useState<TelegraphLangMode>(isFa ? 'fa' : 'en');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [errors, setErrors] = useState<FieldErrors<InsightFormInput>>({});
  const [savingTarget, setSavingTarget] = useState<'draft' | 'published' | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');

  const coverFileRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLTextAreaElement>(null);

  const filteredInsights = useMemo(() => {
    const q = search.trim().toLowerCase();
    return insights.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (!q) return true;
      return (
        item.titleFa.toLowerCase().includes(q) ||
        item.titleEn.toLowerCase().includes(q) ||
        item.slug.toLowerCase().includes(q) ||
        (item.authorFa ?? '').toLowerCase().includes(q)
      );
    });
  }, [insights, search, statusFilter]);

  const previewArticle = useMemo<Insight | null>(() => {
    if (!editor) return null;
    const prepared = prepareTelegraphInsightDraft(editor, 'prev');
    const draftObj: Insight = {
      id: editor.existingId ?? 'preview',
      slug: prepared.slug,
      titleFa: prepared.titleFa || (isFa ? 'عنوان مقاله' : 'Article Title'),
      titleEn: prepared.titleEn || 'Article Title',
      subtitleFa: editor.subtitleFa.trim() || undefined,
      subtitleEn: editor.subtitleEn.trim() || undefined,
      excerptFa: prepared.excerptFa,
      excerptEn: prepared.excerptEn,
      bodyFa: prepared.bodyFa,
      bodyEn: prepared.bodyEn,
      coverImage: editor.coverImage.trim() || undefined,
      coverCaptionFa: editor.coverCaptionFa.trim() || undefined,
      coverCaptionEn: editor.coverCaptionEn.trim() || undefined,
      authorFa: editor.authorFa.trim() || undefined,
      authorEn: editor.authorEn.trim() || undefined,
      authorRoleFa: editor.authorRoleFa.trim() || undefined,
      authorRoleEn: editor.authorRoleEn.trim() || undefined,
      tagsFa: parseSpecialtiesList(editor.tagsFaText),
      tagsEn: parseSpecialtiesList(editor.tagsEnText),
      topic: editor.topic,
      publishedDate: editor.publishedDate,
      featured: editor.featured,
      status: editor.status,
      blocks: prepared.cleanBlocks,
    };
    return {
      ...draftObj,
      readingTimeMinutes: estimateReadingTimeMinutes(draftObj, langMode === 'en' ? 'en' : 'fa'),
    };
  }, [editor, isFa, langMode]);

  const liveStats = useMemo(() => {
    if (!previewArticle) return { readMins: 1, photos: 0 };
    return {
      readMins: previewArticle.readingTimeMinutes ?? 1,
      photos: countInsightMedia(previewArticle),
    };
  }, [previewArticle]);

  const openEditor = (nextState: InsightEditorState) => {
    setErrors({});
    setPreviewMode(false);
    setSettingsOpen(false);
    setLangMode(isFa ? 'fa' : 'en');
    setEditor(nextState);
  };

  /* Block operations */
  const handleInsertBlockAt = (index: number, type: InsightBlockType) => {
    setEditor((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        blocks: insertBlockAt(prev.blocks, index, createInsightBlock(type)),
      };
    });
  };

  const handleUpdateBlock = (index: number, nextBlock: InsightBlock) => {
    setEditor((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        blocks: prev.blocks.map((b, i) => (i === index ? nextBlock : b)),
      };
    });
  };

  const handleMoveBlock = (index: number, delta: -1 | 1) => {
    setEditor((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        blocks: moveBlockByOffset(prev.blocks, index, delta),
      };
    });
  };

  const handleDuplicateBlock = (index: number) => {
    setEditor((prev) => {
      if (!prev || prev.blocks.length >= MAX_INSIGHT_BLOCKS) return prev;
      const src = prev.blocks[index];
      const cloned: InsightBlock = {
        ...src,
        id: generateBlockId(src.type.slice(0, 3)),
        media: src.media ? src.media.map((m) => ({ ...m })) : undefined,
        metrics: src.metrics ? src.metrics.map((m) => ({ ...m })) : undefined,
      };
      return {
        ...prev,
        blocks: insertBlockAt(prev.blocks, index + 1, cloned),
      };
    });
  };

  const handleRemoveBlock = (index: number) => {
    setEditor((prev) => {
      if (!prev) return prev;
      const next = prev.blocks.filter((_, i) => i !== index);
      return {
        ...prev,
        blocks: next.length > 0 ? next : [createInsightBlock('rich-text')],
      };
    });
  };

  /* Direct Cover Upload (1-click, Telegraph-clean) */
  const handleCoverUpload = async (file: File | undefined) => {
    if (!file) return;
    setUploadingCover(true);
    try {
      const res = await uploadStudioImage(file, 'cover');
      setEditor((prev) => (prev ? { ...prev, coverImage: res.mediaRef } : prev));
    } catch {
      onBanner(
        isFa ? 'آپلود تصویر جلد انجام نشد (JPG/PNG/WebP مجاز است).' : 'Cover image upload failed.',
        'error'
      );
    } finally {
      setUploadingCover(false);
      if (coverFileRef.current) coverFileRef.current.value = '';
    }
  };

  const handleRemoveCover = async () => {
    if (editor?.coverImage && isMediaRef(editor.coverImage)) {
      await deleteStudioImage(editor.coverImage);
    }
    setEditor((prev) =>
      prev ? { ...prev, coverImage: '', coverCaptionFa: '', coverCaptionEn: '' } : prev
    );
  };

  /* Canvas-wide Ctrl+V image paste → instantly creates a Telegram photo block */
  const handleCanvasPaste = async (e: React.ClipboardEvent) => {
    if (!editor || previewMode) return;
    const target = e.target as HTMLElement | null;
    if (target?.closest('[data-album-block="true"]')) return;
    const items = e.clipboardData?.items;
    if (!items) return;
    const files: File[] = [];
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const f = item.getAsFile();
        if (f) files.push(f);
      }
    }
    if (files.length === 0) return;
    e.preventDefault();
    try {
      const res = await uploadStudioImage(files[0], 'gallery');
      const albumBlock: InsightBlock = {
        ...createInsightBlock('telegram-media-post'),
        media: [{ url: res.mediaRef, captionFa: '', captionEn: '' }],
      };
      setEditor((prev) =>
        prev
          ? { ...prev, blocks: insertBlockAt(prev.blocks, prev.blocks.length, albumBlock) }
          : prev
      );
      onBanner(isFa ? 'تصویر از کلیپ‌بورد به مقاله اضافه شد.' : 'Pasted image added to article.', 'success');
    } catch {
      onBanner(isFa ? 'آپلود تصویر پیست‌شده انجام نشد.' : 'Could not upload pasted image.', 'error');
    }
  };

  /* Save or Publish with Telegraph zero-friction smart defaults */
  const handleSaveArticle = async (targetStatus: 'draft' | 'published') => {
    if (!editor) return;

    const prepared = prepareTelegraphInsightDraft(editor);

    const nextErrors = validateInsightForm(
      {
        slug: prepared.slug,
        titleFa: prepared.titleFa,
        titleEn: prepared.titleEn,
        excerptFa: prepared.excerptFa,
        excerptEn: prepared.excerptEn,
        bodyFa: prepared.bodyFa,
        bodyEn: prepared.bodyEn,
        coverImage: editor.coverImage,
        hasRichBlocks: prepared.cleanBlocks.length > 0,
      },
      locale
    );

    if (!prepared.titleFa || prepared.titleFa.length < 2) {
      nextErrors.titleFa = isFa
        ? 'لطفاً ابتدا عنوان مقاله را بنویسید.'
        : 'Please write an article title first.';
    }
    if (!prepared.hasAnyContent) {
      nextErrors.bodyFa = isFa
        ? 'حداقل یک پاراگراف متن یا یک تصویر به مقاله اضافه کنید.'
        : 'Add at least one paragraph or photo before publishing.';
    }

    setErrors(nextErrors);
    if (hasErrors(nextErrors)) {
      if (nextErrors.slug) {
        setSettingsOpen(true);
      } else if (nextErrors.titleFa) {
        titleInputRef.current?.focus();
      }
      onBanner(
        nextErrors.titleFa ||
          nextErrors.bodyFa ||
          nextErrors.slug ||
          (isFa ? 'لطفاً خطای نمایش‌داده‌شده را بررسی کنید.' : 'Please review the highlighted field.'),
        'error'
      );
      return;
    }

    setSavingTarget(targetStatus);
    try {
      const payload: Insight = {
        id: editor.existingId ?? '',
        slug: prepared.slug,
        titleFa: prepared.titleFa,
        titleEn: prepared.titleEn,
        subtitleFa: editor.subtitleFa.trim() || undefined,
        subtitleEn: editor.subtitleEn.trim() || undefined,
        excerptFa: prepared.excerptFa,
        excerptEn: prepared.excerptEn,
        bodyFa: prepared.bodyFa,
        bodyEn: prepared.bodyEn,
        coverImage: editor.coverImage.trim() || undefined,
        coverCaptionFa: editor.coverCaptionFa.trim() || undefined,
        coverCaptionEn: editor.coverCaptionEn.trim() || undefined,
        authorFa: editor.authorFa.trim() || undefined,
        authorEn: editor.authorEn.trim() || undefined,
        authorRoleFa: editor.authorRoleFa.trim() || undefined,
        authorRoleEn: editor.authorRoleEn.trim() || undefined,
        tagsFa: parseSpecialtiesList(editor.tagsFaText),
        tagsEn: parseSpecialtiesList(editor.tagsEnText),
        topic: editor.topic,
        publishedDate: editor.publishedDate,
        featured: editor.featured,
        status: targetStatus,
        blocks: prepared.cleanBlocks,
      };
      payload.readingTimeMinutes = estimateReadingTimeMinutes(payload, 'fa');

      await saveInsightArticle(payload, editor.existingId);
      setEditor(null);
      setErrors({});
      await onRefresh();
      onBanner(
        targetStatus === 'published'
          ? isFa
            ? 'مقاله با موفقیت منتشر شد و اکنون برای مخاطبان نمایش داده می‌شود.'
            : 'Article published successfully.'
          : isFa
            ? 'پیش‌نویس مقاله ذخیره شد.'
            : 'Article draft saved.',
        'success'
      );
    } catch {
      onBanner(
        isFa ? 'ذخیره مقاله انجام نشد. لطفاً دوباره تلاش کنید.' : 'Could not save article.',
        'error'
      );
    } finally {
      setSavingTarget(null);
    }
  };

  const handleToggleStatus = async (article: Insight) => {
    const nextStatus = article.status === 'published' ? 'draft' : 'published';
    try {
      await saveInsightArticle(
        { ...article, status: nextStatus },
        article.isSeedDefault ? article.slug : article.id
      );
      await onRefresh();
      onBanner(
        nextStatus === 'published'
          ? isFa
            ? 'مقاله منتشر شد.'
            : 'Article published.'
          : isFa
            ? 'مقاله به حالت پیش‌نویس رفت.'
            : 'Article moved to draft.',
        'success'
      );
    } catch {
      onBanner(isFa ? 'تغییر وضعیت مقاله انجام نشد.' : 'Could not update status.', 'error');
    }
  };

  const handleDelete = async (article: Insight) => {
    try {
      if (article.isSeedDefault && settings) {
        const nextHidden = Array.from(
          new Set([...(settings.hiddenSeedInsightSlugs ?? []), article.slug])
        );
        await saveSiteSettings({ ...settings, hiddenSeedInsightSlugs: nextHidden });
      } else {
        await deleteInsightArticle(article.id);
      }
      setConfirmDeleteId(null);
      await onRefresh();
      onBanner(isFa ? 'مقاله حذف شد.' : 'Article deleted.', 'success');
    } catch {
      onBanner(isFa ? 'حذف مقاله انجام نشد.' : 'Could not delete article.', 'error');
    }
  };

  /* ============================================================================
   * TELEGRAPH WRITING & LIVE PREVIEW WORKSPACE
   * ========================================================================== */
  if (editor) {
    const BackIcon = isFa ? ArrowRight : ArrowLeft;
    const showFa = langMode === 'fa' || langMode === 'both';
    const showEn = langMode === 'en' || langMode === 'both';

    return (
      <div className="space-y-5" onPaste={(e) => void handleCanvasPaste(e)}>
        {/* Minimal Sticky Telegraph Top Bar */}
        <div className="sticky top-20 z-30 rounded-2xl border border-white/12 bg-[#09101E]/95 backdrop-blur-md px-3.5 sm:px-5 py-2.5 flex flex-wrap items-center justify-between gap-3">
          {/* Start: Back + quiet reading stats */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setEditor(null)}
              className="min-h-[36px] inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#C6D2E3] hover:text-white hover:bg-white/[0.06] transition-colors whitespace-nowrap shrink-0"
            >
              <BackIcon className="w-3.5 h-3.5" />
              <span>{isFa ? 'مقالات' : 'Articles'}</span>
            </button>
            <span className="hidden md:inline text-xs text-[#6E82A1] font-numeric tabular-nums whitespace-nowrap">
              {isFa
                ? `${liveStats.readMins} دقیقه مطالعه · ${liveStats.photos} تصویر`
                : `${liveStats.readMins} min read · ${liveStats.photos} photos`}
            </span>
          </div>

          {/* Center: Clean 2-mode segmented toggle (Write | Live Preview) */}
          <div className="inline-flex items-center rounded-xl bg-black/40 p-1 border border-white/10">
            <button
              type="button"
              onClick={() => setPreviewMode(false)}
              className={`min-h-[32px] rounded-lg px-3.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                !previewMode
                  ? 'bg-[#223A87] text-white'
                  : 'text-[#9BB0CC] hover:text-white'
              }`}
            >
              {isFa ? 'نگارش' : 'Write'}
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode(true)}
              className={`min-h-[32px] inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                previewMode
                  ? 'bg-[#223A87] text-white'
                  : 'text-[#9BB0CC] hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{isFa ? 'پیش‌نمایش واقعی' : 'Preview'}</span>
            </button>
          </div>

          {/* End: Settings Drawer + Draft + ONE Primary Publish CTA */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              aria-label={isFa ? 'تنظیمات انتشار و ترجمه' : 'Publish settings & translation'}
              className="min-h-[36px] inline-flex items-center gap-1.5 rounded-lg border border-white/12 bg-white/[0.03] hover:bg-white/[0.08] px-3 py-1.5 text-xs text-[#DCE6F5] transition-colors whitespace-nowrap shrink-0"
            >
              <Sliders className="w-3.5 h-3.5 text-[#6F9BFF]" />
              <span className="hidden sm:inline">{isFa ? 'تنظیمات و ترجمه' : 'Settings'}</span>
            </button>

            <button
              type="button"
              disabled={savingTarget !== null}
              onClick={() => void handleSaveArticle('draft')}
              className="min-h-[36px] inline-flex items-center gap-1.5 rounded-lg border border-white/12 bg-white/[0.03] hover:bg-white/[0.08] px-3 py-1.5 text-xs text-[#C6D2E3] transition-colors disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              {savingTarget === 'draft' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">{isFa ? 'پیش‌نویس' : 'Draft'}</span>
            </button>

            <button
              type="button"
              disabled={savingTarget !== null}
              onClick={() => void handleSaveArticle('published')}
              className="min-h-[38px] inline-flex items-center gap-1.5 rounded-lg bg-[#00A651] hover:bg-[#05B85C] px-4 sm:px-5 py-1.5 text-xs font-semibold text-[#04150C] transition-colors disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              {savingTarget === 'published' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>
                {savingTarget === 'published'
                  ? isFa
                    ? 'در حال انتشار...'
                    : 'Publishing...'
                  : isFa
                    ? 'انتشار'
                    : 'Publish'}
              </span>
            </button>
          </div>
        </div>

        {/* LIVE PREVIEW MODE */}
        {previewMode && previewArticle ? (
          <div className="max-w-4xl mx-auto rounded-3xl border border-white/12 bg-[#070C17] p-5 sm:p-8">
            <div className="flex items-center justify-between gap-2 pb-4 mb-6 border-b border-white/10">
              <span className="text-xs font-medium text-[#28CF77]">
                {isFa ? 'پیش‌نمایش دقیق صفحه مخاطبان' : 'Live Reader Preview'}
              </span>
              <button
                type="button"
                onClick={() => setPreviewMode(false)}
                className="text-xs text-[#9BB0CC] hover:text-white"
              >
                {isFa ? 'بازگشت به نگارش' : 'Back to Editor'}
              </button>
            </div>
            <InsightEditorialRenderer
              article={previewArticle}
              locale={langMode === 'en' ? 'en' : 'fa'}
              isPreview
            />
          </div>
        ) : (
          /* TELEGRAPH DISTRACTION-FREE WRITING CANVAS */
          <div className="max-w-[780px] mx-auto rounded-3xl border border-white/10 bg-[#080E1B]/95 px-5 sm:px-10 md:px-12 py-7 sm:py-10 space-y-6">
            {/* Inline Validation Alert (only when needed) */}
            {(errors.titleFa || errors.bodyFa) && (
              <div
                role="alert"
                className="rounded-xl border border-amber-400/35 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-200"
              >
                {errors.titleFa || errors.bodyFa}
              </div>
            )}

            {/* 1. Optional Minimal Cover Strip (1-click upload, zero bloat) */}
            <div>
              <input
                ref={coverFileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => void handleCoverUpload(e.target.files?.[0])}
                className="sr-only"
              />

              {editor.coverImage ? (
                <div className="space-y-2">
                  <div className="group/cov relative aspect-[16/9] rounded-2xl overflow-hidden border border-white/10 bg-[#050912]">
                    <SafeImage
                      src={editor.coverImage}
                      alt={editor.titleFa || 'Article cover'}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 end-3 flex items-center gap-1.5 opacity-100 sm:opacity-0 sm:group-hover/cov:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => coverFileRef.current?.click()}
                        className="rounded-lg bg-black/75 border border-white/15 px-3 py-1.5 text-xs text-white hover:border-[#6F9BFF]"
                      >
                        {isFa ? 'تغییر کاور' : 'Replace Cover'}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleRemoveCover()}
                        aria-label={isFa ? 'حذف تصویر جلد' : 'Remove cover image'}
                        className="w-8 h-8 rounded-lg bg-black/80 border border-rose-400/35 text-rose-300 hover:bg-rose-500 hover:text-white flex items-center justify-center"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    dir={langMode === 'en' ? 'ltr' : 'rtl'}
                    value={langMode === 'en' ? editor.coverCaptionEn : editor.coverCaptionFa}
                    onChange={(e) =>
                      setEditor(
                        langMode === 'en'
                          ? { ...editor, coverCaptionEn: e.target.value }
                          : { ...editor, coverCaptionFa: e.target.value }
                      )
                    }
                    placeholder={
                      isFa ? 'زیرنویس تصویر جلد (اختیاری)...' : 'Cover photo caption (optional)...'
                    }
                    className="w-full bg-transparent outline-none text-xs text-[#8FA4C2] placeholder:text-[#526583]"
                  />
                </div>
              ) : (
                <button
                  type="button"
                  disabled={uploadingCover}
                  onClick={() => coverFileRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 -ms-2.5 text-xs text-[#7E94B5] hover:text-[#DCE6F5] hover:bg-white/[0.04] transition-colors"
                >
                  {uploadingCover ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#28CF77]" />
                  ) : (
                    <ImagePlus className="w-3.5 h-3.5 text-[#28CF77]" />
                  )}
                  <span>
                    {uploadingCover
                      ? isFa
                        ? 'در حال آپلود تصویر جلد...'
                        : 'Uploading cover...'
                      : isFa
                        ? 'افزودن تصویر جلد مقاله (اختیاری)'
                        : 'Add cover image (optional)'}
                  </span>
                </button>
              )}
            </div>

            {/* 2. Telegraph Borderless Title, Subtitle & Author Line */}
            <header className="space-y-3 pb-6 border-b border-white/10">
              {showFa && (
                <AutoGrowTextarea
                  textareaRef={titleInputRef}
                  dir="rtl"
                  minRows={1}
                  ariaLabel={isFa ? 'عنوان مقاله' : 'Persian article title'}
                  value={editor.titleFa}
                  onChange={(next) => {
                    setErrors((prev) => ({ ...prev, titleFa: undefined }));
                    setEditor({ ...editor, titleFa: next });
                  }}
                  placeholder="عنوان مقاله را اینجا بنویسید..."
                  className="text-2xl sm:text-[32px] font-bold leading-snug text-[#F5F8FC] tracking-tight"
                />
              )}

              {showEn && (
                <AutoGrowTextarea
                  dir="ltr"
                  minRows={1}
                  ariaLabel="English article title"
                  value={editor.titleEn}
                  onChange={(next) => setEditor({ ...editor, titleEn: next })}
                  placeholder="Article title (English)..."
                  className="text-xl sm:text-2xl font-bold leading-snug text-[#DCE6F5]"
                />
              )}

              {showFa && (
                <AutoGrowTextarea
                  dir="rtl"
                  minRows={1}
                  ariaLabel={isFa ? 'زیرعنوان اختیاری' : 'Optional subtitle'}
                  value={editor.subtitleFa}
                  onChange={(next) => setEditor({ ...editor, subtitleFa: next })}
                  placeholder="یک جمله خلاصه یا زیرعنوان (اختیاری)..."
                  className="text-base leading-7 text-[#9BB0CC]"
                />
              )}

              {/* Telegraph Author & Topic Single Quiet Row */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pt-1 text-xs text-[#8FA4C2]">
                <input
                  type="text"
                  dir={langMode === 'en' ? 'ltr' : 'rtl'}
                  aria-label={isFa ? 'نام نویسنده' : 'Author name'}
                  value={langMode === 'en' ? editor.authorEn : editor.authorFa}
                  onChange={(e) =>
                    setEditor(
                      langMode === 'en'
                        ? { ...editor, authorEn: e.target.value }
                        : { ...editor, authorFa: e.target.value }
                    )
                  }
                  placeholder={isFa ? 'نام نویسنده...' : 'Your name...'}
                  className="min-w-[160px] flex-1 max-w-[260px] bg-transparent outline-none text-[#C6D2E3] placeholder:text-[#556886]"
                />

                <span aria-hidden="true" className="text-white/20">
                  ·
                </span>

                <select
                  aria-label={isFa ? 'دپارتمان مقاله' : 'Article department'}
                  value={editor.topic}
                  onChange={(e) =>
                    setEditor({ ...editor, topic: e.target.value as InsightTopic })
                  }
                  className="bg-transparent outline-none text-[#28CF77] font-medium cursor-pointer"
                >
                  <option value="sustainability-lab" className="bg-[#0B1221] text-[#F5F8FC]">
                    {isFa ? 'آزمایشگاه پایداری' : 'Sustainability Lab'}
                  </option>
                  <option value="architecture" className="bg-[#0B1221] text-[#F5F8FC]">
                    {isFa ? 'معماری و شهرسازی' : 'Architecture & Urbanism'}
                  </option>
                  <option value="energy-mep" className="bg-[#0B1221] text-[#F5F8FC]">
                    {isFa ? 'انرژی و تأسیسات' : 'Energy & MEP'}
                  </option>
                  <option value="structure-seismic" className="bg-[#0B1221] text-[#F5F8FC]">
                    {isFa ? 'سازه و مهندسی زلزله' : 'Structure & Seismic'}
                  </option>
                </select>

                {langMode !== 'fa' && (
                  <>
                    <span aria-hidden="true" className="text-white/20">
                      ·
                    </span>
                    <button
                      type="button"
                      onClick={() => setLangMode('fa')}
                      className="text-[#6F9BFF] hover:underline"
                    >
                      {isFa ? 'بازگشت به نمای ساده فارسی' : 'Switch to Persian focus'}
                    </button>
                  </>
                )}
              </div>
            </header>

            {/* 3. Live Telegraph Story Blocks + Inline "+" Inserters */}
            <div className="space-y-1">
              {editor.blocks.map((block, idx) => (
                <React.Fragment key={block.id}>
                  <div data-album-block={block.type === 'telegram-media-post' ? 'true' : undefined}>
                    <TelegraphBlockItem
                      block={block}
                      index={idx}
                      total={editor.blocks.length}
                      locale={locale}
                      langMode={langMode}
                      onChange={(next) => handleUpdateBlock(idx, next)}
                      onMove={(delta) => handleMoveBlock(idx, delta)}
                      onDuplicate={() => handleDuplicateBlock(idx)}
                      onRemove={() => handleRemoveBlock(idx)}
                      onEnterNewParagraph={() => handleInsertBlockAt(idx + 1, 'rich-text')}
                    />
                  </div>
                  {idx < editor.blocks.length - 1 && (
                    <InlineTelegraphInserter
                      locale={locale}
                      disabled={editor.blocks.length >= MAX_INSIGHT_BLOCKS}
                      onInsert={(type) => handleInsertBlockAt(idx + 1, type)}
                    />
                  )}
                </React.Fragment>
              ))}

              {/* Always-Ready Calm Bottom Telegraph Creation Strip */}
              <InlineTelegraphInserter
                locale={locale}
                alwaysOpen
                disabled={editor.blocks.length >= MAX_INSIGHT_BLOCKS}
                onInsert={(type) => handleInsertBlockAt(editor.blocks.length, type)}
              />
            </div>
          </div>
        )}

        {/* Slide-Over Optional Publish Settings & Translation Drawer */}
        <PublishSettingsDrawer
          open={settingsOpen}
          locale={locale}
          langMode={langMode}
          onChangeLangMode={setLangMode}
          values={{
            existingId: editor.existingId,
            slug: editor.slug,
            titleEn: editor.titleEn,
            subtitleEn: editor.subtitleEn,
            excerptFa: editor.excerptFa,
            excerptEn: editor.excerptEn,
            authorRoleFa: editor.authorRoleFa,
            authorRoleEn: editor.authorRoleEn,
            authorEn: editor.authorEn,
            tagsFaText: editor.tagsFaText,
            tagsEnText: editor.tagsEnText,
            topic: editor.topic,
            publishedDate: editor.publishedDate,
            featured: editor.featured,
          }}
          errors={errors}
          onChange={(patch) => setEditor((prev) => (prev ? { ...prev, ...patch } : prev))}
          onClose={() => setSettingsOpen(false)}
        />
      </div>
    );
  }

  /* ============================================================================
   * CLEAN ARTICLES LIBRARY VIEW (Single Primary Action + Calm Cards)
   * ========================================================================== */
  return (
    <div className="space-y-5">
      {/* Top Bar: One unmistakable primary CTA + quiet template shortcuts */}
      <div className="glass-surface rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-[#F5F8FC]">
              {isFa ? `مقالات تخصصی (${insights.length})` : `Technical Articles (${insights.length})`}
            </h2>
            <p className="text-xs text-[#9BB0CC]">
              {isFa
                ? 'مانند تلگراف بنویسید و در کمتر از یک دقیقه با آلبوم چندتصویری منتشر کنید.'
                : 'Write cleanly like Telegraph and publish with multi-photo albums in under a minute.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => openEditor(emptyTelegraphState('blank'))}
            className="min-h-[42px] inline-flex items-center gap-2 rounded-xl bg-[#00A651] hover:bg-[#05B85C] px-5 py-2 text-xs font-semibold text-[#04150C] transition-colors whitespace-nowrap shrink-0"
          >
            <FilePlus2 className="w-4 h-4" />
            <span>{isFa ? 'نوشتن مقاله جدید' : 'Write New Article'}</span>
          </button>
        </div>

        {/* Quiet Quick-Start Template Links + Search & Filter */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[#7E94B5]">
              {isFa ? 'یا شروع سریع با الگو:' : 'Quick templates:'}
            </span>
            <button
              type="button"
              onClick={() => openEditor(emptyTelegraphState('telegram-report'))}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] hover:border-[#28CF77]/45 px-2.5 py-1.5 text-[#DCE6F5] transition-colors"
            >
              <Images className="w-3.5 h-3.5 text-[#28CF77]" />
              <span>{isFa ? 'گزارش چندتصویری تلگرامی' : 'Telegram Photo Report'}</span>
            </button>
            <button
              type="button"
              onClick={() => openEditor(emptyTelegraphState('slide-deck'))}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] hover:border-[#6F9BFF]/45 px-2.5 py-1.5 text-[#DCE6F5] transition-colors"
            >
              <Layers className="w-3.5 h-3.5 text-[#6F9BFF]" />
              <span>{isFa ? 'ارائه اسلایدی' : 'Slide Presentation'}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 flex-1 sm:flex-initial justify-end">
            <div className="relative min-w-[200px] flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 text-[#7E94B5] absolute top-1/2 -translate-y-1/2 start-3 pointer-events-none" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isFa ? 'جستجو در مقالات...' : 'Search articles...'}
                className="w-full rounded-lg border border-white/12 bg-black/35 ps-9 pe-3 py-1.5 text-xs text-[#F5F8FC] outline-none focus:border-[#6F9BFF]"
              />
            </div>

            <div className="inline-flex items-center rounded-lg bg-black/35 p-0.5 border border-white/10 text-xs">
              {(
                [
                  { id: 'all', fa: 'همه', en: 'All' },
                  { id: 'published', fa: 'منتشرشده', en: 'Published' },
                  { id: 'draft', fa: 'پیش‌نویس', en: 'Drafts' },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setStatusFilter(f.id)}
                  className={`rounded-md px-2.5 py-1 transition-colors whitespace-nowrap ${
                    statusFilter === f.id
                      ? 'bg-[#223A87] text-white font-medium'
                      : 'text-[#9BB0CC] hover:text-white'
                  }`}
                >
                  {isFa ? f.fa : f.en}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Articles Grid */}
      {filteredInsights.length === 0 ? (
        <div className="glass-surface rounded-2xl p-10 text-center space-y-2 text-sm text-[#8B9DB7]">
          <BookOpen className="w-7 h-7 text-[#6F9BFF] mx-auto" />
          <p>{isFa ? 'مقاله‌ای با این جستجو یافت نشد.' : 'No matching articles found.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredInsights.map((article) => {
            const mediaTotal = countInsightMedia(article);
            const readMins =
              article.readingTimeMinutes || estimateReadingTimeMinutes(article, locale);

            return (
              <div
                key={article.id}
                className="glass-card rounded-2xl overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {article.coverImage && (
                    <div className="relative aspect-[16/8] bg-[#070C17] overflow-hidden border-b border-white/10">
                      <SafeImage
                        src={article.coverImage}
                        alt={isFa ? article.titleFa : article.titleEn}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="p-4 sm:p-5 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                      <div className="flex items-center gap-2 text-[#9BB0CC] font-numeric tabular-nums">
                        <span className="text-[#28CF77]">{article.publishedDate}</span>
                        <span aria-hidden="true">·</span>
                        <span>{isFa ? `${readMins} دقیقه` : `${readMins} min`}</span>
                        {mediaTotal > 0 && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{isFa ? `${mediaTotal} تصویر` : `${mediaTotal} photos`}</span>
                          </>
                        )}
                        {article.featured && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-[#6F9BFF] font-medium">
                              {isFa ? 'شاخص' : 'Featured'}
                            </span>
                          </>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => void handleToggleStatus(article)}
                        className={`text-[11px] font-medium transition-colors ${
                          article.status === 'published'
                            ? 'text-[#28CF77] hover:underline'
                            : 'text-amber-300 hover:underline'
                        }`}
                      >
                        {article.status === 'published'
                          ? isFa
                            ? 'منتشرشده'
                            : 'Published'
                          : isFa
                            ? 'پیش‌نویس'
                            : 'Draft'}
                      </button>
                    </div>

                    <h3 className="text-base font-semibold text-[#F5F8FC] leading-snug">
                      {isFa ? article.titleFa : article.titleEn}
                    </h3>
                    <p className="text-xs text-[#C6D2E3] line-clamp-2 leading-relaxed">
                      {isFa ? article.excerptFa : article.excerptEn}
                    </p>
                  </div>
                </div>

                <div className="px-4 sm:px-5 py-3 border-t border-white/10 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEditor(insightToEditorState(article))}
                      className="min-h-[36px] inline-flex items-center gap-1.5 rounded-lg border border-white/12 bg-white/[0.04] hover:border-[#6F9BFF]/55 px-3.5 py-1.5 text-xs font-medium text-[#F5F8FC] transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#6F9BFF]" />
                      <span>{isFa ? 'ویرایش' : 'Edit'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const base = insightToEditorState(article);
                        openEditor({
                          ...base,
                          existingId: undefined,
                          isSeedDefault: false,
                          slug: `${base.slug}-copy`,
                          titleFa: `${base.titleFa} (کپی)`,
                          titleEn: `${base.titleEn} (Copy)`,
                          status: 'draft',
                        });
                      }}
                      className="min-h-[36px] inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-[#C6D2E3] hover:text-white hover:bg-white/[0.05] transition-colors"
                      title={isFa ? 'کپی به عنوان مقاله جدید' : 'Duplicate as draft'}
                    >
                      <Copy className="w-3.5 h-3.5 text-[#28CF77]" />
                      <span className="hidden sm:inline">{isFa ? 'کپی' : 'Duplicate'}</span>
                    </button>
                  </div>

                  {confirmDeleteId === article.id ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => void handleDelete(article)}
                        className="rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        {isFa ? 'حذف قطعی' : 'Confirm'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2 py-1 text-xs text-[#C6D2E3]"
                      >
                        {isFa ? 'لغو' : 'Cancel'}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(article.id)}
                      aria-label={isFa ? `حذف مقاله ${article.titleFa}` : `Delete ${article.titleEn}`}
                      className="w-9 h-9 rounded-lg text-rose-300/75 hover:text-rose-200 hover:bg-rose-500/10 flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
