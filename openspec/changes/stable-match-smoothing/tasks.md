# Tasks

- [x] Define temporal stability behavior in OpenSpec delta.
- [x] Add pure `MatchStabilityState` state machine.
- [x] Smooth headline score with EMA.
- [x] Require 2 consecutive raw matches to enter stable match.
- [x] Require 2 consecutive minor misses to exit stable match.
- [x] Clear stable state immediately on severe aggregate/framing/scale miss.
- [x] Add stable-entry transition helper for future Auto Capture.
- [x] Reset stability at camera/Live Coach lifecycle boundaries.
- [x] Preserve stability across display-mode-only changes.
- [x] Update camera UI to distinguish raw hold progress from stable match.
- [x] Update current `live-coach` spec after implementation review.
- [x] Clear stale `liveFeedback` on camera-sample capture failure paths.
- [ ] Run `npm run spec:validate` when a runnable environment is available.
- [ ] Run `npm run typecheck` when a runnable environment is available.
- [ ] Run `npm run export:web` when a runnable environment is available.
- [x] Review complete PR diff and resolve P0/P1 before merge.
