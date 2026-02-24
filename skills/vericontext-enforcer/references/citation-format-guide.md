# VeriContext Citation & Claim Format Guide

## Citation (코드 라인 참조)

### 형식
````
[[vctx:<relative-path>#L<start>-L<end>@<hash8>]]
````

### 구성 요소
- `relative-path`: 프로젝트 루트 기준 상대 경로 (예: `src/cli.ts`)
- `L<start>-L<end>`: 1-based 라인 범위 (예: `L36-L103`)
- `hash8`: SHA-256 해시의 앞 8자 (도구가 자동 생성)

### 예시
````
[[vctx:src/cli.ts#L36-L103@4db34b59]]
[[vctx:src/verify/workspace.ts#L46-L109@39dad95f]]
````

### 검증 동작
- 해당 파일의 지정 라인 범위를 읽어 SHA-256 해시를 재계산한다.
- EOL 정규화 적용 (CRLF/CR → LF).
- 해시가 일치하면 `ok: true`, 불일치하면 `hash_mismatch`.

## 파일 해시 (전체 파일 참조)

파일을 언급할 때(역할, 코드, 존재 여부 무관) 반드시 `vctx_cite`로 전체 파일을 해시한다.
`exists-file` claim은 사용하지 않는다.

### 형식
````
[[vctx:<relative-path>#L1-L<last>@<hash8>]]
````

### 예시
````
<!-- [[vctx:package.json#L1-L25@93ac3fea]] -->
<!-- [[vctx:src/cli.ts#L1-L103@b4ee03f3]] -->
````

## Structure Claim (구조 선언)

### 형식
| Kind | 형식 | 의미 |
|------|------|------|
| `exists-dir` | `[​[vctx-exists-dir:<path>]]` | 디렉토리로 존재 |
| `missing` | `[[vctx-missing:<path>]]` | 존재하지 않음 |

> `exists-file` / `exists` claim은 사용하지 않는다. 파일은 반드시 `vctx_cite`로 해시한다.

### 예시
````
<!-- [[vctx-exists-dir:src/]] -->
<!-- [[vctx-missing:tmp-output/]] -->
````

## 에러 코드

| Reason | 원인 | 대응 |
|--------|------|------|
| `hash_mismatch` | 파일 내용 변경됨 | 재인용 (`vctx_cite`) |
| `file_missing` | 파일 삭제/이동됨 | 문서 수정 또는 claim 제거 |
| `range_invalid` | 라인 범위 초과 | 올바른 범위로 재인용 |
| `path_escape` | `../` 등 루트 이탈 | 상대 경로 수정 |
| `not_file` | 디렉토리인데 file claim | `exists-dir` claim으로 변경 |
| `not_dir` | 파일인데 dir claim | dir claim 제거 후 `vctx_cite`로 전체 파일 해시 |
