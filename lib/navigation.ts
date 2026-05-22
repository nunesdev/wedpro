export const MAIN_NAV_ITEMS = [
  { href: '/live', label: 'Cronograma' },
  { href: '/checkin', label: 'Check-in' },
  { href: '/selfbar/operacao', label: 'Self-Bar' },
  { href: '/backoffice', label: 'Backoffice' },
] as const;

export function isNavItemActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (href === '/selfbar/operacao' && pathname.startsWith('/selfbar')) return true;
  return false;
}
