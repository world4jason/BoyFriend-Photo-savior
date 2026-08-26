# Architecture

This document explains the stable architecture of **BoyFriend Photo Savior**. Behavior contracts live in `openspec/specs/`; this file explains how the implementation is organized and why.

## 1. Product model

There are three orthogonal concepts:

```text
INPUT                     DISPLAY                   ASSISTANCE
Reference Photo ----\      Outline ----\             Live Coach
                     -> Shared Geometry -> Skeleton ----> scoring + one hint
Template ----------/       Ghost ------/
                           Guide ------/
```

- **Reference**: a user-provided image analyzed into geometry.
- **Template**: reusable target geometry already stored in the catalog.
- **Display Mode**: how the same target is visualized: Outline / Skeleton / Ghost / Guide.
- **Live Coach**: compares current camera geometry with target geometry; it is not a display mode.

Benchmark names such as SOVS, PoseOverlay, PoseGhost, and reCompose are provenance/research metadata only.

## 2. Shared domain model

`GuideSpec` is the single target model.

It can contain:

```text
GuideSpec
├─ kind: portrait | food | scene
├─ people[]
│  ├─ contour
│  ├─ head + face direction
│  ├─ shoulders / torso
│  └─ joints
├─ objects[]
├─ annotations[]
│  ├─ line
│  ├─ zone
│  ├─ point
│  └─ frame
├─ crop / lookSpace / aspectRatio
└─ transform
```

No display mode owns a separate copy of target truth.

## 3. Runtime layers

```text
┌──────────────────────────────────────────────────────────────┐
│ UI / Screens                                                │
│ App.tsx today; should gradually split into feature screens  │
└──────────────────────────────┬───────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────┐
│ Camera / Input adapters                                      │
│ expo-camera, image-picker, image preparation                 │
└──────────────────────────────┬───────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────┐
│ Analysis adapters                                            │
│ MediaPipe segmentation + pose + face via DOM component      │
└──────────────────────────────┬───────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────┐
│ Domain geometry                                              │
│ GuideSpec / PersonGuide / ObjectGuide / annotations          │
└───────────────┬──────────────────────────────┬───────────────┘
                │                              │
┌───────────────▼──────────────┐  ┌────────────▼──────────────┐
│ Rendering                    │  │ Matching                  │
│ GuideOverlay                 │  │ guideMatch.ts             │
│ Outline/Skeleton/Ghost/Guide │  │ position/scale/pose/face │
└───────────────┬──────────────┘  └────────────┬──────────────┘
                │                              │
                └──────────────┬───────────────┘
                               ▼
                     Camera coaching UI
```

## 4. Reference-analysis lifecycle

```text
select photo
   ↓
resize/compress analysis copy
   ↓
DOM MediaPipe analyzer
   ├─ Image Segmenter → contour
   ├─ Pose Landmarker → joints
   └─ Face Landmarker → face direction
   ↓
build GuideSpec
   ↓
clean temporary analysis file
```

Important invariants:

- Large images are bounded before Base64 bridge transfer.
- Stale reference preparation must not replace a newer selection.
- Camera entry is blocked while the current reference is actively mutating.
- Pose and face are optional enhancements; segmentation/fallback can still produce a usable guide.
- A transient MediaPipe initialization failure must not permanently poison all later attempts.

## 5. Live Coach lifecycle

The current Expo MVP does not receive camera frames continuously. It samples a low-quality still roughly every 1.7 seconds:

```text
CameraView
   ↓ periodic still
resize/compress
   ↓
MediaPipe analyzer
   ↓
live GuideSpec
   ↓
scorePortraitMatch(target, live)
   ↓
framing / scale / pose / face
   ↓
one prioritized hint
```

This remains explicitly **sampled**, not 15–30 FPS tracking.

A future native/frame-processor camera adapter should replace only the sampling/input layer; `GuideSpec` and match semantics should remain portable.

## 6. Template architecture

Templates are data, not alternate renderers.

```text
Template
├─ id / title / category
├─ benchmark provenance
├─ recommended display mode
└─ GuideSpec geometry
```

Current families:

- Outline: portrait body-envelope patterns.
- Skeleton: pose/joint-heavy patterns.
- Ghost: 62-slot PoseGhost family-based POC reconstruction.
- Guide: portrait, food, travel, street, selfie, pets, family, landscape, buildings, basic composition patterns.

Large catalogs should default to a category subset instead of eagerly rendering every SVG preview.

## 7. Display-mode renderers

### Outline
Reads the person contour when available. Vector-only templates use a body-envelope fallback. A small face-direction cue is allowed.

### Skeleton
Reads meaningful normalized joint anchors. It is a photographer-facing skeleton, not a raw 33-landmark debug dump.

### Ghost
Reads the same contour/body envelope as Outline, but renders it as a translucent filled stencil.

### Guide
Reads semantic target geometry: subject bounds, eye/look space, objects, lines, zones, points, frames, and relationships. A generic grid is not automatically added when a shot-specific guide exists.

## 8. Platform strategy

Web, iOS, and Android are first-class targets.

- UI/domain/rendering/matching are shared React Native/TypeScript.
- MediaPipe currently runs in one Expo DOM Component: browser DOM on Web, DOM WebView bridge on native.
- Native file cleanup is isolated behind `.native.ts`; Web uses a no-op fallback.
- Current MediaPipe WASM/models are fetched from public URLs on first load. User image bytes remain local.

## 9. Current technical debt

### P1 / fix before calling the architecture stable

1. **Benchmark IDs in domain mode state** — legacy values (`sovs`, `poseoverlay`, `poseghost`, `recompose`) still appear in core `GuideSpec.visualStyle`. Product-domain state should converge on `outline | skeleton | ghost | guide`; benchmark IDs should remain compatibility/provenance metadata only.
2. **Analyzer retry** — a rejected singleton MediaPipe initialization promise currently remains rejected for the lifetime of the page unless reset.
3. **Segmentation mask cleanup** — category-mask resources should close even when contour conversion throws.

### P2 / next structural cleanup

1. `App.tsx` is a monolith combining navigation state, reference preparation, live sampling, template browsing, and all screen markup.
2. Ghost (62) and Guide (~40) template catalogs need category-first browsing/virtualization rather than eager large SVG lists.
3. Package version and Expo app version should stay synchronized.
4. `src/pose/PoseDetector.ts` contains legacy comments from the earlier outline-only product model.
5. Physical-device camera smoke testing is still missing because hosted Actions are blocked and the current execution environment has no external DNS.

## 10. Recommended module direction

Do not perform a large rewrite just for aesthetics. Split only when touching the relevant area:

```text
src/
├─ domain/               # GuideSpec, display modes, invariant helpers
├─ analysis/             # preparation + MediaPipe adapters
├─ rendering/            # GuideOverlay + mode renderers
├─ matching/             # photography-oriented scoring
├─ templates/            # catalog + benchmark metadata
├─ camera/               # sampled/native camera analysis adapters
└─ screens/              # Home / Reference / Camera UI
```

The critical dependency rule is one-way:

```text
camera/input → analysis → domain ← templates
                         ↓
                   rendering/matching
                         ↓
                        UI
```

Domain code must not import Expo Camera or MediaPipe implementation types.

## 11. Source of truth

- Observable behavior: `openspec/specs/`
- Architecture and dependency boundaries: this document
- Benchmark research/provenance: `docs/BENCHMARKS.md` and POC notes
- Current product prose: `docs/PRODUCT.md`
- Proposed changes: `openspec/changes/<change>/`

For non-trivial future behavior changes, update intent through an OpenSpec change before implementation.
