'use client';

import { useState } from 'react';
import { Coordinate, RouteSegment } from '@/shared/types';
import { haversineDistance } from '@/shared/utils/distance';

/** 구간 끝점 도달 판정 반경 (m) */
const SEGMENT_ARRIVAL_RADIUS = 40;
/** 환승 알림 발동 거리 (m) */
const TRANSFER_ALERT_DISTANCE = 200;

interface TurnByTurnState {
  /** 현재 진행 중인 구간 인덱스 */
  currentSegmentIndex: number;
  /** 현재 구간 끝점까지 남은 거리 (m) — 위치 없으면 null */
  distanceToSegmentEnd: number | null;
  /** 다음 구간이 탑승 구간이고 환승 지점에 접근 중인지 */
  isTransferApproaching: boolean;
  /** 수동 이전 구간 */
  goPrev: () => void;
  /** 수동 다음 구간 */
  goNext: () => void;
}

/**
 * GPS 위치 기반 Turn-by-Turn 자동 구간 진행.
 * 현재 구간 끝점 반경 40m 이내 진입 시 다음 구간으로 자동 전환.
 * 다음 구간이 버스/지하철이면 200m 이내부터 환승 접근 상태를 알린다.
 */
export function useTurnByTurn(
  segments: RouteSegment[],
  position: Coordinate | null
): TurnByTurnState {
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);

  const segment = segments[currentSegmentIndex];
  const endPoint = segment?.coordinates[segment.coordinates.length - 1];
  const distanceToSegmentEnd =
    position && endPoint ? haversineDistance(position, endPoint) : null;

  // 끝점 도달 → 다음 구간 자동 전환 (렌더 중 상태 보정 패턴)
  if (
    distanceToSegmentEnd !== null &&
    distanceToSegmentEnd < SEGMENT_ARRIVAL_RADIUS &&
    currentSegmentIndex < segments.length - 1
  ) {
    setCurrentSegmentIndex(currentSegmentIndex + 1);
  }

  const nextSegment = segments[currentSegmentIndex + 1];
  const isTransferApproaching =
    distanceToSegmentEnd !== null &&
    distanceToSegmentEnd < TRANSFER_ALERT_DISTANCE &&
    nextSegment !== undefined &&
    (nextSegment.type === 'BUS' || nextSegment.type === 'SUBWAY');

  return {
    currentSegmentIndex,
    distanceToSegmentEnd,
    isTransferApproaching,
    goPrev: () => setCurrentSegmentIndex((i) => Math.max(0, i - 1)),
    goNext: () => setCurrentSegmentIndex((i) => Math.min(segments.length - 1, i + 1)),
  };
}
