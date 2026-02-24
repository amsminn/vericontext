# VeriContext Verification Playbook

## 검증 실행

### 단일 문서 검증
```bash
vericontext verify workspace --root . --in-path README.md --json
```

### 응답 구조
```json
{
  "ok": true|false,
  "total": <number>,
  "ok_count": <number>,
  "fail_count": <number>,
  "results": [
    {
      "claim": "<full claim string>",
      "ok": true|false,
      "reason": "<error code if failed>"
    }
  ]
}
```

## 실패 유형별 수정 절차

### 1. `hash_mismatch` — 파일 내용이 변경됨

```
원인: citation이 가리키는 라인의 내용이 달라졌다.
수정:
  1. 해당 파일의 현재 내용을 확인한다.
  2. 참조하려는 코드가 여전히 같은 위치에 있는지 확인한다.
     - 같은 위치: vctx_cite를 다시 실행하여 새 hash로 교체.
     - 다른 위치: 올바른 라인 범위를 찾아 재인용.
     - 코드가 삭제됨: 문서에서 해당 참조를 제거하거나 수정.
  3. 문서의 citation 토큰을 새 것으로 교체한다.
```

### 2. `file_missing` — 파일이 존재하지 않음

```
원인: 파일이 삭제되었거나 이름이 변경되었다.
수정:
  1. 파일이 이동/이름변경되었는지 확인한다.
     - 이동됨: 새 경로로 citation 재생성.
     - 삭제됨: 문서에서 해당 참조를 제거.
  2. structure claim (exists-file 등)도 함께 수정한다.
```

### 3. `range_invalid` — 라인 범위 초과

```
원인: 파일이 줄어들어 지정한 end_line이 파일 길이를 초과한다.
수정:
  1. 파일의 현재 줄 수를 확인한다.
  2. 참조하려는 코드의 현재 라인 범위를 찾는다.
  3. 올바른 범위로 재인용한다.
```

### 4. `missing` / `not_file` / `not_dir` — structure claim 실패

```
원인: 파일/디렉토리가 예상과 다른 상태다.
수정:
  1. 실제 상태를 확인한다 (파일인지, 디렉토리인지, 없는지).
  2. claim의 kind를 실제 상태에 맞게 수정하거나, 문서 내용을 수정한다.
```

## 수정 후 재검증

수정을 마친 뒤 반드시 다시 검증을 실행한다:
```bash
vericontext verify workspace --root . --in-path <수정한문서.md> --json
```

`ok: true`가 될 때까지 반복한다. 검증 통과 전에는 커밋하지 않는다.
