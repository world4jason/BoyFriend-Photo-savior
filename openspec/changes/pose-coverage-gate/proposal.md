# Proposal: require sufficient live pose coverage

## Why

Live Coach currently treats a pose comparison as usable once four common points exist. Because shoulders are always part of the comparison, a full-body target with many intended joints can still receive a pose score when the live analyzer exposes only shoulders plus two optional joints.

That is enough for local shape math but not enough to verify the photographer recreated a full-body pose. In the worst case, framing and the few visible joints can allow `matched` / Stable Match / Auto Capture while important target limbs are not actually verified.

There is a second trust problem: when required pose evidence is unavailable, the aggregate score currently drops the pose weight and renormalizes only the available framing/scale components. Perfect framing can therefore display a misleading `100% · CLOSE` beside `Show the full pose`.

## What changes

- Treat target optional joints as explicit pose intent.
- Require the live sample to cover a minimum proportion of the target's intended optional joints before pose matching can satisfy the matched-state gate.
- Keep the current geometric pose score, framing/scale weights, face behavior, and coaching priority unchanged once coverage is sufficient.
- When coverage is insufficient, return no usable `poseScore` so the existing `Show the full pose` guidance path remains the photographer-facing fallback.
- When pose is required but not yet usable, retain the existing 0.23 pose weight in the aggregate with an unsatisfied value of 0 instead of renormalizing framing/scale into an artificially high headline score.

## Proposed coverage rule

For a pose-required target (`>= 2` optional joint anchors), the live sample must contain at least:

```text
min(targetAnchorCount, max(2, ceil(targetAnchorCount * 0.60)))
```

matching optional joint anchors.

Examples:

- target 2 anchors -> require 2
- target 4 anchors -> require 3
- target 6 anchors -> require 4
- target 8 anchors -> require 5
- target 10 anchors -> require 6

This is intentionally tolerant of occasional landmark dropout while preventing a tiny partial pose from validating a full-body target.

## Scope

Affected capability: `live-coach`.

No sampling cadence, stable-match streaks, Auto Capture transition rules, display modes, or MediaPipe models change.