'use client';

import { useEffect, useState, useCallback } from 'react';
import { ShareSession, Coordinate, TransportOption } from '@/shared/types';
import { FirebaseShareRepository } from '@/shared/infrastructure/firebase/FirebaseShareRepository';

interface CreateSessionParams {
  origin: Coordinate;
  destination: Coordinate;
  currentLocation: Coordinate;
  selectedRoute: TransportOption;
  expiresInMinutes?: number;
}

export function useShareSession(sessionId: string | null) {
  const [session, setSession] = useState<ShareSession | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    const repo = new FirebaseShareRepository();
    const unsubscribe = repo.subscribeToSession(sessionId, (s) => setSession(s));
    return unsubscribe;
  }, [sessionId]);

  const createSession = useCallback(async (params: CreateSessionParams): Promise<string> => {
    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...params,
          expiresInMinutes: params.expiresInMinutes ?? 60,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? '공유 세션 생성 실패');
      return data.sessionId as string;
    } catch (e) {
      const msg = e instanceof Error ? e.message : '공유 세션 생성 실패';
      setError(msg);
      throw e;
    }
  }, []);

  const updateLocation = useCallback(async (location: Coordinate) => {
    if (!sessionId) return;
    try {
      await fetch(`/api/location/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(location),
      });
    } catch {
      setError('위치 업데이트 실패');
    }
  }, [sessionId]);

  return { session, error, createSession, updateLocation };
}
