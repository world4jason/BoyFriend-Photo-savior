## Why

<!-- What user problem or product risk does this PR address? -->

## What changed

<!-- Keep this focused. -->

## Product doctrine check

- [ ] This still follows `reference/template -> shared geometry -> display mode -> camera`.
- [ ] Mode and Template are not being conflated.
- [ ] Product-facing mode names are Outline / Skeleton / Ghost / Guide; benchmark brands remain secondary research labels.
- [ ] Outline remains the default uploaded-portrait mode; Skeleton appears only when explicitly selected.
- [ ] Skeleton/landmarks are photographer guidance, not raw CV/debug-data dumps.
- [ ] Guide mode uses shot-specific semantic guidance rather than blindly adding a generic grid.
- [ ] The camera gives one primary actionable instruction at a time.
- [ ] Capability wording is accurate (for example `sampled`, not falsely `real-time`).

## Technical review

- [ ] Display-mode switching changes presentation without corrupting shared target geometry.
- [ ] Template geometry remains usable in every mode the UI allows for that kind.
- [ ] Async/race behavior reviewed.
- [ ] Image/memory/cache lifetime reviewed.
- [ ] Web / iOS / Android behavior considered.
- [ ] Failure/fallback behavior considered.
- [ ] Privacy/network implications considered.

## Validation

<!-- Record what actually ran. Do not mark checks that were blocked by Actions billing/runner availability. -->

- [ ] `npm run typecheck`
- [ ] `npm run export:web`
- [ ] Web manual smoke test
- [ ] iOS physical-device smoke test
- [ ] Android physical-device smoke test

## Review findings

<!-- Summarize P0/P1/P2/P3 findings and resolutions before merge. -->

## Known limitations / follow-ups

<!-- What remains intentionally out of scope? -->
