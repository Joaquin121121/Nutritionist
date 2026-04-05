'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Headphones,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ArrowLeft,
  Loader2,
} from 'lucide-react';

interface Audiobook {
  title: string;
  author: string;
  filename: string;
  sizeBytes: number;
}

interface SavedProgress {
  currentTime: number;
  duration: number;
}

function getProgressKey(filename: string) {
  return `audiobook-progress-${filename}`;
}

function getSavedProgress(filename: string): SavedProgress | null {
  try {
    const raw = localStorage.getItem(getProgressKey(filename));
    const parsed = raw ? JSON.parse(raw) : null;
    console.log('[audiobook] getSavedProgress', filename.slice(0, 30), parsed);
    return parsed;
  } catch {
    return null;
  }
}

function safeDuration(d: number): number {
  return Number.isFinite(d) && d > 0 ? d : 0;
}

function saveProgress(filename: string, currentTime: number, duration: number) {
  const dur = safeDuration(duration);
  console.log('[audiobook] saveProgress called', {
    file: filename.slice(0, 30),
    currentTime,
    duration: dur,
  });
  if (currentTime <= 0 && dur <= 0) {
    console.log('[audiobook] saveProgress SKIPPED (both zero)');
    return;
  }
  const key = getProgressKey(filename);
  const value = JSON.stringify({ currentTime, duration: dur });
  localStorage.setItem(key, value);
  // Verify write
  const verify = localStorage.getItem(key);
  console.log('[audiobook] saveProgress WRITTEN, verify:', verify);
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatSize(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${Math.round(mb)} MB`;
}

export default function AudiobookPage() {
  const [audiobooks, setAudiobooks] = useState<Audiobook[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Audiobook | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioLoading, setAudioLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const saveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const durationRef = useRef(0);
  // Flag to prevent event handlers from overwriting progress during teardown
  const disposingRef = useRef(false);

  // Fetch audiobook list
  useEffect(() => {
    fetch('/api/audiobooks')
      .then((res) => res.json())
      .then((data) => {
        console.log('[audiobook] fetched list:', data.length, 'books');
        setAudiobooks(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      console.log('[audiobook] component unmounting, cleaning up');
      if (saveIntervalRef.current) clearInterval(saveIntervalRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const handleSelect = useCallback((book: Audiobook) => {
    console.log('[audiobook] handleSelect:', book.title);
    disposingRef.current = false;
    setSelected(book);
    setIsPlaying(false);
    setAudioLoading(true);
    setCurrentTime(0);
    setDuration(0);
    durationRef.current = 0;

    // Clean up previous audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
      audioRef.current.load();
    }
    if (saveIntervalRef.current) clearInterval(saveIntervalRef.current);

    const cdnUrl = process.env.NEXT_PUBLIC_BUNNY_CDN_URL;
    const url = `${cdnUrl}/${encodeURIComponent(book.filename)}`;
    console.log('[audiobook] audio URL:', url);
    const audio = new Audio(url);
    audio.preload = 'auto';
    audioRef.current = audio;

    audio.addEventListener('loadedmetadata', () => {
      console.log('[audiobook] loadedmetadata, audio.duration:', audio.duration);
      const dur = safeDuration(audio.duration);
      if (dur > 0) {
        durationRef.current = dur;
        setDuration(dur);
      }
      const saved = getSavedProgress(book.filename);
      if (saved && saved.currentTime > 0) {
        console.log('[audiobook] restoring position to:', saved.currentTime);
        audio.currentTime = saved.currentTime;
        setCurrentTime(saved.currentTime);
      }
      setAudioLoading(false);
    });

    audio.addEventListener('durationchange', () => {
      console.log('[audiobook] durationchange, audio.duration:', audio.duration);
      const dur = safeDuration(audio.duration);
      if (dur > 0) {
        durationRef.current = dur;
        setDuration(dur);
      }
    });

    audio.addEventListener('timeupdate', () => {
      if (!disposingRef.current) {
        setCurrentTime(audio.currentTime);
      }
    });

    audio.addEventListener('ended', () => {
      console.log('[audiobook] ended event');
      if (!disposingRef.current) {
        setIsPlaying(false);
        saveProgress(book.filename, audio.currentTime, durationRef.current);
      }
    });

    audio.addEventListener('pause', () => {
      console.log('[audiobook] pause event, disposing:', disposingRef.current, 'currentTime:', audio.currentTime);
      if (!disposingRef.current) {
        setIsPlaying(false);
        saveProgress(book.filename, audio.currentTime, durationRef.current);
      }
    });

    audio.addEventListener('play', () => {
      console.log('[audiobook] play event');
      setIsPlaying(true);
    });

    // Save progress every 5 seconds
    saveIntervalRef.current = setInterval(() => {
      if (audio && !audio.paused && !disposingRef.current) {
        saveProgress(book.filename, audio.currentTime, durationRef.current);
      }
    }, 5000);
  }, []);

  const handleBack = useCallback(() => {
    console.log('[audiobook] handleBack called, selected:', selected?.title);
    // Set disposing flag FIRST to prevent event handlers from overwriting
    disposingRef.current = true;

    if (audioRef.current && selected) {
      const time = audioRef.current.currentTime;
      const dur = durationRef.current;
      console.log('[audiobook] handleBack saving:', { time, dur });
      saveProgress(selected.filename, time, dur);
      // Now safe to tear down — event handlers will check disposingRef
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
      audioRef.current.load();
      audioRef.current = null;
    }
    if (saveIntervalRef.current) {
      clearInterval(saveIntervalRef.current);
      saveIntervalRef.current = null;
    }
    setSelected(null);
    setIsPlaying(false);
    durationRef.current = 0;
  }, [selected]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      audioRef.current.play().catch(console.error);
    } else {
      audioRef.current.pause();
    }
  }, []);

  const skip = useCallback((seconds: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(
      0,
      Math.min(audioRef.current.currentTime + seconds, audioRef.current.duration || 0)
    );
  }, []);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audioRef.current.currentTime = ratio * duration;
  }, [duration]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-neutral-500">Cargando...</div>
      </div>
    );
  }

  // Player view
  if (selected) {
    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
      <div className="max-w-lg mx-auto px-4 py-6 flex flex-col min-h-[calc(100vh-5rem)]">
        {/* Back button */}
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Audiolibros</span>
        </button>

        {/* Book info */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mb-6 shadow-lg">
            <Headphones className="w-16 h-16 text-white" />
          </div>
          <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200 text-center mb-1">
            {selected.title}
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-8">
            {selected.author}
          </p>

          {/* Progress bar */}
          <div className="w-full mb-3">
            <div
              className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden cursor-pointer"
              onClick={handleSeek}
            >
              <div
                className="h-full bg-purple-500 transition-all duration-300 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Time display */}
          <div className="w-full flex justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-10">
            <span>{formatTime(currentTime)}</span>
            <span>{duration > 0 ? formatTime(duration) : '--:--'}</span>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-6">
            <button
              onClick={() => skip(-10)}
              className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
            >
              <SkipBack className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
            </button>

            <button
              onClick={togglePlay}
              disabled={audioLoading}
              className="w-16 h-16 rounded-full bg-purple-500 hover:bg-purple-600 flex items-center justify-center transition-colors shadow-lg disabled:opacity-50"
            >
              {audioLoading ? (
                <Loader2 className="w-7 h-7 text-white animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-7 h-7 text-white" />
              ) : (
                <Play className="w-7 h-7 text-white ml-1" />
              )}
            </button>

            <button
              onClick={() => skip(10)}
              className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
            >
              <SkipForward className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-200 mb-6">
        Audiolibros
      </h1>

      {audiobooks.length === 0 ? (
        <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
          <Headphones className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No hay audiolibros disponibles.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {audiobooks.map((book) => {
            const saved = getSavedProgress(book.filename);
            const pct = saved && saved.duration > 0
              ? Math.round((saved.currentTime / saved.duration) * 100)
              : 0;

            return (
              <button
                key={book.filename}
                onClick={() => handleSelect(book)}
                className="w-full text-left p-4 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:border-purple-300 dark:hover:border-purple-600 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Headphones className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                      {book.title}
                    </h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      {book.author} &middot; {formatSize(book.sizeBytes)}
                    </p>
                    {/* Progress bar */}
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-neutral-400 dark:text-neutral-500 w-8 text-right">
                        {pct}%
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
