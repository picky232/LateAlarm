import { TransportOption } from '@/shared/types';
import {
  TRANSPORT_BADGE_CLASS,
  TRANSPORT_ICON,
  TRANSPORT_LABEL,
} from '@/frontend/constants';

interface Props {
  option: TransportOption;
  selected?: boolean;
  onClick?: () => void;
}

function formatTime(min: number): string {
  if (min < 60) return `${min}분`;
  return `${Math.floor(min / 60)}시간 ${min % 60}분`;
}

function formatArrival(date: Date): string {
  return new Date(date).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

function formatCost(won: number): string {
  if (won === 0) return '무료';
  return `${won.toLocaleString()}원`;
}

export function TransportCard({ option, selected, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
        selected ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-white hover:border-blue-200'
      } shadow-sm`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{TRANSPORT_ICON[option.type]}</span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${TRANSPORT_BADGE_CLASS[option.type]}`}>
            {TRANSPORT_LABEL[option.type]}
          </span>
        </div>
        <span className="text-lg font-bold text-gray-900">{formatTime(option.totalTime)}</span>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center gap-3">
          <span>도착 {formatArrival(option.arrivalTime)}</span>
          {option.transferCount > 0 && <span>환승 {option.transferCount}회</span>}
        </div>
        <span className={option.cost === 0 ? 'text-green-600 font-medium' : ''}>
          {formatCost(option.cost)}
        </span>
      </div>

      {/* 노선 색상 바 */}
      <div className="flex gap-1 mt-3 h-1.5">
        {option.segments.map((seg, i) => (
          <div
            key={i}
            className="rounded-full flex-1"
            style={{ backgroundColor: seg.lineColor ?? '#cccccc' }}
          />
        ))}
      </div>
    </button>
  );
}
