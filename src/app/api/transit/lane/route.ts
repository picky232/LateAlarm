import { NextRequest, NextResponse } from 'next/server';
import { OdsayLaneRepository } from '@/backend/infrastructure/odsay/OdsayLaneRepository';
import { LoadLaneUseCase } from '@/shared/domains/transit/useCases/LoadLaneUseCase';

// GET + 불변 응답 → CDN·브라우저 캐시로 ODsay 쿼터 절약
export async function GET(req: NextRequest) {
  try {
    const mapObj = req.nextUrl.searchParams.get('mapObj');
    if (!mapObj) {
      return NextResponse.json({ error: 'mapObj가 필요합니다.' }, { status: 400 });
    }

    const useCase = new LoadLaneUseCase(new OdsayLaneRepository());
    const lanes = await useCase.execute(mapObj);

    return NextResponse.json(
      { lanes },
      { headers: { 'Cache-Control': 'public, max-age=86400, immutable' } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : '노선 좌표 조회에 실패했습니다.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
