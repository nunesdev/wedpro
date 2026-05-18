'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/utils/cn';
import type { ThemeMode } from '@/types';

const LINKS = [
  { href: '/live', label: 'Live' },
  { href: '/backoffice', label: 'Backoffice' },
  { href: '/checkin', label: 'Portaria' },
  { href: '/selfbar/operacao', label: 'Self-bar' },
] as const;

export function DomainNav({ theme }: { theme: ThemeMode }) {
  const pathname = usePathname();
  const isDark = theme === 'dark';

  return (
    <nav aria-label="Domínios" className="flex flex-wrap items-center gap-4 sm:gap-6">
      {LINKS.map((link) => {
        const isActive =
          pathname === link.href ||
          pathname.startsWith(`${link.href}/`) ||
          (link.href === '/selfbar/operacao' && pathname.startsWith('/selfbar'));
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'text-sm font-medium transition whitespace-nowrap',
              isActive
                ? isDark
                  ? 'text-emerald-400 underline underline-offset-4 decoration-emerald-500/80'
                  : 'text-emerald-700 underline underline-offset-4 decoration-emerald-600/80'
                : isDark
                  ? 'text-zinc-500 hover:text-zinc-200'
                  : 'text-zinc-500 hover:text-zinc-900'
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
