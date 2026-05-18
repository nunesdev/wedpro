import { QueueOperator } from '@/components/queue/queue-operator';
import { SelfbarShell } from '@/components/queue/selfbar-shell';

export default function SelfbarOperacaoPage() {
  return (
    <SelfbarShell
      title="Self-bar — Operação"
      description="Adicione convidados à fila, chame o próximo e controle os timers."
    >
      <QueueOperator />
    </SelfbarShell>
  );
}
