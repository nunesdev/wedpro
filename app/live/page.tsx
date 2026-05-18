import { TimelineShell } from '@/components/timeline/timeline-shell';
import { TimelineLive } from '@/components/timeline/timeline-live';

export default function LivePage() {
  return (
    <TimelineShell>
      <TimelineLive />
    </TimelineShell>
  );
}
