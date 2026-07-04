'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { RouteResult, TransportOption, Coordinate, TransportType } from '@/shared/types';
import { TransportCard } from '@/frontend/components/TransportCard/TransportCard';
import { ShareLinkModal } from '@/frontend/components/Share/ShareLinkModal';
import { LoadingSpinner } from '@/frontend/components/UI/LoadingSpinner';
import { BottomSheet } from '@/frontend/components/UI/BottomSheet';
import { KakaoMap } from '@/frontend/components/Map/KakaoMap';
import { RouteTopBar } from '@/frontend/components/Route/RouteTopBar';
import { useGeolocation } from '@/frontend/hooks/useGeolocation';
import { useRouteGeometry } from '@/frontend/hooks/useRouteGeometry';
import { ACTIVE_ROUTE_STORAGE_KEY } from '@/frontend/constants';

type Filter = 'ALL' | 'SUBWAY' | 'BUS' | 'ETC';

const FILTERS: Array<{ key: Filter; label: string }> = [
  { key: 'ALL', label: '전체' },
  { key: 'SUBWAY', label: '지하철' },
  { key: 'BUS', label: '버스' },
  { key: 'ETC', label: '자동차·도보' },
];

function matchFilter(type: TransportType, filter: Filter): boolean {
  if (filter === 'ALL') return true;
  if (filter === 'ETC') return type === 'TAXI' || type === 'CAR' || type === 'WALK';
  return type === filter;
}

function ResultContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { position } = useGeolocation();

  const [result, setResult] = useState<RouteResult | null>(null);
  const [selected, setSelected] = useState<TransportOption | null>(null);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const origin: Coordinate = useMemo(
    () => ({
      lat: parseFloat(params.get('originLat') ?? '0'),
      lng: parseFloat(params.get('originLng') ?? '0'),
    }),
    [params]
  );
  const dest: Coordinate = useMemo(
    () => ({
      lat: parseFloat(params.get('destLat') ?? '0'),
      lng: parseFloat(params.get('destLng') ?? '0'),
    }),
    [params]
  );
  const originName = params.get('originName') || '출발지';
  const destName = params.get('destName') || '목적지';

  // 선택한 경로의 실제 좌표 (loadLane / 카카오내비 온디맨드)
  const { segments: enrichedSegments } = useRouteGeometry(selected, origin, dest);

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const res = await fetch('/api/transit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            origin,
            destination: dest,
            walkSpeed: params.get('walkSpeed') ?? 'NORMAL',
            transferBuffer: parseInt(params.get('transferBuffer') ?? '3'),
            preferElevator: params.get('preferElevator') === 'true',
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setResult(data);
        setSelected(data.options[0]);
      } catch (e) {
        setError(e instanceof Error ? e.message : '경로 탐색 실패');
      } finally {
        setLoading(false);
      }
    };
    fetchRoutes();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(
    () => result?.options.filter((o) => matchFilter(o.type, filter)) ?? [],
    [result, filter]
  );

  const startNavigate = () => {
    if (!selected) return;
    const enriched = enrichedSegments ? { ...selected, segments: enrichedSegments } : selected;
    // 실경로 좌표가 수백 개라 URL로 넘기면 431 — sessionStorage로 전달
    sessionStorage.setItem(ACTIVE_ROUTE_STORAGE_KEY, JSON.stringify(enriched));
    const q = new URLSearchParams({
      originLat: origin.lat.toString(),
      originLng: origin.lng.toString(),
      destLat: dest.lat.toString(),
      destLng: dest.lng.toString(),
    });
    router.push(`/navigate?${q}`);
  };

  if (loading) return <LoadingSpinner text="경로 탐색 중..." />;
  if (error)
    return (
      <div className="h-dvh flex flex-col items-center justify-center p-6 text-center">
        <p className="text-red-500 font-medium whitespace-pre-line">{error}</p>
        <button onClick={() => router.back()} className="mt-4 text-blue-500 text-sm">
          ← 돌아가기
        </button>
      </div>
    );
  if (!result) return null;

  return (
    <main className="h-dvh relative overflow-hidden bg-gray-100">
      {/* 풀스크린 지도 — 탭하면 시트 접기 */}
      <div className="absolute inset-0" onClick={() => setSheetExpanded(false)}>
        <KakaoMap
          center={origin}
          segments={enrichedSegments ?? selected?.segments}
          currentPosition={position ?? undefined}
          destination={dest}
          className="w-full h-full"
        />
      </div>

      <RouteTopBar
        originName={originName}
        destName={destName}
        onBack={() => router.back()}
        onEdit={() => router.push('/')}
      />

      {/* 경로 목록 바텀시트 */}
      <BottomSheet expanded={sheetExpanded} onToggle={setSheetExpanded}>
        {/* 이동수단 필터 칩 */}
        <div className="px-4 pb-2 flex gap-2 overflow-x-auto shrink-0">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => {
                setFilter(f.key);
                setSheetExpanded(true);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                filter === f.key ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {f.label}
            </button>
          ))}
          <span className="ml-auto text-xs text-gray-400 self-center whitespace-nowrap">
            {filtered.length}개 경로
          </span>
        </div>

        {/* 경로 카드 리스트 */}
        <div className="px-4 pb-28 space-y-3">
          {filtered.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-8">해당 이동수단 경로가 없습니다.</p>
          )}
          {filtered.map((opt, i) => (
            <TransportCard
              key={i}
              option={opt}
              selected={selected === opt}
              onClick={() => setSelected(opt)}
            />
          ))}
        </div>
      </BottomSheet>

      {/* 하단 고정 액션 바 */}
      {selected && (
        <div className="absolute bottom-0 left-0 right-0 z-30 px-4 pb-6 pt-3 bg-gradient-to-t from-white via-white/95 to-transparent flex gap-3">
          <button
            onClick={() => setShowShare(true)}
            className="flex-1 py-3.5 bg-white border-2 border-blue-500 text-blue-500 rounded-2xl font-bold text-sm shadow-lg"
          >
            위치 공유
          </button>
          <button
            onClick={startNavigate}
            className="flex-1 py-3.5 bg-blue-500 text-white rounded-2xl font-bold text-sm shadow-lg"
          >
            안내 시작
          </button>
        </div>
      )}

      {showShare && selected && (
        <ShareLinkModal
          origin={origin}
          destination={dest}
          currentLocation={position ?? origin}
          selectedRoute={selected}
          onClose={() => setShowShare(false)}
        />
      )}
    </main>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={<LoadingSpinner text="경로 탐색 중..." />}>
      <ResultContent />
    </Suspense>
  );
}
