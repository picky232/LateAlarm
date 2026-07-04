import { NextRequest, NextResponse } from 'next/server';
import { FirebaseShareRepository } from '@/shared/infrastructure/firebase/FirebaseShareRepository';
import { CreateShareSessionUseCase } from '@/shared/domains/sharing/useCases/CreateShareSessionUseCase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { origin, destination, currentLocation, selectedRoute, expiresInMinutes = 60 } = body;

    if (!origin || !destination || !currentLocation || !selectedRoute) {
      return NextResponse.json({ error: '필수 파라미터가 누락되었습니다.' }, { status: 400 });
    }

    const repo = new FirebaseShareRepository();
    const useCase = new CreateShareSessionUseCase(repo);

    const session = await useCase.execute({
      origin,
      destination,
      currentLocation,
      selectedRoute,
      expiresInMinutes: Number(expiresInMinutes),
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : '공유 세션 생성에 실패했습니다.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
