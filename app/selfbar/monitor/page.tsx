import { QueueMonitor } from '@/components/queue/queue-monitor';
import { SelfbarShell } from '@/components/queue/selfbar-shell';

export default function SelfbarMonitorPage() {
  return (
    <SelfbarShell
      title="Self-bar — Monitor"
      description="Totem de sinalização para o salão."
    >
      <div className="-mx-4 -mb-8 sm:-mx-6">
        <QueueMonitor />
      </div>
    </SelfbarShell>
  );
}
