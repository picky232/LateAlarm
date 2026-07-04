import { Coordinate, RouteResult, WalkSpeed } from '@/shared/types';

export interface SearchRouteParams {
  origin: Coordinate;
  destination: Coordinate;
  walkSpeed: WalkSpeed;
  transferBuffer: number;
  /** 엘리베이터 선호 — 탑승 1회당 우회 시간 보정 */
  preferElevator?: boolean;
}

export interface ITransitRepository {
  searchRoute(params: SearchRouteParams): Promise<RouteResult>;
}
