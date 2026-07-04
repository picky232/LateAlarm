import { RouteResult } from '@/shared/types';
import { ITransitRepository, SearchRouteParams } from '../repositories/ITransitRepository';
import { ICarRouteRepository } from '../repositories/ICarRouteRepository';
import { applyElevatorPreference } from '../services/ElevatorTimeAdjuster';
import { enhanceWithCarRoute } from '../services/CarRouteEnhancer';

export class SearchRouteUseCase {
  constructor(
    private readonly transitRepo: ITransitRepository,
    private readonly carRouteRepo?: ICarRouteRepository
  ) {}

  async execute(params: SearchRouteParams): Promise<RouteResult> {
    if (!params.origin || !params.destination) {
      throw new Error('출발지와 목적지를 입력해주세요.');
    }
    let result = await this.transitRepo.searchRoute(params);

    // 자동차 실경로 보정 — 택시 정확화 + 승용차 옵션 (실패해도 기본 결과 유지)
    if (this.carRouteRepo) {
      try {
        const car = await this.carRouteRepo.searchCarRoute(params.origin, params.destination);
        result = enhanceWithCarRoute(result, car);
      } catch {
        // 카카오내비 실패 → 추정치 기반 택시 옵션 그대로 사용
      }
    }

    return params.preferElevator ? applyElevatorPreference(result) : result;
  }
}
