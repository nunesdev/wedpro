'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useDragControls, type Variants } from 'framer-motion';
import {
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Volume1,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { usePlayerStore } from '@/store/player-store';
import { secondsToMMSS } from '@/utils/time-formatter';
import { cn } from '@/utils/cn';

const SILENT_WAV =
  'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

interface VolumeControlsProps {
  volume: number;
  isMuted: boolean;
  onVolumeChange: (value: number) => void;
  onToggleMute: () => void;
  className?: string;
}

function VolumeControls({
  volume,
  isMuted,
  onVolumeChange,
  onToggleMute,
  className,
}: VolumeControlsProps) {
  const effectiveVolume = isMuted ? 0 : volume;
  const VolumeIcon =
    isMuted || effectiveVolume === 0 ? VolumeX : effectiveVolume < 0.5 ? Volume1 : Volume2;

  return (
    <div className={cn('flex min-w-0 items-center gap-2', className)}>
      <button
        type="button"
        onClick={onToggleMute}
        className="shrink-0 rounded-md p-1.5 text-neutral-400 transition hover:bg-neutral-800 hover:text-neutral-100"
        aria-label={isMuted ? 'Ativar som' : 'Silenciar'}
      >
        <VolumeIcon size={16} aria-hidden />
      </button>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={isMuted ? 0 : volume}
        onChange={(e) => onVolumeChange(Number(e.target.value))}
        className="h-1 w-20 min-w-0 flex-1 accent-emerald-500 rounded-lg sm:w-24"
        aria-label="Volume"
      />
    </div>
  );
}

interface LocalAudioControlsUIProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onTogglePlayPause: () => void;
  onSeek: (value: number) => void;
  onSeekStart: () => void;
  onSeekEnd: () => void;
  seekDisabled?: boolean;
}

function LocalAudioControlsUI({
  isPlaying,
  currentTime,
  duration,
  onTogglePlayPause,
  onSeek,
  onSeekStart,
  onSeekEnd,
  seekDisabled = false,
}: LocalAudioControlsUIProps) {
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex min-w-0 items-center gap-3">
      <button
        type="button"
        onClick={onTogglePlayPause}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 transition hover:bg-emerald-500/20"
        aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}
      >
        {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
      </button>

      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-center justify-between gap-2 text-[11px] font-mono tabular-nums text-neutral-400">
          <span>{secondsToMMSS(currentTime)}</span>
          <span>{secondsToMMSS(duration)}</span>
        </div>

        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-neutral-800">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-emerald-500 transition-[width] duration-75"
            style={{ width: `${progressPercent}%` }}
          />
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={currentTime}
            onChange={(e) => onSeek(Number(e.target.value))}
            onPointerDown={onSeekStart}
            onPointerUp={onSeekEnd}
            onPointerCancel={onSeekEnd}
            disabled={duration <= 0 || seekDisabled}
            className="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent opacity-0 disabled:cursor-not-allowed"
            aria-label="Progresso da música"
          />
        </div>
      </div>
    </div>
  );
}

const shellVariants: Variants = {
  docked: {
    x: 0,
    y: 0,
    width: '100%',
    opacity: 1,
  },
  dockedHidden: {
    x: 0,
    y: '100%',
    width: '100%',
    opacity: 1,
  },
  floating: {
    x: 0,
    y: 0,
    opacity: 1,
  },
  floatingHidden: {
    x: 0,
    y: 0,
    opacity: 0,
  },
};

export function GlobalPlayer() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isOpen = usePlayerStore((s) => s.isOpen);
  const isFloating = usePlayerStore((s) => s.isFloating);
  const remoteOnly = usePlayerStore((s) => s.remoteOnly);
  const isPlaybackActive = usePlayerStore((s) => s.isPlaybackActive);
  const playbackIntent = usePlayerStore((s) => s.playbackIntent);
  const playbackNonce = usePlayerStore((s) => s.playbackNonce);
  const audioUnlockNonce = usePlayerStore((s) => s.audioUnlockNonce);
  const closePlayer = usePlayerStore((s) => s.closePlayer);
  const toggleIsFloating = usePlayerStore((s) => s.toggleIsFloating);
  const requestPlay = usePlayerStore((s) => s.requestPlay);
  const requestPause = usePlayerStore((s) => s.requestPause);
  const setPlaybackActive = usePlayerStore((s) => s.setPlaybackActive);
  const acknowledgePlaybackIntent = usePlayerStore((s) => s.acknowledgePlaybackIntent);
  const dragControls = useDragControls();
  const dragBoundsRef = useRef<HTMLDivElement>(null);

  const audioRef = useRef<HTMLAudioElement>(null);
  const isSeekingRef = useRef(false);
  const loadedSrcRef = useRef<string | null>(null);

  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const startTime = currentTrack?.start_time ?? 0;
  const isLocalTrack = currentTrack?.type === 'music_local';
  const audioSrc = isLocalTrack && currentTrack?.audio_url ? currentTrack.audio_url : undefined;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  useEffect(() => {
    if (!currentTrack) {
      loadedSrcRef.current = null;
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.removeAttribute('src');
        audio.load();
      }
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
    }
  }, [currentTrack]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || audioUnlockNonce === 0) return;

    const previousSrc = audio.src;
    const previousTime = audio.currentTime;
    const previousVolume = audio.volume;

    audio.src = SILENT_WAV;
    audio.volume = 0;
    audio.load();

    void audio
      .play()
      .then(() => {
        audio.pause();
        audio.currentTime = 0;
      })
      .catch(() => {
        /* autoplay policy may block until user gesture */
      })
      .finally(() => {
        if (previousSrc) {
          audio.src = previousSrc;
          audio.currentTime = previousTime;
        } else {
          audio.removeAttribute('src');
          audio.load();
        }
        audio.volume = previousVolume;
      });
  }, [audioUnlockNonce]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isLocalTrack) return;

    const onTimeUpdate = () => {
      if (!isSeekingRef.current && !remoteOnly) {
        setCurrentTime(audio.currentTime);
      }
    };

    const onPlay = () => {
      if (!remoteOnly) setIsPlaying(true);
    };
    const onPause = () => {
      if (!remoteOnly) setIsPlaying(false);
    };
    const onEnded = () => {
      if (!remoteOnly) {
        setIsPlaying(false);
        setPlaybackActive(false);
      }
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
    };
  }, [isLocalTrack, remoteOnly, setPlaybackActive]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack || !isLocalTrack || !audioSrc) return;

    if (playbackIntent === 'pause') {
      audio.pause();
      setIsPlaying(false);
      acknowledgePlaybackIntent();
      return;
    }

    if (playbackIntent !== 'play') return;

    let cancelled = false;

    const applyStartTime = () => {
      const total = Number.isFinite(audio.duration) ? audio.duration : 0;
      setDuration(total);
      const initialTime = startTime > 0 ? Math.min(startTime, total || startTime) : 0;
      audio.currentTime = initialTime;
      setCurrentTime(initialTime);
      return initialTime;
    };

    const run = async () => {
      const mustReload = loadedSrcRef.current !== audioSrc;
      if (mustReload) {
        loadedSrcRef.current = audioSrc;
        audio.src = audioSrc;
        audio.load();
      }

      const startPlayback = async () => {
        if (cancelled) return;
        applyStartTime();
        audio.volume = isMuted ? 0 : volume;

        if (remoteOnly) {
          setIsPlaying(isPlaybackActive);
          acknowledgePlaybackIntent();
          return;
        }

        try {
          await audio.play();
          setIsPlaying(true);
          setPlaybackActive(true);
        } catch {
          setIsPlaying(false);
          setPlaybackActive(false);
        } finally {
          acknowledgePlaybackIntent();
        }
      };

      if (audio.readyState >= 1) {
        await startPlayback();
        return;
      }

      const onLoadedMetadata = () => {
        void startPlayback();
      };

      audio.addEventListener('loadedmetadata', onLoadedMetadata, { once: true });
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [
    playbackNonce,
    playbackIntent,
    currentTrack,
    isLocalTrack,
    audioSrc,
    startTime,
    remoteOnly,
    isPlaybackActive,
    volume,
    isMuted,
    acknowledgePlaybackIntent,
    setPlaybackActive,
  ]);

  useEffect(() => {
    if (!remoteOnly || !isLocalTrack) return;
    setIsPlaying(isPlaybackActive);
  }, [remoteOnly, isLocalTrack, isPlaybackActive]);

  const togglePlayPause = useCallback(() => {
    if (!currentTrack) return;

    if (remoteOnly) {
      if (isPlaybackActive) requestPause(currentTrack.id);
      else requestPlay(currentTrack);
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      void audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  }, [currentTrack, remoteOnly, isPlaybackActive, requestPause, requestPlay]);

  const handleSeek = useCallback(
    (value: number) => {
      if (remoteOnly) return;

      const audio = audioRef.current;
      if (!audio || !Number.isFinite(value)) return;

      audio.currentTime = value;
      setCurrentTime(value);
    },
    [remoteOnly]
  );

  const handleVolumeChange = (value: number) => {
    setVolume(value);
    if (value > 0) setIsMuted(false);
  };

  const handleToggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  const shellAnimation = isFloating
    ? isOpen
      ? 'floating'
      : 'floatingHidden'
    : isOpen
      ? 'docked'
      : 'dockedHidden';

  const playerContent = currentTrack && (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-neutral-100">{currentTrack.title}</p>
          {remoteOnly && (
            <p className="mt-0.5 text-[11px] font-medium text-amber-400/90">
              Controlo remoto — áudio no Host
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={toggleIsFloating}
            className="rounded-lg border border-neutral-700 p-2 text-neutral-400 transition hover:border-neutral-500 hover:bg-neutral-800 hover:text-neutral-100"
            aria-label={isFloating ? 'Acoplar player' : 'Destacar player'}
            title={isFloating ? 'Acoplar' : 'Destacar'}
          >
            {isFloating ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
          <button
            type="button"
            onClick={closePlayer}
            className="rounded-lg border border-neutral-700 p-2 text-neutral-400 transition hover:border-neutral-500 hover:bg-neutral-800 hover:text-neutral-100"
            aria-label="Fechar player"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="min-h-0 min-w-0 flex-1">
        {currentTrack.type === 'music_spotify' && currentTrack.spotify_uri && !remoteOnly && (
          <iframe
            src={`https://open.spotify.com/embed/track/${currentTrack.spotify_uri}?utm_source=generator&theme=0`}
            width="100%"
            height="80"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="h-20 w-full rounded-lg border border-neutral-700"
            title={`Spotify: ${currentTrack.title}`}
          />
        )}

        {currentTrack.type === 'music_spotify' && remoteOnly && (
          <p className="rounded-lg border border-neutral-700 bg-neutral-800/50 px-3 py-4 text-center text-xs text-neutral-400">
            Faixa Spotify enviada para o Host
          </p>
        )}

        {isLocalTrack && audioSrc && (
          <LocalAudioControlsUI
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            onTogglePlayPause={togglePlayPause}
            onSeek={handleSeek}
            onSeekStart={() => {
              isSeekingRef.current = true;
            }}
            onSeekEnd={() => {
              isSeekingRef.current = false;
            }}
            seekDisabled={remoteOnly}
          />
        )}
      </div>

      {isLocalTrack && !remoteOnly && (
        <VolumeControls
          volume={volume}
          isMuted={isMuted}
          onVolumeChange={handleVolumeChange}
          onToggleMute={handleToggleMute}
          className="border-t border-neutral-800 pt-2"
        />
      )}
    </div>
  );

  if (!currentTrack && !isOpen) {
    return <audio ref={audioRef} preload="auto" className="hidden" aria-hidden />;
  }

  return (
    <>
      <audio ref={audioRef} preload="auto" className="hidden" aria-hidden />

      <div ref={dragBoundsRef} className="pointer-events-none fixed inset-0 z-40" aria-hidden />

      <motion.div
        key={isFloating ? 'floating' : 'docked'}
        drag={isFloating}
        dragMomentum={false}
        dragListener={false}
        dragControls={dragControls}
        dragConstraints={dragBoundsRef}
        dragElastic={0}
        initial={false}
        animate={shellAnimation}
        variants={shellVariants}
        transition={{ type: 'spring', stiffness: 420, damping: 36 }}
        className={cn(
          'z-50',
          isFloating ? 'fixed top-20 right-4' : 'fixed bottom-0 left-0 w-full',
          !isOpen && 'pointer-events-none'
        )}
        aria-hidden={!isOpen}
      >
        <div
          className={cn(
            'flex flex-col border-neutral-800 bg-neutral-900 text-neutral-100 shadow-2xl',
            isFloating
              ? 'h-[200px] min-h-[150px] w-96 min-w-[320px] max-h-[400px] max-w-[600px] resize overflow-auto rounded-xl border p-4'
              : 'h-auto min-h-[120px] w-full resize-none overflow-hidden border-t p-4'
          )}
        >
          {isFloating && (
            <div
              className="drag-handle -mx-4 -mt-4 mb-3 flex shrink-0 cursor-move select-none items-center justify-between rounded-t-xl bg-neutral-800/50 px-3 py-2 text-xs text-neutral-400"
              onPointerDown={(event) => dragControls.start(event)}
            >
              <span>Arrastar painel</span>
              <span className="font-mono text-[10px] text-neutral-500">↘ redimensionar</span>
            </div>
          )}

          <div className="mx-auto flex min-h-0 w-full min-w-0 max-w-4xl flex-1 flex-col">
            {playerContent}
          </div>
        </div>
      </motion.div>
    </>
  );
}
