#!/usr/bin/env bash
# 이 레포 전용 gh 래퍼. machumstudio 토큰(키체인)으로만 실행하고, 계정이 다르면 중단한다.
# 전역 gh 로그인(다른 계정)으로 공개 이슈/PR이 올라가는 사고를 막기 위함.
# 사용: bash scripts/gh.sh pr create ... / bash scripts/gh.sh issue create ...
set -euo pipefail

EXPECTED_LOGIN="machumstudio"
KEYCHAIN_SERVICE="gh-machumstudio"

if ! TOKEN="$(security find-generic-password -s "$KEYCHAIN_SERVICE" -a "$EXPECTED_LOGIN" -w 2>/dev/null)"; then
  echo "gh.sh: 키체인에 '$KEYCHAIN_SERVICE' 토큰이 없습니다. 중단합니다." >&2
  exit 1
fi

export GH_TOKEN="$TOKEN"           # 저장된 gh 로그인보다 우선한다
export GH_HOST="github.com"
export GH_REPO="machumstudio/studio-portfolio"
export GH_PROMPT_DISABLED=1

LOGIN="$(gh api user --jq .login 2>/dev/null || true)"
if [ "$LOGIN" != "$EXPECTED_LOGIN" ]; then
  echo "gh.sh: 인증 계정이 '${LOGIN:-없음}' 입니다. '$EXPECTED_LOGIN' 이 아니면 실행하지 않습니다." >&2
  exit 1
fi

exec gh "$@"
