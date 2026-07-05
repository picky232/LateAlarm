import {
  Coordinate,
  OdsayPath,
  OdsaySubPath,
  RouteResult,
  RouteSegment,
  TransportOption,
  TransportType,
  WALK_SPEED_MAP,
} from '@/shared/types';
import { ITransitRepository, SearchRouteParams } from '@/shared/domains/transit/repositories/ITransitRepository';
import { haversineDistance } from '@/shared/utils/distance';
import { OdsayApiError, OdsayClient } from './OdsayClient';

// 대중교통 경로가 없을 뿐 도보·택시는 안내 가능한 ODsay 에러 코드
// -98: 출·도착지 700m 이내, -99: 서비스 지역 아님, 3: 결과 없음
const NO_TRANSIT_CODES = new Set(['-98', '-99', '3']);
import subwayColors from '@/shared/data/subwayColors.json';
import busColors from '@/shared/data/busColors.json';

const TAXI_BASE_FARE = 4800;
const TAXI_PER_KM = 1000;

function calcTaxiCost(distanceM: number): number {
  const km = distanceM / 1000;
  if (km <= 1.6) return TAXI_BASE_FARE;
  return TAXI_BASE_FARE + Math.ceil((km - 1.6) * TAXI_PER_KM);
}

function calcTaxiTime(distanceM: number): number {
  // 서울 평균 택시 속도 25km/h 기준
  return Math.ceil(distanceM / (25000 / 60));
}

function getSubwayColor(subwayCode: number): string {
  const key = String(subwayCode);
  return (subwayColors as Record<string, { color: string }>)[key]?.color ?? '#888888';
}

function getBusColor(busType: number): string {
  const key = String(busType);
  return (busColors as Record<string, { color: string }>)[key]?.color ?? '#888888';
}

function isValidCoord(c: Coordinate): boolean {
  return Number.isFinite(c.lat) && Number.isFinite(c.lng) && c.lat !== 0 && c.lng !== 0;
}

/**
 * 구간별 좌표 생성.
 * ODsay는 대중교통 경로 내 도보 구간에 좌표를 주지 않는 경우가 있음(NaN 발생)
 * → 인접 탑승 구간의 끝/시작점과 출발지·목적지로 보간한다.
 */
function buildSegments(
  subPaths: OdsaySubPath[],
  origin: Coordinate,
  destination: Coordinate
): RouteSegment[] {
  const segments = subPaths.map((sp) => {
    let coords: Coordinate[] = [];

    if (sp.passStopList?.stations) {
      for (const s of sp.passStopList.stations) {
        coords.push({ lat: parseFloat(s.y), lng: parseFloat(s.x) });
      }
    } else {
      coords.push(
        { lat: parseFloat(sp.startY), lng: parseFloat(sp.startX) },
        { lat: parseFloat(sp.endY), lng: parseFloat(sp.endX) }
      );
    }
    coords = coords.filter(isValidCoord);

    const type: RouteSegment['type'] =
      sp.trafficType === 1 ? 'SUBWAY' : sp.trafficType === 2 ? 'BUS' : 'WALK';

    const lane = sp.lane?.[0];
    let lineColor: string | undefined;
    let lineId: string | undefined;
    let lineName: string | undefined;
    let busType: number | undefined;

    if (type === 'SUBWAY' && lane?.subwayCode) {
      lineId = String(lane.subwayCode);
      lineColor = getSubwayColor(lane.subwayCode);
      lineName = (subwayColors as Record<string, { name: string }>)[lineId]?.name;
    } else if (type === 'BUS' && lane?.type) {
      busType = lane.type;
      lineColor = getBusColor(lane.type);
      lineName = lane.busNo;
    }

    return {
      type,
      startName: sp.startName,
      endName: sp.endName,
      distance: sp.distance,
      time: sp.sectionTime,
      coordinates: coords,
      lineId,
      lineName,
      lineColor,
      busType,
      stationCount: sp.stationCount,
    };
  });

  // 좌표 없는 구간(주로 도보) 보간: 이전 구간 끝점 → 다음 구간 시작점
  for (let i = 0; i < segments.length; i++) {
    if (segments[i].coordinates.length >= 2) continue;
    const prevEnd =
      i > 0 ? segments[i - 1].coordinates[segments[i - 1].coordinates.length - 1] : origin;
    const nextStart =
      i < segments.length - 1 ? segments[i + 1].coordinates[0] : destination;
    const points = [prevEnd, nextStart].filter((c): c is Coordinate => Boolean(c && isValidCoord(c)));
    segments[i] = { ...segments[i], coordinates: points };
  }

  return segments.filter((s) => s.coordinates.length >= 2);
}

function odsayPathToOption(
  path: OdsayPath,
  walkSpeedMpm: number,
  transferBuffer: number,
  now: Date,
  origin: Coordinate,
  destination: Coordinate
): TransportOption {
  const pathType = path.pathType;
  const type: TransportType =
    pathType === 1 ? 'SUBWAY' : pathType === 2 ? 'BUS' : pathType === 3 ? 'BUS' : 'WALK';

  const segments = buildSegments(path.subPath, origin, destination);
  const walkTime = Math.ceil((path.info.totalWalk / walkSpeedMpm));
  const totalTime = path.info.totalTime + transferBuffer;
  const arrivalTime = new Date(now.getTime() + totalTime * 60000);

  return {
    type,
    totalTime,
    walkTime,
    transferCount: segments.filter((s) => s.type !== 'WALK').length - 1,
    cost: path.info.totalFare || 0,
    arrivalTime,
    segments,
    mapObj: path.info.mapObj,
  };
}

export class OdsayTransitRepository implements ITransitRepository {
  private readonly client: OdsayClient;

  constructor() {
    this.client = new OdsayClient();
  }

  async searchRoute(params: SearchRouteParams): Promise<RouteResult> {
    const { origin, destination, walkSpeed, transferBuffer } = params;
    const walkSpeedMpm = WALK_SPEED_MAP[walkSpeed];
    const now = new Date();

    const options: TransportOption[] = [];

    try {
      const data = await this.client.searchTransit(
        origin.lng,
        origin.lat,
        destination.lng,
        destination.lat
      );
      if (data.result?.path) {
        for (const path of data.result.path) {
          options.push(
            odsayPathToOption(path, walkSpeedMpm, transferBuffer, now, origin, destination)
          );
        }
      }
    } catch (err) {
      // 대중교통 경로 없음 → 도보·택시만 안내
      const isNoTransit =
        err instanceof OdsayApiError && NO_TRANSIT_CODES.has(String(err.code));
      if (!isNoTransit) throw err;
    }

    // 도보 옵션 추가
    const distanceM = haversineDistance(origin, destination);
    const walkOnlyTime = Math.ceil(distanceM / walkSpeedMpm);
    options.push({
      type: 'WALK',
      totalTime: walkOnlyTime,
      walkTime: walkOnlyTime,
      transferCount: 0,
      cost: 0,
      arrivalTime: new Date(now.getTime() + walkOnlyTime * 60000),
      segments: [
        {
          type: 'WALK',
          startName: '출발지',
          endName: '목적지',
          distance: distanceM,
          time: walkOnlyTime,
          coordinates: [origin, destination],
          lineColor: '#4CAF50',
        },
      ],
    });

    // 택시 옵션 추가
    const taxiTime = calcTaxiTime(distanceM);
    const taxiCost = calcTaxiCost(distanceM);
    options.push({
      type: 'TAXI',
      totalTime: taxiTime,
      walkTime: 0,
      transferCount: 0,
      cost: taxiCost,
      arrivalTime: new Date(now.getTime() + taxiTime * 60000),
      segments: [
        {
          type: 'TAXI',
          startName: '출발지',
          endName: '목적지',
          distance: distanceM,
          time: taxiTime,
          coordinates: [origin, destination],
          lineColor: '#F5A623',
        },
      ],
    });

    return {
      origin,
      destination,
      options: options.sort((a, b) => a.totalTime - b.totalTime),
      searchedAt: now,
    };
  }
}
