import { Coordinate } from '@/shared/types';
import { ILaneRepository } from '@/shared/domains/transit/repositories/ILaneRepository';
import { OdsayClient } from './OdsayClient';

// 노선 좌표는 불변 데이터 — 서버 프로세스 수명 동안 캐시해 ODsay 쿼터(일 5,000건) 절약
const laneCache = new Map<string, Coordinate[][]>();
const LANE_CACHE_MAX = 500;

export class OdsayLaneRepository implements ILaneRepository {
  private readonly client: OdsayClient;

  constructor() {
    this.client = new OdsayClient();
  }

  /** mapObj → 탑승 구간 순서대로 노선 실경로 좌표 */
  async loadLane(mapObj: string): Promise<Coordinate[][]> {
    const cached = laneCache.get(mapObj);
    if (cached) return cached;

    const data = await this.client.loadLane(mapObj);
    const lanes = (data.result?.lane ?? []).map((lane) =>
      lane.section.flatMap((section) =>
        section.graphPos.map((p) => ({ lat: p.y, lng: p.x }))
      )
    );

    if (laneCache.size >= LANE_CACHE_MAX) {
      const oldest = laneCache.keys().next().value;
      if (oldest !== undefined) laneCache.delete(oldest);
    }
    laneCache.set(mapObj, lanes);
    return lanes;
  }
}
