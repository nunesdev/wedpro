'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import HeaderNavMenu from '@/components/HeaderNavMenu';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Toggle } from '@/components/ui/toggle';
import { TIMELINE_EVENT_ID } from '@/lib/timeline/constants';
import { unsubscribeWebPush } from '@/lib/push';
import { useThemeStore } from '@/store/theme-store';
import { useTimelineStore } from '@/store/timeline-store';
import { cn } from '@/utils/cn';

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

export default function Header() {
  const pathname = usePathname();
  const theme = useThemeStore((s) => s.theme);
  const layout = useTimelineStore((s) => s.layout);
  const toggleLayout = useTimelineStore((s) => s.toggleLayout);

  const swRegistrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const [notificationsSupported, setNotificationsSupported] = useState(false);
  const [notificationsOn, setNotificationsOn] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  const isLivePage = pathname === '/live';
  const isDark = theme === 'dark';

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    setNotificationsSupported(true);
    const saved = localStorage.getItem('wedi_notifications');
    const granted = Notification.permission === 'granted';
    setNotificationsOn(saved === 'true' || (saved !== 'false' && granted));

    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.register('/sw.js').then((registration) => {
        swRegistrationRef.current = registration;
      });
    }
  }, []);

  const handleNotificationsToggle = async (enabled: boolean) => {
    if (!('Notification' in window) || notificationsLoading) return;

    setNotificationsLoading(true);
    try {
      if (!enabled) {
        if (swRegistrationRef.current) {
          await unsubscribeWebPush(swRegistrationRef.current, TIMELINE_EVENT_ID);
        }
        localStorage.setItem('wedi_notifications', 'false');
        setNotificationsOn(false);
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        localStorage.setItem('wedi_notifications', 'true');
        setNotificationsOn(true);
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
      className={cn(
        'sticky top-0 z-50 flex flex-col gap-4 border-b px-4 py-4 sm:px-6',
        isDark
          ? 'border-zinc-800 bg-zinc-950/95 backdrop-blur-md'
          : 'border-zinc-200 bg-white/95 backdrop-blur-md'
      )}
    >
      <div className="flex w-full items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-4 sm:gap-6">
          <Link href="/">
            <Image
              src="/images/icon-256x256.png"
              alt="Ceria"
              width={36}
              height={36}
              className="shrink-0 rounded-lg"
              priority
            />
          </Link>
          <HeaderNavMenu />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {notificationsSupported && (
            <div
              className="flex items-center gap-2"
              title={notificationsOn ? 'Notificações ativas' : 'Ativar notificações'}
            >
              <BellIcon
                className={cn(
                  'shrink-0',
                  notificationsOn ? 'text-emerald-500' : 'text-zinc-400'
                )}
              />
              <Toggle
                checked={notificationsOn}
                onChange={handleNotificationsToggle}
                disabled={notificationsLoading}
                id="header-notifications"
              />
            </div>
          )}

          {isLivePage && (
            <button
              type="button"
              onClick={toggleLayout}
              title={layout === 'detailed' ? 'Layout detalhado' : 'Layout limpo'}
              className={cn(
                'rounded-md border p-2 transition cursor-pointer',
                isDark
                  ? 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500'
                  : 'border-zinc-300 bg-zinc-50 text-zinc-600 hover:border-zinc-400'
              )}
            >
              {layout === 'detailed' ? <LayoutDetailedIcon /> : <LayoutCleanIcon />}
            </button>
          )}

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
