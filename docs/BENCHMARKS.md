# Guide Benchmark Research

This document records the public products/pages used to bootstrap the MVP's template vocabulary.

## Product taxonomy

The app's primary user-facing terms are:

- **Outline**
- **Skeleton**
- **Ghost**
- **Guide**

SOVS/SOVS2, PoseOverlay, PoseGhost and reCompose are **benchmark inspirations**, not our primary feature names.

A template is separate from the mode. Example: `Wall Lean` is a template; `Skeleton` or `Outline` is how that same geometry may be displayed.

## Outline benchmark — SOVS / SOVS2

Research source:

- https://apppage.net/preview/me.sovs.sovs2

Public interaction pattern:

- pre-drawn human silhouette on the camera
- photographer moves/scales it
- subject steps into the silhouette
- SOVS2 supports multiple people and a background-reference mode

MVP patterns recreated as our own geometry include:

- relaxed full body
- wall lean
- seated compact
- low squat
- look back
- duo side-by-side
- couple close
- small-group stagger

## Skeleton benchmark — PoseOverlay

Research sources:

- https://poseoverlay.com/
- https://poseoverlay.com/features/copy-this-pose
- https://poseoverlay.com/blog/mens-posing-guide/
- https://poseoverlay.com/blog/how-to-pose-for-photos/
- https://poseoverlay.com/blog/movement-in-photos
- https://poseoverlay.com/blog/what-to-do-with-your-hands-in-photos/

Public product/site patterns include:

- skeleton overlay + match score
- uploaded photo -> body skeleton -> camera overlay
- Power Stance
- Hip Pop
- Casual Walk
- Arms Crossed
- Natural / hand-in-pocket stance
- Look Away
- Weight Shift / Square Stance
- Step Forward
- Forward Lean
- Arm on Knee
- Wall Lean
- Walk / Look-back Walk
- couple walking / forehead-touch style interactions

The MVP recreates normalized joint geometry for representative patterns; it does not copy the site's pose illustrations.

## Ghost benchmark — PoseGhost

Research source:

- https://play.google.com/store/apps/details?id=nz.dev.poseghost

The public Google Play description states that PoseGhost has 62 hand-crafted overlays and these categories:

- Selfie Essentials
- Female Poses — full body, seated, walking, over-the-shoulder
- Male Poses — relaxed stances
- Couple Poses — hugs, hand-holds, twirls, back-to-back
- Wedding Poses
- Friends & Groups

It also exposes opacity, scaling/repositioning, mirroring, white/black silhouettes, rotation/lock and tint controls.

MVP Ghost seeds cover these same functional families using our own geometry.

## Guide benchmark — reCompose

Research source:

- https://recompose.camera/

The official site publicly describes **10 styles / 40 guides**. The library is not just a generic grid; guides are drawn for a specific shot and may include one-line hints, flipping, or labeled multi-object zones.

### Public categories and patterns

**Travel — 5 guides**

- landmarks on golden points
- big skies
- frames
- reflections
- you + landmark

**Street — 5 guides**

- leading lines
- walk-in space
- near + far pairings
- layered scenes

**Food — 6 guides**

- overhead flat-lays
- off-center plates
- plate + glass
- spreads
- cocktails

**Portrait — 5 guides**

- eye lines
- look space
- two-person staggering
- deliberate symmetry

**Selfie — 3 guides**

- off-center framing
- duos
- look space

**Pets — 3 guides**

- eye-level
- placement with looking room
- tiny-against-big

**Family — 3 guides**

- candid framing
- staggered group heads
- kid-height shots

**Landscape — 4 guides**

- high horizon
- low horizon
- foreground anchors / Peak + Anchor
- mirror reflections

**Buildings — 4 guides**

- symmetry
- converging lines
- person for scale
- frame within frame

**Basic — 2 guides**

- rule of thirds
- golden-ratio / phi grid

The branch recreates this public composition vocabulary with generic `line`, `zone`, `point`, and `frame` annotations.

## Secondary store research

Other current camera-pose apps reinforce useful template-library categories and controls:

- PoseCam: standing, sitting, action and yoga; drag/scale/rotate/opacity.
- Pose Guide Camera: one-, two-, three- and four-person pose guides.
- PoseSnap: solo, couple, group, outdoor, beach, cafe, engagement, family and gym packs.
- PoseCam AI: reusable subject overlay plus live Pose Assist / auto-capture.

These are useful discovery references but do not create additional product modes. They feed the **Template** vocabulary underneath Outline/Skeleton/Ghost/Guide.

## Asset / copyright policy

Public screenshots and proprietary pose artwork are used only to understand interaction patterns and template categories.

Do not commit copied or traced commercial assets as shipped templates.

Instead:

1. keep the source URL;
2. record the public template/category name or functional description;
3. rebuild the target using our own normalized points/lines/zones/frames;
4. use our own or openly licensed reference photography;
5. keep benchmark names secondary to the product mode names.

This gives the MVP a broad proven template vocabulary without coupling it to another product's artwork or license.
