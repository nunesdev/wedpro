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
    <div className="min-h-dvh bg-zinc-950 px-4 py-16 text-zinc-100">
      <div className="mx-auto max-w-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-500">
          Ceria
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Eventos</h1>
        <p className="mt-3 text-sm text-zinc-400">
          Três domínios independentes — timeline, portaria e fila do self-bar.
        </p>
        <ul className="mt-10 space-y-3">
          {domains.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="block rounded-xl border border-zinc-800 bg-zinc-900/50 px-5 py-4 transition hover:border-emerald-500/40"
              >
                <span className="font-semibold">{item.title}</span>
                <span className="mt-1 block text-sm text-zinc-500">{item.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
