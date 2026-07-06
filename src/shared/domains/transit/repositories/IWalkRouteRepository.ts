import { Coordinate } from '@/shared/types';

/** 보행자 실경로 탐색 */
export interface IWalkRouteRepository {
  searchWalkRoute(origin: Coordinate, destination: Coordinate): Promise<Coordinate[]>;
}
