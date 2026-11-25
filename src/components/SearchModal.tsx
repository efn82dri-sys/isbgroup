import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, ArrowLeft, Search, X } from './icons/IsbIcons';
import { DISCIPLINES } from '../data/seedContent';
import { getCopy } from '../data/translations';
import type { Insight, Locale, PageRoute, Project } from '../types/content';
import { searchPublishedContent } from '../utils/searchAndFilter';

interface SearchModalProps {
  open: boolean;
  locale: Locale;
  projects: Project[];
  insights: Insight[];
  onClose: () => void;
  onNavigate: (route: PageRoute) => void;
  returnFocusRef: React.RefObject<HTMLButtonElement | null>;
}

export function SearchModal({
  open,
  locale,
  projects,
  insights,
  onClose,
  onNavigate,
  returnFocusRef,
}: SearchModalProps) {
  const copy = getCopy(locale);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const isRtl = locale === 'fa';

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        returnFocusRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose, returnFocusRef]);

  const results = useMemo(
    () => searchPublishedContent(query, locale, DISCIPLINES, projects, insights),
    [query, locale, projects, insights]
  );

  if (!open) return null;

  const handleClose = () => {
    onClose();
    setTimeout(() => returnFocusRef.current?.focus(), 10);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={copy.nav.searchLabel}
      className="fixed inset-0 z-50 flex items-start justify-center bg-[#060A12]/78 backdrop-blur-xl px-3 sm:px-4 pt-14 sm:pt-28"
      onClick={handleClose}
    >
      <div
        className="glass-surface-strong w-full max-w-2xl rounded-2xl sm:rounded-3xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 sm:gap-3 px-4 py-3 sm:px-5 sm:py-4 border-b border-[#6F9BFF]/18">
          <Search className="w-4 h-4 sm:w-5 sm:h-5 text-[#6F9BFF] shrink-0" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={copy.search.placeholder}
            aria-label={copy.search.placeholder}
            className="w-full bg-transparent text-[#F5F8FC] placeholder:text-[#8B9DB7] text-[14px] sm:text-base focus:outline-none"
          />
          <button
            type="button"
            onClick={handleClose}
            aria-label={copy.nav.closeLabel}
            className="glass-pill relative before:content-[''] before:absolute before:-inset-1.5 w-9 h-9 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[#C6D2E3] hover:text-[#F5F8FC] hover:border-[#6F9BFF]/50 transition-colors shrink-0 active:scale-[0.96]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-[62vh] sm:max-h-[60vh] overflow-y-auto p-2.5 sm:p-4">
          {!query.trim() ? (
            <p className="px-3 py-6 sm:py-8 text-center text-[13px] sm:text-sm text-[#8B9DB7]">
              {copy.search.emptyPrompt}
            </p>
          ) : results.length === 0 ? (
            <div className="px-3 py-6 sm:py-8 text-center space-y-1.5">
              <p className="text-[13px] sm:text-sm text-[#C6D2E3]">
                {copy.search.noResults} <span className="text-[#6F9BFF]">“{query.trim()}”</span>
              </p>
            </div>
          ) : (
            <ul className="space-y-1">
              {results.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onNavigate(item.route);
                      onClose();
                    }}
                    className="w-full min-h-[52px] text-start rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 hover:bg-[#223A87]/20 active:bg-[#223A87]/30 transition-colors flex items-center justify-between gap-3 sm:gap-4 group"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-[11px] sm:text-xs text-[#28CF77]">
                        <span>{copy.search.kindLabels[item.kind]}</span>
                      </div>
                      <div className="text-[13.5px] sm:text-sm font-medium text-[#F5F8FC] mt-0.5 truncate">
                        {item.title}
                      </div>
                      <div className="text-[11.5px] sm:text-xs text-[#8B9DB7] mt-0.5 line-clamp-1">
                        {item.subtitle}
                      </div>
                    </div>
                    {isRtl ? (
                      <ArrowLeft className="w-4 h-4 text-[#8B9DB7] group-hover:text-[#6F9BFF] shrink-0 transition-colors" />
                    ) : (
                      <ArrowRight className="w-4 h-4 text-[#8B9DB7] group-hover:text-[#6F9BFF] shrink-0 transition-colors" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="px-4 py-2 sm:px-5 sm:py-2.5 border-t border-[#6F9BFF]/14 bg-[#223A87]/[0.08] flex items-center justify-between text-[11px] sm:text-xs text-[#8B9DB7]">
          <span>{copy.search.escHint}</span>
          {query.trim() && (
            <span className="font-numeric">
              {results.length} {locale === 'fa' ? 'نتیجه' : results.length === 1 ? 'result' : 'results'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
