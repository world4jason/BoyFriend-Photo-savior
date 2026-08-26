# Product Doctrine

This document is the product contract for **BoyFriend Photo Savior**. New features should make the shooting moment simpler. If a feature makes the photographer study the screen instead of taking the photo, it is probably moving the product in the wrong direction.

## Product sentence

> Turn a reference photo or a reusable shooting template into a minimal, actionable camera guide so a non-photographer can reproduce the important composition without memorizing it.

The primary flow is:

```text
reference photo OR template
    -> understand / load geometry once
    -> choose a display mode
    -> live camera
    -> one useful correction at a time
    -> photo
```

## Core product model: Mode vs Template

These are two different concepts and should never be mixed in UI or code reviews.

### A. Display Mode = how the guide is shown

There are exactly four core display modes:

| Product mode | Benchmark inspiration | Photographer sees | Best for |
| --- | --- | --- | --- |
| **Outline** | SOVS / SOVS2 | clean outside contour | fastest “stand inside this shape” instruction |
| **Skeleton** | PoseOverlay | body skeleton + joint anchors | precise body/hand/leg placement |
| **Ghost** | PoseGhost | translucent filled silhouette | quick stencil-like overlap |
| **Guide** | reCompose | zones, grids, eye lines, labels, relationships | composition, food, objects, scenes |

**Outline / Skeleton / Ghost / Guide are the product names.** Brand names should appear only in research/benchmark documentation or small secondary labels.

For a portrait reference, analysis happens **once** and the user may switch Outline / Skeleton / Ghost / Guide without rerunning ML.

### B. Template = what shot/pose/composition to make

A template is a reusable target geometry, for example:

```text
Power Stance
Wall Lean
Over the Shoulder
Couple Walk
Two-person Stagger
Plate + Glass
Big Sky
Leading Lines
Peak + Anchor
```

A template has one recommended/default display mode, but the mode and template are independent where the geometry supports it.

Examples:

```text
Power Stance template
    -> default Skeleton
    -> user may switch to Outline / Ghost / Guide

Over-the-shoulder template
    -> default Ghost
    -> user may switch to Outline / Skeleton / Guide

Plate + Glass template
    -> Guide only for now
```

### C. Live Coach is not a fifth mode

Live Coach is an orthogonal assistance layer.

```text
Outline  + Live Coach
Skeleton + Live Coach
Ghost    + Live Coach
Guide    + Live Coach
```

It compares the same underlying target geometry with the current camera subject and produces one prioritized instruction.

## Shared geometry

Do not maintain four incompatible versions of the same reference.

The analyzer/template should build one shared model containing as much as available:

```text
person contour
pose joints
face direction
subject bounds
object bounds
composition lines / zones / points / frames
```

The display mode only decides which layers to render:

- **Outline** reads contour / fallback body envelope.
- **Skeleton** reads body joints.
- **Ghost** reads contour as translucent fill.
- **Guide** reads semantic annotations, subject/object zones and relationships.

## Non-negotiable principles

### 1. Reference-to-guide, not raw reference overlay

The default shooting experience must not simply place the whole source image at 50% opacity. The product should retain only information needed to reproduce the shot.

A raw-photo ghost can exist as an optional debug/reference aid, but it is not one of the four core display modes.

### 2. Outline is the default portrait mode

For arbitrary uploaded portraits, default to **Outline** because it is the most glanceable to a casual photographer.

Skeleton is a real user-facing feature, but only when the user explicitly chooses **Skeleton**. Do not dump raw CV diagnostics.

Useful Skeleton:

- head marker
- shoulder line
- spine / hip line
- arms / legs
- meaningful joint anchors

Not useful product UI:

- all model landmarks with no hierarchy
- face mesh
- confidence values on every point
- segmentation mask pixels

### 3. Guide mode is semantic, not just a grid

Guide mode must be able to describe composition beyond a person box.

Supported primitive concepts include:

- lines / horizon / leading lines
- zones / subject regions
- anchor points / golden points
- frames / frame-within-frame
- eye line / look space
- object relationship / near-far relationship
- one-line labels or hints

This is required for food, travel, street, landscape and architecture templates.

### 4. Composition matters more than anatomical equality

The app is a photography assistant, not an exercise-form checker.

Matching priority is roughly:

1. subject position
2. subject scale / crop
3. overall body or object relationship
4. face direction
5. smaller limb differences

Even in Skeleton mode, do not punish harmless anatomical differences if the resulting photograph preserves the visual composition.

### 5. One instruction at a time

Live coaching should answer:

> What is the single most useful thing to change right now?

Good examples:

- `Subject -> left`
- `Move closer`
- `Face -> right`
- `Raise left wrist`
- `Plate farther right`
- `Lower the horizon`
- `✓ Match`

### 6. The guide must be glanceable

Prefer:

- contour
- skeleton when explicitly selected
- ghost silhouette
- zones
- arrows
- short labels
- clear matched/not-matched state

Avoid permanent explanation-heavy UI in the camera.

### 7. Never overclaim capability

The current Expo Camera MVP uses sampled still frames, so it is **Sampled Live Coach**, not 30 FPS realtime tracking.

Likewise:

- approximate face yaw is not a calibrated physical angle
- one-person segmentation is not multi-person instance tracking
- manually seeded food/scene templates are not arbitrary-object AI understanding

### 8. Cross-platform is a product requirement

Web, iOS and Android are first-class targets. Shared domain geometry and matching logic matter more than forcing identical camera internals.

### 9. Local-first image processing

Reference and camera images should stay on-device whenever practical. Cloud/VLM analysis may later add high-level semantics, but basic camera guidance must not silently depend on a cloud service.

### 10. Fail soft

Examples:

- segmentation works, pose fails -> Outline/Ghost still work
- pose works, segmentation fails -> Skeleton works; approximate envelope may back Outline/Ghost
- face fails -> keep guide without look-direction cue
- automatic extraction fails -> show editable fallback/template instead of blocking camera

### 11. Template sourcing

We study public product pages, App Store / Google Play screenshots and documentation to understand useful template **patterns**.

We may reproduce the functional geometry/pattern in our own vector format, but do not ship copied proprietary screenshots, traced commercial pose artwork or extracted app assets in this public repository.

Store:

- source URL
- template/category name or functional description
- our own normalized geometry
- default display mode

## Template-library targets

### Outline templates

Prioritize simple step-in shapes:

- standing / relaxed
- leaning
- seated
- squat
- over-the-shoulder
- duo / couple
- small groups

### Skeleton templates

Prioritize poses where exact limb placement matters:

- power stance
- hip pop
- casual walk
- arms crossed
- hand-in-pocket / natural
- look-away
- wall lean
- step forward
- seated forward lean
- arm on knee
- look-back walk
- couple interactions

### Ghost templates

Prioritize PoseGhost-style categories:

- selfie essentials
- female full-body / seated / walking / over-the-shoulder
- male relaxed stances
- couple hug / hand hold / twirl / back-to-back
- wedding
- friends & groups

### Guide templates

Use reCompose-style semantic categories:

- Travel
- Street
- Food
- Portrait
- Selfie
- Pets
- Family
- Landscape
- Buildings
- Basic composition

The goal is not to preserve another app's artwork. The goal is to quickly bootstrap a useful vocabulary of proven shooting patterns.

## MVP scope

### Portrait

- one primary person from arbitrary uploaded reference
- shared contour + pose + face geometry
- switchable Outline / Skeleton / Ghost / Guide
- editable target position / scale
- sampled alignment coaching

### Food / object

- reusable Guide templates for one-to-many objects
- relative size / spacing / placement
- arbitrary object extraction from a user photo is later

### Scene

- Guide templates using semantic lines / zones / points / frames
- initial scope includes Travel / Street / Landscape / Buildings / Basic patterns

### Explicitly later

- multi-person instance segmentation from arbitrary uploaded references
- arbitrary food/object segmentation
- continuous high-FPS native frame processing
- stable auto-capture
- cloud/VLM semantic composition analysis
- community/template marketplace
- per-layer mixing beyond the four main modes

## Success criteria

Before shipping a feature, ask:

1. Does it help during the shooting moment?
2. Is it simpler than memorizing the original reference?
3. Can a non-photographer understand it quickly?
4. Does it preserve composition rather than merely matching pixels?
5. Does failure leave the camera usable?
6. Does it work, or degrade clearly, on Web/iOS/Android?

If several answers are no, redesign before merging.
