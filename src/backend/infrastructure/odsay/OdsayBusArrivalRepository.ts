import { BusArrival } from '@/shared/types';
import { IBusArrivalRepository } from '@/shared/domains/transit/repositories/IBusArrivalRepository';
import { OdsayClient } from './OdsayClient';

interface RealtimeArrival {
  arrivalSec?: number;
  leftStation?: number;
}

interface RealtimeEntry {
  routeNm?: string | number;
  arrival1?: RealtimeArrival;
  arrival2?: RealtimeArrival;
}

interface RealtimeResult {
  result?: {
    real?: RealtimeEntry[];
    // 실시간 미제공 지역이면 result 안에 error가 옴 (예: code -11)
    error?: { code: string; msg: string };
  };
}

export class OdsayBusArrivalRepository implements IBusArrivalRepository {
  private readonly client: OdsayClient;

  constructor() {
    this.client = new OdsayClient();
  }

  async getArrivals(stationId: number): Promise<BusArrival[]> {
    const data = (await this.client.realtimeStation(stationId)) as RealtimeResult;
    const real = data.result?.real;
    if (!Array.isArray(real)) return []; // 미제공 지역·데이터 없음 → 조용히 빈 배열

    return real
      .filter((e) => e.routeNm !== undefined && e.arrival1?.arrivalSec !== undefined)
      .map((e) => ({
        routeName: String(e.routeNm),
        arrivalSec: e.arrival1!.arrivalSec!,
        leftStationCount: e.arrival1?.leftStation ?? 0,
        nextArrivalSec: e.arrival2?.arrivalSec ?? null,
      }));
  }
}
