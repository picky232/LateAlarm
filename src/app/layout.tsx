import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';

export const metadata: Metadata = {
  title: '지각 알리미',
  description: '내가 얼마나 늦는지, 기다리는 사람이 실시간으로 알 수 있는 앱',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#2563EB',
};

const KAKAO_APP_KEY = process.env.NEXT_PUBLIC_KAKAO_APP_KEY ?? '';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        {KAKAO_APP_KEY && (
          <Script
            src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(KAKAO_APP_KEY)}&libraries=services&autoload=false`}
            strategy="beforeInteractive"
          />
        )}
      </head>
      <body>{children}</body>
    </html>
  );
}
