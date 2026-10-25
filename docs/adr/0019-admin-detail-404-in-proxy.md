# 0019. 관리자 상세 화면의 "없음"은 proxy 가 확인해 상태 코드 404 로 돌려준다
- 상태: 채택 (2026-10)

## 배경
없는 문의 상세(`/admin/inquiries/[id]`)와 없는 작업 편집(`/admin/works/[id]`)은 화면은 404 인데 상태 코드가 200 이었다 (ADR 0016 결과에 남긴 것).
Next 16.4 + `cacheComponents` 에서 모든 관리자 화면은 빌드 때 만든 (빈) 정적 껍데기 + 요청 때 이어 그리기(PPR resume)로 나간다.
이어 그릴 때 상태 코드는 이미 껍데기의 200 으로 정해져 있어서, 페이지의 `notFound()` 는 화면만 바꾸고 상태 코드는 바꾸지 못한다.
확인한 것 (빌드 후 `next start`):
- 페이지 맨 앞에서 `connection()` 을 불러도, 관리자 루트 레이아웃을 동적으로 만들어도 그대로 200 (`x-nextjs-prerender: 1`, 응답은 resume)
- 정적 껍데기를 건너뛰는 HTML 전용 봇 User-Agent 에서만 404
- proxy 의 `NextResponse.next({ status: 404 })`, 같은 주소 rewrite + status 는 무시된다
- 요청 값을 읽지 않고 바로 `notFound()` 하는 정적 경로는 빌드 때 404 화면으로 만들어져 상태 코드도 404
Next 문서도 스트리밍 응답의 404 는 proxy 에서 확인하라고 안내한다 (`loading.md` "Status codes").

## 결정
- **proxy 가 관리자 상세 주소의 문서 요청(GET/HEAD, `rsc` 헤더 없음)에서 문의/작업이 있는지 묻는다.** 없으면 404 로 미리 만든 정적 화면
  (`/admin/inquiries/missing`, `/admin/works/missing`, 각각 바로 `notFound()`)으로 rewrite 한다. 주소창의 주소는 그대로다
- 묻는 곳은 `features/<영역>/proxy-check.ts`(`inquiryExists`, `workExists`). 화면과 같은 유스케이스(`getInquiry`, `getAdminWork`)와
  같은 저장소(요청의 관리자 세션, RLS)를 쓴다. container 의 관리자 저장소는 쿠키 묶음을 받을 수 있게 했다(proxy 는 `next/headers` 를 못 쓴다)
- proxy 의 빠른 확인으로 관리자처럼 보일 때만 묻는다. 로그인 전에는 지금처럼 로그인 화면으로 보내서, 문의가 있는지 알려 주지 않는다
- 저장소 장애로 알 수 없으면 "있다"로 보고 페이지에 맡긴다. 페이지가 다시 읽어 알맞은 화면(오류 또는 404 화면)을 그린다
- 화면 안 이동(RSC 요청, 프리페치)은 묻지 않는다. 상태 코드가 보이지 않고, 페이지의 `notFound()` 가 같은 화면을 그린다

## 대안
- **그대로 두기(200 + noindex)**: 관리자 화면은 검색 제외라 검색엔진 문제는 없다. 하지만 모니터링/로그에서 없는 주소가 성공으로 보이고, 납품 기준(정확한 상태 코드)에 맞지 않는다
- **HTML 전용 봇 목록(`htmlLimitedBots`)을 모든 UA 로**: 정적 껍데기를 건너뛰게 되지만 앱 전체 설정이라 공개 화면의 정적 응답도 잃는다
- **관리자 화면을 PPR 에서 빼기**: Next 16.4 + `cacheComponents` 에는 경로별로 끄는 설정이 없다 (`experimental_ppr` 제거됨)
- **id 형식만 proxy 에서 검사**: 저장소에 묻지 않아 싸지만, 형식이 맞는 없는 id(지운 문의)가 그대로 200 이다

## 결과
- 상세 화면을 주소로 열 때 저장소 읽기가 한 번 더 생긴다 (proxy + 페이지). 관리자 1명, 문서 요청에서만이라 감수한다
- proxy 묶음에 container(저장소 구현)가 같이 실린다. 인메모리 저장소는 이미 프로세스 하나(globalThis)라 proxy 와 페이지가 같은 데이터를 본다
- 새 관리자 상세 경로를 만들면 proxy 의 `detailPages` 에 같이 넣어야 404 상태 코드가 된다
