import { Coordinate } from '@/shared/types';

export class KakaoNaviError extends Error {
  constructor(message: string, public readonly httpStatus?: number) {
    super(message);
    this.name = 'KakaoNaviError';
  }
}

interface KakaoNaviResponse {
  routes?: Array<{
    result_code: number;
    result_msg: string;
    summary: {
      distance: number;      // 미터
      duration: number;      // 초
      fare: { taxi: number; toll: number };
    };
    sections: Array<{
      roads: Array<{
        vertexes: number[];  // [x, y, x, y, ...]
      }>;
    }>;
  }>;
}

/** 카카오내비 자동차 길찾기 REST API — KAKAO_REST_API_KEY 필요 (서버 전용) */
export class KakaoNaviClient {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://apis-navi.kakaomobility.com/v1/directions';

  /** 키 존재 여부 — 미설정 시 클라이언트 생성 없이 폴백 처리용 */
  static isConfigured(): boolean {
    return Boolean(process.env.KAKAO_REST_API_KEY);
  }

  constructor() {
    const key = process.env.KAKAO_REST_API_KEY;
    if (!key) throw new Error('KAKAO_REST_API_KEY 환경 변수가 설정되지 않았습니다.');
    this.apiKey = key;
  }

  async directions(origin: Coordinate, destination: Coordinate) {
    const params = new URLSearchParams({
      origin: `${origin.lng},${origin.lat}`,
      destination: `${destination.lng},${destination.lat}`,
      priority: 'RECOMMEND',
      summary: 'false',
    });

    const res = await fetch(`${this.baseUrl}?${params}`, {
      headers: { Authorization: `KakaoAK ${this.apiKey}` },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      throw new KakaoNaviError(`카카오내비 요청 실패 (${res.status})`, res.status);
    }

    const data = (await res.json()) as KakaoNaviResponse;
    const route = data.routes?.[0];
    if (!route || route.result_code !== 0) {
      throw new KakaoNaviError(route?.result_msg ?? '자동차 경로를 찾을 수 없습니다.');
    }
    return route;
  }
}
