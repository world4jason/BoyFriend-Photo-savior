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

Enabling Auto Capture resets temporal stability so the automatic shot must earn a **fresh** two-sample stable entry after the photographer opts in. Stability accumulated while Auto Capture was still off is not consumed retroactively.

Turning Live Coach off also turns Auto Capture off. Re-enabling Live Coach does not silently re-enable Auto Capture; the photographer must opt in again.

## Capture concurrency

All camera `takePictureAsync()` calls share `photoCaptureRef` as a serialization lock:

- low-quality sampled camera stills hold the lock only while the camera capture call itself is in flight
- manual high-quality capture holds the lock for the full capture call
- automatic high-quality capture holds the lock for the full capture call

The sampled Live Coach also holds `liveBusyRef` while one sampled frame is being prepared/analyzed. When stable entry occurs inside `onLiveResult`, Auto Capture awaits the high-quality `takePictureAsync()` before releasing `liveBusyRef` in the existing `finally` block. This prevents the periodic sampler from starting another camera capture while the automatic photo is in flight.

Leaving the camera SHALL NOT forcibly release an in-flight `photoCaptureRef`; the capture owner releases the lock in its own `finally` path.

Manual capture may cancel a current sampled analysis request after the low-quality camera still has already been acquired. If the camera itself is actively executing another `takePictureAsync()`, manual capture does not overlap that call.

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
- disabled while Live Coach is off

The thumbnail may label the most recent photo as `Auto captured`, but match/stability messaging SHALL be derived from current temporal state rather than the source of an older captured thumbnail.

## Scope

Auto Capture is portrait-only in this MVP. Food/scene Guide mode keeps manual shutter behavior.
