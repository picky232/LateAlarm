'use client';

import { BusArrival, RouteSegment } from '@/shared/types';
import { SEGMENT_ACTION_LABEL, TRANSPORT_ICON } from '@/frontend/constants';

interface Props {
  currentSegment: RouteSegment;
  nextSegment?: RouteSegment;
  arrivalTime: Date;
  remainingMinutes: number;
  /** 탑승 예정 버스의 실시간 도착 정보 (미제공 지역이면 null) */
  busArrival?: BusArrival | null;
}

function formatArrivalSec(sec: number): string {
  if (sec < 60) return '곧 도착';
  return `${Math.round(sec / 60)}분 후`;
}

export function NavigationCard({
  currentSegment,
  nextSegment,
  arrivalTime,
  remainingMinutes,
  busArrival,
}: Props) {
  const arrivalStr = new Date(arrivalTime).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="bg-white rounded-t-3xl shadow-2xl p-4 space-y-3">
      {/* 도착 시각 */}
      <div className="flex items-center justify-between px-1">
        <div>
          <p className="text-xs text-gray-400">예상 도착</p>
          <p className="text-2xl font-black text-gray-900">{arrivalStr}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">남은 시간</p>
          <p className="text-2xl font-black text-blue-500">{remainingMinutes}분</p>
        </div>
      </div>

      {/* 현재 행동 안내 */}
      <div
        className="flex items-center gap-3 p-3 rounded-2xl"
        style={{ backgroundColor: currentSegment.lineColor ? `${currentSegment.lineColor}22` : '#f3f4f6' }}
      >
        <span className="text-3xl">{TRANSPORT_ICON[currentSegment.type]}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-xs font-medium text-gray-500">{SEGMENT_ACTION_LABEL[currentSegment.type]}</p>
            <span className="text-xs font-bold text-gray-600">{currentSegment.time}분</span>
          </div>
          <p className="font-bold text-gray-900 truncate">
            {currentSegment.lineName ? (
              <>
                <span
                  className="inline-block px-2 py-0.5 rounded-lg text-white text-sm font-black mr-1.5"
                  style={{ backgroundColor: currentSegment.lineColor ?? '#555555' }}
                >
                  {currentSegment.lineName}
                </span>
                {currentSegment.endName ?? '하차 정류장'} 방면
              </>
            ) : (
              `${currentSegment.endName ?? '다음 지점'}까지`
            )}
          </p>
          {currentSegment.stationCount ? (
            <p className="text-xs text-gray-400 mt-0.5">
              {currentSegment.stationCount}개 정류장 · {currentSegment.endName} 하차
            </p>
          ) : null}
        </div>
      </div>

      {/* 실시간 버스 도착 */}
      {busArrival && (
        <div className="flex items-center gap-2 px-3 py-2.5 bg-blue-50 rounded-xl">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shrink-0" />
          <span className="text-sm font-bold text-blue-600">{busArrival.routeName}번</span>
          <span className="text-sm font-black text-blue-700">
            {formatArrivalSec(busArrival.arrivalSec)}
          </span>
          <span className="text-xs text-blue-400">
            {busArrival.leftStationCount}정거장 전
          </span>
          {busArrival.nextArrivalSec !== null && (
            <span className="text-xs text-gray-400 ml-auto">
              다음 {formatArrivalSec(busArrival.nextArrivalSec)}
            </span>
          )}
        </div>
      )}

      {/* 다음 행동 */}
      {nextSegment && (
        <div className="flex items-center gap-2 px-1 text-sm text-gray-400">
          <span>{TRANSPORT_ICON[nextSegment.type]}</span>
          <span className="truncate">
            다음: {nextSegment.startName ?? '다음 정류장'}에서{' '}
            {nextSegment.lineName ? (
              <span className="font-bold text-gray-600">{nextSegment.lineName}</span>
            ) : null}{' '}
            {SEGMENT_ACTION_LABEL[nextSegment.type]}
          </span>
        </div>
      )}
    </div>
  );
}
