# BoyFriend Photo Savior

Reference-photo composition guidance for **Web, iOS, and Android**.

## MVP flow

1. Choose a reference photo.
2. Turn it into an editable composition guide.
3. Pick **Simple / Outline / Pose** guide rendering.
4. Nudge or scale the guide.
5. Open the live camera and place the subject into the guide.
6. Capture the shot.

This repository intentionally separates the product UI from pose detection. `src/pose/PoseDetector.ts` defines the adapter boundary for MediaPipe, MoveNet, ML Kit, or another runtime.

## Stack

- Expo / React Native / TypeScript
- `expo-camera`
- `expo-image-picker`
- `react-native-svg`

One shared UI targets Web, iOS, and Android.

## Run

```bash
npm install
npx expo start
```

Then press:

- `w` for Web
- `i` for iOS simulator
- `a` for Android emulator

Camera behavior should also be tested on a physical device.

## Current status

### Implemented

- Cross-platform Expo shell
- Reference image picker
- Three guide styles: Simple, Outline, Pose
- Editable guide position and scale
- Live camera overlay
- Face/look-space flip
- Camera capture
- Rule-of-thirds overlay
- `PoseDetector` interface
- landmark-to-guide `HeuristicGuideGenerator`

### Next

- Automatic reference-photo pose extraction
- Face direction from face landmarks
- Live pose matching and alignment score
- Auto-capture when alignment passes a threshold
- Person segmentation → clean silhouette/outline
- Food/object composition guides
- Save/share captured photos

## Architecture

```text
Reference image
      |
      v
PoseDetector (adapter)
      |
      v
GuideGenerator
      |
      v
GuideSpec
  |       |       |
Simple  Outline  Pose
      |
      v
Live Camera Overlay
```

The product model is **reference → abstract guide → camera**, not transparent source-photo overlay.
