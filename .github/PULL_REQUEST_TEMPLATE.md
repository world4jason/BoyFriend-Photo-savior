## Why

<!-- What user problem or product risk does this PR address? -->

## What changed

<!-- Keep this focused. -->

## Product doctrine check

- [ ] This still follows `reference -> abstract guide -> camera`.
- [ ] Human shooting UI remains contour/semantic-guide first, not skeleton/debug-data first.
- [ ] The camera gives one primary actionable instruction at a time.
- [ ] Capability wording is accurate (for example `sampled`, not falsely `real-time`).

## Technical review

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
