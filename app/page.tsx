import Link from 'next/link';

const domains = [
  {
    href: '/live',
    title: 'Timeline — Live',
    description: 'Cronograma público do evento em tempo real.',
  },
  {
    href: '/backoffice',
    title: 'Timeline — Backoffice',
    description: 'Gestão de blocos e horários do evento.',
  },
  {
    href: '/checkin',
    title: 'Portaria — Check-in',
    description: 'Confirmação de presença na entrada.',
  },
  {
    href: '/selfbar/operacao',
    title: 'Self-bar — Operação',
    description: 'Gerir fila: adicionar nomes, chamar próximo, timers.',
  },
  {
    href: '/selfbar',
    title: 'Self-bar — Convidado',
    description: 'Tela do convidado ativo no balcão.',
  },
  {
    href: '/selfbar/monitor',
    title: 'Self-bar — Monitor',
    description: 'Totem vertical de sinalização.',
  },
] as const;

export default function HomePage() {
  return (
    <div className="mx-auto max-w-xl py-10">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-600 dark:text-emerald-500">
        Wed
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        Eventos
      </h1>
      <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
        Três domínios independentes — timeline, portaria e fila do self-bar.
      </p>
      <ul className="mt-10 space-y-3">
        {domains.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="block rounded-xl border border-zinc-200 bg-white px-5 py-4 transition hover:border-emerald-500/40 dark:border-zinc-800 dark:bg-zinc-900/50"
            >
              <span className="font-semibold text-zinc-900 dark:text-zinc-50">{item.title}</span>
              <span className="mt-1 block text-sm text-zinc-500">{item.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
