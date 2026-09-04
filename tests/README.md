# Domain regression tests

## Matching

Run:

```bash
npm run test:matching
```

The script uses the project's existing TypeScript compiler to compile a small pure-domain subset into `.test-dist/`, then executes it with Node. No additional test framework is required.

### Stable Match coverage

- two consecutive raw matches are required to enter stable;
- stable-entry fires once per stable period (the Auto Capture gate);
- one minor miss is tolerated and two clear stable;
- a severe miss clears stable immediately;
- a severe miss snaps the headline score to the raw score instead of retaining stale EMA history;
- non-severe adjacent score jitter still uses EMA smoothing;
- framing/scale severe thresholds can independently trigger a severe miss.

### Guide Match coverage

- a visually aligned 3:4 portrait target aspect-fitted into a 9:16 camera still scores as aligned;
- horizontal displacement produces the correct opposite-direction correction;
- a pose-intent target cannot silently fall back to framing-only matching when live pose anchors disappear;
- meaningful left/right face direction gates the matched state;
- duo/group targets remain manual-guide-only;
- a clearly undersized subject is told to move closer before lower-priority pose corrections.

### Pose Coverage coverage

- a full-body target with eight optional joint anchors rejects a live pose that covers only two of those anchors;
- the same eight-anchor target can use pose scoring when five matching optional anchors are visible;
- a small two-anchor target requires both optional anchors rather than allowing one anchor plus shoulders to satisfy pose intent.

## Reference analysis

Run:

```bash
npm run test:analysis
```

Coverage currently includes:

- dedicated Face Landmarker direction overrides conflicting low-confidence pose fallback points;
- low-confidence pose face landmarks cannot invent a precise left/right direction;
- trusted pose face landmarks can provide a fallback direction when dedicated face analysis is unavailable;
- raw MediaPipe NaN/Infinity coordinates are dropped **before** finite values are clamped into `0..1`;
- present non-finite visibility/presence values reject the raw landmark;
- finite presence is used when visibility is absent;
- missing confidence remains eligible for finite geometry;
- the guide builder repeats finite/confidence filtering as defense-in-depth;
- portrait crop classification prefers trusted ankle/knee/hip anatomy before image-edge heuristics;
- when only trusted shoulders remain, shoulder-to-silhouette extent distinguishes tight `headshot` from longer `half` crop;
- the exact 38% shoulder-extent boundary is deterministic despite floating-point rounding;
- a shoulder outside the segmented subject's vertical bounds is ignored for crop classification and falls back safely;
- a waist-up subject touching the reference bottom remains `half` and keeps the estimated 2× lens hint;
- a tight head/shoulders reference with shoulders near the segmented bottom remains `headshot` and keeps the estimated 3× lens hint;
- nose-only or isolated arm evidence does not force a crop label;
- segmentation-only references retain the previous bottom-position fallback when trusted crop anatomy is unavailable.

These suites are intentionally narrower than full application validation. They do not replace `npm run typecheck`, `npm run export:web`, or physical-device camera smoke tests.
