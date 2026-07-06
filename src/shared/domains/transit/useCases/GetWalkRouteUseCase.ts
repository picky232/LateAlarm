import { Coordinate } from '@/shared/types';
import { IWalkRouteRepository } from '../repositories/IWalkRouteRepository';

/** 도보 구간의 실제 보행 경로 좌표 조회 */
export class GetWalkRouteUseCase {
  constructor(private readonly walkRouteRepo: IWalkRouteRepository) {}

  async execute(origin: Coordinate, destination: Coordinate): Promise<Coordinate[]> {
    if (!origin || !destination) {
      throw new Error('출발지와 목적지를 입력해주세요.');
    }
    return this.walkRouteRepo.searchWalkRoute(origin, destination);
  }
}
