'use client';

import { useEffect, useRef, useState } from 'react';
import { Coordinate, RouteSegment, TransportOption } from '@/shared/types';

/**
 * 선택한 경로의 실제 좌표를 온디맨드로 조회해 구간에 입힌다.
 * - 대중교통: ODsay loadLane(mapObj) → 탑승 구간 실경로
 * - 택시: 카카오내비 자동차 경로 (서버 키 미설정 시 직선 유지 + approximate 표시)
 * 응답은 세션 내 캐시 — 같은 경로 재선택 시 API 재호출 없음.
 */
export function useRouteGeometry(
  option: TransportOption | null,
  origin: Coordinate,
  destination: Coordinate
): { segments: RouteSegment[] | null; loading: boolean } {
  // 조회 완료된 경로 좌표 캐시 — 같은 경로 재선택 시 API 재호출 없음
  const [cache, setCache] = useState<Map<string, RouteSegment[]>>(() => new Map());
  const inFlightRef = useRef<Set<string>>(new Set());

  const cacheKey = option ? buildCacheKey(option, origin, destination) : null;
  // 서버가 이미 실좌표를 채워줬으면(승용차 보정 등) 재조회 불필요
  const alreadyReal =
    option !== null &&
    option.segments.every((s) => s.type === 'WALK' || s.coordinates.length > 2);
  const needsFetch =
    option !== null &&
    !alreadyReal &&
    (option.type === 'TAXI' || Boolean(option.mapObj));
  const cached = cacheKey ? cache.get(cacheKey) : undefined;

  useEffect(() => {
    if (!option || !cacheKey || !needsFetch) return;
    if (cached || inFlightRef.current.has(cacheKey)) return;

    inFlightRef.current.add(cacheKey);

    const enrich =
      option.type === 'TAXI'
        ? enrichTaxi(option.segments, origin, destination)
        : enrichTransit(option.segments, option.mapObj!);

    enrich
      .catch(() => markApproximate(option.segments)) // 실패 시 근사 경로로 캐시
      .then((enriched) => {
        inFlightRef.current.delete(cacheKey);
        setCache((prev) => new Map(prev).set(cacheKey, enriched));
      });
  }, [option, cacheKey, needsFetch, cached, origin, destination]);

  if (!option) return { segments: null, loading: false };

  return {
    segments: cached ?? markApproximate(option.segments),
    loading: needsFetch && !cached,
  };
}

function buildCacheKey(
  option: TransportOption,
  origin: Coordinate,
  destination: Coordinate
): string {
  return (
    option.mapObj ??
    `${option.type}:${origin.lat},${origin.lng}-${destination.lat},${destination.lng}`
  );
}

/** 좌표 2개뿐인 비도보 구간 = 직선 근사 */
function markApproximate(segments: RouteSegment[]): RouteSegment[] {
  return segments.map((s) =>
    s.coordinates.length <= 2 && s.type !== 'WALK' ? { ...s, approximate: true } : s
  );
}

async function enrichTaxi(
  segments: RouteSegment[],
  origin: Coordinate,
  destination: Coordinate
): Promise<RouteSegment[]> {
  const res = await fetch('/api/route/car', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ origin, destination }),
  });
  const data = await res.json();

  if (!res.ok || !data.available || !data.route?.coordinates?.length) {
    return markApproximate(segments);
  }

  return segments.map((s) =>
    s.type === 'TAXI'
      ? { ...s, coordinates: data.route.coordinates, approximate: false }
      : s
  );
}

async function enrichTransit(
  segments: RouteSegment[],
  mapObj: string
): Promise<RouteSegment[]> {
  const res = await fetch(`/api/transit/lane?mapObj=${encodeURIComponent(mapObj)}`);
  const data = await res.json();
  if (!res.ok || !Array.isArray(data.lanes)) return markApproximate(segments);

  const lanes: Coordinate[][] = data.lanes;
  let laneIndex = 0;

  return segments.map((s) => {
    if (s.type !== 'BUS' && s.type !== 'SUBWAY') return s;
    const lane = lanes[laneIndex++];
    return lane && lane.length >= 2 ? { ...s, coordinates: lane, approximate: false } : s;
  });
}
