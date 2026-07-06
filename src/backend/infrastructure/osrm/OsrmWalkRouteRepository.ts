import { Coordinate } from '@/shared/types';
import { IWalkRouteRepository } from '@/shared/domains/transit/repositories/IWalkRouteRepository';

// OSRM 공개 보행자 라우팅 (FOSSGIS 운영, 키 불필요) — 데모·소규모 트래픽용
const OSRM_BASE = 'https://routing.openstreetmap.de/routed-foot/route/v1/foot';

interface OsrmResponse {
  code: string;
  routes?: Array<{
    geometry: { coordinates: Array<[number, number]> };
  }>;
}

// 같은 도보 구간 반복 조회 방지 — 좌표 5자리(약 1m) 반올림 키
const walkCache = new Map<string, Coordinate[]>();
const WALK_CACHE_MAX = 500;

function cacheKey(a: Coordinate, b: Coordinate): string {
  const r = (n: number) => n.toFixed(5);
  return `${r(a.lat)},${r(a.lng)}-${r(b.lat)},${r(b.lng)}`;
}

export class OsrmWalkRouteRepository implements IWalkRouteRepository {
  async searchWalkRoute(origin: Coordinate, destination: Coordinate): Promise<Coordinate[]> {
    const key = cacheKey(origin, destination);
    const cached = walkCache.get(key);
    if (cached) return cached;

    const url =
      `${OSRM_BASE}/${origin.lng},${origin.lat};${destination.lng},${destination.lat}` +
      `?overview=full&geometries=geojson`;

    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) {
      throw new Error(`보행 경로 요청 실패 (${res.status})`);
    }

    const data = (await res.json()) as OsrmResponse;
    const coords = data.routes?.[0]?.geometry.coordinates;
    if (data.code !== 'Ok' || !coords || coords.length < 2) {
      throw new Error('보행 경로를 찾을 수 없습니다.');
    }

    const result = coords.map(([lng, lat]) => ({ lat, lng }));
    if (walkCache.size >= WALK_CACHE_MAX) {
      const oldest = walkCache.keys().next().value;
      if (oldest !== undefined) walkCache.delete(oldest);
    }
    walkCache.set(key, result);
    return result;
  }
}
