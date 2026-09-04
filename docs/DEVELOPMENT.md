# Development Workflow

The repository uses **OpenSpec + branch + PR + deliberate review** for non-trivial behavior changes.

## GitHub Actions status

GitHub Actions is intentionally **disabled** for this repository while the hosted-runner/billing issue remains unresolved. There should be no active `.github/workflows/*` validation workflow during this period.

Do not use missing GitHub checks as evidence that a PR passed or failed. Validation must record only work that actually executed.

Current validation paths are:

```text
OpenSpec review
  -> focused branch + PR
  -> complete-diff review
  -> resolve P0/P1
  -> local spec/type/Web checks when a runnable environment exists
  -> EAS Hosting / deployed-Web smoke when relevant
  -> physical-device smoke for camera/native changes
```

Reintroducing GitHub Actions requires a separate reviewed change after the runner/account issue is confirmed resolved.

## Source-of-truth hierarchy

Use the right document for the right question:

```text
openspec/specs/       observable current behavior / capability contracts
docs/ARCHITECTURE.md  dependency boundaries and implementation shape
docs/PRODUCT.md       product doctrine and UX intent
docs/BENCHMARKS.md    benchmark research/provenance
openspec/changes/     proposed behavior changes and their implementation plan
```

Do not use README or old PR descriptions as the authoritative behavior contract when an OpenSpec capability covers the same topic.

## Normal workflow

For a non-trivial feature or behavior change:

```text
branch
  -> inspect current OpenSpec capabilities
  -> OpenSpec proposal + delta specs + design + tasks
  -> review/adjust the plan
  -> implementation
  -> PR
  -> complete-diff review
  -> resolve P0/P1 findings
  -> verify specs still match implementation
  -> squash merge
  -> archive/sync the OpenSpec change
```

OpenSpec's default spec-driven workflow is `proposal -> specs -> design -> tasks -> apply -> archive`.

### Initial brownfield baseline

`openspec/specs/` was initially backfilled from the already-working MVP during the architecture audit. That bootstrap is current truth, not fabricated historical change data. Future behavior changes should use `openspec/changes/<change-name>/`.

## When an OpenSpec change is required

Create/update an OpenSpec change before implementation when work changes observable behavior or an important cross-layer contract, for example:

- adding/removing/changing a Display Mode
- changing Template semantics or supported target kinds
- changing reference-analysis output/fallback behavior
- changing matching thresholds, weighting, status semantics, or coaching priority
- changing privacy/network behavior
- replacing sampled camera analysis with a frame processor
- adding arbitrary multi-person/object analysis
- changing cross-platform behavior or persisted data formats

A pure code cleanup may skip delta specs when behavior intentionally stays identical, but the PR must say so and still respect current specs.

Repository-process changes may use an OpenSpec change folder without a capability delta when observable product behavior is unchanged.

## OpenSpec quick start

OpenSpec currently requires Node.js 20.19+; this project already targets Node 22.13+.

```bash
npm install -g @fission-ai/openspec@latest
openspec list --specs
openspec validate --specs
openspec new change <change-name>
```

For the default spec-driven workflow, a behavior change should normally contain:

```text
openspec/changes/<change-name>/
├── proposal.md
├── specs/<affected-capability>/spec.md
├── design.md
└── tasks.md
```

Delta specs describe only what changes; archiving folds them into `openspec/specs/`.

## Branch policy

Do not develop non-trivial work directly on `main`.

Use a focused branch, for example:

```text
feat/live-frame-processing
fix/reference-analysis-memory
chore/disable-broken-github-actions
```

A direct `main` edit should be limited to a trivial emergency correction when explicitly justified.

## Pull request policy

Keep PRs focused enough to review as one decision. Every PR should state:

- user/product problem or technical risk
- affected OpenSpec capabilities/change folder, or why behavior specs are unchanged
- approach and important implementation choices
- known limitations/residual risk
- actual validation performed
- files/areas deserving extra review attention

## Required self-review

Before merging, review the **complete PR diff**, not only the latest commit. GitHub does not allow a PR author to formally approve their own PR, so same-identity self-review is recorded as a PR **COMMENT** with findings and residual risk.

Do not merge immediately after writing the code.

### Review checklist

#### Spec / product

- Does implementation satisfy the affected `openspec/specs/` requirements and scenarios?
- If behavior changed, is there an appropriate OpenSpec change/delta?
- Are Mode and Template still separate concepts?
- Are product-facing mode names still Outline / Skeleton / Ghost / Guide?
- Does the camera remain glanceable and give one primary action at a time?
- Is capability labeling accurate (`sampled`, `approximate`, POC, etc.)?

#### Architecture

- Is shared `GuideSpec` geometry still the single target truth?
- Does Display Mode affect rendering rather than create separate target geometry?
- Are camera/input, analysis, domain, rendering, and matching boundaries preserved?
- Is benchmark provenance kept out of primary product taxonomy/domain state?

#### Correctness

- Are async operations cancellable or safe when screens change?
- Can stale analysis results overwrite a newer request?
- Are missing detections and partial ML failures handled?
- Are coordinate systems/aspect ratios consistent?
- Are resource lifetimes deterministic enough (masks/cache/temp files)?

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

#### Privacy/network

- Do image bytes stay local unless a feature explicitly requires cloud processing?
- Are new external runtime/model/network dependencies documented?

#### Validation

GitHub Actions is disabled. Record only checks that actually ran.

Preferred local checks when a runnable environment is available:

```bash
npm install
npm run spec:validate
npm run typecheck
npm run export:web
```

For Web behavior, a current EAS Hosting deployment can be used as a runtime smoke test. Camera behavior should also be checked on a physical iOS or Android device before calling camera changes stable.

If none of these executed, write `not run` in the PR review rather than inferring success.

## Severity

- **P0** — data/security/privacy issue, severe crash, destructive behavior. Never merge.
- **P1** — core flow broken, resource leak, major race, wrong user guidance, contradictory product/domain contract. Fix before merge.
- **P2** — degraded edge case, maintainability/performance risk, confusing UX. Prefer fix; otherwise track explicitly.
- **P3** — polish, naming, non-blocking cleanup.

No PR merges with unresolved P0/P1 findings.

## Merge strategy

Prefer **squash merge** for focused feature/fix PRs.

Before merging:

1. Review the complete diff.
2. Confirm all P0/P1 findings are resolved.
3. Confirm current specs/product doctrine and implementation agree.
4. Add a self-review comment summarizing findings, validation, and residual risks.
5. Merge only then.
6. For a completed behavior change, archive/sync its OpenSpec change so `openspec/specs/` remains current truth.

## Architecture guardrails

See [`ARCHITECTURE.md`](ARCHITECTURE.md) for the detailed map. The essential dependency direction is:

```text
camera/input -> analysis -> domain <- templates
                         |
                         +-> rendering
                         +-> matching
                               |
                               v
                              UI
```

Do not bury matching rules inside camera components. Do not make the renderer depend directly on MediaPipe types. This allows the current sampled Expo camera adapter to be replaced later without rewriting product semantics.
