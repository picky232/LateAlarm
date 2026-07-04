import { NextRequest, NextResponse } from 'next/server';
import { OdsayLaneRepository } from '@/backend/infrastructure/odsay/OdsayLaneRepository';
import { LoadLaneUseCase } from '@/shared/domains/transit/useCases/LoadLaneUseCase';

export async function POST(req: NextRequest) {
  try {
    const { mapObj } = await req.json();
    if (typeof mapObj !== 'string' || !mapObj) {
      return NextResponse.json({ error: 'mapObj가 필요합니다.' }, { status: 400 });
    }

    const useCase = new LoadLaneUseCase(new OdsayLaneRepository());
    const lanes = await useCase.execute(mapObj);

    return NextResponse.json({ lanes });
  } catch (err) {
    const message = err instanceof Error ? err.message : '노선 좌표 조회에 실패했습니다.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
