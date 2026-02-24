---
name: vericontext-enforcer
description: >-
  AI 에이전트가 문서(README, AGENTS.md, 플랜 등)를 작성·수정할 때 VeriContext
  citation/claim을 자동으로 생성·삽입하도록 강제하고, 커밋·플랜 마무리 시점에
  vctx_verify_workspace를 실행하여 모든 claim이 최신 상태인지 검증한다.
  코드를 참조하는 모든 문서 작업에서 사용한다.
  NOT for: 코드 자체의 수정, 테스트 작성, 빌드 작업.
hooks:
  PreToolUse:
    - matcher: Edit
      hooks:
        - command: >-
            echo '[vericontext-enforcer] Editing a file — remember to update
            any vctx citations referencing changed lines.'
---

## Phase 1 — 참조 대상 식별 (Detect & Plan)

문서를 작성하거나 수정하기 전에, 참조할 코드와 구조를 먼저 식별한다.

### 1.1 참조 유형 분류

| 참조 유형 | VeriContext 도구 | 실제 예시 |
|-----------|-----------------|-----------|
| 코드 라인 범위 | `vctx_cite` | <!-- [[vctx:src/cli.ts#L28-L34@2b4ed3f8]] --> |
| 파일 존재 여부 | `vctx_claim --kind exists-file` | <!-- [[vctx-exists-file:src/cli.ts]] --> |
| 디렉토리 존재 여부 | `vctx_claim --kind exists-dir` | <!-- [[vctx-exists-dir:src/]] --> |
| 파일/디렉토리 부재 확인 | `vctx_claim --kind missing` | <!-- [[vctx-missing:tmp-output]] --> |

> 위 예시는 모두 이 프로젝트에서 실제로 유효한 claim이다. `vctx_verify_workspace`로 검증하면 전부 `ok: true`.

### 1.2 행동 규칙

1. **코드를 언급하면 반드시 citation을 생성한다.** "이 함수는 X를 한다"라고 쓰려면, 해당 함수의 라인 범위를 `vctx_cite`로 인용한 뒤 토큰을 문서에 삽입한다.
2. **프로젝트 구조를 언급하면 반드시 claim을 생성한다.** "src/ 디렉토리에는..."이라고 쓰려면 `vctx_claim --kind exists-dir`로 claim을 만든다.
3. **외부 도구(read_file 등)로 코드를 읽었더라도**, 문서에 기술하기 전에 `vctx_cite`를 호출하여 citation 토큰을 확보한다.
4. citation/claim 토큰은 **HTML 주석(`<!-- ... -->`)** 안에 넣거나, 관련 텍스트 바로 뒤에 inline으로 배치한다.

## Phase 2 — Citation/Claim 생성 및 삽입 (Generate & Embed)

### 2.1 CLI 사용법 (에이전트 환경 공통)

**Citation 생성:**
```bash
vericontext cite --root <project-root> --path <file> --start-line <N> --end-line <M> --json
```

응답 예시:
```json
{ "ok": true, "citation": "[[vctx:src/cli.ts#L28-L34@2b4ed3f8]]", "sha256_full": "2b4ed3f8..." }
```

**Structure Claim 생성:**
```bash
vericontext claim --root <project-root> --kind exists-dir --path src/ --json
```

응답 예시:
```json
{ "ok": true, "claim": "[[vctx-exists-dir:src/]]", "kind": "exists-dir", "normalized_path": "src/" }
```

### 2.2 MCP 사용법 (MCP 지원 에이전트)

MCP 도구 `vctx_cite`, `vctx_claim`을 직접 호출한다. 파라미터는 CLI와 동일하다.

### 2.3 삽입 패턴

**패턴 A — 인라인 (테이블, 코드맵에서 사용):**

| CLI 진입점 | `src/cli.ts` | <!-- [[vctx:src/cli.ts#L28-L34@2b4ed3f8]] --> |

**패턴 B — 섹션 끝 (설명 문단 뒤에 사용):**

검증 로직은 claim 단위로 원자적으로 동작한다. 하나라도 실패하면 전체 결과가 `ok: false`가 된다.
<!-- [[vctx:src/verify/workspace.ts#L46-L109@39dad95f]] -->

**패턴 C — 구조 선언 (프로젝트 구조 설명에 사용):**

├── src/          # production logic
<!-- [[vctx-exists-dir:src/]] -->
├── tests/        # unit + e2e tests
<!-- [[vctx-exists-dir:tests/]] -->
<!-- [[vctx-exists-file:package.json]] -->

### 2.4 절대 금지 사항

- citation 토큰을 수동으로 타이핑하지 않는다. 반드시 도구로 생성한다.
- hash 값을 추측하거나 이전 값을 복사하지 않는다.
- 존재하지 않는 파일에 대한 citation을 만들지 않는다.
- claim 없이 "이 파일이 있다/없다"고 단언하지 않는다.

## Phase 3 — 검증 및 강제 (Verify & Enforce)

### 3.1 검증 타이밍

다음 시점에 **반드시** 검증을 실행한다:

1. **문서 작성/수정 완료 직후** — 커밋 전에 반드시 실행
2. **플랜 마무리 시** — 플랜 문서에 포함된 모든 claim 검증
3. **코드 수정 후** — 코드를 변경했다면, 해당 코드를 참조하는 문서의 claim 검증

### 3.2 검증 실행

**CLI:**
```bash
vericontext verify workspace --root <project-root> --in-path <document.md> --json
```

**MCP:**
`vctx_verify_workspace` 도구를 `root`와 `in_path` 파라미터로 호출한다.

**응답 예시 (성공):**
```json
{ "ok": true, "total": 3, "ok_count": 3, "fail_count": 0, "results": [...] }
```

**실패 시 응답 구조:**
```json
{ "ok": false, "total": N, "ok_count": M, "fail_count": N-M,
  "results": [{ "claim": "<token>", "ok": false, "reason": "hash_mismatch|missing|range_invalid" }] }
```
`reason` 필드의 값에 따라 3.3의 대응 절차를 따른다.

### 3.3 실패 시 대응 절차

1. `hash_mismatch` → 해당 파일의 현재 라인 범위를 다시 읽고, `vctx_cite`로 새 citation을 생성하여 교체한다.
2. `missing` / `not_file` / `not_dir` → 파일/디렉토리가 이동·삭제되었는지 확인하고, 문서 내용을 수정하거나 claim을 제거한다.
3. `range_invalid` → 파일이 줄어들었다면 올바른 범위로 재인용한다.
4. **모든 실패를 해결한 뒤 다시 검증을 실행한다.** `ok: true`가 될 때까지 반복한다.

### 3.4 검증 통과 기준

- `ok: true` — 커밋 또는 플랜 제출 가능
- `ok: false` — **커밋/제출 불가**. 실패한 claim을 모두 수정해야 한다.

> **원칙: Fail Closed.** 검증을 건너뛰거나, 실패한 채로 커밋하는 것은 이 스킬의 위반이다.

## Phase 4 — 에이전트별 설정 가이드

### Claude Code
- MCP 서버로 `vericontext mcp`를 등록하면 `vctx_cite`, `vctx_claim`, `vctx_verify_workspace` 도구를 직접 사용할 수 있다.
- 이 스킬은 `.claude/skills/vericontext-enforcer`에 symlink로 연결되어 자동 로드된다.

### Codex (OpenAI)
- CLI(`vericontext cite`, `vericontext claim`, `vericontext verify workspace`)를 Bash/shell 도구로 실행한다.
- AGENTS.md에 이 스킬의 핵심 규칙이 요약되어 있어 Codex가 자동으로 읽는다.

### OpenCode
- MCP를 지원하는 경우 Claude Code와 동일하게 MCP 서버를 등록한다.
- MCP 미지원 시 Codex와 동일하게 CLI + AGENTS.md 방식을 사용한다.

### Antigravity / 기타
- CLI 실행만 가능한 환경에서는 `scripts/verify-modified-docs.sh`를 실행하여 수정된 문서를 일괄 검증한다.
- INSTRUCTIONS.md 또는 시스템 프롬프트에 Phase 1~3의 핵심 규칙을 복사하여 사용한다.

## Reference File Index

| File | Read When |
|------|-----------|
| `references/citation-format-guide.md` | citation/claim 문법을 정확히 알아야 할 때 |
| `references/verification-playbook.md` | 검증 실패 시 구체적인 해결 절차가 필요할 때 |
| `references/cross-agent-setup.md` | 새 에이전트 환경에 VeriContext를 설정할 때 |

## Critical Rules

1. **문서에 코드를 참조하면 반드시 `vctx_cite`로 citation을 생성한다.** 예외 없음.
2. **커밋 전에 반드시 `vctx_verify_workspace`를 실행한다.** `ok: true`가 아니면 커밋하지 않는다.
3. **citation 토큰을 수동으로 작성하지 않는다.** 항상 도구로 생성한다.
4. **코드를 수정하면, 해당 코드를 참조하는 문서의 citation도 갱신한다.**
5. **검증 실패를 무시하지 않는다.** Fail closed — 실패는 항상 수정해야 한다.
