# Product Doctrine

This document is the product contract for **BoyFriend Photo Savior**. New features should make the shooting moment simpler. If a feature makes the photographer study the screen instead of taking the photo, it is probably moving the product in the wrong direction.

## Product sentence

> Turn a reference photo into a minimal, actionable shooting guide so a non-photographer can reproduce the important composition without memorizing it.

The primary flow is always:

```text
reference photo
    -> understand composition
    -> abstract guide
    -> live camera
    -> one useful correction at a time
    -> photo
```

## Non-negotiable principles

### 1. Reference-to-guide, not reference overlay

The default shooting experience must not be a semi-transparent copy of the source photo. The product should extract only information needed to reproduce the composition.

For a portrait this usually means:

- subject position and size
- body envelope / outside contour
- head position
- face direction
- important hand / leg placement
- crop and look space
- relationships between multiple people

For food or objects this usually means:

- number of objects
- relative size
- center / bounding zone
- foreground/background ordering
- spacing
- angle or rotation when compositionally meaningful

A raw-photo ghost overlay can exist as a debug or optional reference aid, but it is not the core product.

### 2. Humans step into an outline

The photographer-facing human guide is a clean outside contour. Pose landmarks, face landmarks and segmentation masks are implementation details.

Do not expose:

- stick-figure skeletons as the normal shooting guide
- 33-point pose landmarks
- face meshes
- dense CV debug information

Small semantic cues are allowed when useful, such as a face-direction arrow.

### 3. Composition matters more than exact pose equality

The app is a photography assistant, not an exercise-form checker.

Matching priority is roughly:

1. subject position
2. subject scale / crop
3. overall body shape
4. face direction
5. smaller limb differences

Do not punish harmless anatomical differences if the resulting photograph has the same visual composition.

### 4. One instruction at a time

Live coaching should answer one question:

> What is the single most useful thing to change right now?

Good examples:

- `Subject → left`
- `Move closer`
- `Face → right`
- `Raise left wrist`
- `✓ Match`

Avoid simultaneously showing a checklist of corrections. Component scores can exist as secondary/debug information, but the primary UI is one action.

### 5. The guide must be glanceable

The photographer should understand the viewfinder without reading instructions for several seconds.

Prefer:

- contour
- zones
- arrows
- very short labels
- clear matched/not-matched state

Avoid permanent explanatory paragraphs in the camera view.

### 6. Never pretend a capability is more real-time or accurate than it is

The current Expo Camera MVP uses sampled still frames, so the UI calls it **Sampled Live Coach**. Do not describe it as 30 FPS tracking.

Likewise:

- approximate face yaw is not a calibrated physical angle
- heuristic food zones are not object segmentation
- one-person segmentation is not multi-person instance tracking

Product copy should describe the actual behavior.

### 7. Cross-platform is a product requirement

Web, iOS and Android are first-class targets. Shared product behavior matters more than forcing every implementation detail to be identical.

During MVP development, a shared Expo/React Native implementation is preferred. Native adapters are acceptable when they materially improve camera latency, stability or device integration.

The domain model and matching logic should remain portable even if the camera or ML runtime becomes platform-specific.

### 8. Local-first image processing

Reference and camera images should stay on-device whenever practical.

Cloud/VLM processing may later be used for higher-level composition semantics, but it must be an explicit architectural/product decision rather than an accidental requirement of basic shooting.

### 9. Fail soft

If one ML subsystem fails, preserve whatever useful guide is still available.

Examples:

- segmentation works, pose fails -> use the contour
- pose works, face fails -> keep portrait guide without face direction
- automatic extraction fails -> show editable fallback instead of blocking the camera

### 10. Validate the shooting UX before optimizing the model

A more accurate model does not matter if the guide is visually noisy or awkward in a real camera view.

When prioritizing work, prefer:

1. real-world shooting usability
2. stability and latency
3. composition guidance quality
4. model sophistication

## MVP scope

### Portrait MVP

- one primary person
- reference image -> segmentation contour
- hidden pose/face geometry
- editable target position / scale
- camera guide
- sampled alignment coaching

### Food/object MVP

- one to three prominent objects
- composition templates/zones
- relative placement and size

### Explicitly later

- multi-person instance segmentation
- arbitrary object segmentation from uploaded food photos
- continuous high-FPS native frame processing
- stable auto-capture
- cloud/VLM semantic composition analysis
- community/template marketplace

## Success criteria for a feature

A feature is valuable when it measurably helps a user get closer to the intended photo with less communication or trial-and-error.

Before shipping, ask:

1. Does it help during the shooting moment?
2. Is the instruction visually simpler than the original reference?
3. Can a non-photographer understand it quickly?
4. Does it preserve the intended composition rather than merely matching pixels?
5. Does failure leave the camera usable?
6. Does it work, or degrade clearly, on Web/iOS/Android?

If the answer to several of these is no, the feature should be redesigned before merging.
