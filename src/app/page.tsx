'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Coordinate } from '@/shared/types';
import { useGeolocation } from '@/frontend/hooks/useGeolocation';
import { useUserPreferences } from '@/frontend/hooks/useUserPreferences';
import { useKakaoSearch } from '@/frontend/hooks/useKakaoSearch';
import { KakaoMap } from '@/frontend/components/Map/KakaoMap';

const SEOUL_CENTER: Coordinate = { lat: 37.5665, lng: 126.9780 };

export default function HomePage() {
  const router = useRouter();
  const { position } = useGeolocation();
  const { prefs } = useUserPreferences();
  const destSearch = useKakaoSearch();
  const originSearch = useKakaoSearch();

  const [mapCenter, setMapCenter] = useState<Coordinate>(SEOUL_CENTER);
  const [origin, setOrigin] = useState<Coordinate | null>(null);
  const [originText, setOriginText] = useState('현재 위치');
  const [dest, setDest] = useState<Coordinate | null>(null);
  const [destText, setDestText] = useState('');
  const [activeField, setActiveField] = useState<'dest' | 'origin' | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const [searching, setSearching] = useState(false);

  // GPS → origin 기본값 (렌더 중 상태 보정 패턴 — 최초 1회만)
  if (position && !origin) {
    setOrigin(position);
    setMapCenter(position);
  }

  const handleDestChange = (v: string) => {
    setDestText(v);
    destSearch.search(v);
  };

  const handleOriginChange = (v: string) => {
    setOriginText(v);
    originSearch.search(v);
  };

  const handleDestSelect = (r: { name: string; address: string; coord: Coordinate }) => {
    setDest(r.coord);
    setDestText(r.name);
    destSearch.clear();
    setActiveField(null);
    setMapCenter(r.coord);
    setShowPanel(true);
  };

  const handleOriginSelect = (r: { name: string; address: string; coord: Coordinate }) => {
    setOrigin(r.coord);
    setOriginText(r.name);
    originSearch.clear();
    setActiveField(null);
  };

  const resetDest = () => {
    setDest(null);
    setDestText('');
    destSearch.clear();
    setShowPanel(false);
    setActiveField(null);
  };

  const handleSearch = () => {
    if (!origin || !dest) return;
    setSearching(true);
    const params = new URLSearchParams({
      originLat: origin.lat.toString(),
      originLng: origin.lng.toString(),
      destLat: dest.lat.toString(),
      destLng: dest.lng.toString(),
      walkSpeed: prefs.walkSpeed,
      transferBuffer: prefs.transferBuffer.toString(),
      preferElevator: prefs.preferElevator.toString(),
      originName: originText,
      destName: destText,
    });
    router.push(`/result?${params}`);
  };

  const blurAfter = (field: 'dest' | 'origin', clearFn: () => void) => () => {
    setTimeout(() => {
      setActiveField((f) => (f === field ? null : f));
      clearFn();
    }, 150);
  };

  return (
    <main className="h-dvh relative overflow-hidden bg-gray-100">
      {/* 카카오맵 풀스크린 */}
      <div className="absolute inset-0">
        <KakaoMap
          center={mapCenter}
          currentPosition={origin ?? undefined}
          destination={dest ?? undefined}
          className="w-full h-full"
        />
      </div>

      {/* 상단 검색 패널 */}
      <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-12 pb-2">
        <div className="bg-white rounded-2xl shadow-xl">
          {/* 목적지 입력 */}
          <div className="flex items-center gap-3 px-4 py-3.5">
            <span className="text-red-500 text-lg shrink-0">📍</span>
            <input
              type="text"
              placeholder="어디로 가나요?"
              value={destText}
              onChange={(e) => handleDestChange(e.target.value)}
              onFocus={() => setActiveField('dest')}
              onBlur={blurAfter('dest', destSearch.clear)}
              className="flex-1 text-sm outline-none placeholder-gray-300 font-medium text-gray-800"
            />
            {destText ? (
              <button aria-label="목적지 지우기" onMouseDown={resetDest} className="text-gray-300 text-xl leading-none shrink-0">✕</button>
            ) : (
              <button
                aria-label="설정"
                onMouseDown={() => router.push('/settings')}
                className="text-gray-300 text-xl leading-none shrink-0"
              >
                ⚙️
              </button>
            )}
          </div>

          {/* 출발지 (목적지 선택 후) */}
          {showPanel && (
            <>
              <div className="h-px bg-gray-100 mx-4" />
              <div className="flex items-center gap-3 px-4 py-3">
                <span className="text-blue-400 text-lg shrink-0">◎</span>
                {activeField === 'origin' ? (
                  <input
                    type="text"
                    value={originText === '현재 위치' ? '' : originText}
                    placeholder="출발지 검색"
                    onChange={(e) => handleOriginChange(e.target.value)}
                    onBlur={blurAfter('origin', originSearch.clear)}
                    autoFocus
                    className="flex-1 text-sm outline-none placeholder-gray-300 text-gray-800"
                  />
                ) : (
                  <button
                    onMouseDown={() => setActiveField('origin')}
                    className="flex-1 text-left text-sm text-gray-500"
                  >
                    {originText}
                  </button>
                )}
                <button
                  onMouseDown={() => {
                    if (position) { setOrigin(position); setOriginText('현재 위치'); }
                    setActiveField(null);
                  }}
                  className="text-xs text-blue-400 shrink-0"
                >
                  현재위치
                </button>
              </div>
            </>
          )}
        </div>

        {/* 검색 결과 드롭다운 */}
        {(() => {
          const activeResults = activeField === 'dest' ? destSearch.results : originSearch.results;
          const activeLoading = activeField === 'dest' ? destSearch.loading : originSearch.loading;
          const activeError = activeField === 'dest' ? destSearch.error : originSearch.error;
          const selectFn = activeField === 'dest' ? handleDestSelect : handleOriginSelect;
          if (!activeLoading && !activeError && activeResults.length === 0) return null;
          return (
            <div className="bg-white rounded-2xl shadow-xl mt-2 overflow-hidden">
              {activeLoading && (
                <div className="px-4 py-3 text-sm text-gray-400">검색 중...</div>
              )}
              {activeError && (
                <div className="px-4 py-3 text-sm text-red-500 whitespace-pre-line">{activeError}</div>
              )}
              {!activeLoading && !activeError && activeResults.length === 0 && (
                <div className="px-4 py-3 text-sm text-gray-400">검색 결과가 없습니다.</div>
              )}
              {activeResults.map((r, i) => (
                <button
                  key={i}
                  className="w-full text-left px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-blue-50 transition-colors"
                  onMouseDown={() => selectFn(r)}
                >
                  <p className="text-sm font-medium text-gray-800">{r.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{r.address}</p>
                </button>
              ))}
            </div>
          );
        })()}

      </div>

      {/* 현재위치 버튼 */}
      <button
        aria-label="현재 위치로 이동"
        onClick={() => {
          if (position) {
            setOrigin(position);
            setOriginText('현재 위치');
            setMapCenter(position);
          }
        }}
        className="absolute right-4 z-20 w-11 h-11 bg-white rounded-full shadow-lg flex items-center justify-center text-xl transition-all"
        style={{ bottom: showPanel ? '108px' : '40px' }}
      >
        🎯
      </button>

      {/* 하단 경로 탐색 버튼 */}
      {showPanel && (
        <div className="absolute bottom-0 left-0 right-0 z-20 px-4 pb-8 pt-3 bg-white/95 backdrop-blur-sm shadow-2xl border-t border-gray-100">
          <button
            onClick={handleSearch}
            disabled={!origin || !dest || searching}
            className="w-full py-4 bg-blue-500 text-white rounded-2xl font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed active:bg-blue-600 transition-colors"
          >
            {searching ? '탐색 중...' : '경로 탐색'}
          </button>
        </div>
      )}
    </main>
  );
}
