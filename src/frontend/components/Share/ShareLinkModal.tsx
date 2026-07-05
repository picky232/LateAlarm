'use client';

import { useState } from 'react';
import { TransportOption, Coordinate } from '@/shared/types';
import { useShareSession } from '@/frontend/hooks/useShareSession';

interface Props {
  origin: Coordinate;
  destination: Coordinate;
  currentLocation: Coordinate;
  selectedRoute: TransportOption;
  onClose: () => void;
  onSessionCreated?: (sessionId: string) => void;
}

export function ShareLinkModal({
  origin,
  destination,
  currentLocation,
  selectedRoute,
  onClose,
  onSessionCreated,
}: Props) {
  const [link, setLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expires, setExpires] = useState(60);
  const [copied, setCopied] = useState(false);
  const { createSession } = useShareSession(null);

  const generateLink = async () => {
    setLoading(true);
    try {
      const sessionId = await createSession({
        origin,
        destination,
        currentLocation,
        selectedRoute,
        expiresInMinutes: expires,
      });
      setLink(`${window.location.origin}/share/${sessionId}`);
      onSessionCreated?.(sessionId);
    } catch {
      // 실패 시 버튼 상태만 복구 — 재시도 가능
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
      <div className="bg-white w-full max-w-md rounded-t-3xl p-6 pb-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">위치 공유</h2>
          <button onClick={onClose} className="text-gray-400 text-2xl leading-none">×</button>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          링크를 보내면 상대방이 앱 설치 없이 내 위치와 도착 예정 시각을 실시간으로 확인할 수 있어요.
        </p>

        <div className="flex gap-2 mb-4">
          {[30, 60, 120].map((m) => (
            <button
              key={m}
              onClick={() => setExpires(m)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                expires === m ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {m === 60 ? '1시간' : m === 120 ? '2시간' : '30분'}
            </button>
          ))}
        </div>

        {!link ? (
          <button
            onClick={generateLink}
            disabled={loading}
            className="w-full py-3.5 bg-blue-500 text-white rounded-2xl font-bold text-sm disabled:opacity-60"
          >
            {loading ? '링크 생성 중...' : '공유 링크 생성'}
          </button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 flex-1 truncate">{link}</p>
              <button
                onClick={copyLink}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                  copied ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'
                }`}
              >
                {copied ? '복사됨!' : '복사'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
