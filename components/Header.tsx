'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { ThemeMode, LayoutMode, ViewMode } from '@/types';
import HeaderNavMenu from '@/components/HeaderNavMenu';

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

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path
        d="M9 2.25a3.25 3.25 0 0 0-3.25 3.25v2.1c0 .48-.17.95-.48 1.32l-.92 1.15a1.25 1.25 0 0 0 .98 2.03h7.34a1.25 1.25 0 0 0 .98-2.03l-.92-1.15a2.1 2.1 0 0 1-.48-1.32V5.5A3.25 3.25 0 0 0 9 2.25Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
      <path
        d="M7.25 13.75h3.5M8.25 15.75h1.5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
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
  onPermissionGranted?: () => void | Promise<void>;
  onNotificationsDisabled?: () => void | Promise<void>;
}

export default function Header({
  theme,
  toggleTheme,
  layout,
  toggleLayout,
  view,
  setView,
  onPermissionGranted,
  onNotificationsDisabled,
}: HeaderProps) {
  const [notificationsSupported, setNotificationsSupported] = useState(false);
  const [notificationsOn, setNotificationsOn] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    setNotificationsSupported(true);
    const saved = localStorage.getItem('wedi_notifications');
    const granted = Notification.permission === 'granted';
    setNotificationsOn(saved === 'true' || (saved !== 'false' && granted));
  }, []);

  const handleNotificationsToggle = async () => {
    if (!('Notification' in window) || notificationsLoading) return;

    if (notificationsOn) {
      setNotificationsLoading(true);
      try {
        await onNotificationsDisabled?.();
        localStorage.setItem('wedi_notifications', 'false');
        setNotificationsOn(false);
      } catch (err) {
        console.error('Erro ao desativar notificações:', err);
      } finally {
        setNotificationsLoading(false);
      }
      return;
    }

    setNotificationsLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        localStorage.setItem('wedi_notifications', 'true');
        setNotificationsOn(true);
        await onPermissionGranted?.();
      } else {
        localStorage.setItem('wedi_notifications', 'false');
        setNotificationsOn(false);
      }
    } finally {
      setNotificationsLoading(false);
    }
  };

  return (
    <header
      className={`border-b px-4 sm:px-6 py-4 flex flex-col gap-4 sticky top-0 z-50 backdrop-blur-md ${
        theme === 'dark'
          ? 'border-zinc-800 bg-zinc-950/80 text-zinc-100'
          : 'border-zinc-200 bg-white/80 text-zinc-900'
      }`}
    >
      <div className="flex items-center justify-between gap-3 w-full">
        <div className="flex items-center gap-4 sm:gap-6 min-w-0">
          <Image
            src="/images/icon-256x256.png"
            alt="wedi.casa"
            width={36}
            height={36}
            className="rounded-lg shrink-0"
            priority
          />
          <HeaderNavMenu theme={theme} />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {notificationsSupported && (
            <div
              className={`flex items-center gap-1.5 rounded-md border p-1.5 transition ${
                theme === 'dark'
                  ? 'border-zinc-700 bg-zinc-900'
                  : 'border-zinc-300 bg-zinc-50'
              }`}
              title={notificationsOn ? 'Notificações ativas' : 'Ativar notificações'}
            >
              <BellIcon
                className={
                  notificationsOn ? 'text-emerald-400 shrink-0' : 'text-zinc-400 shrink-0'
                }
              />
              <button
                type="button"
                role="switch"
                aria-checked={notificationsOn}
                aria-label={
                  notificationsOn ? 'Desativar notificações' : 'Ativar notificações'
                }
                disabled={notificationsLoading}
                onClick={handleNotificationsToggle}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed ${
                  notificationsOn
                    ? 'bg-emerald-600 border-emerald-500'
                    : theme === 'dark'
                      ? 'bg-zinc-800 border-zinc-700'
                      : 'bg-zinc-200 border-zinc-300'
                }`}
              >
                {notificationsLoading ? (
                  <span className="mx-auto h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      notificationsOn ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                )}
              </button>
            </div>
          )}

          {view === 'live' && (
            <button
              type="button"
              onClick={toggleLayout}
              title={layout === 'detailed' ? 'Layout detalhado' : 'Layout limpo'}
              aria-label={
                layout === 'detailed'
                  ? 'Layout detalhado (clique para layout limpo)'
                  : 'Layout limpo (clique para layout detalhado)'
              }
              className={`p-2 rounded-md border transition cursor-pointer ${
                theme === 'dark'
                  ? 'border-zinc-700 hover:border-zinc-500 bg-zinc-900 text-zinc-300'
                  : 'border-zinc-300 hover:border-zinc-400 bg-zinc-50 text-zinc-600'
              }`}
            >
              {layout === 'detailed' ? <LayoutDetailedIcon /> : <LayoutCleanIcon />}
            </button>
          )}

          <button
            type="button"
            onClick={toggleTheme}
            className={`p-2 rounded-md border text-xs sm:text-sm cursor-pointer ${
              theme === 'dark'
                ? 'border-zinc-800 hover:bg-zinc-900'
                : 'border-zinc-200 hover:bg-zinc-100'
            }`}
            aria-label="Alternar tema"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </div>
    </header>
  );
}
