// ─── 좌표 ───────────────────────────────────────────────
export interface Coordinate {
  lat: number;
  lng: number;
}

// ─── 이동 수단 ─────────────────────────────────────────
export type TransportType = 'WALK' | 'BUS' | 'SUBWAY' | 'TAXI' | 'CAR';

export interface TransportOption {
  type: TransportType;
  totalTime: number;       // 분
  walkTime: number;        // 분
  transferCount: number;
  cost: number;            // 원
  arrivalTime: Date;
  segments: RouteSegment[];
  /** ODsay 노선 그래픽 ID — loadLane으로 실경로 좌표 조회용 */
  mapObj?: string;
}

// ─── 경로 구간 ─────────────────────────────────────────
export type SegmentType = 'WALK' | 'BUS' | 'SUBWAY' | 'TAXI' | 'CAR';

export interface RouteSegment {
  type: SegmentType;
  startName: string;
  endName: string;
  distance: number;        // 미터
  time: number;            // 분
  coordinates: Coordinate[];
  lineId?: string;         // 지하철 호선 ID 또는 버스 노선 ID
  lineName?: string;
  lineColor?: string;
  busType?: number;        // 버스 유형 (1:간선 2:지선 3:광역)
  stationCount?: number;
  /** 실경로가 아닌 근사(직선) 좌표 여부 — 지도에서 점선 표시 */
  approximate?: boolean;
  /** 탑승 정류장 ODsay ID — 실시간 버스 도착 조회용 */
  startStationId?: number;
}

// ─── 실시간 버스 도착 ──────────────────────────────────
export interface BusArrival {
  /** 버스 번호 */
  routeName: string;
  /** 첫 차 도착까지 남은 초 */
  arrivalSec: number;
  /** 첫 차 남은 정거장 수 */
  leftStationCount: number;
  /** 다음 차 도착까지 남은 초 (없으면 null) */
  nextArrivalSec: number | null;
}

// ─── 도착 예측 ─────────────────────────────────────────
export interface RouteResult {
  origin: Coordinate;
  destination: Coordinate;
  options: TransportOption[];
  searchedAt: Date;
}

// ─── 위치 공유 세션 ────────────────────────────────────
export interface ShareSession {
  id: string;
  origin: Coordinate;
  destination: Coordinate;
  currentLocation: Coordinate;
  selectedRoute: TransportOption;
  estimatedArrival: Date;
  remainingMinutes: number;
  lastUpdated: Date;
  expiresAt: Date;
  isArrived: boolean;
}

// ─── 개인화 설정 ───────────────────────────────────────
export type WalkSpeed = 'SLOW' | 'NORMAL' | 'FAST';

export interface UserPreferences {
  walkSpeed: WalkSpeed;
  transferBuffer: 0 | 3 | 5; // 분
  preferElevator: boolean;
}

export const WALK_SPEED_MAP: Record<WalkSpeed, number> = {
  SLOW: 60,
  NORMAL: 80,
  FAST: 100,
};

// ─── ODsay API 타입 ────────────────────────────────────
export interface OdsaySubPath {
  trafficType: number;     // 1:지하철 2:버스 3:도보
  distance: number;
  sectionTime: number;
  stationCount?: number;
  startName: string;
  endName: string;
  /** 탑승 정류장 ODsay ID (버스 구간) */
  startID?: number;
  lane?: Array<{
    busNo?: string;
    type?: number;
    subwayCode?: number;
    subwayCityCode?: number;
  }>;
  passStopList?: {
    stations: Array<{
      index: number;
      stationID: number;
      x: string;
      y: string;
      stationName: string;
    }>;
  };
  startX: string;
  startY: string;
  endX: string;
  endY: string;
}

export interface OdsayPath {
  pathType: number;
  info: {
    totalTime: number;
    totalWalk: number;
    totalFare: number;
    trafficDistance: number;
    mapObj?: string;
  };
  subPath: OdsaySubPath[];
}

// ─── ODsay loadLane (노선 실경로 좌표) ─────────────────
export interface OdsayLaneResponse {
  result?: {
    lane: Array<{
      class: number;           // 1:버스 2:지하철
      type: number;            // 노선 코드
      section: Array<{
        graphPos: Array<{ x: number; y: number }>;
      }>;
    }>;
  };
  error?: OdsayError | OdsayError[];
}

// ─── 자동차 경로 (택시·승용차) ─────────────────────────
export interface CarRoute {
  coordinates: Coordinate[];
  /** 분 */
  duration: number;
  /** 원 — 택시 예상 요금 (통행료 제외) */
  taxiFare: number;
  /** 원 — 통행료 */
  tollFare: number;
  distance: number;         // 미터
}

export interface OdsayError {
  code: number | string;
  message?: string;        // 인증 에러 형식
  msg?: string;            // 비즈니스 에러 형식
}

// ODsay는 에러를 객체 또는 배열로 반환함 (엔드포인트별 상이)
export interface OdsayResponse {
  result?: {
    path: OdsayPath[];
  };
  error?: OdsayError | OdsayError[];
}
