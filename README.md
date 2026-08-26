# BoyFriend Photo Savior

A **reference → abstract human guide → live camera** MVP for Web, iOS and Android.

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
- SOVS-style guide keeps the silhouette clean and adds only a subtle face-direction cue when useful
- Built-in portrait presets use outline-only fallback geometry
- Food references use object zones / object outlines
- Move / scale / reset the guide
- Source aspect ratio is preserved so the guide is not stretched on a phone screen
- Live camera overlay
- Camera capture with captured thumbnail
- Built-in demo reference gallery and four rendering-style benchmarks

## Automatic portrait flow

```text
User photo
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

The current automatic extractor targets **one primary person**. Multi-person instance separation is a later milestone.

## One analyzer across Web / iOS / Android

The MediaPipe implementation lives in `src/segmentation/PersonAnalyzerDom.tsx` as an Expo **DOM Component**.

- **Web:** it executes as normal browser DOM.
- **iOS / Android:** Expo SDK 57 automatically hosts the same DOM component in its built-in `@expo/dom-webview` bridge.

This keeps one MediaPipe implementation instead of maintaining JavaScript + Swift + Kotlin versions during MVP development.

The selected photo stays local to the app/browser. The current MVP fetches the MediaPipe WASM runtime and model files from their public hosting URLs, so first use requires network access. A packaged production build should bundle those assets or move inference to native MediaPipe Tasks.

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

## Data model

```text
person.contour exists
    -> draw the closed segmentation contour

person.contour missing
    -> derive an outer body envelope from hidden pose geometry

face direction exists
    -> optionally draw one small directional cue near the head

never
    -> render center-line stick skeletons or face mesh points
```

## Built-in demo photos

The demo gallery uses Unsplash references and includes photographer credit in the UI. They are reference material for validating the shooting interaction. Replace them with local licensed assets for an offline packaged demo.

## Next milestones

1. Better contour tracing/smoothing around separated arms and legs.
2. Multi-person instance segmentation and relationship guides.
3. Live subject segmentation → overlap/alignment score against the target contour.
4. Auto-capture when contour overlap is close enough.
5. Arbitrary food/object segmentation from uploaded references.
6. Bundle MediaPipe models/runtime for offline use.
7. Save/share captured photos.
