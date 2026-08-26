# Design: auto-capture

## Trigger boundary

Auto Capture consumes temporal match state; it does not add another matching algorithm.

```text
sampled frame
   ↓
scorePortraitMatch
   ↓
advanceMatchStability(previous, feedback)
   ↓
didEnterStableMatch(previous, next)
   ↓
Auto Capture enabled?
   ├─ no  → no capture
   └─ yes → capture one photo
```

## State

Add UI/session state:

- `autoCaptureEnabled: boolean`, default `false`

No extra arming counter is required because `didEnterStableMatch(previous, next)` is true only on the transition into stable state. Stable state must be lost before another stable-entry transition can occur.

## Capture concurrency

The sampled Live Coach already holds `liveBusyRef` while one sampled frame is being analyzed. When stable entry occurs inside `onLiveResult`, Auto Capture SHALL await the high-quality `takePictureAsync()` before releasing `liveBusyRef` in the existing `finally` block.

This prevents the periodic sampler from starting another camera capture while the Auto Capture photo is in flight.

Manual capture remains separate. It may cancel the current sampled analysis request before using the camera.

## Failure behavior

If Auto Capture fails:

- keep Live Coach enabled
- do not fabricate a captured thumbnail
- show a lightweight live error telling the user to use the shutter
- do not loop/retry repeatedly during the same stable period

The stable-entry transition has already been consumed. Another Auto Capture attempt requires losing stable state and entering it again.

## UI

Portrait camera shows a compact toggle:

- `AUTO OFF` by default
- `AUTO ON` when enabled

This toggle is independent from the existing Live Coach on/off control. Turning Live Coach off prevents Auto Capture from triggering because no stable-match state is being produced.

## Scope

Auto Capture is portrait-only in this MVP. Food/scene Guide mode keeps manual shutter behavior.
