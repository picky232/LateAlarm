import { NextRequest, NextResponse } from 'next/server';
import { OsrmWalkRouteRepository } from '@/backend/infrastructure/osrm/OsrmWalkRouteRepository';
import { GetWalkRouteUseCase } from '@/shared/domains/transit/useCases/GetWalkRouteUseCase';

export async function GET(req: NextRequest) {
  try {
    const p = req.nextUrl.searchParams;
    const origin = { lat: Number(p.get('fromLat')), lng: Number(p.get('fromLng')) };
    const destination = { lat: Number(p.get('toLat')), lng: Number(p.get('toLng')) };

    if (
      ![origin.lat, origin.lng, destination.lat, destination.lng].every(Number.isFinite)
    ) {
      return NextResponse.json({ error: '출발지와 목적지 좌표가 필요합니다.' }, { status: 400 });
    }

    const useCase = new GetWalkRouteUseCase(new OsrmWalkRouteRepository());
    const coordinates = await useCase.execute(origin, destination);

    // 도보 경로는 사실상 불변 — 캐시 허용
    return NextResponse.json(
      { coordinates },
      { headers: { 'Cache-Control': 'public, max-age=86400' } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : '보행 경로 탐색에 실패했습니다.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
