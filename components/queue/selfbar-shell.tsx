'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { ReactNode } from 'react';
import { SelfbarNav } from '@/components/queue/selfbar-nav';
import { DomainNav } from '@/components/timeline/domain-nav';

export function SelfbarShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-4xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Image
                src="/images/icon-256x256.png"
                alt="Ceria"
                width={32}
                height={32}
                className="rounded-lg"
              />
            </Link>
            <DomainNav theme="dark" />
          </div>
          <SelfbarNav />
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description ? (
          <p className="mt-1 mb-8 text-sm text-zinc-400">{description}</p>
        ) : (
          <div className="mb-8" />
        )}
        {children}
      </main>
    </div>
  );
}
