'use client';

import { useEffect, useRef, useState } from 'react';
import { Coordinate, RouteSegment } from '@/shared/types';
import { waitForKakaoSdk } from '@/frontend/hooks/useKakaoSdk';

interface Props {
  center: Coordinate;
  segments?: RouteSegment[];
  currentPosition?: Coordinate;
  destination?: Coordinate;
  /** 현재 진행 중인 구간 인덱스 — 지정 시 나머지 구간은 흐리게 표시 */
  activeSegmentIndex?: number;
  level?: number;
  className?: string;
}

export function KakaoMap({ center, segments, currentPosition, destination, activeSegmentIndex, level = 5, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<kakao.maps.Map | null>(null);
  const overlaysRef = useRef<Array<kakao.maps.Polyline | kakao.maps.Marker | kakao.maps.Circle>>([]);
  const lastBoundsRef = useRef<kakao.maps.LatLngBounds | null>(null);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // SDK 로드 대기 후 지도 초기화
  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;

    const initMap = async () => {
      if (cancelled || !containerRef.current || mapRef.current) return;
      try {
        await waitForKakaoSdk();
        const maps = window.kakao?.maps;
        if (cancelled || !containerRef.current || mapRef.current || !maps) return;

        mapRef.current = new maps.Map(containerRef.current, {
          center: new maps.LatLng(center.lat, center.lng),
          level,
        });
        setReady(true);
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : `지도 생성 실패: ${e}`);
      }
    };

    initMap();

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 중심 이동
  useEffect(() => {
    const maps = window.kakao?.maps;
    if (!ready || !mapRef.current || !maps) return;
    mapRef.current.panTo(new maps.LatLng(center.lat, center.lng));
  }, [ready, center]);

  // 컨테이너 크기 변경 → 카카오맵 내부 크기 갱신 후 bounds 재적용
  // (relayout 없이는 setBounds가 이전 크기 기준으로 계산돼 줌이 어긋남)
  useEffect(() => {
    if (!ready || !containerRef.current) return;
    const observer = new ResizeObserver(() => {
      const map = mapRef.current;
      if (!map) return;
      map.relayout();
      if (lastBoundsRef.current && !lastBoundsRef.current.isEmpty()) {
        map.setBounds(lastBoundsRef.current, 60, 60, 60, 60);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [ready]);

  // 경로 및 마커 그리기
  useEffect(() => {
    const maps = window.kakao?.maps;
    if (!ready || !mapRef.current || !maps) return;

    overlaysRef.current.forEach((o) => o.setMap(null));
    overlaysRef.current = [];

    const map = mapRef.current;
    const bounds = new maps.LatLngBounds();

    if (segments) {
      for (const [i, seg] of segments.entries()) {
        // NaN·0 좌표 방어 — bounds 오염 시 지도 전체가 깨짐
        const valid = seg.coordinates.filter(
          (c) => Number.isFinite(c.lat) && Number.isFinite(c.lng) && c.lat !== 0 && c.lng !== 0
        );
        if (valid.length < 2) continue;
        const path = valid.map((c) => new maps.LatLng(c.lat, c.lng));
        path.forEach((p) => bounds.extend(p));

        const isActive = activeSegmentIndex === undefined || i === activeSegmentIndex;
        const isDashed = seg.type === 'WALK' || seg.approximate === true;

        // 흰색 캐이싱(테두리) — 현재 진행 구간을 도드라지게
        if (isActive && !isDashed) {
          const casing = new maps.Polyline({
            path,
            strokeWeight: 9,
            strokeColor: '#ffffff',
            strokeOpacity: 1,
            strokeStyle: 'solid',
            map,
          });
          overlaysRef.current.push(casing);
        }

        // 모든 구간을 이동수단별 고유색으로 진하게 — 흐림 없이 전체 동선이 이어져 보이게
        const polyline = new maps.Polyline({
          path,
          strokeWeight: seg.type === 'WALK' ? 4 : isActive ? 6 : 5,
          strokeColor: seg.lineColor ?? (seg.type === 'WALK' ? '#6B7280' : '#555555'),
          strokeOpacity: 1,
          strokeStyle: isDashed ? 'shortdot' : 'solid',
          map,
        });
        overlaysRef.current.push(polyline);

        if (seg.type !== 'WALK') {
          const circle = new maps.Circle({
            center: path[0],
            radius: 8,
            strokeWeight: 2,
            strokeColor: '#ffffff',
            strokeOpacity: 1,
            fillColor: seg.lineColor ?? '#888888',
            fillOpacity: 1,
            map,
          });
          overlaysRef.current.push(circle);
        }
      }
    }

    if (currentPosition) {
      const pos = new maps.LatLng(currentPosition.lat, currentPosition.lng);
      // 경로가 있으면 bounds는 경로에만 맞춤 — GPS가 경로에서 멀면(실내 오차 등) 줌이 반국토로 벌어짐
      if (!segments || segments.length === 0) bounds.extend(pos);
      overlaysRef.current.push(new maps.Marker({ position: pos, map }));
    }

    if (destination) {
      const pos = new maps.LatLng(destination.lat, destination.lng);
      bounds.extend(pos);
      overlaysRef.current.push(new maps.Marker({ position: pos, map }));
    }

    if (!bounds.isEmpty()) {
      lastBoundsRef.current = bounds;
      // 창 크기 변경이 있었을 수 있으니 내부 크기 갱신 후 fit
      map.relayout();
      map.setBounds(bounds, 60, 60, 60, 60);
    }
  }, [ready, segments, currentPosition, destination, activeSegmentIndex]);

  if (loadError) {
    return (
      <div className={`${className ?? 'w-full h-full'} bg-gray-50 flex items-center justify-center p-6`}>
        <div className="bg-white rounded-2xl p-5 shadow-lg max-w-xs w-full">
          <p className="text-red-500 font-bold text-sm mb-2">지도 로드 실패</p>
          <p className="text-gray-600 text-xs whitespace-pre-line leading-relaxed">{loadError}</p>
        </div>
      </div>
    );
  }

  return <div ref={containerRef} className={className ?? 'w-full h-full'} />;
}
