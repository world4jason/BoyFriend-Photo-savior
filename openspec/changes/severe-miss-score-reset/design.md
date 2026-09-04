# Design

## Current behavior

`advanceMatchStability()` computes an EMA headline score for every valid sample. A severe miss correctly clears `stableMatched` immediately, but the displayed `smoothedScore` can still be dominated by earlier high scores.

Example with `SCORE_ALPHA = 0.45`:

```text
previous headline: 94
current severe raw score: 35
normal EMA result: ~67
```

The stable state is already false, but a 67% headline overstates the current composition quality.

## Decision

Reuse the existing `isSevereMatchMiss()` predicate as the discontinuity detector.

```text
if severe miss:
    smoothedScore = raw score
else if first sample:
    smoothedScore = raw score
else:
    smoothedScore = EMA(previous, raw)
```

This keeps smoothing where it is useful—small sampled-analysis noise—while preventing a deliberately severe state transition from being visually hidden by history.

## Invariants

- Severe-miss thresholds remain unchanged.
- Stable-entry/exit streak counts remain unchanged.
- Raw component scores remain unchanged.
- Auto Capture continues to gate only on stable-entry transitions.
- Display mode remains irrelevant to match truth.

## Risk

Low. The change is isolated to the pure temporal state machine and only changes the headline aggregate value for samples that already meet the existing severe-miss condition.