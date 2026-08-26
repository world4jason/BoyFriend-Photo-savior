# Design: reliability-audit

## 1. Matching coordinate contract

`GuideOverlay` aspect-fits `GuideSpec.aspectRatio` into the actual camera container. `scorePortraitMatch` must compare target geometry after applying the equivalent transform into live-camera normalized coordinates.

```text
reference-normalized target
        ↓ guide transform
        ↓ aspect-fit to camera aspect
camera-normalized target
        ↔
live camera-normalized subject
```

The renderer and matcher must never maintain different interpretations of where the target is.

## 2. Eligibility boundary

The current MediaPipe live analyzer extracts one pose/person. Therefore:

```text
one-person portrait -> Live Coach + optional Auto Capture
multi-person portrait -> manual overlay only
food / scene -> manual Guide mode
```

The matcher also hard-rejects multi-person targets so a future UI regression cannot accidentally expose a false matched state.

## 3. Required pose signal

A target with multiple explicit joint anchors expresses pose intent. Such a target must not silently degrade to framing-only matching when the live Pose Landmarker fails to expose enough corresponding joints.

Framing-only matching remains acceptable only for targets that do not encode meaningful pose anchors.

## 4. Camera viewport and readiness

The camera is nested inside a SafeAreaView. Use `cameraWrap.onLayout` as the authoritative renderer viewport instead of full-window dimensions.

Photo capture rules:

- wait for `onCameraReady`
- on `onMountError`, invalidate live session and disable capture
- manual/auto paths must not capture while mount error is active
- set `animateShutter={false}` because low-quality analysis stills are intentionally invisible to the photographer

## 5. Failure behavior

All reliability guards fail safe:

- unsupported target -> manual overlay, never false green
- missing required pose -> ask user to show pose, never false green
- camera not ready/mount failed -> no capture
- old behavior remains available through manual shutter where camera is valid
