# Product Doctrine

This document is the product contract for **BoyFriend Photo Savior**. New features should make the shooting moment simpler. If a feature makes the photographer study the screen instead of taking the photo, it is probably moving the product in the wrong direction.

## Product sentence

> Turn a reference photo into a minimal, actionable shooting guide so a non-photographer can reproduce the important composition without memorizing it.

The primary flow is always:

```text
reference photo
    -> understand composition once
    -> shared guide geometry
    -> choose a guide preset
    -> live camera
    -> one useful correction at a time
    -> photo
```

## The four guide presets

The benchmark product names describe **four representations of the same underlying composition geometry**, not four unrelated analysis pipelines.

| Preset | Benchmark | Photographer sees | Best for |
| --- | --- | --- | --- |
| `sovs` / Outline | SOVS / SOVS2 | clean outside contour | easiest step-in portrait framing |
| `poseoverlay` / Skeleton | PoseOverlay | body skeleton + anchors | precise pose / hands / limbs |
| `poseghost` / Ghost | PoseGhost | translucent filled silhouette | fast stencil-like alignment |
| `recompose` / Guide | reCompose | zones, grids, eye lines, labels, relationships | semantic composition; especially food/objects |

A reference should be analyzed **once**. The user can then switch renderer/preset without rerunning segmentation or pose detection.

See [`BENCHMARKS.md`](BENCHMARKS.md) for source research and template seeds.

## Non-negotiable principles

### 1. Reference-to-guide, not raw reference overlay

The default shooting experience must not be a semi-transparent copy of the source photo. The product should extract only information needed to reproduce the composition.

For a portrait this may include:

- subject position and size
- outside contour
- pose joints
- head position
- face direction
- important hand / leg placement
- crop and look space
- relationships between multiple people

For food or objects this may include:

- number of objects
- relative size
- center / bounding zone
- foreground/background ordering
- spacing
- angle or rotation when compositionally meaningful

A raw-photo ghost overlay can exist as a debug or optional reference aid, but it is not one of the four core guide presets.

### 2. Outline is the default; skeleton is explicit

For portraits, **SOVS-like Outline is the default** because it is the most glanceable for a casual photographer.

Pose landmarks and face landmarks are shared geometry. They are normally hidden, but an explicit **PoseOverlay-like Skeleton** preset is allowed and expected to render body joints/segments when the user asks for precision.

Do not expose dense CV debug information such as:

- all 33 pose points without a useful skeleton structure
- face mesh points
- raw segmentation masks
- model confidence dumps

The distinction is:

```text
useful photographer skeleton = product feature
raw landmark/debug visualization = implementation detail
```

### 3. The four presets are views, not separate truth

Do not maintain four incompatible copies of a reference pose.

The analyzer should produce a shared model containing as much as available:

```text
contour
pose joints
face direction
subject/object bounds
composition semantics
```

Renderers decide what to show:

- Outline reads contour.
- Skeleton reads joints.
- Ghost reads contour as translucent fill.
- Guide reads subject/object/composition semantics.

This makes switching instant and keeps matching consistent.

### 4. Composition matters more than exact pose equality

The app is a photography assistant, not an exercise-form checker.

Matching priority is roughly:

1. subject position
2. subject scale / crop
3. overall body shape
4. face direction
5. smaller limb differences

Even in Skeleton mode, do not punish harmless anatomical differences if the resulting photograph has the same visual composition.

### 5. One instruction at a time

Live coaching should answer one question:

> What is the single most useful thing to change right now?

Good examples:

- `Subject -> left`
- `Move closer`
- `Face -> right`
- `Raise left wrist`
- `✓ Match`

Avoid simultaneously showing a checklist of corrections. Component scores can exist as secondary/debug information, but the primary UI is one action.

### 6. The guide must be glanceable

The photographer should understand the viewfinder without reading instructions for several seconds.

Prefer:

- contour
- skeleton when explicitly selected
- ghost silhouette
- zones
- arrows
- very short labels
- clear matched/not-matched state

Avoid permanent explanatory paragraphs in the camera view.

### 7. Never pretend a capability is more real-time or accurate than it is

The current Expo Camera MVP uses sampled still frames, so the UI calls it **Sampled Live Coach**. Do not describe it as 30 FPS tracking.

Likewise:

- approximate face yaw is not a calibrated physical angle
- heuristic food zones are not object segmentation
- one-person segmentation is not multi-person instance tracking

Product copy should describe the actual behavior.

### 8. Cross-platform is a product requirement

Web, iOS and Android are first-class targets. Shared product behavior matters more than forcing every implementation detail to be identical.

During MVP development, a shared Expo/React Native implementation is preferred. Native adapters are acceptable when they materially improve camera latency, stability or device integration.

The domain model and matching logic should remain portable even if the camera or ML runtime becomes platform-specific.

### 9. Local-first image processing

Reference and camera images should stay on-device whenever practical.

Cloud/VLM processing may later be used for higher-level composition semantics, but it must be an explicit architectural/product decision rather than an accidental requirement of basic shooting.

### 10. Fail soft

If one ML subsystem fails, preserve whatever useful guide is still available.

Examples:

- segmentation works, pose fails -> Outline/Ghost still work
- pose works, segmentation fails -> Skeleton can still work and an approximate outer envelope may be generated
- face fails -> keep guide without look-direction cue
- automatic extraction fails -> show editable fallback instead of blocking the camera

### 11. Validate the shooting UX before optimizing the model

A more accurate model does not matter if the guide is visually noisy or awkward in a real camera view.

When prioritizing work, prefer:

1. real-world shooting usability
2. stability and latency
3. composition guidance quality
4. model sophistication

## MVP scope

### Portrait MVP

- one primary person
- reference image -> shared contour + pose + face geometry
- four switchable guide presets where applicable
- editable target position / scale
- camera guide
- sampled alignment coaching

### Food/object MVP

- one to three prominent objects
- reCompose-like composition templates/zones
- relative placement and size
- other presets may be added only where they make semantic sense

### Explicitly later

- multi-person instance segmentation from arbitrary uploaded references
- arbitrary object segmentation from uploaded food photos
- continuous high-FPS native frame processing
- stable auto-capture
- cloud/VLM semantic composition analysis
- community/template marketplace
- advanced per-layer mixing (e.g. Outline + composition eye line at the same time)

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
