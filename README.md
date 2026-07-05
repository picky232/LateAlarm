# 지각 알리미 🏃

[![CI](https://github.com/picky232/LateAlarm/actions/workflows/ci.yml/badge.svg)](https://github.com/picky232/LateAlarm/actions/workflows/ci.yml)

> 내가 얼마나 늦는지, 기다리는 사람이 실시간으로 알 수 있는 앱

개인 포트폴리오 / 학습용 크로스플랫폼 PWA

---

## 기능

| 기능 | 설명 |
|------|------|
| 실시간 도착 예측 | 현재 위치 기준 목적지까지 최적 경로 및 도착 시각 계산 |
| 이동 수단 비교 | 풀스크린 지도 + 바텀시트 — 이동수단 필터 칩, 내부 스크롤, 지도 탭으로 접기 |
| 실경로 표시 | 지하철·버스는 ODsay loadLane 실좌표, 택시·승용차는 카카오내비 실도로 경로 — 근사 경로는 점선, 실경로는 흰 테두리 강조 |
| 승용차 옵션 | 카카오내비 기반 실소요시간 + 비용(통행료+유류비 추정), 택시는 실제 미터기 요금 |
| 실시간 위치 공유 | 공유 링크 생성 → 수신자가 앱 설치 없이 브라우저에서 실시간 추적 |
| 노선색 경로 안내 | 카카오맵 위에 ODsay 구간별 좌표로 노선 색상 Polyline 직접 렌더링, 진행 구간 강조 |
| Turn-by-Turn | GPS 기반 자동 구간 진행 — 구간 끝 40m 이내 진입 시 다음 구간 전환 |
| 환승 알림 | 환승 지점 200m 접근 시 배너 + 진동 + Web Notification |
| 개인화 설정 | 보행 속도, 환승 여유 시간, 엘리베이터 선호 — 설정 페이지(`/settings`), LocalStorage 저장 |

---

## 기술 스택

| 역할 | 기술 |
|------|------|
| 프레임워크 | Next.js 16 (App Router) + TypeScript |
| 지도 | 카카오맵 JavaScript SDK |
| 대중교통 경로 | ODsay API (서버 전용 — API 키 노출 차단) |
| 실시간 공유 | Firebase Realtime Database |
| 스타일 | Tailwind CSS |
| 배포 | Vercel |

---

## 아키텍처 — DDD (Domain-Driven Design)

```
src/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # 홈 (출발지·목적지 입력)
│   ├── result/page.tsx           # 이동 수단 비교
│   ├── navigate/page.tsx         # 경로 안내 (발신자)
│   ├── share/[id]/page.tsx       # 실시간 추적 (수신자)
│   └── api/                      # 백엔드 API Routes
│       ├── transit/route.ts      # POST  — 경로 탐색
│       ├── share/route.ts        # POST  — 공유 세션 생성
│       └── location/[id]/route.ts # PATCH — 위치 갱신
│
├── shared/                       # 공유 레이어 (프론트+백 공용)
│   ├── types/                    # 공유 타입 정의
│   ├── domains/                  # DDD 도메인 (비즈니스 로직, 외부 의존성 없음)
│   │   ├── transit/              # 경로 탐색 도메인
│   │   └── sharing/              # 위치 공유 도메인
│   ├── data/                     # 정적 데이터 (노선 색상 JSON)
│   └── infrastructure/
│       └── firebase/             # Firebase (클라이언트+서버 공용)
│
├── frontend/                     # 프론트엔드 전용 (브라우저)
│   ├── components/               # React 컴포넌트
│   │   ├── Map/                  # 카카오맵 + Polyline
│   │   ├── TransportCard/        # 이동 수단 비교 카드
│   │   ├── Navigation/           # 경로 안내 카드
│   │   ├── Share/                # 공유 링크 모달
│   │   └── UI/                   # 공통 UI 컴포넌트
│   ├── hooks/                    # 커스텀 훅
│   └── infrastructure/
│       └── kakao/                # 카카오맵 SDK 타입 정의
│
└── backend/                      # 백엔드 전용 (서버)
    └── infrastructure/
        └── odsay/                # ODsay API 클라이언트 (API 키 서버 보호)
```

---

## 환경 변수 설정

`.env.local.example`을 복사해서 `.env.local` 생성 후 키 입력:

```bash
cp .env.local.example .env.local
```

| 변수 | 설명 | 노출 |
|------|------|------|
| `NEXT_PUBLIC_KAKAO_APP_KEY` | 카카오맵 JavaScript SDK 앱 키 | 클라이언트 (도메인 제한 필수) |
| `ODSAY_API_KEY` | ODsay 대중교통 경로 API 키 | 서버 전용 |
| `ODSAY_REFERER` | ODsay 콘솔에 등록한 도메인 (기본 `http://localhost:3003`) — 웹 키는 Referer 검증함 | 서버 전용 |
| `KAKAO_REST_API_KEY` | 카카오 REST API 키 — 택시 실경로·요금 (미설정 시 점선 근사 표시) | 서버 전용 |
| `NEXT_PUBLIC_FIREBASE_*` | Firebase 프로젝트 설정 | 클라이언트 |

---

## 로컬 실행

```bash
# 의존성 설치
npm install

# 개발 서버
npm run dev

# 프로덕션 빌드
npm run build
npm start
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속.

---

## API 키 발급

- **카카오맵**: [developers.kakao.com](https://developers.kakao.com) → 애플리케이션 생성 → JavaScript 키
- **ODsay**: [lab.odsay.com](https://lab.odsay.com) → 회원가입 → API 키 발급 (무료 일 5,000건)
- **Firebase**: [console.firebase.google.com](https://console.firebase.google.com) → 프로젝트 생성 → Realtime Database 활성화

---

## 개발 단계

- [x] **Phase 1** — Next.js 세팅, 카카오맵 연동, ODsay 연동, 이동 수단 비교 화면
- [x] **Phase 2** — Firebase 실시간 위치 공유, 수신자 추적 지도
- [x] **Phase 3** — Turn-by-Turn 자동 구간 진행, 환승 알림(진동·Web Notification), 설정 페이지(`/settings`) 및 엘리베이터 선호 반영, 진행 구간 지도 강조
- [x] **Phase 4a** — CI/CD 구축 (GitHub Actions + Vercel 자동 배포)
- [x] **Phase 4b** — 노선 좌표 서버 캐시(ODsay 쿼터 절약, 145ms→12ms), 접근성(aria-label·aria-pressed·role=alert), OG 메타태그
- [ ] **Phase 5** — Firebase 연동 마무리(위치 공유 실동작), PWA 오프라인, 도착 히스토리

---

## CI/CD

| 브랜치 | 역할 | 자동화 |
|--------|------|--------|
| `dev` | 개발 | push 시 GitHub Actions CI (lint+build) + Vercel **프리뷰 배포** |
| `main` | 배포 | PR 머지로만 갱신 (CI 통과 필수) → Vercel **프로덕션 배포** |

흐름: `dev`에 push → CI·프리뷰로 검증 → `dev` → `main` PR → CI 통과 시 머지 → 프로덕션 자동 배포.

프로덕션: https://late-alarm.vercel.app
(카카오·ODsay 콘솔에 프로덕션 도메인 등록 필요)

---

## 개발 서버 포트 주의

dev 서버는 **3003 포트 고정** (`next dev -p 3003`).
카카오맵 SDK는 등록된 도메인에서만 동작하므로, [카카오 개발자 콘솔](https://developers.kakao.com) → 앱 설정 → 플랫폼 → Web에 `http://localhost:3003` 등록 필수.
ODsay 웹 키는 등록 도메인의 Referer를 검증함 — 서버에서 `ODSAY_REFERER` 헤더로 전송 (기본 `http://localhost:3003`). 배포 시 프로덕션 도메인을 ODsay 콘솔에 등록하고 `ODSAY_REFERER`를 해당 도메인으로 설정할 것.
