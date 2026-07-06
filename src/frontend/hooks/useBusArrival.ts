'use client';

import { useEffect, useState } from 'react';
import { BusArrival } from '@/shared/types';

/** 실시간 도착 갱신 주기 (ms) */
const POLL_INTERVAL = 30000;

/**
 * 탑승 정류장의 특정 버스 실시간 도착 정보.
 * 30초마다 갱신. 미제공 지역·조회 실패 시 null.
 */
export function useBusArrival(
  stationId: number | undefined,
  busNo: string | undefined
): BusArrival | null {
  const [arrival, setArrival] = useState<BusArrival | null>(null);

  useEffect(() => {
    if (!stationId || !busNo) {
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch(`/api/transit/arrival?stationId=${stationId}`);
        const data = await res.json();
        if (cancelled || !Array.isArray(data.arrivals)) return;
        const matched = (data.arrivals as BusArrival[]).find((a) => a.routeName === busNo);
        setArrival(matched ?? null);
      } catch {
        if (!cancelled) setArrival(null);
      }
    };

    // 최초 로드도 비동기 태스크로 — effect 본문 동기 setState 방지
    const first = setTimeout(load, 0);
    const interval = setInterval(load, POLL_INTERVAL);
    return () => {
      cancelled = true;
      clearTimeout(first);
      clearInterval(interval);
    };
  }, [stationId, busNo]);

  return arrival;
}
