/** Normaliza nome para comparação (trim + minúsculas, locale pt-BR). */
export function normalizeQueueName(name: string): string {
  return name.trim().toLocaleLowerCase('pt-BR');
}

export function isDuplicateWaitingName(
  name: string,
  waitingGuests: { name: string }[]
): boolean {
  const normalized = normalizeQueueName(name);
  if (!normalized) return false;
  return waitingGuests.some((g) => normalizeQueueName(g.name) === normalized);
}

export const DUPLICATE_QUEUE_NAME_MESSAGE =
  'Já existe alguém na fila com esse nome. Adicione um sobrenome ou apelido para identificar.';
