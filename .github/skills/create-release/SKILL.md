---
name: create-release
description: >
  Step-by-step process for creating and publishing a new release of akeyless-action.
  Invoke when main is ready to ship: determines version bump, runs precommit, commits,
  creates the release branch, moves the major tag, and drafts the GitHub Release.
---

# Create Release

## Prerequisites

- The `main` branch is up to date and all intended changes have been merged.
- You are authenticated with push access to the remote (`origin`).

---

## Step 1 — Determine the Next Version Number

The current version lives in `package.json` → `"version"`.

Apply exactly one of the following rules (checked in priority order):

| Condition | Action |
|---|---|
| The **major version** of the `akeyless` devDependency in `package.json` is higher than the action's current major version | Increment **major**, reset minor and patch to `0` |
| A **new feature** was added since the last release | Increment **minor**, reset patch to `0` |
| Default (bug fixes, maintenance, dependency bumps) | Increment **patch** only |

> **Key rule:** The action's major version number must always match the `akeyless` package's major version number.
> Example: if `akeyless` is `^5.x.x`, the action version must be `5.y.z`.

Record the resulting version as `NEW_VERSION` (e.g. `5.4.1`).

---

## Step 2 — Update `package.json`

Set `"version"` in `package.json` to `NEW_VERSION`.

```json
{
  "version": "NEW_VERSION"
}
```

---

## Step 3 — Run the Precommit Command

```bash
npm run precommit
```

This runs: `npm install` → `prettier` → `eslint` → `vitest` → `ncc build` (outputs to `dist/`).

**If the command fails:**
- Open a new GitHub Issue titled `Release build failed for vNEW_VERSION` with the full error output in the body.
- Stop. Do not proceed until the issue is resolved.

**If the command succeeds**, continue to Step 4.

---

## Step 4 — Commit and Push to `main`

```bash
git add package.json package-lock.json dist/
git commit -m "chore: release vNEW_VERSION"
git push origin main
```

---

## Step 5 — Create and Push the Release Branch

```bash
git checkout -b releases/vNEW_VERSION
git push origin releases/vNEW_VERSION
```

The branch name format is `releases/v{version}`, e.g. `releases/v5.4.1`.

---

## Step 6 — Move the Major Version Tag

Move the floating major tag (e.g. `v5`) to the latest commit on this release branch, then force-push the tags.

```bash
# Replace vMAJOR with the major portion only, e.g. v5
git tag -f vMAJOR
git push origin vMAJOR --force
```

---

## Step 7 — Create the GitHub Release (Draft)

On GitHub, create a new Release with the following settings:

| Field | Value |
|---|---|
| **Source branch** | `releases/vNEW_VERSION` |
| **Tag** | Create new tag `vNEW_VERSION` (e.g. `v5.4.1`) targeting the release branch |
| **Title** | `vNEW_VERSION - Maintenance Updates` (adjust noun if a feature was added, e.g. "Feature Updates") |
| **Body** | Auto-generate or manually write a summary of commits since the previous release tag |
| **Save as** | **Draft** |

To get the commit range for the release body:

```bash
# List commits from the previous release tag to HEAD
git log vPREVIOUS_TAG..HEAD --oneline --no-merges
```

Group the summary by type (features, fixes, dependency bumps, maintenance) for readability.

---

## Step 8 — Notify the Maintainer

Inform the maintainer that the draft release `vNEW_VERSION` is ready for review at:

```
https://github.com/LanceMcCarthy/akeyless-action/releases
```

The maintainer should review the draft release body and publish when ready.
