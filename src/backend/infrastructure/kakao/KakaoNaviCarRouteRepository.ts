import { CarRoute, Coordinate } from '@/shared/types';
import { ICarRouteRepository } from '@/shared/domains/transit/repositories/ICarRouteRepository';
import { KakaoNaviClient } from './KakaoNaviClient';

export class KakaoNaviCarRouteRepository implements ICarRouteRepository {
  private readonly client: KakaoNaviClient;

  constructor() {
    this.client = new KakaoNaviClient();
  }

  async searchCarRoute(origin: Coordinate, destination: Coordinate): Promise<CarRoute> {
    const route = await this.client.directions(origin, destination);

    const coordinates: Coordinate[] = [];
    for (const section of route.sections) {
      for (const road of section.roads) {
        // vertexes = [x, y, x, y, ...] 평탄 배열
        for (let i = 0; i < road.vertexes.length; i += 2) {
          coordinates.push({ lng: road.vertexes[i], lat: road.vertexes[i + 1] });
        }
      }
    }

    return {
      coordinates,
      duration: Math.ceil(route.summary.duration / 60),
      taxiFare: route.summary.fare.taxi,
      tollFare: route.summary.fare.toll,
      distance: route.summary.distance,
    };
  }
}
