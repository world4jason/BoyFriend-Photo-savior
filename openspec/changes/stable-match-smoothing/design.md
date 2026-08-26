# Design: stable-match-smoothing

## Boundary

Raw photography matching remains in `src/matching/guideMatch.ts`. Temporal stability is a separate pure layer in `src/matching/stableMatch.ts`.

```text
raw sampled GuideSpec
        ↓
scorePortraitMatch
        ↓
MatchFeedback (single sample)
        ↓
advanceMatchStability
        ↓
MatchStabilityState
        ↓
camera UI / future auto-capture gate
```

## State

`MatchStabilityState` contains:

- `sampleCount`
- `smoothedScore`
- `matchedStreak`
- `missStreak`
- `stableMatched`

The state contains no camera or MediaPipe objects.

## Score smoothing

Use an exponential moving average (EMA):

- first sample: `smoothedScore = raw score`
- later samples: `smoothed = previous * 0.55 + raw * 0.45`

The raw component scores remain available in `MatchFeedback`; only the headline aggregate score is smoothed.

## Stable entry

A stable match requires **3 consecutive** samples whose raw `MatchFeedback.status === 'matched'`.

Before the third sample, the UI may show a hold/progress state but must not expose the final stable green state.

## Stable exit hysteresis

After entering stable match, one isolated non-matched sample does not immediately clear it. The state exits after **2 consecutive** non-matched samples.

This protects against a single segmentation or face-landmark wobble while still reacting to a real subject movement within two sampled updates.

## Reset lifecycle

Stability resets when:

- camera session opens or closes
- Live Coach is disabled/re-enabled
- target guide changes materially

Display-mode changes do not reset stability because they do not change target geometry.

## Future Auto Capture

Auto Capture must depend on `stableMatched`, never on a single raw `MatchFeedback.status`.
