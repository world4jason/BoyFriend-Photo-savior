# Design

## Decision

GitHub-hosted Actions are disabled for this repository until the runner/billing problem is intentionally revisited.

The repository SHALL NOT keep an active `.github/workflows/*` validation workflow that produces misleading red checks without actually validating the application.

## Validation while GHA is disabled

For behavior changes:

1. OpenSpec proposal/delta/design/tasks when required.
2. Focused branch and PR.
3. Complete-diff review with no unresolved P0/P1.
4. Local checks when a runnable environment exists:
   - `npm run spec:validate`
   - `npm run typecheck`
   - `npm run export:web`
5. EAS Hosting / deployed Web smoke for Web behavior.
6. Physical-device smoke for camera/native behavior.

## Reporting rule

A check is only reported as passed if it actually executed. Missing local runtime or disabled GHA must be recorded as `not run`, not inferred as success.

## Reintroduction

GitHub Actions may be reintroduced later only through a new reviewed change after the account/runner issue is confirmed resolved. Until then, GHA is deliberately absent rather than treated as an optional-but-broken gate.
