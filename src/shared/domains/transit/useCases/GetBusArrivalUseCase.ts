import { BusArrival } from '@/shared/types';
import { IBusArrivalRepository } from '../repositories/IBusArrivalRepository';

/** 탑승 정류장의 실시간 버스 도착 정보 조회 (미제공 지역이면 빈 배열) */
export class GetBusArrivalUseCase {
  constructor(private readonly arrivalRepo: IBusArrivalRepository) {}

  async execute(stationId: number): Promise<BusArrival[]> {
    if (!Number.isFinite(stationId) || stationId <= 0) {
      throw new Error('유효한 정류장 ID가 필요합니다.');
    }
    return this.arrivalRepo.getArrivals(stationId);
  }
}
