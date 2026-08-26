# Guide Benchmarks

The app uses four named **guide presets**. These are interaction-pattern benchmarks, not copied product assets.

## 1. SOVS / SOVS2 -> `sovs` -> Outline

Source: https://apppage.net/preview/me.sovs.sovs2

Observed pattern:

- pre-drawn human silhouette on the live camera
- photographer moves/scales the silhouette
- subject physically steps into the shape
- SOVS2 also supports multiple people and a background-reference mode

What we adopt:

- clean outside contour
- move / scale / flip-friendly target
- multi-person relationship support
- default portrait mode because it is the easiest for a non-photographer to understand

## 2. PoseOverlay -> `poseoverlay` -> Skeleton

Sources:

- https://poseoverlay.com/
- https://poseoverlay.com/features/copy-this-pose

Observed pattern:

- explicit body skeleton overlay
- uploaded photo -> MoveNet body keypoints -> skeleton
- live pose matching / match percentage
- categories include Solo, Couple, Travel, Graduation, Fitness, Portrait, Adaptive, Selfie, etc.

What we adopt:

- explicit skeleton only when the user chooses this preset
- body-joint geometry and pose matching
- useful for precise hand/arm/leg placement

We do **not** make skeleton the default shooting view.

## 3. PoseGhost -> `poseghost` -> Ghost

Source: https://play.google.com/store/apps/details?id=nz.dev.poseghost

Observed pattern:

- semi-transparent pose silhouette directly over the viewfinder
- 62 hand-drawn overlays
- categories: Selfie Essentials, Female, Male, Couple, Wedding, Friends & Groups
- opacity, scale, drag, mirror, rotation/lock, tint

What we adopt:

- translucent filled silhouette / stencil feeling
- same underlying contour geometry as SOVS, but a different visual treatment
- future controls: opacity, mirror, tint, lock

## 4. reCompose -> `recompose` -> Guide

Source: https://recompose.camera/

Observed pattern:

- semantic composition guide rather than a person outline
- one-line hint
- asymmetric guides can flip
- multi-object zones can be labeled (`plate here`, `glass there`)
- 40 guides across Travel, Street, Food, Portrait, Selfie, Pets, Family, Landscape, Buildings and Basic

Useful seed examples:

- Food: overhead flat-lay, off-center plate, plate + glass, spreads, cocktails
- Portrait: eye line, look space, two-person stagger, deliberate symmetry
- Street: leading lines, walk-in space, near/far pairing
- Landscape: high/low horizon, foreground anchor, reflection

What we adopt:

- grids / eye lines / look-space zones
- object placement zones and relationship lines
- one short semantic instruction

## Asset policy

Commercial screenshots and proprietary pose artwork are useful research references, but they are not copied into the public repository as shipped template assets.

Instead:

1. keep source URLs here;
2. recreate the interaction pattern with our own vector geometry;
3. use our own/openly licensed reference photography;
4. store reusable vector seeds in `src/templates/benchmarkTemplates.ts`.

This keeps the repo useful without coupling the product to another app's artwork/license.
