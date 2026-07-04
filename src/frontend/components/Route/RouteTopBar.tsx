'use client';

interface Props {
  originName: string;
  destName: string;
  onBack: () => void;
  /** 출발/도착 요약 탭 → 재검색 */
  onEdit: () => void;
}

/** 경로 화면 상단 플로팅 바 — 뒤로가기 + 출발→도착 요약(탭하면 재검색) */
export function RouteTopBar({ originName, destName, onBack, onEdit }: Props) {
  return (
    <div className="absolute top-0 left-0 right-0 z-30 px-4 pt-12 flex items-center gap-2">
      <button
        onClick={onBack}
        aria-label="뒤로가기"
        className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 shrink-0"
      >
        ←
      </button>
      <button
        onClick={onEdit}
        className="flex-1 min-w-0 bg-white rounded-2xl shadow-lg px-4 py-2.5 flex items-center gap-2 text-left"
      >
        <span className="text-blue-400 shrink-0">◎</span>
        <span className="text-sm text-gray-700 truncate">{originName}</span>
        <span className="text-gray-300 shrink-0">→</span>
        <span className="text-red-400 shrink-0">📍</span>
        <span className="text-sm font-bold text-gray-900 truncate">{destName}</span>
      </button>
    </div>
  );
}
