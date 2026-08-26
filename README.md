# BoyFriend Photo Savior

A **reference/template -> shared geometry -> display mode -> camera guide -> live coach** MVP for Web, iOS and Android.

> 想直接使用：看 [`docs/USAGE.md`](docs/USAGE.md)。

## Product model

```text
INPUT                  SHARED TARGET             DISPLAY                 ASSISTANCE
Reference photo ---\                            Outline ----\
                    -> GuideSpec geometry ----> Skeleton ----+----> Camera + Live Coach
Template ----------/                            Ghost -------+
                                              Guide -------/
```

There are two separate product concepts:

```text
DISPLAY MODE = how the photographer sees guidance
TEMPLATE     = what pose/composition the photographer is trying to make
```

The four product-facing display modes are:

| Mode | Benchmark inspiration | Shows |
| --- | --- | --- |
| **Outline** | SOVS / SOVS2 | clean outside contour; step into the shape |
| **Skeleton** | PoseOverlay | curated body skeleton + meaningful joint anchors |
| **Ghost** | PoseGhost | translucent filled silhouette / stencil |
| **Guide** | reCompose | semantic zones, lines, eye lines, look space, object/scene relationships |

Benchmark brands are research/provenance metadata, not primary product taxonomy. Live Coach is an assistance layer, not a fifth mode.

For an uploaded portrait, analysis happens once. The same geometry can be presented as Outline, Skeleton, Ghost, or Guide without rerunning the reference models.

## Source of truth

This project uses **OpenSpec** for behavior contracts.

- [`docs/USAGE.md`](docs/USAGE.md) — end-user MVP usage guide
- [`openspec/specs/`](openspec/specs/) — current observable capability requirements/scenarios
- [`openspec/config.yaml`](openspec/config.yaml) — project/spec workflow context and rules
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — implementation layers, invariants, technical debt
- [`docs/PRODUCT.md`](docs/PRODUCT.md) — product doctrine / UX intent
- [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) — OpenSpec + branch + PR + review workflow
- [`docs/BENCHMARKS.md`](docs/BENCHMARKS.md) — benchmark research/provenance
- [`docs/POSEGHOST_POC.md`](docs/POSEGHOST_POC.md) — 62-slot Ghost POC notes

For future non-trivial behavior changes:

```text
proposal -> delta specs -> design -> tasks -> implementation -> verify -> archive
```

## Templates

Templates are reusable target geometry, for example:

- Power Stance
- Wall Lean
- Over the Shoulder
- Couple Walk
- Plate + Glass
- Leading Lines
- Big Sky
- Peak + Anchor

Each template has a recommended/default display mode. Portrait geometry can generally be viewed in any of the four modes; food/scene templates currently use Guide.

Current families:

- **Outline:** standing, lean, seated, squat, look-back, duo/couple/group shapes.
- **Skeleton:** power stance, hip pop, casual walk, arms crossed, natural stance, wall lean, step forward, seated poses and couple interactions.
- **Ghost:** **62-slot PoseGhost POC** across Selfie Essentials, Female, Male, Couple, Wedding, Friends & Groups.
- **Guide:** Travel, Street, Food, Portrait, Selfie, Pets, Family, Landscape, Buildings and Basic composition patterns.

Large catalogs now use **Display Mode -> Category -> virtualized FlatList** browsing rather than mounting every SVG preview at once.

## What works now

- Expo / React Native shared UI for Web, iOS and Android
- Import a one-person portrait reference photo
- Reference image resize/compression before native/DOM analysis bridge
- MediaPipe Image Segmenter -> outer contour
- MediaPipe Pose Landmarker -> body anchors
- MediaPipe Face Landmarker -> approximate left/right/front look direction
- Retryable MediaPipe initialization after transient runtime/model-load failure
- Shared `GuideSpec` target geometry
- Four display renderers: Outline / Skeleton / Ghost / Guide
- Guide-only preview
- Move / scale / reset target geometry
- Source aspect-ratio preservation
- Food/object Guide zones
- Scene Guide primitives: lines / zones / points / frames
- Category-filtered, virtualized template browser
- 62-slot Ghost POC catalog
- **Sampled Live Coach for eligible one-person portraits**
  - framing / subject position
  - subject scale
  - relative pose when the target encodes pose intent
  - face direction when meaningful
  - one prioritized coaching hint
  - target matching uses the same camera aspect-fit geometry as the visible overlay
- **Stable Match**
  - 2 consecutive raw matches to enter stable
  - 2 consecutive minor misses to exit
  - severe framing/scale miss exits immediately
  - EMA-smoothed headline score
- **Optional Auto Capture**
  - OFF by default each camera session
  - fresh stable confirmation after opt-in
  - one automatic photo per stable-entry transition
- Manual shutter + captured thumbnail
- Camera readiness / mount-error guards
- Best-effort cleanup of native temporary analysis files

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

For **exactly one-person portrait targets**, the match engine compares:

1. framing / subject center
2. scale / crop
3. relative pose geometry when the target encodes pose anchors
4. face direction when meaningful

The camera shows one prioritized correction such as `Subject -> left`, `Move closer`, `Face -> right`, or `Show the full pose`.

A single raw match shows `HOLD 1/2`; two consecutive matches produce `STABLE`. Duo/group portrait templates remain **manual overlay only** until multi-person extraction/matching exists.

This is intentionally labeled **sampled**, not 15–30 FPS live tracking.

## Run

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

Then:

- `w` — Web
- `i` — iOS simulator
- `a` — Android emulator

A physical phone is recommended for camera testing. Web camera access outside localhost generally requires HTTPS.

## Validation

Preferred checks when a runnable environment is available:

```bash
npm install
npm run spec:validate
npm run typecheck
npm run export:web
```

GitHub Actions hosted-runner billing/availability is currently **not a merge gate**. Do not claim checks passed when the runner or local runtime did not execute them.

## Current limits / technical debt

- Automatic arbitrary-reference extraction targets one primary person.
- Live Coach / Stable Match / Auto Capture support exactly one-person portrait targets; duo/group templates are manual overlays.
- Live Coach is sampled, not continuous frame inference.
- Food/scene templates are predefined semantic geometry; arbitrary food/object/scene understanding is later.
- Current 62 Ghost slots are category/family reconstruction POCs, not a verified one-to-one commercial catalog.
- MediaPipe WASM/models currently load from public URLs on first use; user image bytes remain local, but first analysis is not fully offline.
- Captured native photos currently live in Expo Camera's app cache; **Save to Photos / Gallery and Share are not implemented yet**.
- Built-in React Native `SafeAreaView` is deprecated; current camera geometry uses measured viewport dimensions, but migration to `react-native-safe-area-context` remains technical debt.
- `App.tsx` remains monolithic and should be split incrementally.
- Older template/sample records still carry deprecated benchmark-shaped renderer keys and should migrate to canonical `displayMode`.
- No dedicated automated unit-test layer yet for pure geometry/matching/template invariants.
- Physical-device iOS/Android smoke testing is still required before calling camera behavior stable.

See [`docs/USAGE.md`](docs/USAGE.md) for practical usage and [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the reviewed architecture.

## Next milestones

1. Save captured photos to Photos / Gallery and add Share / Export.
2. Add repeatable Web + iOS + Android smoke-test coverage.
3. Add unit tests for match scoring, aspect-fit mapping, stable-match transitions, mode mapping and catalog invariants.
4. Migrate template/sample data fully to canonical `displayMode`.
5. Migrate legacy SafeAreaView usage to `react-native-safe-area-context`.
6. Replace approximate Ghost POC slots with better source-derived normalized geometry where useful.
7. True live frame processing (15–30 FPS target).
8. Better contour tracing around separated arms, legs and props.
9. Arbitrary multi-person / food / object extraction and matching.
10. Bundle MediaPipe runtime/models for offline use.
