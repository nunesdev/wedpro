'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ThemeMode } from '@/types';

const NAV_ITEMS = [
  { href: '/live', label: 'Live' },
  { href: '/backoffice', label: 'Backoffice' },
] as const;

interface HeaderNavMenuProps {
  theme: ThemeMode;
}

/** @deprecated Use DomainNav for cross-domain navigation */
export default function HeaderNavMenu({ theme }: HeaderNavMenuProps) {
  const pathname = usePathname();
  const isDark = theme === 'dark';

  return (
    <nav aria-label="Navegação timeline" className="flex items-center gap-4 sm:gap-6">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`text-sm font-medium transition whitespace-nowrap ${
              isActive
                ? isDark
                  ? 'text-emerald-400 underline underline-offset-4'
                  : 'text-emerald-700 underline underline-offset-4'
                : isDark
                  ? 'text-zinc-500 hover:text-zinc-200'
                  : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
