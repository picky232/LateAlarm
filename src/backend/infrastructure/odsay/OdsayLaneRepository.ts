import { Coordinate } from '@/shared/types';
import { ILaneRepository } from '@/shared/domains/transit/repositories/ILaneRepository';
import { OdsayClient } from './OdsayClient';

export class OdsayLaneRepository implements ILaneRepository {
  private readonly client: OdsayClient;

  constructor() {
    this.client = new OdsayClient();
  }

  /** mapObj → 탑승 구간 순서대로 노선 실경로 좌표 */
  async loadLane(mapObj: string): Promise<Coordinate[][]> {
    const data = await this.client.loadLane(mapObj);
    const lanes = data.result?.lane ?? [];

    return lanes.map((lane) =>
      lane.section.flatMap((section) =>
        section.graphPos.map((p) => ({ lat: p.y, lng: p.x }))
      )
    );
  }
}
