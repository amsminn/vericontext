#!/usr/bin/env bash
# verify-docs.sh — VeriContext로 claim이 포함된 모든 프로젝트 문서를 검증
# 코드만 변경돼도 citation hash가 깨질 수 있으므로, 문서 diff와 무관하게
# claim이 포함된 모든 .md 파일을 검증한다.
# 의존성: node >= 20, vericontext CLI (dist/cli.js)
# 종료 코드: 0 = 모두 통과, 1 = 실패 있음

set -euo pipefail

ROOT="$(cd "${1:-.}" && pwd)"
VCTX="${VERICONTEXT_BIN:-npx vericontext}"

# claim 토큰([[vctx)이 포함된 .md 파일을 찾되,
# 내부 도구/플랜/스킬 디렉토리는 제외한다.
DOCS=$(grep -rl '\[\[vctx' "$ROOT" --include='*.md' \
  | grep -v node_modules \
  | grep -v '\.git/' \
  | grep -v '\.agents/skills/' \
  | grep -v '\.claude/skills/' \
  | grep -v '\.sisyphus/' \
  | sed "s|^$ROOT/||" \
  | sort || true)

if [ -z "$DOCS" ]; then
  echo "[vericontext-enforcer] No documents with vctx claims found."
  exit 0
fi

FAILED=0
TOTAL=0

while IFS= read -r doc; do
  [ -z "$doc" ] && continue
  TOTAL=$((TOTAL + 1))
  echo "[vericontext-enforcer] Verifying: $doc"

  RESULT=$($VCTX verify workspace --root "$ROOT" --in-path "$doc" --json 2>/dev/null || echo '{"ok":false,"error":"command_failed"}')
  OK=$(echo "$RESULT" | grep -o '"ok":[a-z]*' | head -1 | cut -d: -f2)

  if [ "$OK" = "true" ]; then
    echo "  PASS"
  else
    echo "  FAIL"
    echo "$RESULT" | python3 -m json.tool 2>/dev/null || echo "$RESULT"
    FAILED=$((FAILED + 1))
  fi
done <<< "$DOCS"

echo ""
echo "[vericontext-enforcer] Results: $((TOTAL - FAILED))/$TOTAL passed"

if [ "$FAILED" -gt 0 ]; then
  echo "[vericontext-enforcer] $FAILED document(s) have stale claims. Fix before committing."
  exit 1
fi

echo "[vericontext-enforcer] All documents verified."
exit 0
