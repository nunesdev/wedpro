import { GuestActiveView } from '@/components/queue/guest-active-view';
import { SelfbarShell } from '@/components/queue/selfbar-shell';

export default function SelfbarPage() {
  return (
    <SelfbarShell
      title="Self-bar — Convidado"
      description="Tela do convidado ativo no balcão. Use Operação para gerir a fila."
    >
      <div className="flex justify-center">
        <GuestActiveView />
      </div>
    </SelfbarShell>
  );
}
