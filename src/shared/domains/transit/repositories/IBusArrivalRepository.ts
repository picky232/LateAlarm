import { BusArrival } from '@/shared/types';

/** 정류장의 실시간 버스 도착 정보 */
export interface IBusArrivalRepository {
  getArrivals(stationId: number): Promise<BusArrival[]>;
}
