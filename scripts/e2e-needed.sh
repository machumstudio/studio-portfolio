#!/usr/bin/env bash
# CI e2e 잡이 돌아야 하는지: BASE..HEAD 사이에 문서(docs/**, *.md) 말고 바뀐 파일이 있으면 run=true.
# 워크플로 paths-ignore 를 쓰면 필수 체크가 "대기"로 남아서, 잡은 늘 시작하고 이 결과로 단계만 건너뛴다.
# 사용: bash scripts/e2e-needed.sh <base-sha> <head-sha>   → 표준 출력 "run=true" 또는 "run=false"
# base 를 알 수 없으면(첫 push, force push 로 사라진 커밋) 안전하게 run=true
set -euo pipefail

base="${1:-}"
head="${2:-HEAD}"

if [[ -z "$base" || "$base" =~ ^0+$ ]] || ! git cat-file -e "${base}^{commit}" 2>/dev/null; then
  echo "e2e-needed: base 커밋을 알 수 없어 e2e 를 돌린다 (${base:-없음})" >&2
  echo "run=true"
  exit 0
fi

changed="$(git diff --name-only "${base}...${head}")"

# 앞 20개만 보여 준다. head 는 20줄을 읽고 먼저 끝나서, 바뀐 파일이 많으면 printf 가 SIGPIPE(141)로 죽고
# pipefail + set -e 때문에 스크립트가 run= 을 쓰지 못한 채 실패한다. sed 는 입력을 끝까지 읽어서 그런 일이 없다
preview() {
  printf '%s\n' "$1" | sed -n '1,20s/^/  /p'
  local count
  count="$(printf '%s\n' "$1" | grep -c . || true)"
  if ((count > 20)); then echo "  … 외 $((count - 20))개"; fi
}

code="$(printf '%s\n' "$changed" | grep -vE '^(docs/|$)|\.md$' || true)"

if [[ -n "$code" ]]; then
  echo "e2e-needed: 문서 밖 파일이 바뀌었다:" >&2
  preview "$code" >&2
  echo "run=true"
else
  echo "e2e-needed: 문서(docs/**, *.md)만 바뀌어 e2e 를 건너뛴다:" >&2
  preview "$changed" >&2
  echo "run=false"
fi
