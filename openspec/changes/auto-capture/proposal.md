# Proposal: auto-capture

## Why

Stable Match now provides a temporal gate that distinguishes a real held composition from one lucky sampled frame. The next useful shooting aid is optional Auto Capture so a solo traveler or helper can focus on alignment without timing the shutter manually.

## Affected capability

- `live-coach`

## Proposed behavior

- Auto Capture is **off by default**.
- The photographer can toggle Auto Capture while using portrait Live Coach.
- Auto Capture fires only when temporal state transitions from non-stable to stable.
- Remaining stable does not trigger more photos.
- Losing stability and later reaching a new stable period may trigger one new capture.
- Manual shutter remains available regardless of Auto Capture state.
- Auto Capture must never fire while Live Coach is disabled, while another camera capture is active, or after leaving the camera screen.

## Platform impact

The stable-entry gate is shared TypeScript. Actual capture continues through the existing Expo Camera adapter on Web, iOS, and Android.