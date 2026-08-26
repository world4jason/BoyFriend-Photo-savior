# BoyFriend Photo Savior

A **reference → abstract guide → live camera coach** MVP for Web, iOS and Android.

## Product doctrine

The product exists to help a non-photographer reproduce the important composition of a reference image **without memorizing it**.

The canonical flow is:

```text
reference photo
    -> understand composition
    -> abstract guide
    -> live camera
    -> one useful correction at a time
    -> photo
```

These rules are non-negotiable:

1. **Reference-to-guide, not raw reference overlay.** The normal shooting view should keep only compositionally useful information.
2. **Humans step into an outside contour.** Pose/face landmarks are hidden implementation details; do not turn the camera into a stick-figure/debug view.
3. **Composition beats exact anatomical equality.** Position, crop and scale matter more than perfect joint matching.
4. **One instruction at a time.** The primary live UI should answer “what should I change now?”
5. **The guide must be glanceable.** Prefer contours, zones, arrows and short labels over explanation-heavy UI.
6. **Never overclaim.** Sampled matching is labeled sampled; approximate estimates are labeled approximate.
7. **Web, iOS and Android are first-class targets.** Shared domain logic matters more than forcing identical camera internals.
8. **Local-first image processing.** Cloud/VLM processing must be an explicit future product decision, not a hidden requirement.
9. **Fail soft.** If one ML subsystem fails, preserve the useful guide or editable fallback.
10. **Validate the shooting UX before optimizing models.** A more accurate model is not useful if the viewfinder becomes harder to use.

See [`docs/PRODUCT.md`](docs/PRODUCT.md) for the detailed product contract and [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) for the branch/PR/review workflow.

## Development rule

Non-trivial work follows:

```text
branch -> implementation -> PR -> deliberate self-review -> resolve findings -> merge
```

GitHub Actions hosted-runner billing/availability is currently **not a merge gate**. When Actions cannot start a runner, record manual review/validation instead of treating the infrastructure failure as an application failure. GitHub does not allow PR authors to formally approve their own PRs, so same-identity self-review is recorded as a PR review/comment checklist before merge.

## What works now

- Expo / React Native shared UI for Web, iOS and Android
- Import your own reference image
- Reference images are resized/compressed before crossing the native/DOM analysis bridge
- Automatic one-person segmentation with MediaPipe Image Segmenter
- Automatic 33-point pose analysis with MediaPipe Pose Landmarker
- Dedicated face analysis with MediaPipe Face Landmarker
- Segmentation mask → simplified closed outer contour
- Pose landmarks → hidden geometry for framing and fallback anchors
- Face landmarks → left / right / front look-direction cue
- Reference / Guide-only preview
- SOVS-style step-in portrait guide
- Built-in portrait presets and rendering-style benchmarks
- Food references use object zones / object outlines
- Move / scale / reset target guide
- Source aspect ratio preserved
- Live camera overlay
- **Sampled Live Coach** for portraits
  - subject position score
  - subject size score
  - relative pose score when enough landmarks exist
  - face-direction score when the reference is turned left/right
  - one prioritized coaching hint at a time
- Sampled native camera cache files are cleaned after analysis
- Camera capture with captured thumbnail

## Automatic reference flow

```text
Reference photo
   |
   +----------------------+----------------------+
   |                      |                      |
   v                      v                      v
MediaPipe              MediaPipe              MediaPipe
Image Segmenter        Pose Landmarker        Face Landmarker
   |                      |                      |
   v                      v                      v
person mask            body anchors           face direction
   |                      |                      |
   +----------------------+----------------------+
                          |
                          v
               abstract portrait guide
                  outer contour +
              subtle look-direction cue
                          |
                          v
                   live camera
```

The photographer sees the **outside line**, not the skeleton or face mesh.

## Sampled Live Coach

Expo Camera exposes still-photo and recording APIs rather than a general per-frame processor. The MVP therefore samples a small analysis image roughly every 1.7 seconds and runs it through the same local MediaPipe analyzer.

```text
Target Guide                 Sampled Camera Frame
     |                                |
     |                                v
     |                       silhouette + pose + face
     |                                |
     +---------------+----------------+
                     |
                     v
                Match Engine
                     |
          +----------+----------+
          |          |          |
       position     size       pose/face
          |          |          |
          +----------+----------+
                     |
                     v
                 0–100 score
                     +
               one useful hint
```

Examples:

- `Subject → left`
- `Subject ↑`
- `Move closer`
- `Step back`
- `Face → right`
- `Raise left wrist`
- `✓ Match`

The score is photography-oriented rather than an exercise-form score. Position and framing are weighted more heavily than exact joint equality.

### Why sampled instead of 30 FPS

The MVP keeps Expo Camera for broad Web/iOS/Android coverage. MediaPipe supports video/live-stream tracking, but high-FPS coaching requires direct camera-frame access. The production path is to replace the camera-analysis adapter with a native/frame-processor implementation while keeping `GuideSpec`, rendering and `src/matching/guideMatch.ts` intact.

## One analyzer across Web / iOS / Android

`src/segmentation/PersonAnalyzerDom.tsx` is an Expo **DOM Component**.

- **Web:** executes as normal browser DOM.
- **iOS / Android:** Expo SDK 57 hosts the same DOM component in its built-in DOM WebView bridge.

Reference and sampled images stay local to the app/browser. The MVP currently fetches MediaPipe WASM/model files from public hosting URLs, so first use requires network access. A production build should bundle these assets or move inference to native MediaPipe Tasks.

## Matching engine

`src/matching/guideMatch.ts` compares target/current portraits using:

1. **Framing** — subject center vs target center.
2. **Scale** — subject height vs target height.
3. **Pose** — relative joint geometry after normalizing away position/scale.
4. **Face** — left/right/front when the reference has a meaningful head turn.

It returns an overall score, component scores, match state and one prioritized coaching hint.

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

A physical phone is recommended for camera testing. For web camera access outside localhost, serve over HTTPS.

## Web export

```bash
npm run export:web
```

Expo writes static output to `dist/`.

## Validation

Preferred checks when a local runtime is available:

```bash
npm install
npm run typecheck
npm run export:web
```

`.github/workflows/ci.yml` also contains these checks, but hosted Actions runner/billing failures with **zero executed steps** are ignored as infrastructure status for now.

## Current limits

- Automatic portrait extraction targets one primary person.
- Live Coach is sampled rather than continuous video-frame inference.
- Food guides are template/reference-zone based; arbitrary uploaded food segmentation is not implemented yet.
- First MediaPipe model/runtime load currently needs network access.
- Camera features still require physical-device smoke testing before being called stable.

## Next milestones

1. Temporal smoothing / stable-match window before green `Match`.
2. Optional auto-capture only after multiple stable matches.
3. Replace sampled captures with true live frame processing (15–30 FPS target).
4. Better contour tracing around separated arms, legs and props.
5. Multi-person instance segmentation and relationship guides.
6. Arbitrary food/object segmentation from uploaded references.
7. Bundle MediaPipe models/runtime for offline use.
8. Save/share captured photos.
