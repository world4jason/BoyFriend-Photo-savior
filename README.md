# BoyFriend Photo Savior

A **reference → abstract guide → live camera** MVP for Web, iOS and Android.

The product intentionally does **not** put the whole source photo on top of the camera. It keeps only the composition information that is useful while shooting: body anchors, face direction, multiple-person relationship, or food/object zones.

## What works now

- Expo / React Native shared UI for Web, iOS and Android
- Built-in demo reference gallery
  - half-body cafe pose
  - look-back standing pose
  - low squat
  - two-person pose relationship
  - three-object dessert composition
- Simple / Outline / Pose guide rendering
- Full-body limb anchors when the template contains them
- Multi-person guides
- Food/object zones and relative placement lines
- Show reference / Guide-only preview
- Move / scale / reset guide
- Live camera overlay
- Face-direction flip
- Camera capture with a captured thumbnail
- Import your own reference image (manual guide in this MVP)
- `PoseDetector` adapter boundary for automatic extraction next

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

For camera behavior, a physical phone is recommended.

## Web export

```bash
npm run export:web
```

The static output is written by Expo to `dist/`.

## MVP architecture

```text
Reference image / built-in demo
            |
            v
     Composition Guide
   /          |          \
Simple     Outline       Pose
            |
            v
      Live Camera View
            |
            v
         Capture
```

The next detector plugs into the same flow:

```text
User reference image
        |
        v
MediaPipe / MoveNet / ML Kit
        |
        v
Pose landmarks + face direction
        |
        v
GuideGenerator
        |
        v
GuideSpec (same UI as today)
```

## Demo photos

The built-in samples use free-to-use Unsplash photos and include photographer credit in the UI. They are only reference material for validating the guide interaction. For a packaged offline build, replace them with local licensed assets.

## Next milestones

1. Automatic reference-photo pose extraction.
2. Face landmarks / face yaw to set the direction arrow.
3. Person segmentation to generate a cleaner SOVS-like contour.
4. Live subject detection and alignment score.
5. Auto-capture when the framing is close enough.
6. General object segmentation for arbitrary food references.
7. Save/share captured photos.
