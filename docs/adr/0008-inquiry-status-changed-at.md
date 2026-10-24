# 0008. 문의 상태에 그 상태가 된 시각을 남긴다 (이력은 남기지 않는다)
- 상태: 채택 (2026-10)

## 배경
문의 상태는 `New → Read → Done`, 되돌리기 `Done → Read`다 (docs/architecture.md). 관리자 화면(19칸)에서 "언제 확인했고 언제 끝냈는지"는 응답 속도를 보는 기본 정보다. 시각을 남길지, 남긴다면 어디에 둘지 정해야 한다.

## 결정
- 상태 판별 유니온의 Read, Done 이 `changedAt`을 갖는다: `{ type: "New" } | { type: "Read"; changedAt } | { type: "Done"; changedAt }`. New 의 시각은 `Inquiry.receivedAt`
- 시각은 유스케이스가 `Clock` 포트에서 받아 전이 함수에 넘긴다. 도메인은 시계를 모른다
- 마지막 전이 시각만 남긴다. 되돌리기(`Done → Read`)는 Read 의 `changedAt`을 새 시각으로 바꾼다

## 대안
- 시각을 남기지 않음: 가장 단순하지만 "확인까지 걸린 시간"을 볼 수 없고, 나중에 추가하면 기존 데이터는 비어 있다
- 엔티티에 `readAt`, `doneAt` 필드를 따로 둠: New 인데 `doneAt`이 있는 것처럼 상태와 맞지 않는 조합이 생긴다. 상태 안에 두면 그런 조합이 타입으로 막힌다
- 전이 이력 테이블(누가, 언제, 무엇을): 감사가 필요하면 맞지만 관리자 1명 데모에는 과하다. 필요해지면 `changeInquiryStatus`에서 이력 포트를 추가로 호출하면 된다

## 결과
- 상태와 시각이 항상 같이 다닌다. 14칸 Supabase 테이블은 `status` + `status_changed_at`(New 일 때 null) 두 칼럼으로 저장한다
- 되돌리기 전의 Done 시각은 사라진다. 이력이 필요해지면 새 ADR로 바꾼다
