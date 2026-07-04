'use client';

import { useEffect, useState } from 'react';
import { KakaoMap } from '@/frontend/components/Map/KakaoMap';
import { LoadingSpinner } from '@/frontend/components/UI/LoadingSpinner';
import { useShareSession } from '@/frontend/hooks/useShareSession';

interface Props {
  params: Promise<{ id: string }>;
}

export default function SharePage({ params }: Props) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const { session } = useShareSession(sessionId);

  useEffect(() => {
    params.then(({ id }) => {
      if (!id) { setNotFound(true); return; }
      setSessionId(id);
    });
  }, [params]);

  // 세션 로드 타임아웃: 10초 내 데이터 없으면 notFound
  useEffect(() => {
    if (!sessionId || session) return;
    const timeout = setTimeout(() => setNotFound(true), 10000);
    return () => clearTimeout(timeout);
  }, [sessionId, session]);

  if (notFound) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 text-center">
        <span className="text-5xl mb-4">🔍</span>
        <p className="text-lg font-bold text-gray-800 mb-2">공유 링크를 찾을 수 없어요</p>
        <p className="text-sm text-gray-400">만료되었거나 잘못된 링크입니다.</p>
      </div>
    );
  }

  if (!session) return <LoadingSpinner text="위치 정보 불러오는 중..." />;

  const arrivalStr = new Date(session.estimatedArrival).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const lastUpdatedStr = new Date(session.lastUpdated).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <main className="h-dvh flex flex-col">
      {/* 상단 상태 바 */}
      <div className="bg-white px-5 pt-10 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <p className="text-xs text-gray-400">실시간 위치 추적 중</p>
        </div>

        {session.isArrived ? (
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎉</span>
            <p className="text-xl font-black text-green-500">도착했어요!</p>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">예상 도착</p>
              <p className="text-2xl font-black text-gray-900">{arrivalStr}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">남은 시간</p>
              <p className="text-2xl font-black text-blue-500">{session.remainingMinutes}분</p>
            </div>
          </div>
        )}

        <p className="text-xs text-gray-300 mt-1">최근 갱신: {lastUpdatedStr}</p>
      </div>

      {/* 지도 */}
      <div className="flex-1">
        <KakaoMap
          center={session.currentLocation}
          segments={session.selectedRoute?.segments}
          currentPosition={session.currentLocation}
          destination={session.destination}
          className="w-full h-full"
        />
      </div>

      {/* 하단 목적지 정보 */}
      <div className="bg-white px-5 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📍</span>
          <div>
            <p className="text-xs text-gray-400">목적지</p>
            <p className="text-sm font-bold text-gray-800">
              {session.destination.lat.toFixed(5)}, {session.destination.lng.toFixed(5)}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
