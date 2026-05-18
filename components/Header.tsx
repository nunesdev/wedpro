'use client';

import React from 'react';
import { ThemeMode, LayoutMode, ViewMode } from '@/types';

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
        <div className="font-bold text-xl tracking-tight">
          wedi<span className="text-emerald-500">.casa</span>
        </div>
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
            Estrutura
          </button>
        </div>

        <div className="flex items-center gap-2">
          {view === 'live' && (
            <button 
              onClick={toggleLayout}
              className={`text-xs border rounded-md px-2.5 py-1.5 font-medium transition ${
                theme === 'dark' ? 'border-zinc-700 hover:border-zinc-500 bg-zinc-900' : 'border-zinc-300 hover:border-zinc-400 bg-zinc-50'
              }`}>
              {layout === 'detailed' ? 'Layout: Detalhado' : 'Layout: Limpo'}
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