'use client';

import { UserPreferences, WalkSpeed } from '@/shared/types';

interface Props {
  prefs: UserPreferences;
  onChange: (partial: Partial<UserPreferences>) => void;
}

const WALK_SPEED_OPTIONS: Array<{ value: WalkSpeed; label: string; desc: string }> = [
  { value: 'SLOW', label: '느림', desc: '분당 60m' },
  { value: 'NORMAL', label: '보통', desc: '분당 80m' },
  { value: 'FAST', label: '빠름', desc: '분당 100m' },
];

const TRANSFER_BUFFER_OPTIONS: Array<{ value: 0 | 3 | 5; label: string }> = [
  { value: 0, label: '없음' },
  { value: 3, label: '+3분' },
  { value: 5, label: '+5분' },
];

/** 개인화 설정 패널 — 보행 속도 / 환승 여유 / 엘리베이터 선호 */
export function SettingsPanel({ prefs, onChange }: Props) {
  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-sm font-bold text-gray-900 mb-1">보행 속도</h3>
        <p className="text-xs text-gray-400 mb-3">도보 구간 소요 시간 계산에 사용됩니다</p>
        <div className="flex gap-2">
          {WALK_SPEED_OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => onChange({ walkSpeed: o.value })}
              className={`flex-1 py-3 rounded-2xl text-center transition-colors ${
                prefs.walkSpeed === o.value
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              <p className="text-sm font-bold">{o.label}</p>
              <p className={`text-[10px] mt-0.5 ${prefs.walkSpeed === o.value ? 'text-blue-100' : 'text-gray-400'}`}>
                {o.desc}
              </p>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-bold text-gray-900 mb-1">환승 여유 시간</h3>
        <p className="text-xs text-gray-400 mb-3">예상 소요 시간에 여유분을 더합니다</p>
        <div className="flex gap-2">
          {TRANSFER_BUFFER_OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => onChange({ transferBuffer: o.value })}
              className={`flex-1 py-3 rounded-2xl text-sm font-bold transition-colors ${
                prefs.transferBuffer === o.value
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </section>

      <section className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-900">엘리베이터 선호</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            탑승 1회당 우회 시간 1분을 더해 계산합니다
          </p>
        </div>
        <button
          role="switch"
          aria-checked={prefs.preferElevator}
          onClick={() => onChange({ preferElevator: !prefs.preferElevator })}
          className={`w-12 h-7 rounded-full transition-colors relative shrink-0 ${
            prefs.preferElevator ? 'bg-blue-500' : 'bg-gray-200'
          }`}
        >
          <span
            className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
              prefs.preferElevator ? 'translate-x-5' : 'translate-x-0.5'
            }`}
            style={{ left: 0 }}
          />
        </button>
      </section>
    </div>
  );
}
