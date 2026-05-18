'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { TIMELINE_EVENT_ID } from '@/lib/timeline/constants';
import { unsubscribeWebPush } from '@/lib/push';
import { useTimelineSync } from '@/hooks/useTimelineSync';
import { useTimelineStore } from '@/store/timeline-store';
import { ToastProvider, useToast } from '@/components/ToastProvider';
import ConfirmModal from '@/components/ConfirmModal';
import LoadingSpinner from '@/components/LoadingSpinner';
import { DomainNav } from '@/components/timeline/domain-nav';
import { Toggle } from '@/components/ui/toggle';

function TimelineChrome({ children }: { children: ReactNode }) {
  useTimelineSync();
  const { showToast } = useToast();
  const swRegistrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const [notificationsOn, setNotificationsOn] = useState(false);
  const [notificationsSupported, setNotificationsSupported] = useState(false);

  const theme = useTimelineStore((s) => s.theme);
  const layout = useTimelineStore((s) => s.layout);
  const initialLoading = useTimelineStore((s) => s.initialLoading);
  const confirmStartBlockId = useTimelineStore((s) => s.confirmStartBlockId);
  const toggleTheme = useTimelineStore((s) => s.toggleTheme);
  const toggleLayout = useTimelineStore((s) => s.toggleLayout);
  const setConfirmStartBlockId = useTimelineStore((s) => s.setConfirmStartBlockId);
  const isPending = useTimelineStore((s) => s.isPending);
  const runWithLoading = useTimelineStore((s) => s.runWithLoading);
  const startBlockNow = useTimelineStore((s) => s.startBlockNow);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setNotificationsSupported('Notification' in window);

    const saved = localStorage.getItem('wedi_notifications');
    const granted = 'Notification' in window && Notification.permission === 'granted';
    setNotificationsOn(saved === 'true' || (saved !== 'false' && granted));

    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.register('/sw.js').then((registration) => {
        swRegistrationRef.current = registration;
      });
    }
  }, []);

  const handleNotifications = async (enabled: boolean) => {
    if (!notificationsSupported) return;

    if (!enabled) {
      if (swRegistrationRef.current) {
        await unsubscribeWebPush(swRegistrationRef.current, TIMELINE_EVENT_ID);
      }
      localStorage.setItem('wedi_notifications', 'false');
      setNotificationsOn(false);
      showToast('Notificações desativadas', 'warning');
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      localStorage.setItem('wedi_notifications', 'true');
      setNotificationsOn(true);
      showToast('Notificações ativadas', 'success');
    }
  };

  const isDark = theme === 'dark';

  return (
    <div
      className={`min-h-screen pb-12 transition-colors ${
        isDark ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-50 text-zinc-900'
      }`}
    >
      <header
        className={`sticky top-0 z-50 border-b px-4 py-4 backdrop-blur-md sm:px-6 ${
          isDark ? 'border-zinc-800 bg-zinc-950/80' : 'border-zinc-200 bg-white/80'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
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
            <DomainNav theme={theme} />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {notificationsSupported && (
              <Toggle
                checked={notificationsOn}
                onChange={handleNotifications}
                label="Push"
              />
            )}
            <button
              type="button"
              onClick={toggleLayout}
              className={`rounded-md border px-2 py-1.5 text-xs cursor-pointer ${
                isDark ? 'border-zinc-700' : 'border-zinc-300'
              }`}
            >
              {layout === 'detailed' ? 'Detalhado' : 'Limpo'}
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              className={`rounded-md border px-2 py-1.5 text-xs cursor-pointer ${
                isDark ? 'border-zinc-800' : 'border-zinc-200'
              }`}
              aria-label="Alternar tema"
            >
              {isDark ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </header>

      {initialLoading && (
        <div className="fixed inset-0 z-[60] flex min-h-screen items-center justify-center bg-white/75 backdrop-blur-md">
          <LoadingSpinner size="lg" className="text-emerald-500" />
        </div>
      )}

      <main className="relative mt-6 px-4 sm:px-6">{children}</main>

      <ConfirmModal
        open={confirmStartBlockId !== null}
        theme={theme}
        title="⚠️ Iniciar bloco agora?"
        message="Ao iniciar este bloco imediatamente, o(s) bloco(s) anterior(es) será(ão) considerado(s) concluído(s) e os horários seguintes mudarão em cascata."
        loading={
          confirmStartBlockId !== null && isPending(`start:${confirmStartBlockId}`)
        }
        onConfirm={() => {
          if (!confirmStartBlockId) return;
          void runWithLoading(`start:${confirmStartBlockId}`, async () => {
            const result = await startBlockNow(confirmStartBlockId);
            if (result.ok) showToast('Bloco iniciado', 'success');
            else showToast(result.error, 'error');
            setConfirmStartBlockId(null);
          });
        }}
        onCancel={() => setConfirmStartBlockId(null)}
      />
    </div>
  );
}

export function TimelineShell({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <TimelineChrome>{children}</TimelineChrome>
    </ToastProvider>
  );
}
