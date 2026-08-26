# Proposal: stable-match-smoothing

## Why

Sampled Live Coach currently treats each analyzed still as an independent truth. With a roughly 1.7-second sampling cadence, small segmentation/pose differences can make the visible score and `MATCHED` state jump between samples even when the photographer and subject are holding still.

Before Auto Capture can be safe, the camera needs a stable temporal gate rather than a single-frame match decision.

## Affected capability

- `live-coach`

## Proposed behavior

- Smooth the displayed aggregate score across recent samples.
- Require three consecutive raw `matched` samples before exposing a stable green match state.
- Once stable, require two consecutive non-matched samples before clearing the stable state.
- Keep raw per-sample matching geometry and hint priority unchanged.
- Expose stability as pure matching-domain state so a later Auto Capture feature can depend on it without coupling to `CameraView`.

## Platform impact

The state machine is shared TypeScript and has equivalent behavior on Web, iOS, and Android. It does not change camera permissions, MediaPipe models, network behavior, or sampled capture cadence.
