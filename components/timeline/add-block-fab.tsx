'use client';

import Link from 'next/link';
import { PlusIcon } from '@/components/icons';

export function AddBlockFab() {
  return (
    <Link
      href="/backoffice"
      className="fixed bottom-5 right-4 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-600 text-white shadow-lg shadow-emerald-900/25 transition hover:bg-emerald-500 active:scale-95 sm:bottom-6 sm:right-6"
      style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label="Adicionar blocos no backoffice"
      title="Adicionar blocos"
    >
      <PlusIcon className="h-6 w-6" />
    </Link>
  );
}
