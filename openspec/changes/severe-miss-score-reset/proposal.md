# Proposal: reset headline smoothing on severe miss

## Why

Stable Match already clears immediately when aggregate, framing, or scale quality becomes severe, but the headline percentage still uses the previous EMA history. After a strong match, a subject can move far away and the UI can briefly show a misleadingly high percentage next to an `ADJUST` state.

That conflicts with the product doctrine that the camera should give trustworthy, glanceable guidance.

## What changes

- Keep EMA smoothing for ordinary adjacent-sample jitter.
- When a sample qualifies as a severe match miss, bypass prior EMA history and set the headline score to the current raw aggregate score.
- Keep existing severe-miss thresholds and stable-state exit semantics unchanged.

## Scope

Affected capability: `live-coach`.

No camera sampling cadence, matching weights, component thresholds, Auto Capture eligibility, or display-mode behavior changes.