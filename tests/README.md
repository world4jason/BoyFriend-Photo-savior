# Matching regression tests

Run:

```bash
npm run test:matching
```

The script uses the project's existing TypeScript compiler to compile a small pure-domain subset into `.test-dist/`, then executes it with Node. No additional test framework is required.

## Stable Match coverage

- two consecutive raw matches are required to enter stable;
- stable-entry fires once per stable period (the Auto Capture gate);
- one minor miss is tolerated and two clear stable;
- a severe miss clears stable immediately;
- a severe miss snaps the headline score to the raw score instead of retaining stale EMA history;
- non-severe adjacent score jitter still uses EMA smoothing;
- framing/scale severe thresholds can independently trigger a severe miss.

## Guide Match coverage

- a visually aligned 3:4 portrait target aspect-fitted into a 9:16 camera still scores as aligned;
- horizontal displacement produces the correct opposite-direction correction;
- a pose-intent target cannot silently fall back to framing-only matching when live pose anchors disappear;
- meaningful left/right face direction gates the matched state;
- duo/group targets remain manual-guide-only;
- a clearly undersized subject is told to move closer before lower-priority pose corrections.

## Pose Coverage coverage

- a full-body target with eight optional joint anchors rejects a live pose that covers only two of those anchors;
- the same eight-anchor target can use pose scoring when five matching optional anchors are visible;
- a small two-anchor target requires both optional anchors rather than allowing one anchor plus shoulders to satisfy pose intent.

This suite is intentionally narrower than full application validation. It does not replace `npm run typecheck`, `npm run export:web`, or physical-device camera smoke tests.
