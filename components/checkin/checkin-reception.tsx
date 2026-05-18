'use client';

import { useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Button } from '@/components/ui/button';
import { useCheckinStore } from '@/store/checkin-store';
import { cn } from '@/utils/cn';

export function CheckinReception() {
  const [query, setQuery] = useState('');
  const { guests, hasHydrated, checkIn, undoCheckIn } = useCheckinStore(
    useShallow((s) => ({
      guests: s.guests,
      hasHydrated: s._hasHydrated,
      checkIn: s.checkIn,
      undoCheckIn: s.undoCheckIn,
    }))
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return guests;
    return guests.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        g.table?.toLowerCase().includes(q)
    );
  }, [guests, query]);

  const checkedCount = guests.filter((g) => g.checkedInAt).length;

  if (!hasHydrated) {
    return <p className="text-sm text-zinc-500">Carregando lista de convidados…</p>;
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Portaria
        </p>
        <p className="mt-1 text-2xl font-bold text-zinc-50">
          {checkedCount} / {guests.length}{' '}
          <span className="text-base font-normal text-zinc-400">confirmados</span>
        </p>
      </div>

      <div>
        <label htmlFor="guest-search" className="mb-2 block text-sm font-medium text-zinc-400">
          Pesquisar convidado
        </label>
        <input
          id="guest-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nome ou mesa…"
          autoComplete="off"
          className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </div>

      <ul className="space-y-2">
        {filtered.length === 0 ? (
          <li className="rounded-xl border border-dashed border-zinc-800 py-10 text-center text-sm text-zinc-500">
            Nenhum convidado encontrado
          </li>
        ) : (
          filtered.map((guest) => {
            const isChecked = guest.checkedInAt !== null;
            return (
              <li
                key={guest.id}
                className={cn(
                  'flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between',
                  isChecked
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : 'border-zinc-800 bg-zinc-950/40'
                )}
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-zinc-100">{guest.name}</p>
                  <p className="text-xs text-zinc-500">
                    {guest.table ? `${guest.table} · ` : ''}
                    {guest.partySize} pessoa{guest.partySize > 1 ? 's' : ''}
                    {isChecked && (
                      <span className="ml-2 text-emerald-400">
                        · Entrou{' '}
                        {new Date(guest.checkedInAt!).toLocaleTimeString('pt-PT', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                  </p>
                </div>
                {isChecked ? (
                  <Button variant="outline" size="sm" onClick={() => undoCheckIn(guest.id)}>
                    Desfazer
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => checkIn(guest.id)}>
                    Confirmar presença
                  </Button>
                )}
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
