'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useThemeStore } from '@/store/theme-store';
import { cn } from '@/utils/cn';

const NAV_ITEMS = [
  { href: '/live', label: 'Cronograma' },
  { href: '/checkin', label: 'Check-in' },
  { href: '/selfbar/operacao', label: 'Self-Bar' },
  { href: '/backoffice', label: 'Backoffice' },
] as const;

export default function HeaderNavMenu() {
  const pathname = usePathname();
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';

  return (
    <nav aria-label="Navegação principal" className="flex items-center gap-4 sm:gap-6">
      {NAV_ITEMS.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href === '/selfbar/operacao' && pathname.startsWith('/selfbar'));

        return (
          <Link
            key={item.href}
            href={item.href}
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
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
