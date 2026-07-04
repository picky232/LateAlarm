import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // ODsay API 응답 캐싱 비활성화 (실시간 경로 탐색)
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
};

export default nextConfig;
