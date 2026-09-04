# BoyFriend Photo Savior

A **reference/template → shared geometry → display mode → camera guide → live coach** MVP for Web, iOS and Android.

> 想直接使用：看 [`docs/USAGE.md`](docs/USAGE.md)。

## Try / install

### Web

**[Open the deployed Web app](https://boyfriend-photo-savior.expo.app/)**

The Web deployment is currently published manually through EAS Hosting. After a new `main` change, redeploy EAS Hosting before assuming the production URL contains that change.

### Android APK

The repo is configured with an EAS `preview` profile that outputs an installable `.apk` rather than an `.aab`:

```bash
npx eas-cli@latest login
npm run build:apk
```

After the build finishes, EAS provides an install/download URL and QR code. See [`docs/RELEASE.md`](docs/RELEASE.md).

## Product model

```text
INPUT                  SHARED TARGET             DISPLAY                 ASSISTANCE
Reference photo ---\                            Outline ----\
                    -> GuideSpec geometry ----> Skeleton ----+----> Camera + Live Coach
Template ----------/                            Ghost -------+
                                              Guide -------/
```

Two concepts stay separate:

```text
DISPLAY MODE = how the photographer sees guidance
TEMPLATE     = what pose/composition the photographer is trying to make
```

The four product-facing display modes are:

| Mode | Benchmark inspiration | Shows |
| --- | --- | --- |
| **Outline** | SOVS / SOVS2 | smooth outside contour / body envelope |
| **Skeleton** | PoseOverlay | curated body skeleton + joint anchors |
| **Ghost** | PoseGhost | translucent filled silhouette / stencil |
| **Guide** | reCompose | semantic zones, lines, eye/look-space, object/scene relationships |

Benchmark brands are research/provenance metadata, not primary product taxonomy. Live Coach is an assistance layer, not a fifth mode.

For an uploaded portrait, analysis happens once. The same `GuideSpec` geometry can be rendered as Outline, Skeleton, Ghost, or Guide without rerunning reference analysis.

## Source of truth

This project uses **OpenSpec** for behavior contracts.

- [`openspec/specs/`](openspec/specs/) — current observable capability requirements
- [`openspec/changes/`](openspec/changes/) — proposed changes / design / tasks
- [`docs/PRODUCT.md`](docs/PRODUCT.md) — product doctrine / UX intent
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — implementation layers and invariants
- [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) — OpenSpec + branch + PR + review workflow
- [`docs/BENCHMARKS.md`](docs/BENCHMARKS.md) — benchmark research/provenance
- [`docs/OUTLINE_BENCHMARK.md`](docs/OUTLINE_BENCHMARK.md) — portrait renderer visual contract
- [`docs/USAGE.md`](docs/USAGE.md) — practical usage guide
- [`docs/RELEASE.md`](docs/RELEASE.md) — Web/APK distribution

For non-trivial behavior changes:

```text
proposal -> delta specs -> design -> tasks -> implementation -> verify -> archive
```

## Templates

Templates are reusable target geometry, such as:

- Power Stance
- Wall Lean
- Over the Shoulder
- Couple Walk
- Plate + Glass
- Leading Lines
- Big Sky
- Peak + Anchor

Current families:

- **Outline:** standing, lean, seated, squat, look-back, duo/couple/group shapes.
- **Skeleton:** power stance, hip pop, casual walk, arms crossed, wall lean, step forward, seated poses and couple interactions.
- **Ghost:** 62-slot PoseGhost POC across Selfie, Female, Male, Couple, Wedding, Friends & Groups.
- **Guide:** Travel, Street, Food, Portrait, Selfie, Pets, Family, Landscape, Buildings and Basic composition patterns.

Templates now expose fidelity where relevant:

- `APPROX POC` — reusable hand-authored geometry;
- `SOURCE-DERIVED` — geometry deliberately reconstructed/checked against a specific source image.

## What works now

- Expo / React Native shared UI for Web, iOS and Android
- Import a one-person portrait reference photo
- MediaPipe segmentation → outer contour
- MediaPipe pose → named body anchors
- MediaPipe face → approximate facing direction
- shared `GuideSpec` target geometry
- Outline / Skeleton / Ghost / Guide renderers
- source aspect-ratio preservation
- move / scale / reset target geometry
- Reference Overlay with Off / 15% / 30% / 50%
- advisory `Start at N×` lens hint
- category-filtered, virtualized template browser
- 62-slot Ghost POC catalog
- sampled Live Coach for eligible one-person portraits
- Stable Match hysteresis
- optional Auto Capture
- manual shutter + captured thumbnail
- camera readiness / mount-error guards

## Automatic portrait flow

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
```

## Sampled Live Coach

The current Expo MVP samples a low-quality still roughly every 1.7 seconds rather than receiving a true camera frame stream.

For exactly one-person portrait targets, the match engine compares:

1. framing / subject center
2. scale / crop
3. relative pose geometry when pose anchors are present
4. face direction when meaningful

One raw match shows `HOLD 1/2`; two consecutive matches produce `STABLE`. Duo/group templates remain manual overlay only until multi-person extraction/matching exists.

## Run locally

Use Node 22.13+ for Expo SDK 57.

```bash
npm install
npm run spec:validate
npm run typecheck
npm run web
```

Or:

```bash
npx expo start
```

Then `w` for Web, `i` for iOS simulator, or `a` for Android emulator. A physical phone is recommended for camera testing.

## Validation

### GitHub Actions: intentionally disabled

The repository currently contains **no active GitHub Actions validation workflow**. The hosted runner is unusable because of the account runner/billing issue, so GHA is deliberately removed instead of producing misleading red checks.

Preferred checks when a runnable local environment is available:

```bash
npm install
npm run spec:validate
npm run typecheck
npm run export:web
```

For deployable Web behavior, smoke-test the current EAS Hosting deployment. Camera/native behavior still requires physical-device testing.

Never claim a test/build passed if it did not actually run.

## Current limits / technical debt

- Automatic arbitrary-reference extraction targets one primary person.
- Live Coach / Stable Match / Auto Capture support exactly one-person portrait targets; duo/group templates are manual overlays.
- Live Coach is sampled, not continuous frame inference.
- Food/scene templates are predefined semantic geometry; arbitrary food/object/scene understanding is later.
- Current 62 Ghost slots are category/family reconstruction POCs, not a verified one-to-one commercial catalog.
- MediaPipe WASM/models load from public URLs on first use.
- Captured native photos currently live in Expo Camera cache; Save to Photos / Gallery and Share are not implemented yet.
- `App.tsx` remains monolithic and should be split incrementally.
- Older template/sample records still carry deprecated benchmark-shaped renderer keys and should migrate to canonical `displayMode`.
- No dedicated automated unit-test layer yet for pure geometry/matching/template invariants.
- Physical-device iOS/Android smoke testing is still required before calling camera behavior stable.

## Next milestones

1. Publish/install a current Android APK.
2. Continue replacing high-value approximate templates with source-derived geometry.
3. Save captured photos to Photos / Gallery and add Share / Export.
4. Add repeatable Web + iOS + Android smoke-test coverage outside GitHub Actions.
5. Add unit tests for match scoring, aspect-fit mapping, stable-match transitions, mode mapping and catalog invariants.
6. Migrate template/sample data fully to canonical `displayMode`.
7. True live frame processing (15–30 FPS target).
8. Better contour tracing around separated arms, legs and props.
9. Arbitrary multi-person / food / object extraction and matching.
10. Bundle MediaPipe runtime/models for offline use.
