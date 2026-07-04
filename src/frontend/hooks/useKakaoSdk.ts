'use client';

import { useEffect, useState } from 'react';

type SdkState = 'loading' | 'ready' | 'error';

// layout.tsx의 static <script>가 window.kakao를 설정할 때까지 대기
// 이 Promise는 앱 전체에서 한 번만 생성됨
let sdkPromise: Promise<void> | null = null;

export function waitForKakaoSdk(): Promise<void> {
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('카카오 지도 SDK는 브라우저에서만 사용할 수 있습니다.'));
      return;
    }

    const finishLoad = () => {
      window.kakao?.maps.load(() => {
        if (window.kakao?.maps?.services) {
          resolve();
          return;
        }
        sdkPromise = null;
        reject(new Error('카카오 지도 services 라이브러리가 로드되지 않았습니다.'));
      });
    };

    // 이미 로드 완료
    if (window.kakao?.maps) {
      finishLoad();
      return;
    }

    let elapsed = 0;
    const interval = setInterval(() => {
      elapsed += 100;
      if (window.kakao?.maps) {
        clearInterval(interval);
        finishLoad();
      } else if (elapsed > 15000) {
        clearInterval(interval);
        sdkPromise = null;
        reject(new Error(
          '카카오 지도 SDK 로드 타임아웃\n' +
          `• 카카오 개발자 콘솔에서 ${window.location.origin} 도메인 등록 확인\n` +
          '• 광고 차단기 비활성화 후 새로고침'
        ));
      }
    }, 100);
  });

  return sdkPromise;
}

export function useKakaoSdk(): { state: SdkState; error: string | null } {
  const [state, setState] = useState<SdkState>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    waitForKakaoSdk()
      .then(() => setState('ready'))
      .catch((e: Error) => {
        setError(e.message);
        setState('error');
      });
  }, []);

  return { state, error };
}
