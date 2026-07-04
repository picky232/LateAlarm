'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Coordinate } from '@/shared/types';
import { waitForKakaoSdk } from './useKakaoSdk';

export interface PlaceResult {
  name: string;
  address: string;
  coord: Coordinate;
}

export function useKakaoSearch(debounceMs = 400) {
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      requestIdRef.current += 1;
    };
  }, []);

  const search = useCallback((query: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const keyword = query.trim();
    if (!keyword) {
      requestIdRef.current += 1;
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    timerRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        await waitForKakaoSdk();
        const services = window.kakao?.maps?.services;
        if (requestIdRef.current !== requestId || !services) return;

        const ps = new services.Places();
        ps.keywordSearch(keyword, (res, status) => {
          if (requestIdRef.current !== requestId) return;

          setLoading(false);
          if (status === services.Status.OK) {
            setResults(res.map((r) => ({
              name: r.place_name,
              address: r.road_address_name || r.address_name,
              coord: { lat: parseFloat(r.y), lng: parseFloat(r.x) },
            })));
            return;
          }

          setResults([]);
          if (status === services.Status.ERROR) {
            setError('장소 검색 중 오류가 발생했습니다.');
          }
        }, { size: 5 });
      } catch (e) {
        if (requestIdRef.current !== requestId) return;
        setResults([]);
        setLoading(false);
        setError(e instanceof Error ? e.message : '카카오 장소 검색을 사용할 수 없습니다.');
      }
    }, debounceMs);
  }, [debounceMs]);

  const clear = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    requestIdRef.current += 1;
    setResults([]);
    setLoading(false);
    setError(null);
  }, []);

  return { results, search, clear, loading, error };
}
