import { RouteResult, TransportOption } from '@/shared/types';

/** 엘리베이터 이용 시 탑승/환승 1회당 추가 소요 시간 (분) — 계단 대비 우회 동선 */
const ELEVATOR_MINUTES_PER_BOARDING = 1;

/**
 * 엘리베이터 선호 시 대중교통 옵션의 소요 시간을 보정한다.
 * 지하철·버스 탑승(승차) 횟수만큼 우회 시간을 더하고 도착 시각을 늦춘다.
 * 도보·택시 옵션은 영향 없음.
 */
export function applyElevatorPreference(result: RouteResult): RouteResult {
  return {
    ...result,
    options: result.options.map(adjustOption).sort((a, b) => a.totalTime - b.totalTime),
  };
}

function adjustOption(option: TransportOption): TransportOption {
  const boardings = option.segments.filter(
    (s) => s.type === 'SUBWAY' || s.type === 'BUS'
  ).length;
  if (boardings === 0) return option;

  const extra = boardings * ELEVATOR_MINUTES_PER_BOARDING;
  return {
    ...option,
    totalTime: option.totalTime + extra,
    arrivalTime: new Date(new Date(option.arrivalTime).getTime() + extra * 60000),
  };
}
