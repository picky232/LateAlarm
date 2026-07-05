import { TransportType } from '@/shared/types';

/** result → navigate 경로 전달용 sessionStorage 키 (URL 431 방지 — 실경로 좌표가 수백 개) */
export const ACTIVE_ROUTE_STORAGE_KEY = 'jiGak_activeRoute';

// ─── 이동수단 표시 상수 (카드·안내 공용) ────────────────
export const TRANSPORT_LABEL: Record<TransportType, string> = {
  WALK: '도보',
  BUS: '버스',
  SUBWAY: '지하철',
  TAXI: '택시',
  CAR: '승용차',
};

export const TRANSPORT_ICON: Record<TransportType, string> = {
  WALK: '🚶',
  BUS: '🚌',
  SUBWAY: '🚇',
  TAXI: '🚕',
  CAR: '🚗',
};

/** 카드 뱃지 색상 (Tailwind 클래스) */
export const TRANSPORT_BADGE_CLASS: Record<TransportType, string> = {
  WALK: 'bg-green-100 text-green-700',
  BUS: 'bg-blue-100 text-blue-700',
  SUBWAY: 'bg-purple-100 text-purple-700',
  TAXI: 'bg-yellow-100 text-yellow-700',
  CAR: 'bg-indigo-100 text-indigo-700',
};

/** 경로 안내 화면의 행동 라벨 */
export const SEGMENT_ACTION_LABEL: Record<string, string> = {
  WALK: '도보 이동',
  BUS: '버스 탑승',
  SUBWAY: '지하철 탑승',
  TAXI: '택시 탑승',
  CAR: '승용차 운전',
};
