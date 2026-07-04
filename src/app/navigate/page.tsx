'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TransportOption, Coordinate } from '@/shared/types';
import { KakaoMap } from '@/frontend/components/Map/KakaoMap';
import { NavigationCard } from '@/frontend/components/Navigation/NavigationCard';
import { TransferAlert } from '@/frontend/components/Navigation/TransferAlert';
import { ShareLinkModal } from '@/frontend/components/Share/ShareLinkModal';
import { useGeolocation } from '@/frontend/hooks/useGeolocation';
import { useShareSession } from '@/frontend/hooks/useShareSession';
import { useTurnByTurn } from '@/frontend/hooks/useTurnByTurn';
import { LoadingSpinner } from '@/frontend/components/UI/LoadingSpinner';
import { ACTIVE_ROUTE_STORAGE_KEY } from '@/frontend/constants';

function NavigateContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { position } = useGeolocation(true); // watchPosition

  const origin: Coordinate = {
    lat: parseFloat(params.get('originLat') ?? '0'),
    lng: parseFloat(params.get('originLng') ?? '0'),
  };
  const dest: Coordinate = {
    lat: parseFloat(params.get('destLat') ?? '0'),
    lng: parseFloat(params.get('destLng') ?? '0'),
  };

  // 경로는 sessionStorage 우선 (실경로 좌표가 커서 URL 431 방지), URL 파라미터는 폴백
  const routeParam = params.get('route');
  const [route] = useState<TransportOption | null>(() => {
    try {
      if (routeParam) return JSON.parse(decodeURIComponent(routeParam));
      if (typeof window !== 'undefined') {
        const saved = sessionStorage.getItem(ACTIVE_ROUTE_STORAGE_KEY);
        if (saved) return JSON.parse(saved);
      }
    } catch {
      // 파싱 실패 → 경로 없음 처리
    }
    return null;
  });

  const [showShare, setShowShare] = useState(false);
  const [arrived, setArrived] = useState(false);
  const [shareSessionId, setShareSessionId] = useState<string | null>(null);
  const positionRef = useRef<Coordinate | null>(null);

  const { updateLocation } = useShareSession(shareSessionId);
  const {
    currentSegmentIndex,
    distanceToSegmentEnd,
    isTransferApproaching,
    goPrev,
    goNext,
  } = useTurnByTurn(route?.segments ?? [], position);

  // 최신 position을 ref로 캐시 (interval 클로저 stale 방지)
  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  // 30초마다 위치 업데이트 — shareSessionId 연결 후 시작
  useEffect(() => {
    if (!shareSessionId) return;
    const interval = setInterval(() => {
      if (positionRef.current) {
        updateLocation(positionRef.current);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [shareSessionId, updateLocation]);

  // 도착 감지: 목적지 50m 이내
  useEffect(() => {
    if (!position || arrived) return;
    const dist = Math.sqrt(
      Math.pow((position.lat - dest.lat) * 111000, 2) +
        Math.pow((position.lng - dest.lng) * 88000, 2)
    );
    if (dist < 50) setArrived(true);
  }, [position, dest, arrived]);

  if (!route) return <LoadingSpinner text="경로 정보 없음" />;

  const segments = route.segments;
  const currentSegment = segments[currentSegmentIndex];
  const nextSegment = segments[currentSegmentIndex + 1];
  const remainingMinutes = Math.max(
    0,
    Math.ceil((new Date(route.arrivalTime).getTime() - Date.now()) / 60000)
  );

  return (
    <main className="h-dvh flex flex-col relative">
      {/* 상단 도착 시각 바 */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pt-12 pb-3 bg-gradient-to-b from-white/95 to-transparent">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 bg-white rounded-full shadow flex items-center justify-center text-gray-600"
        >
          ←
        </button>
        <div className="text-center">
          <p className="text-xs text-gray-400">예상 도착</p>
          <p className="text-base font-black text-gray-900">
            {new Date(route.arrivalTime).toLocaleTimeString('ko-KR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        <button
          onClick={() => setShowShare(true)}
          className="bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-full"
        >
          공유
        </button>
      </div>

      {/* 지도 */}
      <div className="flex-1">
        <KakaoMap
          center={position ?? origin}
          segments={segments}
          currentPosition={position ?? undefined}
          destination={dest}
          activeSegmentIndex={currentSegmentIndex}
          className="w-full h-full"
        />
      </div>

      {/* 환승 접근 알림 */}
      {!arrived && isTransferApproaching && nextSegment && (
        <TransferAlert nextSegment={nextSegment} distanceMeters={distanceToSegmentEnd} />
      )}

      {/* 도착 완료 */}
      {arrived && (
        <div className="absolute inset-0 bg-blue-500/90 z-50 flex flex-col items-center justify-center text-white">
          <span className="text-6xl mb-4">🎉</span>
          <p className="text-2xl font-black mb-2">도착!</p>
          <p className="text-blue-100 mb-8">목적지에 도착했습니다</p>
          <button
            onClick={() => router.push('/')}
            className="bg-white text-blue-500 font-bold px-8 py-3 rounded-2xl"
          >
            홈으로
          </button>
        </div>
      )}

      {/* 하단 안내 카드 */}
      {!arrived && (
        <div className="relative z-10">
          <NavigationCard
            currentSegment={currentSegment}
            nextSegment={nextSegment}
            arrivalTime={new Date(route.arrivalTime)}
            remainingMinutes={remainingMinutes}
          />
          <div className="bg-white px-4 pb-6 flex gap-2">
            <button
              onClick={goPrev}
              disabled={currentSegmentIndex === 0}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 disabled:opacity-30"
            >
              ← 이전 구간
            </button>
            <button
              onClick={goNext}
              disabled={currentSegmentIndex === segments.length - 1}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 disabled:opacity-30"
            >
              다음 구간 →
            </button>
          </div>
        </div>
      )}

      {showShare && (
        <ShareLinkModal
          origin={origin}
          destination={dest}
          currentLocation={position ?? origin}
          selectedRoute={route}
          onSessionCreated={(id) => setShareSessionId(id)}
          onClose={() => setShowShare(false)}
        />
      )}
    </main>
  );
}

export default function NavigatePage() {
  return (
    <Suspense fallback={<LoadingSpinner text="경로 안내 준비 중..." />}>
      <NavigateContent />
    </Suspense>
  );
}
