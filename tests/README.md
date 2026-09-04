# Matching regression tests

Run:

```bash
npm run test:matching
```

The script uses the project's existing TypeScript compiler to compile a small pure-domain subset into `.test-dist/`, then executes it with Node. No additional test framework is required.

Current coverage focuses on the temporal Stable Match state machine:

- two consecutive raw matches are required to enter stable;
- stable-entry fires once per stable period (the Auto Capture gate);
- one minor miss is tolerated and two clear stable;
- a severe miss clears stable immediately;
- a severe miss snaps the headline score to the raw score instead of retaining stale EMA history;
- non-severe adjacent score jitter still uses EMA smoothing;
- framing/scale severe thresholds can independently trigger a severe miss.

This suite is intentionally narrower than full application validation. It does not replace `npm run typecheck`, `npm run export:web`, or physical-device camera smoke tests.
