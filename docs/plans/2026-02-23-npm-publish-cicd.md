# npm 배포 + CI/CD 파이프라인 구축 Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** GitHub에 push/tag하면 자동으로 테스트 → 빌드 → npm publish 되는 파이프라인 구축

**Architecture:** GitHub Actions 두 개 — (1) PR/push마다 테스트+타입체크+빌드 검증, (2) `v*` 태그 push 시 npm publish. npm 토큰은 GitHub Secrets에 저장. `npm version` + `git tag`로 버전 관리.

**Tech Stack:** GitHub Actions, npm, Node 20

---

## 사전 준비 (수동, 1회)

npm에 로그인하고 publish용 토큰을 발급받아야 한다.

```bash
# 1. npm 로그인 (계정 없으면 https://www.npmjs.com/signup 에서 생성)
npm login

# 2. publish용 access token 발급
#    https://www.npmjs.com/ → Avatar → Access Tokens → Generate New Token
#    Type: "Automation" (CI용, 2FA 우회)
#    생성된 토큰 복사해둔다

# 3. GitHub repo에 secret 등록
#    https://github.com/amsminn/vericontext/settings/secrets/actions
#    Name: NPM_TOKEN
#    Value: 위에서 복사한 토큰
```

---

### Task 1: package.json에 배포 메타데이터 추가

**Files:**
- Modify: `package.json`

**Step 1: package.json에 누락된 필드 추가**

```json
{
  "name": "vericontext",
  "version": "0.1.0",
  "description": "Deterministic, hash-based verification for docs that reference code",
  "type": "module",
  "bin": {
    "vericontext": "dist/cli.js",
    "vcc": "dist/cli.js"
  },
  "files": [
    "dist",
    "skills"
  ],
  "keywords": [
    "documentation",
    "verification",
    "citation",
    "hash",
    "mcp",
    "agents",
    "cli"
  ],
  "repository": {
    "type": "git",
    "url": "https://github.com/amsminn/vericontext.git"
  },
  "homepage": "https://github.com/amsminn/vericontext",
  "license": "MIT",
  "author": "amsminn",
  "engines": {
    "node": ">=20"
  },
  "scripts": {
    "build": "tsup",
    "dev": "tsx src/cli.ts",
    "test": "vitest run",
    "typecheck": "tsc --noEmit",
    "prepublishOnly": "npm run build",
    "mcp:smoke": "tsx scripts/mcp-smoke.ts"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.18.2",
    "commander": "^14.0.1",
    "zod": "^3.24.2"
  },
  "devDependencies": {
    "@types/node": "^24.4.0",
    "tsup": "^8.5.0",
    "tsx": "^4.20.5",
    "typescript": "^5.9.2",
    "vitest": "^3.2.4"
  }
}
```

핵심 추가 필드:
- `files`: npm에 올라갈 파일. `dist`(빌드 결과물)와 `skills`(스킬 SKILL.md) 만 포함
- `keywords`: npm 검색용
- `repository`, `homepage`: npm 페이지에 링크 노출
- `prepublishOnly`: publish 전에 자동으로 빌드

**Step 2: 로컬에서 dry-run으로 확인**

Run: `npm pack --dry-run`
Expected: `dist/cli.js`, `skills/` 하위 파일들만 포함. `src/`, `tests/`, `assets/` 등은 없어야 함.

**Step 3: Commit**

```bash
git add package.json
git commit -m "chore: add npm publish metadata (files, keywords, repository)"
```

---

### Task 2: CI 워크플로우 — 테스트/빌드 검증

**Files:**
- Create: `.github/workflows/ci.yml`

**Step 1: CI 워크플로우 작성**

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run typecheck
      - run: npm run build
      - run: npm test
```

**Step 2: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add test/build workflow on push and PR"
```

---

### Task 3: Publish 워크플로우 — 태그 push 시 npm 배포

**Files:**
- Create: `.github/workflows/publish.yml`

**Step 1: publish 워크플로우 작성**

```yaml
name: Publish
on:
  push:
    tags: ['v*']

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm run typecheck
      - run: npm run build
      - run: npm test
      - run: npm publish --provenance --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

`--provenance`: npm에 "이 빌드는 이 GitHub commit에서 나왔다" 증명 추가 (신뢰도 높임)
`--access public`: scoped가 아닌 패키지지만 명시적으로

**Step 2: Commit**

```bash
git add .github/workflows/publish.yml
git commit -m "ci: add npm publish workflow on version tag"
```

---

### Task 4: 첫 배포

**Step 1: 사전 준비 확인**

Run: `npm whoami`
Expected: npm 로그인된 상태 (아니면 `npm login` 먼저)

Run: GitHub repo Settings → Secrets에 `NPM_TOKEN` 등록됐는지 확인

**Step 2: push CI 워크플로우**

```bash
git push origin main
```

Expected: GitHub Actions CI 통과 확인 (https://github.com/amsminn/vericontext/actions)

**Step 3: 버전 태그 + push**

```bash
npm version patch -m "release: v%s"
git push origin main --tags
```

이 명령이 하는 일:
1. `package.json` version을 `0.1.0` → `0.1.1`로 올림
2. 자동으로 `git commit -m "release: v0.1.1"` 생성
3. 자동으로 `git tag v0.1.1` 생성
4. `--tags`로 태그 push → GitHub Actions publish 워크플로우 트리거

Expected: GitHub Actions에서 publish job 실행 → npm에 패키지 게시

**Step 4: 배포 확인**

Run: `npm view vericontext`
Expected: 버전, description, dist-tags 등 정보 출력

Run: `npx vericontext --help`
Expected: CLI 도움말 출력

---

## 이후 릴리스 프로세스

배포할 때마다 이것만 하면 됨:

```bash
# 패치 (0.1.1 → 0.1.2): 버그 픽스
npm version patch -m "release: v%s"

# 마이너 (0.1.2 → 0.2.0): 기능 추가
npm version minor -m "release: v%s"

# 메이저 (0.2.0 → 1.0.0): 브레이킹 체인지
npm version major -m "release: v%s"

# push하면 자동 배포
git push origin main --tags
```
