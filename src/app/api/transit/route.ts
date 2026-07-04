import { NextRequest, NextResponse } from 'next/server';
import { OdsayTransitRepository } from '@/backend/infrastructure/odsay/OdsayTransitRepository';
import { KakaoNaviClient } from '@/backend/infrastructure/kakao/KakaoNaviClient';
import { KakaoNaviCarRouteRepository } from '@/backend/infrastructure/kakao/KakaoNaviCarRouteRepository';
import { SearchRouteUseCase } from '@/shared/domains/transit/useCases/SearchRouteUseCase';
import { Coordinate, WalkSpeed } from '@/shared/types';

function isValidCoordinate(value: unknown): value is Coordinate {
  if (!value || typeof value !== 'object') return false;
  const coord = value as Coordinate;
  return Number.isFinite(coord.lat) && Number.isFinite(coord.lng);
}

function normalizeWalkSpeed(value: unknown): WalkSpeed {
  return value === 'SLOW' || value === 'FAST' ? value : 'NORMAL';
}

function normalizeTransferBuffer(value: unknown): 0 | 3 | 5 {
  const parsed = Number(value);
  return parsed === 0 || parsed === 5 ? parsed : 3;
}

function statusFromError(err: unknown): number {
  if (!(err instanceof Error)) return 500;
  if (err.message.includes('ODSAY_API_KEY')) return 500;
  if (err.name === 'OdsayApiError' || err.message.includes('ODsay')) return 502;
  return 500;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { origin, destination, walkSpeed = 'NORMAL', transferBuffer = 3, preferElevator = false } = body;

    if (!isValidCoordinate(origin) || !isValidCoordinate(destination)) {
      return NextResponse.json({ error: '출발지와 목적지 좌표가 필요합니다.' }, { status: 400 });
    }

    const repo = new OdsayTransitRepository();
    const carRepo = KakaoNaviClient.isConfigured()
      ? new KakaoNaviCarRouteRepository()
      : undefined;
    const useCase = new SearchRouteUseCase(repo, carRepo);

    const result = await useCase.execute({
      origin,
      destination,
      walkSpeed: normalizeWalkSpeed(walkSpeed),
      transferBuffer: normalizeTransferBuffer(transferBuffer),
      preferElevator: preferElevator === true,
    });

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : '경로 탐색에 실패했습니다.';
    return NextResponse.json({ error: message }, { status: statusFromError(err) });
  }
}
