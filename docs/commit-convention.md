# 커밋 규칙

main 히스토리만 읽어도 "무엇을 어떤 순서로, 왜 만들었는지" 보이게 한다.

## 형식
```
<type>(<scope>): <요약>

<본문: 왜 바꿨는지, 무엇이 바뀌었는지>

<검증: 테스트, 시각 차이율 등>
```
- type: `feat` `fix` `refactor` `test` `docs` `style`(동작 무관 포맷) `perf` `build` `ci` `chore`
- scope: `shared` `domain` `application` `infra` `works` `inquiry` `admin-auth` `ui` `sections` `pages` `i18n` `design` `deps` `lint` `hooks` `docs`. scope는 생략 가능 (`ci:`처럼 type만으로 충분할 때)
- 요약은 한국어, 72자 이내, 마침표 없이, "~ 추가 / ~ 수정 / ~ 분리"처럼 끝낸다
- 본문은 "왜"가 먼저다. 무엇을 했는지는 diff가 말해준다
- 이슈 연결은 **PR 본문의 `Closes #N`** 으로 한다. 커밋마다 `Refs #N`을 붙이지 않아도 된다 (PR이 커밋 묶음과 이슈를 이어준다)

예시
```
feat(inquiry): 문의 상태 전이 규칙 추가

New → Read → Done, Done → Read(되돌리기)만 허용한다.
관리자 화면과 서버 액션이 같은 규칙을 쓰도록 도메인에 둔다.
허용되지 않은 전이는 InvalidTransition 에러로 돌려준다.

검증: 전이표 9가지 조합 단위 테스트
```

## 크기와 순서
- **커밋 1개 = 논리적 변경 1개.** "그리고"가 들어가면 쪼갠다
- **모든 커밋은 그 자체로 lint/typecheck/test 통과.** 깨진 상태로 커밋하지 않는다 (bisect 가능하게)
- 테스트는 그 코드와 같은 커밋에 넣는다
- 기능 영역은 레이어 순서로 커밋한다: `domain` → `application` → `infra` → 기능 UI/액션 → `pages`
- 섞지 않는다: 포맷 변경(`style`), 리팩터링(`refactor`), 의존성 업데이트(`chore(deps)`)는 기능 커밋과 분리
- 칸 하나는 보통 커밋 3~8개

한 칸의 예 (12칸 inquiry)
```
feat(shared): Result.flatMap 추가
feat(domain): Inquiry 엔티티와 스마트 생성자 추가
feat(domain): 문의 상태 전이 규칙 추가
feat(application): submitInquiry 유스케이스와 포트 정의
test(application): 인메모리 리포지토리로 submitInquiry 시나리오 검증
```

## 브랜치와 머지
- 브랜치: `slot/NN-short-name` (예: `slot/12-inquiry-domain`)
- 리뷰 중 고친 것은 `git commit --fixup <sha>` → 머지 전에 `git rebase -i --autosquash main`으로 정리. main에 "wip", "fix typo", "리뷰 반영" 커밋을 남기지 않는다
- 머지는 **Rebase and merge**. 정리된 커밋을 main에 그대로 남긴다 (squash 하지 않음)
- PR 제목도 같은 형식: `feat(inquiry): 문의 도메인과 유스케이스 (slot 12)`

## 누가 커밋하나
- Claude Code는 위 규칙을 지키면 **확인 없이 커밋**한다. 단, 각 커밋 직전에 lint/typecheck/test 통과를 확인한다
- 하지 않는 것: main에 직접 커밋/푸시, force push(내 브랜치의 autosquash 정리 후 `--force-with-lease`만 허용), 규칙에 없는 type/scope 추가
- 브랜치 푸시, 이슈/PR 생성까지 한다. 머지는 사람이 한다
- gh는 반드시 `bash scripts/gh.sh ...`로만 쓴다. 맨 `gh` 명령은 금지 (전역 로그인이 다른 계정)

## 이슈와 PR
- 칸 시작: `bash scripts/gh.sh issue create --title "[slot NN] 제목" --label slot --body-file <tmp>`. 본문은 tasks.md 해당 칸의 범위와 완료 기준 체크리스트. 이미 있으면 새로 만들지 않는다
- 칸 끝: 모든 커밋 완료 → 로컬 lint/typecheck/test/build 통과 → 브랜치 push → PR 생성
  `bash scripts/gh.sh pr create --base main --head slot/NN-name --title "<type>(<scope>): <요약> (slot NN)" --body-file <tmp> --label slot`
- PR 본문은 .github/pull_request_template.md 를 그대로 채운다: `Closes #N`, 변경 요약, 커밋 목록, 스크린샷(있으면), 시안 재현도 표, 검증 결과, 체크리스트
- PR 생성 후 `bash scripts/gh.sh pr checks --watch` 로 CI 끝까지 확인. 실패하면 같은 브랜치에서 고쳐서(fixup + autosquash, `--force-with-lease`) 다시 push
- 하지 않는 것: PR 머지, main 보호 설정 변경, 레포 설정 변경, 다른 레포 접근
- 끝나면 PR URL, CI 결과, 남은 TODO를 보고한다

## 커밋하지 않는 것
- `.env*` (`.env.example`만), Supabase/Resend 키, 토큰
- `docs/design/reference/` (시안 원본 PNG), `playwright-report/`, `test-results/`, `storybook-static/`, `.vscode/`(개인 에디터 설정)
- 실명, 개인/회사 메일, 다른 회사나 프로젝트의 코드와 문서

## 자동 검사
- `commit-msg` 훅: commitlint (형식, type/scope 목록, scope 생략 허용, 요약 길이)
- `pre-commit` 훅: lint-staged (스테이징된 파일만 prettier + eslint)
- CI: PR의 모든 커밋에 commitlint
- 작성자: `git log --format='%an <%ae>'`가 Machum Studio / GitHub noreply 주소인지 (GitHub에서 이메일 노출 push 차단 켜둠)
