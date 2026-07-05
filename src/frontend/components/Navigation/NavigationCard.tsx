'use client';

import { RouteSegment } from '@/shared/types';
import { SEGMENT_ACTION_LABEL, TRANSPORT_ICON } from '@/frontend/constants';

interface Props {
  currentSegment: RouteSegment;
  nextSegment?: RouteSegment;
  arrivalTime: Date;
  remainingMinutes: number;
}

export function NavigationCard({ currentSegment, nextSegment, arrivalTime, remainingMinutes }: Props) {
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
        <div>
          <p className="text-xs font-medium text-gray-500">{SEGMENT_ACTION_LABEL[currentSegment.type]}</p>
          <p className="font-bold text-gray-900">
            {currentSegment.lineName
              ? `${currentSegment.lineName} 탑승`
              : `${currentSegment.endName}까지`}
          </p>
          {currentSegment.stationCount && (
            <p className="text-xs text-gray-400">{currentSegment.stationCount}개 정류장</p>
          )}
        </div>
      </div>

      {/* 다음 행동 */}
      {nextSegment && (
        <div className="flex items-center gap-2 px-1 text-sm text-gray-400">
          <span>{TRANSPORT_ICON[nextSegment.type]}</span>
          <span>다음: {nextSegment.startName}에서 {SEGMENT_ACTION_LABEL[nextSegment.type]}</span>
        </div>
      )}
    </div>
  );
}
