import { CarRoute, Coordinate } from '@/shared/types';

/** 자동차(택시) 실경로 탐색 */
export interface ICarRouteRepository {
  searchCarRoute(origin: Coordinate, destination: Coordinate): Promise<CarRoute>;
}
