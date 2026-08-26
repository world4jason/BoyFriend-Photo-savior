# BoyFriend Photo Savior

A **reference → abstract human guide → live camera coach** MVP for Web, iOS and Android.

The core product rule is:

> **If the reference contains a person, the shooting guide is an outside contour — never a pose skeleton.**

MediaPipe Pose Landmarker and Face Landmarker are hidden geometry only. They improve head, shoulder, hand, hip, knee, ankle, crop and face-direction guidance without exposing landmark dots or stick figures to the photographer.

## What works now

- Expo / React Native shared UI for Web, iOS and Android
- Import your own reference image
- Automatic one-person segmentation with MediaPipe Image Segmenter
- Automatic 33-point pose analysis with MediaPipe Pose Landmarker
- Dedicated face analysis with MediaPipe Face Landmarker
- Segmentation mask → simplified closed outer contour
- Pose landmarks → hidden geometry that improves framing metadata and fallback anchors
- Face landmarks → left / right / front look-direction cue
- Reference / Guide-only preview
- Portrait guides render only as human outer contours
- SOVS-style step-in guide
- Built-in portrait presets and rendering-style benchmarks
- Food references use object zones / object outlines
- Move / scale / reset the target guide
- Source aspect ratio is preserved so the guide is not stretched
- Live camera overlay
- **Sampled Live Coach** for portraits
  - subject position score
  - subject size score
  - relative pose score when enough landmarks exist
  - face-direction score when the reference is turned left/right
  - one prioritized coaching hint at a time
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

Expo Camera currently exposes still-photo and recording APIs rather than a general per-frame processor. For the MVP, the camera silently samples a low-quality analysis image roughly every 1.7 seconds and sends it through the same local MediaPipe analyzer.

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

Examples of coaching output:

- `Subject → left`
- `Subject ↑`
- `Move closer`
- `Step back`
- `Face → right`
- `Raise left wrist`
- `✓ Match`

The score is deliberately composition-oriented rather than a strict exercise/fitness pose score. Position and framing matter more than exact joint equality.

### Why it is sampled instead of 30 FPS

This version uses Expo Camera for the broadest Web/iOS/Android MVP. MediaPipe itself supports video/live-stream tracking, but true high-FPS coaching needs direct camera-frame access. The planned production path is to replace only the camera-analysis adapter with a native/frame-processor implementation while keeping `src/matching/guideMatch.ts` and the GuideSpec model.

## One analyzer across Web / iOS / Android

The MediaPipe implementation lives in `src/segmentation/PersonAnalyzerDom.tsx` as an Expo **DOM Component**.

- **Web:** executes as normal browser DOM.
- **iOS / Android:** Expo SDK 57 hosts the same DOM component in its built-in `@expo/dom-webview` bridge.

The selected image/frame stays local to the app/browser. The MVP fetches MediaPipe WASM and model files from public hosting URLs, so first use requires network access. A packaged production build should bundle those assets or move inference to native MediaPipe Tasks.

## Matching engine

`src/matching/guideMatch.ts` compares the target and current portrait using four signals:

1. **Framing** — subject center vs target center.
2. **Scale** — subject height vs target height.
3. **Pose** — relative joint geometry after normalizing away position/scale.
4. **Face** — left/right/front direction when the reference has a meaningful turn.

The engine returns a `MatchFeedback` object with an overall score, component scores, status and coaching hint.

## Run

Use Node 22.13+ for Expo SDK 57.

```bash
npm install
npx expo start
```

Then:

- press `w` for Web
- press `i` for iOS simulator
- press `a` for Android emulator

A physical phone is recommended for camera testing.

For web camera access outside localhost, serve the build over HTTPS.

## Web export

```bash
npm run export:web
```

Expo writes the static output to `dist/`.

## CI

`.github/workflows/ci.yml` is configured to run:

```text
npm install
npm run typecheck
npm run export:web
```

on every push / pull request. If the GitHub account cannot allocate a hosted Actions runner, the workflow can fail before any step starts; that is an account/runner issue rather than an application test result.

## Current limits

- Automatic portrait extraction targets one primary person.
- Live Coach is sampled rather than continuous video-frame inference.
- Repeated sampled frames use temporary camera-cache images on native platforms.
- Food guides are template/reference-zone based; arbitrary uploaded food segmentation is not implemented yet.
- First MediaPipe model/runtime load currently needs network access.

## Next milestones

1. Replace sampled captures with true live frame processing (15–30 FPS target).
2. Add temporal smoothing so instructions do not flicker between adjacent frames.
3. Require a stable match across multiple frames before offering auto-capture.
4. Better contour tracing around separated arms, legs and props.
5. Multi-person instance segmentation and relationship guides.
6. Arbitrary food/object segmentation from uploaded references.
7. Bundle MediaPipe models/runtime for offline use.
8. Save/share captured photos.
