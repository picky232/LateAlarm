<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# 프로젝트 아키텍처 — DDD 구조

이 프로젝트는 DDD 4계층 구조로 구성됨. 새 기능 추가 시 반드시 이 구조를 따를 것.

```
src/
  app/                              # Next.js App Router (변경 불가)
    page.tsx                        # 홈 (출발지·목적지 입력)
    result/page.tsx                 # 이동 수단 비교
    navigate/page.tsx               # 경로 안내 (발신자) — Turn-by-Turn·환승 알림
    share/[id]/page.tsx             # 실시간 추적 (수신자)
    settings/page.tsx               # 개인화 설정 페이지
    api/
      transit/route.ts              # POST  — ODsay 경로 탐색 (ODSAY_API_KEY 서버 보호)
      transit/lane/route.ts         # GET   — ODsay loadLane 노선 실경로 좌표 (서버·CDN 캐시, immutable)
      transit/arrival/route.ts      # GET   — ODsay realtimeStation 정류장 실시간 도착
      route/car/route.ts            # POST  — 카카오내비 자동차 경로 (KAKAO_REST_API_KEY, 미설정 시 available:false)
      route/walk/route.ts           # GET   — OSRM 도보 실경로 (키 불필요, 서버 캐시)
      share/route.ts                # POST  — Firebase 공유 세션 생성
      location/[id]/route.ts        # PATCH — 위치 갱신

  shared/                           # 공유 레이어 (프론트+백 공용)
    types/index.ts                  # 전체 공유 타입
    domains/                        # 도메인 레이어 (외부 의존성 없음)
      transit/
        repositories/ITransitRepository.ts
        repositories/ILaneRepository.ts       # 노선 실경로 좌표
        repositories/ICarRouteRepository.ts   # 자동차(택시·승용차) 경로
        repositories/IWalkRouteRepository.ts  # 도보 실경로
        repositories/IBusArrivalRepository.ts # 정류장 실시간 버스 도착
        useCases/SearchRouteUseCase.ts
        useCases/LoadLaneUseCase.ts
        useCases/GetCarRouteUseCase.ts
        useCases/GetWalkRouteUseCase.ts
        useCases/GetBusArrivalUseCase.ts
        services/ElevatorTimeAdjuster.ts  # 엘리베이터 선호 시간 보정 (순수 함수)
        services/CarRouteEnhancer.ts      # 카카오내비 실경로로 택시 보정 + 승용차 옵션 (순수 함수)
      sharing/
        repositories/IShareRepository.ts
        useCases/CreateShareSessionUseCase.ts
        useCases/UpdateLocationUseCase.ts
    data/
      subwayColors.json             # 지하철 호선별 공식 색상 (ODsay 코드 기준 — 코드표 임의 변경 금지)
      busColors.json                # 버스 유형별 색상 (ODsay busType 코드 기준)
    utils/
      distance.ts                   # Haversine 거리 계산 (순수 함수)
    infrastructure/
      firebase/                     # Firebase (클라이언트+서버 공용) — 위치 공유 핵심 기능
        FirebaseClient.ts
        FirebaseShareRepository.ts  # IShareRepository 구현. selectedRoute.arrivalTime은
                                     # API Route를 거치며 문자열이 되므로 Date 정규화 필수

  frontend/                         # 프론트엔드 전용 (브라우저에서만 실행)
    components/
      Map/KakaoMap.tsx              # approximate 구간 점선, NaN 좌표 방어
      TransportCard/TransportCard.tsx
      Navigation/NavigationCard.tsx
      Navigation/TransferAlert.tsx  # 환승 접근 배너 + 진동/알림
      Route/RouteTopBar.tsx         # 경로 화면 상단 플로팅 바
      Settings/SettingsPanel.tsx    # 개인화 설정 UI
      Share/ShareLinkModal.tsx
      UI/                           # 공통 UI (LoadingSpinner, SearchInput, BottomSheet)
    hooks/
      useBusArrival.ts              # 정류장 실시간 버스 도착 (30초 폴링)
      useGeolocation.ts
      useKakaoSdk.ts
      useKakaoSearch.ts
      useRouteGeometry.ts           # 선택 경로 실좌표(대중교통·자동차·도보) 온디맨드 조회+캐시
      useShareSession.ts
      useTurnByTurn.ts              # GPS 기반 자동 구간 진행
      useUserPreferences.ts
    infrastructure/
      kakao/kakao.d.ts              # 카카오맵 SDK 타입 정의

  backend/                          # 백엔드 전용 (서버에서만 실행)
    infrastructure/
      odsay/
        OdsayClient.ts              # ODsay API 클라이언트 (Referer 헤더 필수, error msg/message 이중 형식)
        OdsayTransitRepository.ts   # ITransitRepository 구현 (도보 구간 좌표·이름 보간)
        OdsayLaneRepository.ts      # ILaneRepository 구현 (인메모리 캐시, 상한 500)
        OdsayBusArrivalRepository.ts # IBusArrivalRepository 구현 (realtimeStation)
      kakao/
        KakaoNaviClient.ts          # 카카오내비 REST (KAKAO_REST_API_KEY)
        KakaoNaviCarRouteRepository.ts # ICarRouteRepository 구현
      osrm/
        OsrmWalkRouteRepository.ts  # IWalkRouteRepository 구현 (공개 서버, 키 불필요, 서버 캐시)
```

## 규칙
- `shared/domains/`: 외부 라이브러리 import 금지, 인터페이스만 정의
- `backend/infrastructure/`: 서버 전용 — `ODSAY_API_KEY` 등 시크릿 키 사용 가능
- `frontend/`: 클라이언트 전용 — 시크릿 키 사용 금지
- API Routes: UseCase 호출만, 인프라 직접 접근 금지
- 클라이언트 컴포넌트: hooks 통해 접근, 인프라 직접 import 금지
- import alias: `@/shared/*`, `@/frontend/*`, `@/backend/*` (tsconfig `@/*` → `src/*`)
- 위치 공유(Firebase)는 이 앱의 핵심 기능 — `sharing/` 도메인·`FirebaseShareRepository` 수정 시
  로컬 `.env.local`에 `NEXT_PUBLIC_FIREBASE_*` 7개가 실제 값으로 채워져 있는지 먼저 확인 후 작업
