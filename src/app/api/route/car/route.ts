import { NextRequest, NextResponse } from 'next/server';
import { Coordinate } from '@/shared/types';
import { KakaoNaviClient } from '@/backend/infrastructure/kakao/KakaoNaviClient';
import { KakaoNaviCarRouteRepository } from '@/backend/infrastructure/kakao/KakaoNaviCarRouteRepository';
import { GetCarRouteUseCase } from '@/shared/domains/transit/useCases/GetCarRouteUseCase';

function isValidCoordinate(value: unknown): value is Coordinate {
  if (!value || typeof value !== 'object') return false;
  const coord = value as Coordinate;
  return Number.isFinite(coord.lat) && Number.isFinite(coord.lng);
}

export async function POST(req: NextRequest) {
  // 키 미설정 시 프론트가 점선 폴백을 쓰도록 available:false 반환 (에러 아님)
  if (!KakaoNaviClient.isConfigured()) {
    return NextResponse.json({ available: false });
  }

  try {
    const { origin, destination } = await req.json();
    if (!isValidCoordinate(origin) || !isValidCoordinate(destination)) {
      return NextResponse.json({ error: '출발지와 목적지 좌표가 필요합니다.' }, { status: 400 });
    }

    const useCase = new GetCarRouteUseCase(new KakaoNaviCarRouteRepository());
    const route = await useCase.execute(origin, destination);

    return NextResponse.json({ available: true, route });
  } catch (err) {
    const message = err instanceof Error ? err.message : '자동차 경로 탐색에 실패했습니다.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
