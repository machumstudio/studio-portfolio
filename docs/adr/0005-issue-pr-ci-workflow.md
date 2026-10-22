# 0005. 칸 단위 이슈 → PR → CI
- 상태: 채택 (2026-10)

## 결정
- 작업표의 칸마다 이슈 1개, 브랜치 `slot/NN-name`, PR 1개
- 커밋은 논리 단위로 쪼개고(docs/commit-convention.md) **Rebase and merge**로 main에 그대로 남긴다. 리뷰 수정은 fixup + autosquash로 정리
- CI(GitHub Actions): install → commitlint(PR 커밋) → lint(의존 규칙 포함) → typecheck → test → build

- 이슈/PR은 Claude Code가 `scripts/gh.sh`(machumstudio 토큰 전용, 계정 확인 후 실행)로 만든다. 머지는 사람이 한다

## 대안
- Squash merge: main이 칸당 커밋 1개로 깔끔하지만, 레이어별로 쌓아 올린 순서가 사라진다. 이 레포는 그 순서 자체가 보여줄 거리라 택하지 않는다

## 결과
레포만 봐도 진행 순서와 검증 기록이 남는다. 대신 커밋마다 테스트가 통과해야 해서 커밋 전 정리 비용이 든다. 1인 작업이라 리뷰어는 없지만 PR 본문이 작업 기록 역할을 한다.
