# Copilot Instructions

## Project Overview

This is a **GitHub Action** (`runs: node24`, entry: `dist/index.cjs`) that authenticates to AKeyless and fetches static/dynamic secrets or provisions AWS credentials for CI/CD workflows. It supports JWT (GitHub OIDC) and AWS IAM authentication.

## Commands

```bash
npm test                        # Run all tests (vitest run)
npm run test:verbose            # Tests with verbose output
npm run test:coverage           # Tests with coverage report
npx vitest run _tests_/auth.test.js   # Run a single test file
npm run lint                    # ESLint check
npm run format                  # Prettier formatting
npm run build                   # Bundle to dist/ with ncc
npm run package                 # format → lint → test → build (pre-release)
```

## Architecture

The action flows through these modules in sequence:

1. **`src/input.js`** — Parses and validates all GitHub Action inputs. Converts `static-secrets` and `dynamic-secrets` from JSON strings to objects. Normalizes `access-type` to lowercase.
2. **`src/auth.js`** — Authenticates to AKeyless. JWT path calls `core.getIDToken()` to get GitHub's OIDC token. AWS IAM path uses `@aws-sdk` to sign a STS `GetCallerIdentity` request and base64-encodes it as a cloud ID.
3. **`src/akeyless_api.js`** — Factory that creates a configured AKeyless `V2Api` client for a given URL.
4. **`src/secrets.js`** — Fetches static/dynamic secrets and exports them via `core.setOutput()` and/or `core.exportVariable()`. Dynamic secrets support a "parsed" mode (`parse-dynamic-secrets: true`) that splits a JSON object into separate `{variableName}_{key}` outputs.
5. **`src/aws_access.js`** — Fetches AWS credentials from an AKeyless dynamic producer and exports `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and optionally `AWS_SESSION_TOKEN`.

**Entry point**: `src/index.cjs` (CommonJS wrapper) dynamically imports `src/index.js` (ES module). The `bootstrap()` function in `index.js` auto-invokes `main()` when the file is executed directly.

**Build**: `ncc` bundles `src/index.cjs` and all dependencies into `dist/index.cjs`. The `dist/package.json` explicitly sets `"type": "commonjs"` to ensure the runner treats it as CJS.

## Key Conventions

**Module format**: The `src/` files are ES modules (`"type": "module"` in package.json). The `src/index.cjs` wrapper bridges to CommonJS for ncc bundling. Config files (vitest, eslint) use `.mjs`/`.cjs` extensions accordingly.

**All dependencies are devDependencies**: Runtime deps like `akeyless`, `@actions/core`, and `@aws-sdk/*` are under `devDependencies` because ncc bundles everything into `dist/`—nothing is loaded from `node_modules` at runtime.

**Secret inputs (`static-secrets`, `dynamic-secrets`)** are passed as JSON strings in `action.yml` and parsed to objects in `input.js`. The key is the AKeyless path; the value is the output/env variable name.

**All secrets are masked** via `core.setSecret()` immediately after fetching, before any export.

**Error handling pattern**: Errors in `auth.js` use `action_fail()` (sets failed + throws). Errors in `index.js` catch-blocks call both `core.error()` and `core.setFailed()` but `return` rather than throw, allowing partial success for other secret types.

**`access-type` input** is normalized to lowercase in `input.js` before being used as a key in the `login` dispatch object in `auth.js`. Valid values: `jwt`, `aws_iam`.

**Test files** live in `_tests_/` (not `__tests__`). Vitest is configured with `globals: true`, so `describe`, `test`, `expect`, and `vi` are available without imports.

**`dist/` must be committed**: The GitHub Actions runner uses `dist/index.cjs` directly. Always run `npm run build` (or `npm run package`) before committing changes to `src/`.
