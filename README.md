# BoyFriend Photo Savior

A **reference → outer contour → live camera** MVP for Web, iOS and Android.

The core product rule is simple:

> **If the reference contains a person, the shooting guide is an outside contour — never a pose skeleton.**

Pose landmarks may still be used internally as geometry for fallback presets, but stick figures and joint lines are not rendered to the photographer.

## What works now

- Expo / React Native shared UI for Web, iOS and Android
- Import your own reference image
- Automatic one-person segmentation with MediaPipe Image Segmenter
- Segmentation mask → simplified closed outer contour
- Reference / Guide-only preview
- Portrait guides render only as human outer contours
- Built-in portrait presets use outline-only fallback geometry
- Food references use object zones / object outlines
- Move / scale / reset the guide
- Source aspect ratio is preserved so the guide is not stretched on a phone screen
- Live camera overlay
- Camera capture with captured thumbnail
- Built-in demo reference gallery

## Automatic portrait flow

```text
User photo
   |
   v
MediaPipe person segmentation
   |
   v
binary person mask
   |
   v
scan outer left/right boundary
   |
   v
simplified closed contour
   |
   v
GuideSpec.people[0].contour
   |
   v
live camera overlay
```

The current automatic extractor targets **one primary person**. Multi-person instance separation is a later milestone.

## Cross-platform segmentation

### Web

The web build imports `@mediapipe/tasks-vision` directly and runs segmentation in the browser.

### iOS / Android

The Expo app runs the same MediaPipe Image Segmenter inside a tiny hidden `react-native-webview` bridge. The selected photo is provided as a local Base64 data URL; only the MediaPipe runtime/model are fetched remotely.

This keeps the MVP on one React Native codebase without writing separate Swift/Kotlin segmentation bridges yet.

> Current MVP requirement: internet access is needed the first time the MediaPipe WASM/model is loaded. A production build should bundle the model/runtime or replace the bridge with native MediaPipe Tasks.

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

## Data model

Portraits may contain internal head / shoulder / joint geometry because presets need it to construct a fallback shape, but the renderer follows this rule:

```text
person.contour exists
    -> draw the closed segmentation contour

person.contour missing
    -> derive an outer head / torso / limb envelope

never
    -> draw center-line skeletons
```

## Built-in demo photos

The demo gallery uses Unsplash references and includes photographer credit in the UI. They are reference material for validating the shooting interaction. Replace them with local licensed assets for an offline packaged demo.

## Next milestones

1. Bundle the segmentation model/runtime for offline use.
2. Face landmarks / face yaw for automatic look-direction guidance.
3. Better contour smoothing and small-gap preservation around arms/legs.
4. Multi-person instance segmentation and relationship guides.
5. Live subject segmentation → alignment score against the target contour.
6. Auto-capture when contour overlap is close enough.
7. Arbitrary food/object segmentation from uploaded references.
8. Save/share captured photos.
