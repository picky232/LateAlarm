import { Coordinate } from '@/shared/types';
import { ILaneRepository } from '../repositories/ILaneRepository';

/** 선택한 대중교통 경로의 실제 노선 좌표를 조회 */
export class LoadLaneUseCase {
  constructor(private readonly laneRepo: ILaneRepository) {}

  async execute(mapObj: string): Promise<Coordinate[][]> {
    if (!mapObj) {
      throw new Error('mapObj가 필요합니다.');
    }
    return this.laneRepo.loadLane(mapObj);
  }
}
