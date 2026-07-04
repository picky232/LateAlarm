'use client';

import { useRef } from 'react';

interface Props {
  /** true = 확장(내부 스크롤), false = 접힘(peek 높이만) */
  expanded: boolean;
  onToggle: (expanded: boolean) => void;
  /** 접힘 상태 높이 (px) */
  peekHeight?: number;
  /** 확장 상태 최대 높이 (dvh %) */
  expandedHeight?: number;
  children: React.ReactNode;
}

/**
 * 지도 위 바텀시트.
 * 핸들 탭 또는 위/아래 스와이프로 확장·축소, 확장 시 내부 스크롤.
 */
export function BottomSheet({
  expanded,
  onToggle,
  peekHeight = 240,
  expandedHeight = 72,
  children,
}: Props) {
  const touchStartY = useRef<number | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const delta = touchStartY.current - e.changedTouches[0].clientY;
    if (delta > 40) onToggle(true);
    else if (delta < -40) onToggle(false);
    touchStartY.current = null;
  };

  return (
    <div
      className="absolute bottom-0 left-0 right-0 z-20 bg-white rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] flex flex-col transition-[height] duration-300 ease-out"
      style={{ height: expanded ? `${expandedHeight}dvh` : `${peekHeight}px` }}
    >
      {/* 드래그 핸들 */}
      <button
        aria-label={expanded ? '시트 접기' : '시트 펼치기'}
        onClick={() => onToggle(!expanded)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className="w-full pt-3 pb-2 flex justify-center shrink-0 cursor-grab"
      >
        <span className="w-10 h-1 rounded-full bg-gray-300" />
      </button>

      <div className={`flex-1 min-h-0 ${expanded ? 'overflow-y-auto' : 'overflow-hidden'}`}>
        {children}
      </div>
    </div>
  );
}
