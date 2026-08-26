# Development Workflow

The repository uses a **branch -> pull request -> self-review -> merge** workflow for non-trivial changes.

GitHub Actions is useful when available, but hosted-runner billing/availability is currently **not a merge gate**. A failed workflow with no executed steps is treated as infrastructure noise, not as an application test failure.

## Branch policy

Do not develop non-trivial features directly on `main`.

Use a focused branch, for example:

```text
feat/live-contour-matching
fix/reference-analysis-memory
chore/product-doctrine
```

A direct `main` edit should be limited to a trivial emergency correction when explicitly justified.

## Pull request policy

Keep PRs small and single-purpose. GitHub recommends focused PRs because they are easier to understand and review.

Every PR should state:

- problem / user need
- approach
- important implementation choices
- known limitations
- manual validation performed
- files or areas that deserve extra review attention

## Required self-review

Before merging, perform a deliberate review of the PR diff. GitHub does not allow a pull request author to formally approve their own PR, so when the same GitHub identity authored the branch, record the review as a PR **COMMENT** and checklist rather than an `APPROVE` event.

A self-review is still a real review. Do not merge immediately after writing the code.

### Review checklist

#### Product

- Does the change follow `docs/PRODUCT.md`?
- Does it simplify the shooting moment rather than add visual noise?
- Is capability labeling accurate (`sampled`, `approximate`, etc.)?

#### Correctness

- Are async operations cancellable or safe when screens change?
- Can stale analysis results overwrite a newer request?
- Are missing detections and partial ML failures handled?
- Are coordinate systems/aspect ratios consistent?

#### Mobile/runtime safety

- Are large images resized before crossing the DOM/native bridge?
- Are temporary camera/cache files cleaned up?
- Is repeated work bounded so memory does not grow over time?
- Are camera methods called only after `onCameraReady`?

#### Cross-platform

- Web behavior considered?
- iOS behavior considered?
- Android behavior considered?
- Is a platform-specific assumption documented or guarded?

#### Privacy

- Does image data stay local unless the feature explicitly requires cloud processing?
- Are new external network dependencies documented?

#### UX

- Is the primary camera instruction one action at a time?
- Is there a usable fallback when analysis fails?
- Is the guide still understandable without debug scores?

#### Validation

When Actions is unavailable, record what was actually verified. Do not claim tests passed if they were not executed.

Preferred checks when a local runtime is available:

```bash
npm install
npm run typecheck
npm run export:web
```

Camera behavior should also be checked on a physical iOS or Android device before calling a camera feature stable.

## Severity

Use these review severities:

- **P0** — data/security/privacy issue, severe crash, destructive behavior. Never merge.
- **P1** — core flow broken, memory/storage leak, major race, wrong user guidance. Fix before merge.
- **P2** — degraded edge case, maintainability risk, confusing UX. Prefer fix before merge; otherwise track explicitly.
- **P3** — polish, naming, non-blocking cleanup.

No PR merges with unresolved P0/P1 findings.

## Merge strategy

Prefer **squash merge** for focused feature/fix PRs so `main` stays readable.

Before merging:

1. Review the complete diff, not just the latest commit.
2. Confirm all P0/P1 findings are resolved.
3. Confirm the PR still matches the product doctrine.
4. Add a self-review comment summarizing findings and residual risk.
5. Merge only then.

## Architecture guardrails

Keep these boundaries intact where possible:

```text
Camera / input adapters
        |
        v
Analysis adapters (MediaPipe / future native or VLM)
        |
        v
GuideSpec domain model
        |
        +--> Guide renderer
        |
        +--> Match engine
        |
        v
Camera coaching UI
```

Do not bury matching rules inside camera components. Do not make the Guide renderer depend directly on MediaPipe types. This allows the current sampled Expo camera implementation to be replaced later without rewriting product logic.
