'use client';

import { useJukeboxHost } from '@/hooks/useJukeboxHost';

export function JukeboxBridge() {
  useJukeboxHost();
  return null;
}
