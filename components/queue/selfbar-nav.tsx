'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/utils/cn';

const LINKS = [
  { href: '/selfbar/operacao', label: 'Operação', match: (p: string) => p === '/selfbar/operacao' },
  { href: '/selfbar', label: 'Convidado', match: (p: string) => p === '/selfbar' },
  {
    href: '/selfbar/monitor',
    label: 'Monitor',
    match: (p: string) => p === '/selfbar/monitor',
  },
] as const;

export function SelfbarNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Self-bar"
      className="flex flex-wrap items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-100/80 p-1 dark:border-zinc-800 dark:bg-zinc-900/80"
    >
      {LINKS.map((link) => {
        const isActive = link.match(pathname);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-medium transition whitespace-nowrap',
              isActive
                ? 'bg-emerald-600 text-white'
                : 'text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
