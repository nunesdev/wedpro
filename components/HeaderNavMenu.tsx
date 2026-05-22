'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CloseIcon, MenuIcon } from '@/components/icons';
import { isNavItemActive, MAIN_NAV_ITEMS } from '@/lib/navigation';
import { useThemeStore } from '@/store/theme-store';
import { cn } from '@/utils/cn';

function NavLinks({
  pathname,
  isDark,
  onNavigate,
  vertical = false,
}: {
  pathname: string;
  isDark: boolean;
  onNavigate?: () => void;
  vertical?: boolean;
}) {
  return (
    <>
      {MAIN_NAV_ITEMS.map((item) => {
        const isActive = isNavItemActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'font-medium transition',
              vertical
                ? 'block rounded-lg px-3 py-3 text-base'
                : 'text-sm whitespace-nowrap',
              isActive
                ? vertical
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : isDark
                    ? 'text-emerald-400 underline underline-offset-4 decoration-emerald-500/80'
                    : 'text-emerald-700 underline underline-offset-4 decoration-emerald-600/80'
                : vertical
                  ? 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800/60'
                  : isDark
                    ? 'text-zinc-500 hover:text-zinc-200'
                    : 'text-zinc-500 hover:text-zinc-900'
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

export default function HeaderNavMenu() {
  const pathname = usePathname();
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  return (
    <>
      <nav
        aria-label="Navegação principal"
        className="hidden items-center gap-4 md:flex lg:gap-6"
      >
        <NavLinks pathname={pathname} isDark={isDark} />
      </nav>

      <button
        type="button"
        className={cn(
          'inline-flex h-9 w-9 items-center justify-center rounded-lg border transition md:hidden',
          isDark
            ? 'border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800'
            : 'border-zinc-300 bg-zinc-50 text-zinc-700 hover:bg-zinc-100'
        )}
        aria-expanded={menuOpen}
        aria-controls="mobile-nav-panel"
        aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
        onClick={() => setMenuOpen((open) => !open)}
      >
        {menuOpen ? <CloseIcon /> : <MenuIcon />}
      </button>

      {menuOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-[2px] md:hidden"
            aria-label="Fechar menu"
            onClick={() => setMenuOpen(false)}
          />
          <nav
            id="mobile-nav-panel"
            aria-label="Menu mobile"
            className={cn(
              'absolute left-0 right-0 top-full z-50 max-h-[min(70dvh,24rem)] overflow-y-auto border-b px-4 py-3 shadow-lg md:hidden',
              isDark
                ? 'border-zinc-800 bg-zinc-950'
                : 'border-zinc-200 bg-white'
            )}
          >
            <div className="flex flex-col gap-1">
              <NavLinks
                pathname={pathname}
                isDark={isDark}
                vertical
                onNavigate={() => setMenuOpen(false)}
              />
            </div>
          </nav>
        </>
      )}
    </>
  );
}
