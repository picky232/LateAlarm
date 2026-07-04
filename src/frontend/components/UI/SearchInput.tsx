'use client';

import { useEffect, useRef, useState } from 'react';
import { Coordinate } from '@/shared/types';
import { waitForKakaoSdk } from '@/frontend/hooks/useKakaoSdk';

interface SearchResult {
  name: string;
  address: string;
  coord: Coordinate;
}

interface Props {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (result: SearchResult) => void;
}

export function SearchInput({ placeholder, value, onChange, onSelect }: Props) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!value || value.length < 2) {
      requestIdRef.current += 1;
      setResults([]);
      setError(null);
      setOpen(false);
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    timerRef.current = setTimeout(async () => {
      try {
        await waitForKakaoSdk();
        const services = window.kakao?.maps?.services;
        if (requestIdRef.current !== requestId || !services) return;

        const geocoder = new services.Geocoder();
        geocoder.addressSearch(value, (res, status) => {
          if (requestIdRef.current !== requestId) return;

          if (status === services.Status.OK) {
            setResults(res.slice(0, 5).map((r) => ({
              name: r.road_address?.address_name ?? r.address.address_name,
              address: r.address.address_name,
              coord: { lat: parseFloat(r.y), lng: parseFloat(r.x) },
            })));
            setError(null);
            setOpen(true);
            return;
          }

          setResults([]);
          setError(status === services.Status.ERROR ? '주소 검색 중 오류가 발생했습니다.' : null);
          setOpen(status === services.Status.ERROR);
        }, { size: 5 });
      } catch (e) {
        if (requestIdRef.current !== requestId) return;
        setResults([]);
        setError(e instanceof Error ? e.message : '카카오 주소 검색을 사용할 수 없습니다.');
        setOpen(true);
      }
    }, 400);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value]);

  return (
    <div className="relative w-full">
      <input
        type="text"
        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
      />
      {open && (error || results.length > 0) && (
        <ul className="absolute z-50 w-full mt-1 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
          {error && (
            <li className="px-4 py-3 text-sm text-red-500 whitespace-pre-line">{error}</li>
          )}
          {results.map((r, i) => (
            <li
              key={i}
              className="px-4 py-3 text-sm cursor-pointer hover:bg-blue-50 transition-colors border-b last:border-0"
              onMouseDown={() => {
                onSelect(r);
                onChange(r.name);
                setOpen(false);
              }}
            >
              <p className="font-medium text-gray-800">{r.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{r.address}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
