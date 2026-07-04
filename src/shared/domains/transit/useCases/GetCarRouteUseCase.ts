import { CarRoute, Coordinate } from '@/shared/types';
import { ICarRouteRepository } from '../repositories/ICarRouteRepository';

/** 택시 이동의 실제 도로 경로를 조회 */
export class GetCarRouteUseCase {
  constructor(private readonly carRouteRepo: ICarRouteRepository) {}

  async execute(origin: Coordinate, destination: Coordinate): Promise<CarRoute> {
    if (!origin || !destination) {
      throw new Error('출발지와 목적지를 입력해주세요.');
    }
    return this.carRouteRepo.searchCarRoute(origin, destination);
  }
}
