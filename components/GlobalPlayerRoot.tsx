'use client';

import { GlobalPlayer } from '@/components/timeline/global-player';
import { JukeboxBridge } from '@/components/jukebox/jukebox-bridge';

export function GlobalPlayerRoot() {
  return (
    <>
      <JukeboxBridge />
      <GlobalPlayer />
    </>
  );
}
