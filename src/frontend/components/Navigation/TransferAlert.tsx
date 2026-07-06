'use client';

import { useEffect, useRef } from 'react';
import { RouteSegment } from '@/shared/types';
import { TRANSPORT_LABEL } from '@/frontend/constants';

interface Props {
  /** 환승해서 탑승할 다음 구간 */
  nextSegment: RouteSegment;
  /** 환승 지점까지 남은 거리 (m) */
  distanceMeters: number | null;
}

/**
 * 환승 접근 알림 배너.
 * 표시되는 순간 1회 진동 + Web Notification(권한 허용 시)을 발송한다.
 */
export function TransferAlert({ nextSegment, distanceMeters }: Props) {
  // 같은 환승 지점에 대해 진동/알림 중복 발송 방지
  const notifiedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const key = `${nextSegment.startName}-${nextSegment.lineName ?? nextSegment.type}`;
    if (notifiedKeyRef.current === key) return;
    notifiedKeyRef.current = key;

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }

    if (typeof Notification !== 'undefined') {
      const title = '환승 알림 🔔';
      const body = `곧 ${nextSegment.startName ?? '다음 정류장'}에서 ${
        nextSegment.lineName ?? TRANSPORT_LABEL[nextSegment.type] ?? ''
      } 탑승`;
      if (Notification.permission === 'granted') {
        new Notification(title, { body });
      } else if (Notification.permission === 'default') {
        Notification.requestPermission().then((p) => {
          if (p === 'granted') new Notification(title, { body });
        });
      }
    }
  }, [nextSegment]);

  return (
    <div role="alert" className="absolute top-24 left-4 right-4 z-30 animate-pulse">
      <div
        className="rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3 text-white"
        style={{ backgroundColor: nextSegment.lineColor ?? '#2563eb' }}
      >
        <span className="text-2xl">🔔</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium opacity-80">환승 준비</p>
          <p className="font-bold text-sm truncate">
            {nextSegment.startName ?? '다음 정류장'}에서{' '}
            {nextSegment.lineName ?? TRANSPORT_LABEL[nextSegment.type]} 탑승
          </p>
        </div>
        {distanceMeters !== null && (
          <span className="text-xs font-bold whitespace-nowrap">
            {Math.round(distanceMeters)}m
          </span>
        )}
      </div>
    </div>
  );
}
