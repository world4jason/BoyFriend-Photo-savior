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

A stable match requires **2 consecutive** samples whose raw `MatchFeedback.status === 'matched'`.

With the current sampled cadence, this avoids making the photographer hold a pose for roughly four seconds before seeing a stable state.

Before the second matched sample, the UI should show a hold/progress state rather than the final stable green state.

## Stable exit hysteresis

After entering stable match, a **minor** one-sample miss does not immediately clear it. Two consecutive minor misses clear stable state.

A **severe** miss clears stable state immediately. For the MVP, a severe miss means one of:

- aggregate score `< 55`
- framing score `< 40`
- scale score `< 40`

This is intentionally about the subject materially leaving the target framing/scale, not a small wrist/face-estimation wobble.

## Reset lifecycle

Stability resets when:

- camera session opens or closes
- Live Coach is disabled/re-enabled
- target guide changes materially
- live analysis fails to find a usable subject strongly enough that the camera can no longer trust the old stable state

Display-mode changes do not reset stability because they do not change target geometry.

## Future Auto Capture

Auto Capture must never depend on a single raw sample. It should fire only on the **transition into** stable match (`didEnterStableMatch`), not on every later sample while stable state remains true. This prevents repeated captures during one held pose.
