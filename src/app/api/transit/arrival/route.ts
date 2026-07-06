import { NextRequest, NextResponse } from 'next/server';
import { OdsayBusArrivalRepository } from '@/backend/infrastructure/odsay/OdsayBusArrivalRepository';
import { GetBusArrivalUseCase } from '@/shared/domains/transit/useCases/GetBusArrivalUseCase';

export async function GET(req: NextRequest) {
  try {
    const stationId = Number(req.nextUrl.searchParams.get('stationId'));
    if (!Number.isFinite(stationId) || stationId <= 0) {
      return NextResponse.json({ error: 'stationId가 필요합니다.' }, { status: 400 });
    }

    const useCase = new GetBusArrivalUseCase(new OdsayBusArrivalRepository());
    const arrivals = await useCase.execute(stationId);

    return NextResponse.json({ arrivals });
  } catch (err) {
    const message = err instanceof Error ? err.message : '실시간 도착 조회에 실패했습니다.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
