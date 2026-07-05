'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { UserPreferences } from '@/shared/types';

const DEFAULT: UserPreferences = {
  walkSpeed: 'NORMAL',
  transferBuffer: 3,
  preferElevator: false,
};

const STORAGE_KEY = 'jiGak_preferences';

// localStorage를 외부 스토어로 구독 — SSR에서는 DEFAULT, 클라이언트에서 저장값 반영
const listeners = new Set<() => void>();
let cachedRaw: string | null = null;
let cachedPrefs: UserPreferences = DEFAULT;

function notify() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) notify();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

function getSnapshot(): UserPreferences {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === cachedRaw) return cachedPrefs;
  cachedRaw = raw;
  try {
    cachedPrefs = raw ? { ...DEFAULT, ...JSON.parse(raw) } : DEFAULT;
  } catch {
    cachedPrefs = DEFAULT;
  }
  return cachedPrefs;
}

function getServerSnapshot(): UserPreferences {
  return DEFAULT;
}

export function useUserPreferences() {
  const prefs = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const update = useCallback(
    (partial: Partial<UserPreferences>) => {
      const next = { ...getSnapshot(), ...partial };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      notify();
    },
    []
  );

  return { prefs, update };
}
