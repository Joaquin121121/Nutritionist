'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Headphones,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  ChevronLeft,
  Loader2,
} from 'lucide-react';

// Deterministic editorial gradient covers (terracotta, blue, green, gold).
const COVER_GRADIENTS: [string, string][] = [
  ['#c15f3c', '#e0894e'],
  ['#3e6f8e', '#6fa0be'],
  ['#3e9d6b', '#7ac79b'],
  ['#a8843e', '#d8b86a'],
];

function coverStyle(index: number) {
  const [a, b] = COVER_GRADIENTS[index % COVER_GRADIENTS.length];
  return { background: `linear-gradient(150deg, ${a}, ${b})` };
}

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
    const selectedIndex = Math.max(
      0,
      audiobooks.findIndex((b) => b.filename === selected.filename)
    );
    const remaining = duration > 0 ? duration - currentTime : 0;

    return (
      <div className="app-screen player-pad fade-in">
        {/* Back button */}
        <button onClick={handleBack} className="linkbtn back-link">
          <ChevronLeft width={16} height={16} /> Audiolibros
        </button>

        {/* Cover */}
        <div className="player-cover" style={coverStyle(selectedIndex)}>
          <Headphones width={64} height={64} style={{ color: '#fff' }} />
        </div>

        {/* Book info */}
        <div className="player-info">
          <h2>{selected.title}</h2>
          <p>{selected.author}</p>
        </div>

        {/* Seek bar */}
        <div className="player-seek">
          <div className="bar seek-bar" onClick={handleSeek}>
            <i style={{ width: `${progress}%` }} />
            <span className="seek-knob" style={{ left: `${progress}%` }} />
          </div>
          <div className="seek-times">
            <span>{formatTime(currentTime)}</span>
            <span>{duration > 0 ? `-${formatTime(remaining)}` : '--:--'}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="player-ctrls">
          <button className="round-btn" onClick={() => skip(-10)} aria-label="Retroceder 10s">
            <RotateCcw width={24} height={24} strokeWidth={1.8} />
            <b>10</b>
          </button>

          <button className="round-btn big" onClick={togglePlay} disabled={audioLoading}>
            {audioLoading ? (
              <Loader2 width={34} height={34} className="animate-spin" />
            ) : isPlaying ? (
              <Pause width={34} height={34} fill="currentColor" />
            ) : (
              <Play width={34} height={34} fill="currentColor" style={{ marginLeft: 3 }} />
            )}
          </button>

          <button className="round-btn" onClick={() => skip(10)} aria-label="Adelantar 10s">
            <RotateCw width={24} height={24} strokeWidth={1.8} />
            <b>10</b>
          </button>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="app-screen fade-in">
      <div className="screen-title">
        <span className="eyebrow">Tu biblioteca</span>
        <h2>Audiolibros</h2>
      </div>

      {audiobooks.length === 0 ? (
        <div className="text-center py-12 text-neutral-500">
          <Headphones className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No hay audiolibros disponibles.</p>
        </div>
      ) : (
        <div className="book-list">
          {audiobooks.map((book, index) => {
            const saved = getSavedProgress(book.filename);
            const pct =
              saved && saved.duration > 0
                ? Math.round((saved.currentTime / saved.duration) * 100)
                : 0;

            return (
              <button key={book.filename} onClick={() => handleSelect(book)} className="book-card">
                <span className="book-cover" style={coverStyle(index)}>
                  <Headphones width={22} height={22} style={{ color: '#fff' }} />
                </span>
                <span className="book-meta">
                  <span className="book-title">{book.title}</span>
                  <span className="book-author">
                    {book.author} · {formatSize(book.sizeBytes)}
                  </span>
                  <span className="book-bar">
                    <i style={{ width: `${pct}%` }} />
                  </span>
                </span>
                <span className="book-pct">{pct}%</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
