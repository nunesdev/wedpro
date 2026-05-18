import { TimelineShell } from '@/components/timeline/timeline-shell';
import { TimelineBackoffice } from '@/components/timeline/timeline-backoffice';

export default function BackofficePage() {
  return (
    <TimelineShell>
      <TimelineBackoffice />
    </TimelineShell>
  );
}
