'use client';

import { useState, useEffect } from 'react';
import { UserPreferences } from '@/shared/types';

const DEFAULT: UserPreferences = {
  walkSpeed: 'NORMAL',
  transferBuffer: 3,
  preferElevator: false,
};

const STORAGE_KEY = 'jiGak_preferences';

export function useUserPreferences() {
  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setPrefs(JSON.parse(saved));
    } catch {
      // ignore
    }
  }, []);

  const update = (partial: Partial<UserPreferences>) => {
    const next = { ...prefs, ...partial };
    setPrefs(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  return { prefs, update };
}
