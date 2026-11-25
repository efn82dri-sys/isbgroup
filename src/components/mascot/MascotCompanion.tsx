import { lazy, Suspense, useEffect, useState } from 'react';
import { MessageCircle, Volume2 } from 'lucide-react';
import type { Locale, PageRoute } from '../../types/content';
import { buildPath } from '../../utils/routing';
import type { MascotAction } from './MascotMotion';
import './mascot.css';

const MascotViewport = lazy(() => import('./MascotViewport'));

const messages: Record<Locale, Partial<Record<MascotAction, string>>> = {
  fa: {
    welcome: 'سلام! به گروه ISB خوش اومدید.',
    helmet: 'بریم سراغ پروژه‌ها؟',
    plan: 'از روی نقشه شروع کنیم.',
    lab: 'بیاید عملکرد ساختمان رو بررسی کنیم.',
    insights: 'بیاید دقیق‌تر بخونیم.',
    course: 'آماده‌ایم برای یادگیری.',
    contact: 'خوشحالیم که با ما در ارتباطید.',
  },
  en: {
    welcome: 'Hi! Welcome to ISB Group.',
    helmet: 'Ready to explore our projects?',
    plan: 'Let’s start with the drawings.',
    lab: 'Let’s look at building performance.',
    insights: 'Let’s take a closer look.',
    course: 'Ready to learn something new?',
    contact: 'We’d love to hear from you.',
  },
};

const pageActions: Partial<Record<PageRoute['page'], MascotAction>> = {
  expertise: 'plan',
  discipline: 'plan',
  'materials-technologies': 'plan',
  projects: 'helmet',
  'project-detail': 'helmet',
  'sustainability-lab': 'lab',
  insights: 'insights',
  'insight-detail': 'insights',
  courses: 'course',
  contact: 'contact',
};

function useHomeAction(page: PageRoute['page']) {
  const [homeAction, setHomeAction] = useState<MascotAction>('welcome');

  useEffect(() => {
    if (page !== 'home') return;
    let frame = 0;
    let timer: number | undefined;
    let displayed: MascotAction | undefined;
    let pending: MascotAction | undefined;

    function measure() {
      frame = 0;
      const reference = window.innerHeight * 0.48;
      const sections = document.querySelectorAll<HTMLElement>('main [data-mascot-scene]');
      if (sections.length === 0) return;
      const section = Array.from(sections).find((element) => {
        const rect = element.getBoundingClientRect();
        return rect.top <= reference && rect.bottom > reference;
      });
      const next = (section?.dataset.mascotScene ?? 'idle') as MascotAction;

      if (displayed === undefined) {
        displayed = next;
        setHomeAction(next);
      } else if (next !== pending) {
        window.clearTimeout(timer);
        pending = next;
        if (next !== displayed) {
          timer = window.setTimeout(() => {
            displayed = next;
            setHomeAction(next);
          }, 160);
        }
      }
    }

    function schedule() {
      if (frame === 0) frame = window.requestAnimationFrame(measure);
    }

    const main = document.querySelector('main');
    const layout = new ResizeObserver(schedule);
    if (main) layout.observe(main);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    schedule();
    return () => {
      layout.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [page]);

  return page === 'home' ? homeAction : pageActions[page] ?? 'idle';
}

function useModalOpen() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    function check() {
      const dialogs = document.querySelectorAll<HTMLElement>('[role="dialog"][aria-modal="true"], dialog[open]');
      setOpen(Array.from(dialogs).some((dialog) => dialog.getClientRects().length > 0));
    }
    const observer = new MutationObserver(check);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['open', 'aria-modal', 'aria-hidden'],
    });
    window.addEventListener('resize', check);
    check();
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', check);
    };
  }, []);
  return open;
}

function useLocalVoice(locale: Locale) {
  const [voice, setVoice] = useState<SpeechSynthesisVoice>();
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    const speech = window.speechSynthesis;
    function update() {
      setVoice(speech.getVoices().find((item) =>
        item.localService && item.lang.toLowerCase().split(/[-_]/)[0] === locale,
      ));
    }
    update();
    speech.addEventListener('voiceschanged', update);
    return () => speech.removeEventListener('voiceschanged', update);
  }, [locale]);
  return voice?.lang.toLowerCase().split(/[-_]/)[0] === locale ? voice : undefined;
}

function MascotEmblem() {
  return (
    <span className="isb-mascot-emblem" aria-hidden="true">
      <span className="isb-mascot-emblem-face"><i /><i /></span>
      <span className="isb-mascot-emblem-bow" />
    </span>
  );
}

export function MascotCompanion({ locale, page, searchOpen, onConsult }: {
  locale: Locale;
  page: PageRoute['page'];
  searchOpen: boolean;
  onConsult: () => void;
}) {
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [mountedScene, setMountedScene] = useState(false);
  const [replay, setReplay] = useState(0);
  const [captionAction, setCaptionAction] = useState<MascotAction>();
  const [voiceFocused, setVoiceFocused] = useState(false);
  const action = useHomeAction(page);
  const modalOpen = useModalOpen();
  const voice = useLocalVoice(locale);
  const available = page !== 'account' && page !== 'studio' && !modalOpen && !searchOpen;
  const caption = messages[locale][action];
  const isFa = locale === 'fa';
  const name = isFa ? 'راهنمای ISB' : 'ISB guide';

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(motion.matches);
    motion.addEventListener('change', sync);
    return () => motion.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (available) setMountedScene(true);
    if (!available || !caption) {
      setCaptionAction(undefined);
      setVoiceFocused(false);
      return;
    }
    setCaptionAction(action);
    const timeout = window.setTimeout(() => setCaptionAction(undefined), 5000);
    return () => window.clearTimeout(timeout);
  }, [available, action, replay, caption]);

  function speak() {
    if (!voice || !caption) return;
    const utterance = new SpeechSynthesisUtterance(caption);
    utterance.voice = voice;
    utterance.lang = voice.lang;
    utterance.rate = 0.92;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setReplay((count) => count + 1);
  }

  return (
    <aside
      className="isb-mascot"
      aria-label={name}
      dir={isFa ? 'rtl' : 'ltr'}
      hidden={!available}
      data-mascot-action={action}
    >
      <div className="isb-mascot-panel">
        <div className="isb-mascot-stage" aria-hidden="true">
          {mountedScene && (
            <Suspense fallback={<MascotEmblem />}>
              <MascotViewport
                action={action}
                active={available}
                reduced={reduced}
                replay={replay}
                fallback={<MascotEmblem />}
              />
            </Suspense>
          )}
        </div>
        {caption && (captionAction === action || (voice && voiceFocused)) && (
          <div className="isb-mascot-caption">
            <p>{caption}</p>
            {voice && (
              <button
                type="button"
                className="isb-mascot-voice"
                aria-label={isFa ? 'پخش صدای راهنما' : 'Hear the guide'}
                onClick={speak}
                onFocus={() => setVoiceFocused(true)}
                onBlur={() => setVoiceFocused(false)}
              >
                <Volume2 size={15} aria-hidden="true" />
              </button>
            )}
          </div>
        )}
        <a
          className="isb-mascot-consult"
          href={buildPath(locale, { page: 'contact' })}
          onClick={(event) => {
            if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            event.preventDefault();
            onConsult();
          }}
        >
          <MessageCircle size={15} aria-hidden="true" />
          <span>{isFa ? 'درخواست مشاوره' : 'Consult us'}</span>
        </a>
      </div>
    </aside>
  );
}

