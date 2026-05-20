'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';
import { supabaseExternal } from '@/lib/supabase-external';

// Interface mapeando examente o seu Schema SQL + checked_in_at
interface ExternalGuest {
  id: string;
  name: string;
  attending: boolean;
  adults_count: number;
  children_count: number;
  checked_in_at: string | null;
}

export function CheckinReception() {
  const [query, setQuery] = useState('');
  const [guests, setGuests] = useState<ExternalGuest[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Busca os dados da tabela rsvp no banco externo
  useEffect(() => {
    async function fetchExternalGuests() {
      try {
        setLoading(true);
        const { data, error } = await supabaseExternal
          .from('rsvp')
          .select('id, name, attending, adults_count, children_count, checked_in_at')
          .eq('attending', true) // Filtra para listar SÓ quem confirmou RSVP
          .order('name', { ascending: true });

        if (error) throw error;
        setGuests(data || []);
      } catch (err) {
        console.error('Erro ao buscar convidados externos:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchExternalGuests();
  }, []);

  // 2. Filtro de pesquisa por nome do titular
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return guests;
    return guests.filter((g) => g.name?.toLowerCase().includes(q));
  }, [guests, query]);

  const checkedCount = guests.filter((g) => g.checked_in_at !== null).length;

  // 3. Funções para atualizar o status de chegada na porta
  const handleCheckIn = async (id: string) => {
    const now = new Date().toISOString();
    
    setGuests((prev) => prev.map(g => g.id === id ? { ...g, checked_in_at: now } : g));

    const { error } = await supabaseExternal
      .from('rsvp')
      .update({ checked_in_at: now })
      .eq('id', id);

    if (error) console.error('Erro ao fazer check-in:', error);
  };

  const handleUndoCheckIn = async (id: string) => {
    setGuests((prev) => prev.map(g => g.id === id ? { ...g, checked_in_at: null } : g));

    const { error } = await supabaseExternal
      .from('rsvp')
      .update({ checked_in_at: null })
      .eq('id', id);

    if (error) console.error('Erro ao desfazer check-in:', error);
  };

  if (loading) {
    return <p className="text-sm text-zinc-500 animate-pulse">Sincronizando lista da portaria com o RSVP…</p>;
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div className="rounded-xl border border-zinc-200 bg-white/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Recepção do Evento
        </p>
        <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          {checkedCount} / {guests.length}{' '}
          <span className="text-base font-normal text-zinc-400">confirmados presentes</span>
        </p>
      </div>

      <div>
        <label htmlFor="guest-search" className="mb-2 block text-sm font-medium text-zinc-400">
          Pesquisar titular
        </label>
        <input
          id="guest-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Digite o nome..."
          autoComplete="off"
          className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-600"
        />
      </div>

      <ul className="space-y-2">
        {filtered.length === 0 ? (
          <li className="rounded-xl border border-dashed border-zinc-300 py-10 text-center text-sm text-zinc-500 dark:border-zinc-800">
            Nenhum convidado encontrado
          </li>
        ) : (
          filtered.map((guest) => {
            const isChecked = guest.checked_in_at !== null;
            
            // Calcula acompanhantes (Adultos extras + Crianças)
            // Se adults_count for 2, significa 1 titular + 1 acompanhante.
            const extraAdults = Math.max(0, (guest.adults_count || 1) - 1);
            const totalCompanions = extraAdults + (guest.children_count || 0);

            return (
              <li
                key={guest.id}
                className={cn(
                  'flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between transition-colors',
                  isChecked
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : 'border-zinc-200 bg-zinc-50 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950/40 dark:hover:border-zinc-700'
                )}
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-zinc-900 dark:text-zinc-100">{guest.name}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {totalCompanions > 0 ? (
                      <>
                        <span className="font-medium text-zinc-300">+{totalCompanions}</span> acompanhante{totalCompanions !== 1 ? 's' : ''}
                      </>
                    ) : (
                      "Sem acompanhantes"
                    )}
                    
                    {isChecked && (
                      <span className="ml-2 text-emerald-400">
                        · Entrou{' '}
                        {new Date(guest.checked_in_at!).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                  </p>
                </div>
                {isChecked ? (
                  <Button variant="outline" size="sm" onClick={() => handleUndoCheckIn(guest.id)}>
                    Desfazer
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => handleCheckIn(guest.id)}>
                    Confirmar entrada
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