import { NextRequest, NextResponse } from 'next/server';
import { FirebaseShareRepository } from '@/shared/infrastructure/firebase/FirebaseShareRepository';
import { UpdateLocationUseCase } from '@/shared/domains/sharing/useCases/UpdateLocationUseCase';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { lat, lng } = body;

    if (!lat || !lng) {
      return NextResponse.json({ error: '위치 정보가 필요합니다.' }, { status: 400 });
    }

    const repo = new FirebaseShareRepository();
    const useCase = new UpdateLocationUseCase(repo);

    await useCase.execute(id, { lat: Number(lat), lng: Number(lng) });
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : '위치 업데이트에 실패했습니다.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
