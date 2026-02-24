# VeriContext Cross-Agent Setup Guide

## 사전 요구사항

- Node.js >= 20
- VeriContext CLI 설치:
  ```bash
  npm install   # (vericontext 프로젝트 내)
  npm run build # dist/cli.js 생성
  ```
- 또는 글로벌 설치: `npm install -g vericontext`

## Claude Code

### MCP 서버 등록

`~/.claude/settings.json` 또는 프로젝트 `.claude/settings.json`:
```json
{
  "mcpServers": {
    "vericontext": {
      "command": "node",
      "args": ["<path-to>/dist/cli.js", "mcp"]
    }
  }
}
```

### 스킬 자동 로드
`.claude/skills/vericontext-enforcer` symlink가 있으면 자동으로 스킬이 로드된다.

## Codex (OpenAI)

### AGENTS.md 방식
프로젝트 루트의 `AGENTS.md`에 다음을 추가한다:

````markdown
## DOCUMENT VERIFICATION
이 프로젝트에서 문서를 작성/수정할 때:
1. 코드를 참조하면 `vericontext cite --root . --path <file> --start-line <N> --end-line <M> --json`으로 citation을 생성한다.
2. 파일/디렉토리 존재를 언급하면 `vericontext claim --root . --kind <kind> --path <path> --json`으로 claim을 생성한다.
3. 커밋 전에 `vericontext verify workspace --root . --in-path <document.md> --json`을 실행하여 모든 claim이 유효한지 확인한다.
4. `ok: false`이면 커밋하지 않고, 실패한 claim을 수정한 뒤 재검증한다.
````

## OpenCode

### 커스텀 룰 또는 시스템 프롬프트
Codex와 동일한 지침을 `.opencode/instructions.md` 또는 시스템 프롬프트에 추가한다.
MCP를 지원하는 경우 Claude Code와 동일하게 MCP 서버를 등록한다.

## Antigravity

### INSTRUCTIONS.md 방식
프로젝트 루트의 `INSTRUCTIONS.md`에 위의 AGENTS.md 내용과 동일한 지침을 추가한다.

## CI/CD 게이팅 (선택)

### GitHub Actions 예시
```yaml
- name: Verify documentation freshness
  run: |
    for doc in README.md AGENTS.md; do
      result=$(npx vericontext verify workspace --root . --in-path "$doc" --json)
      ok=$(echo "$result" | jq -r '.ok')
      if [ "$ok" != "true" ]; then
        echo "::error::Stale claims in $doc"
        echo "$result" | jq '.results[] | select(.ok == false)'
        exit 1
      fi
    done
```
