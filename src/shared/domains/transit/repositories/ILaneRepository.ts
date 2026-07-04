import { Coordinate } from '@/shared/types';

/** ODsay mapObj → 노선별 실경로 좌표 목록 (탑승 구간 순서대로) */
export interface ILaneRepository {
  loadLane(mapObj: string): Promise<Coordinate[][]>;
}
