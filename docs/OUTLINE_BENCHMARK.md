# Portrait Guide Rendering Benchmark

This document records the visual language we want to preserve when implementing the four portrait Display Modes.

## SOVS / SOVS2 -> Outline

Observed public screenshots show:

- a thin/medium white human contour;
- smooth curves around head, torso and bent limbs;
- pose-specific limb overlap/separation lines when useful;
- no joint dots;
- no center-line skeleton;
- no rectangular torso box;
- no direction arrows inside the silhouette.

The important property is that the guide reads immediately as **the outside shape of a person**. It does not look like a pose graph with thickness added afterward.

Sources:

- https://sovs.imweb.me/
- https://www.digitalcameraworld.com/news/phone-app-helps-non-photographers-compose-perfect-shots
- archived/public SOVS store screenshots referenced from `docs/BENCHMARKS.md`

## PoseGhost -> Ghost

The Google Play description explicitly says the 62 overlays are hand-crafted to one locked style specification with:

- uniform line weight;
- consistent proportions;
- readability at low opacity;
- white/black silhouette options;
- opacity, scale, mirror, rotation and tint controls.

Product implication: Ghost should reuse coherent silhouette geometry and optimize it for overlap/readability, rather than draw independent thick bone segments.

Source:

- https://play.google.com/store/apps/details?id=nz.dev.poseghost

## PoseOverlay -> Skeleton

PoseOverlay's `Copy This Pose` converts an uploaded source photo into MoveNet body keypoints. Its primary exact-pose representation is therefore an explicit skeleton, and Pose Match compares live keypoints against it.

The product also describes a simplified green body outline in Stranger/Photographer Mode, but that is a framing aid; it should not blur the distinction between our precise Skeleton mode and our silhouette-style Outline mode.

Sources:

- https://poseoverlay.com/
- https://poseoverlay.com/features/copy-this-pose
- https://poseoverlay.com/features

## reCompose -> Guide

reCompose explicitly says its guides are not generic grids. Each guide is drawn for a shot and can use semantic lines, regions, labels, relationships and one-line hints.

Product implication: Guide should not inherit human silhouette styling merely because the target is a portrait.

Source:

- https://recompose.camera/

## Renderer contract for this project

| Mode | Primary geometry | Visual rule |
| --- | --- | --- |
| Outline | source contour + meaningful interior rings, else body envelope | smooth body shape, quiet white line |
| Skeleton | named pose anchors | explicit center-lines + joint nodes |
| Ghost | same silhouette/envelope geometry as Outline | translucent fill + consistent thin border; interior rings stay transparent |
| Guide | semantic composition annotations | lines / zones / frames / labels / look-space |

### Source-contour fidelity

Renderer style cannot recover geometry that extraction already destroyed. For uploaded references, the segmentation-mask conversion should therefore preserve the **ordered boundary topology** of the primary person:

- meaningful exterior concavities such as the gap between an arm and torso or an indentation between separated legs;
- meaningful enclosed background rings such as a hand-on-hip or arm-loop opening when the segmentation mask actually contains that negative space.

A per-row `minX/maxX` envelope is only a fail-soft fallback. As a primary extractor it is an anti-pattern because it fills exterior negative space before Outline/Ghost rendering begins.

`PersonGuide.contour` stores the single outer ring. Optional `PersonGuide.contourHoles` stores a bounded set of meaningful enclosed background rings from the same selected person component. Tiny segmentation pinholes are intentionally filtered. Outline strokes the compound silhouette; Ghost uses even-odd fill so the retained holes remain transparent.

This still does **not** infer semantic overlap/separation lines where no background hole exists. For example, a forearm lying across a torso may need an interior line even though the binary person mask is solid there. That requires separate body-part/pose reasoning rather than drawing skeleton rails inside Outline.

### Anti-patterns

Do not regress to:

- rectangular torso + separate parallel rails for every limb segment in Outline;
- row-wise `minX/maxX` hulls as the primary source-derived contour when ordered mask boundaries are available;
- filling meaningful enclosed source negative space solid in Ghost;
- turning one-pixel segmentation defects into visible interior rings;
- joint dots in Outline/Ghost;
- raw source-photo tracing used as Skeleton;
- generic rule-of-thirds grid replacing shot-specific Guide annotations;
- face-direction arrows drawn inside Outline/Ghost.
