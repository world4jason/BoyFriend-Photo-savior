# Proposal: stable-match-smoothing

## Why

Sampled Live Coach currently treats each analyzed still as an independent truth. With a roughly 1.7-second sampling cadence, small segmentation/pose differences can make the visible score and `MATCHED` state jump between samples even when the photographer and subject are holding still.

Before Auto Capture can be safe, the camera needs a stable temporal gate rather than a single-frame match decision.

## Affected capability

- `live-coach`

## Proposed behavior

- Smooth the displayed aggregate score across recent samples.
- Require **two consecutive** raw `matched` samples before exposing a stable green match state.
- Once stable, tolerate one minor miss and clear after two consecutive minor misses.
- Clear stable state immediately when framing/scale is severely wrong.
- Keep raw per-sample matching geometry and hint priority unchanged.
- Expose stability as pure matching-domain state so a later Auto Capture feature can depend on the transition into stability without coupling to `CameraView`.

## Platform impact

The state machine is shared TypeScript and has equivalent behavior on Web, iOS, and Android. It does not change camera permissions, MediaPipe models, network behavior, or sampled capture cadence.
