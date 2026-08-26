# BoyFriend Photo Savior

A **reference -> shared guide geometry -> switchable camera guide -> live coach** MVP for Web, iOS and Android.

## Product model

The product exists to help a non-photographer reproduce the important composition of a reference image **without memorizing it**.

```text
reference photo
    -> analyze once
    -> contour + pose + face + composition geometry
    -> choose how to show it
    -> live camera
    -> one useful correction at a time
    -> photo
```

### Four guide presets

The four benchmark names are **four views of the same reference**, not four separate detection pipelines:

| Camera preset | Inspired by | Shows |
| --- | --- | --- |
| **Outline** | SOVS / SOVS2 | clean outside contour; subject steps into it |
| **Skeleton** | PoseOverlay | explicit body skeleton + pose anchors |
| **Ghost** | PoseGhost | translucent filled silhouette / stencil |
| **Guide** | reCompose | semantic zones, eye lines, look space, object relationships, labels |

For a portrait, the user can switch among all four in the reference preview **and while the camera is open**. The underlying MediaPipe analysis is reused; changing the preset does not rerun ML.

For food/object composition, the current applicable preset is **reCompose-like Guide**; other object representations can be added later where they make semantic sense.

See:

- [`docs/PRODUCT.md`](docs/PRODUCT.md) — product doctrine
- [`docs/BENCHMARKS.md`](docs/BENCHMARKS.md) — research mapping for SOVS2, PoseOverlay, PoseGhost and reCompose
- [`src/templates/benchmarkTemplates.ts`](src/templates/benchmarkTemplates.ts) — our own vector template seeds inspired by benchmark patterns
- [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) — branch / PR / review workflow

## Asset rule

Commercial app screenshots and proprietary pose artwork are research references, not shipped assets in this public repository. We keep benchmark URLs and recreate reusable guide geometry ourselves. Reference photography used by the demo should be ours or openly licensed.

## Development rule

Non-trivial work follows:

```text
branch -> implementation -> PR -> deliberate self-review -> resolve findings -> merge
```

GitHub Actions hosted-runner billing/availability is currently **not a merge gate**. A runner failure with zero executed steps is infrastructure status, not an application test result.

## What works now

- Expo / React Native shared UI for Web, iOS and Android
- Import your own reference image
- Reference images resized/compressed before crossing the native/DOM analysis bridge
- MediaPipe Image Segmenter -> one-person outer contour
- MediaPipe Pose Landmarker -> body anchors
- MediaPipe Face Landmarker -> left / right / front look direction
- One shared `GuideSpec` geometry model
- Four portrait guide renderers:
  - SOVS-like Outline
  - PoseOverlay-like Skeleton
  - PoseGhost-like Ghost
  - reCompose-like Guide
- Guide preset selector in reference preview
- Guide preset selector in camera
- Guide-only preview
- Move / scale / reset target guide
- Source aspect ratio preservation
- reCompose-like food/object zones
- **Sampled Live Coach** for portraits
  - subject position score
  - subject size score
  - relative pose score
  - face-direction score
  - one prioritized coaching hint
- Camera capture with captured thumbnail
- Temporary native sampled-analysis files cleaned after use

## Automatic reference flow

```text
Reference photo
   |
   +----------------------+----------------------+
   |                      |                      |
   v                      v                      v
Image Segmenter        Pose Landmarker        Face Landmarker
   |                      |                      |
   v                      v                      v
outer contour           joints              face direction
   |                      |                      |
   +----------------------+----------------------+
                          |
                          v
                    shared GuideSpec
                          |
          +---------------+---------------+---------------+
          |               |               |               |
          v               v               v               v
       Outline         Skeleton          Ghost           Guide
       (SOVS)       (PoseOverlay)     (PoseGhost)     (reCompose)
```

## Sampled Live Coach

Expo Camera does not provide the frame-processor path we ultimately want, so the MVP samples a small still image roughly every 1.7 seconds and runs it through the same local analyzer.

The match engine (`src/matching/guideMatch.ts`) compares:

1. framing / subject center
2. scale / crop
3. relative pose geometry
4. face direction when meaningful

The primary camera UI still shows **one action at a time**, for example:

- `Subject -> left`
- `Move closer`
- `Face -> right`
- `Raise left wrist`
- `✓ Match`

The score remains photography-oriented: composition and framing matter more than anatomical perfection.

## One analyzer across Web / iOS / Android

`src/segmentation/PersonAnalyzerDom.tsx` is an Expo DOM Component.

- **Web:** browser DOM
- **iOS / Android:** Expo DOM WebView bridge

Reference and sampled images stay local to the app/browser. MediaPipe WASM/model files are currently fetched from public hosting URLs, so first use requires network access. Production should bundle the assets or move inference to native MediaPipe Tasks.

## Run

Use Node 22.13+ for Expo SDK 57.

```bash
npm install
npx expo start
```

Then:

- `w` — Web
- `i` — iOS simulator
- `a` — Android emulator

A physical phone is recommended for camera testing. Web camera access outside localhost requires HTTPS.

## Validation

Preferred checks when a local runtime is available:

```bash
npm install
npm run typecheck
npm run export:web
```

Physical-device camera smoke tests are required before camera behavior is called stable.

## Current limits

- Automatic uploaded-reference extraction targets one primary person.
- Live Coach is sampled rather than continuous video-frame inference.
- Food guides are template/reference-zone based; arbitrary uploaded food segmentation is not implemented yet.
- First MediaPipe model/runtime load needs network access.
- Benchmark template seeds are vector recreations, not copied commercial artwork.

## Next milestones

1. Surface more benchmark-inspired vector templates in the template picker.
2. Temporal smoothing / stable-match window before green `Match`.
3. Optional auto-capture only after multiple stable matches.
4. Replace sampled captures with true live frame processing (15–30 FPS target).
5. Better contour tracing around separated arms, legs and props.
6. Multi-person instance segmentation and relationship guides.
7. Arbitrary food/object segmentation from uploaded references.
8. Bundle MediaPipe models/runtime for offline use.
9. Save/share captured photos.
