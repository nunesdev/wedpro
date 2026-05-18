'use client';

import React from 'react';
import Image from 'next/image';
import { ThemeMode, LayoutMode, ViewMode } from '@/types';

function LayoutDetailedIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <rect x="1.5" y="2" width="4" height="3.5" rx="1" stroke="currentColor" strokeWidth="1.25" />
      <path d="M7.5 3.5h8M7.5 5.5h5.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <rect x="1.5" y="7.25" width="4" height="3.5" rx="1" stroke="currentColor" strokeWidth="1.25" />
      <path d="M7.5 8.75h8M7.5 10.75h5.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <rect x="1.5" y="12.5" width="4" height="3.5" rx="1" stroke="currentColor" strokeWidth="1.25" />
      <path d="M7.5 14h8M7.5 16h5.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}

function LayoutCleanIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M2.5 4.5h13M2.5 9h13M2.5 13.5h13" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}

interface HeaderProps {
  theme: ThemeMode;
  toggleTheme: () => void;
  layout: LayoutMode;
  toggleLayout: () => void;
  view: ViewMode;
  setView: (view: ViewMode) => void;
}

export default function Header({
  theme,
  toggleTheme,
  layout,
  toggleLayout,
  view,
  setView,
}: HeaderProps) {
  return (
    <header className={`border-b px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-0 z-50 backdrop-blur-md ${
      theme === 'dark' ? 'border-zinc-800 bg-zinc-950/80 text-zinc-100' : 'border-zinc-200 bg-white/80 text-zinc-900'
    }`}>
      <div className="flex items-center gap-2 justify-between w-full sm:w-auto">
        <Image
          src="/images/icon-256x256.png"
          alt="wedi.casa"
          width={36}
          height={36}
          className="rounded-lg"
          priority
        />
        <span className="text-[10px] px-2 py-0.5 rounded-full border border-zinc-700 text-zinc-400 sm:inline-block hidden">
          Control Center
        </span>
      </div>
      
      <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4 text-sm w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-zinc-800">
        <div className="flex items-center gap-1 bg-zinc-900/10 dark:bg-zinc-800/40 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <button 
            onClick={() => setView('live')} 
            className={`px-3 py-1 rounded-md text-xs sm:text-sm font-medium transition ${view === 'live' ? 'bg-emerald-600 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'}`}>
            Live
          </button>
          <button 
            onClick={() => setView('backoffice')} 
            className={`px-3 py-1 rounded-md text-xs sm:text-sm font-medium transition ${view === 'backoffice' ? 'bg-emerald-600 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'}`}>
            Backoffice
          </button>
        </div>

        <div className="flex items-center gap-2">
          {view === 'live' && (
            <button
              type="button"
              onClick={toggleLayout}
              title={layout === 'detailed' ? 'Layout detalhado' : 'Layout limpo'}
              aria-label={layout === 'detailed' ? 'Layout detalhado (clique para layout limpo)' : 'Layout limpo (clique para layout detalhado)'}
              className={`p-2 rounded-md border transition ${
                theme === 'dark'
                  ? 'border-zinc-700 hover:border-zinc-500 bg-zinc-900 text-zinc-300'
                  : 'border-zinc-300 hover:border-zinc-400 bg-zinc-50 text-zinc-600'
              }`}
            >
              {layout === 'detailed' ? (
                <LayoutDetailedIcon />
              ) : (
                <LayoutCleanIcon />
              )}
            </button>
          )}

          <button 
            onClick={toggleTheme}
            className={`p-2 rounded-md border text-xs sm:text-sm ${
              theme === 'dark' ? 'border-zinc-800 hover:bg-zinc-900' : 'border-zinc-200 hover:bg-zinc-100'
            }`}
            aria-label="Alternar tema">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </div>
    </header>
  );
}