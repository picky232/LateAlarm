import { OdsayError, OdsayLaneResponse, OdsayResponse } from '@/shared/types';

/**
 * ODsay error 필드 정규화.
 * 인증 에러는 배열([{code, message}]), 비즈니스 에러는 객체({code, msg}) — 필드명도 다름.
 */
function normalizeError(
  error: OdsayError | OdsayError[] | undefined
): { code: number | string; message: string } | null {
  if (!error) return null;
  const first = Array.isArray(error) ? error[0] : error;
  if (!first) return null;
  const raw = first as { code: number | string; message?: string; msg?: string };
  return { code: raw.code, message: raw.message ?? raw.msg ?? '알 수 없는 오류' };
}

export class OdsayApiError extends Error {
  constructor(
    public readonly code: number | string,
    message: string,
    public readonly httpStatus?: number
  ) {
    super(message);
    this.name = 'OdsayApiError';
  }
}

export class OdsayClient {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.odsay.com/v1/api';
  // ODsay 웹 키는 등록 도메인의 Referer를 요구함 — 서버 호출 시 직접 지정
  private readonly referer: string;

  constructor() {
    const key = process.env.ODSAY_API_KEY;
    if (!key) throw new Error('ODSAY_API_KEY 환경 변수가 설정되지 않았습니다.');
    this.apiKey = key;
    this.referer = process.env.ODSAY_REFERER ?? 'http://localhost:3003';
  }

  async searchTransit(
    startX: number,
    startY: number,
    endX: number,
    endY: number
  ): Promise<OdsayResponse> {
    const params = new URLSearchParams({
      apiKey: this.apiKey,
      SX: startX.toString(),
      SY: startY.toString(),
      EX: endX.toString(),
      EY: endY.toString(),
      SearchType: '0',
      SearchPathType: '0',
    });

    const res = await fetch(`${this.baseUrl}/searchPubTransPathT?${params}`, {
      headers: { Referer: this.referer },
      next: { revalidate: 0 },
    });

    const data = await this.parseResponse(res, 'ODsay 대중교통 경로 탐색');
    const error = normalizeError(data.error);
    if (error) {
      throw new OdsayApiError(error.code, `ODsay: ${error.message}`, res.status);
    }
    return data;
  }

  async loadLane(mapObj: string): Promise<OdsayLaneResponse> {
    const params = new URLSearchParams({
      apiKey: this.apiKey,
      // loadLane은 "0:0@" 접두사 필요
      mapObject: `0:0@${mapObj}`,
    });
    const res = await fetch(`${this.baseUrl}/loadLane?${params}`, {
      headers: { Referer: this.referer },
    });
    const data = (await this.parseResponse(res, 'ODsay 노선 좌표')) as OdsayLaneResponse;
    const error = normalizeError(data.error);
    if (error) {
      throw new OdsayApiError(error.code, `ODsay: ${error.message}`, res.status);
    }
    return data;
  }

  private async parseResponse(res: Response, label: string): Promise<OdsayResponse> {
    const text = await res.text();
    let data: OdsayResponse | null = null;

    if (text) {
      try {
        data = JSON.parse(text) as OdsayResponse;
      } catch {
        throw new OdsayApiError(res.status, `${label} 응답을 해석할 수 없습니다.`, res.status);
      }
    }

    if (!res.ok) {
      const error = normalizeError(data?.error);
      const message = error?.message ?? `${label} 요청 실패 (${res.status})`;
      const code = error?.code ?? res.status;
      throw new OdsayApiError(code, message, res.status);
    }

    return data ?? {};
  }
}
