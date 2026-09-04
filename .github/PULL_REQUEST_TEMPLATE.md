## Why

<!-- What user problem or product risk does this PR address? -->

## OpenSpec

<!-- Link/name the affected current capabilities and change folder. For behavior-preserving refactors, say explicitly that current specs are unchanged. -->

- Current capabilities:
- Change: `openspec/changes/...` / N/A because:

## What changed

<!-- Keep this focused. -->

## Spec / product check

- [ ] Implementation matches the affected `openspec/specs/` requirements/scenarios.
- [ ] If observable behavior changed, an OpenSpec change/delta describes it.
- [ ] This still follows `reference/template -> shared geometry -> display mode -> camera`.
- [ ] Mode and Template are not being conflated.
- [ ] Product-facing mode names are Outline / Skeleton / Ghost / Guide; benchmark brands remain secondary provenance labels.
- [ ] Outline remains the default uploaded-portrait mode; Skeleton appears only when explicitly selected.
- [ ] Skeleton/landmarks are photographer guidance, not raw CV/debug-data dumps.
- [ ] Guide mode uses shot-specific semantic guidance rather than blindly adding a generic grid.
- [ ] Live Coach remains assistance, not a fifth mode.
- [ ] The camera gives one primary actionable instruction at a time.
- [ ] Capability wording is accurate (`sampled`, `approximate`, `POC`, etc.).

## Technical review

- [ ] Display-mode switching changes presentation without corrupting shared target geometry.
- [ ] Template geometry remains usable in every mode the UI allows for that kind.
- [ ] Camera/input, analysis, domain, rendering, and matching boundaries remain clear.
- [ ] Async/race behavior reviewed.
- [ ] Image/memory/cache/resource lifetime reviewed.
- [ ] Web / iOS / Android behavior considered.
- [ ] Failure/fallback behavior considered.
- [ ] Privacy/network implications considered.

## Validation

<!-- Record only what actually ran. Do not mark checks blocked by Actions billing/runner availability. -->

- [ ] `openspec validate --specs`
- [ ] `npm run typecheck`
- [ ] `npm run test:matching`
- [ ] `npm run export:web`
- [ ] Web manual smoke test
- [ ] iOS physical-device smoke test
- [ ] Android physical-device smoke test

## Review findings

<!-- Summarize P0/P1/P2/P3 findings and resolutions before merge. No unresolved P0/P1. -->

## Known limitations / follow-ups

<!-- What remains intentionally out of scope? -->
