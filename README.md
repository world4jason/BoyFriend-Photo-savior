# BoyFriend Photo Savior

A **reference/template -> shared geometry -> display mode -> camera guide -> live coach** MVP for Web, iOS and Android.

## Product model

The app has two separate concepts:

```text
MODE     = how the photographer sees guidance
TEMPLATE = what pose/composition the photographer is trying to make
```

### Four display modes

These are the product names shown to users:

| Mode | Benchmark inspiration | Shows |
| --- | --- | --- |
| **Outline** | SOVS / SOVS2 | clean outside contour; step into the shape |
| **Skeleton** | PoseOverlay | explicit body skeleton + meaningful joint anchors |
| **Ghost** | PoseGhost | translucent filled silhouette / stencil |
| **Guide** | reCompose | semantic zones, lines, eye lines, look space, object/scene relationships |

Benchmark brand names are research references, not the primary feature taxonomy.

For an uploaded portrait, the app analyzes the photo once and keeps one shared `GuideSpec`. Switching Outline / Skeleton / Ghost / Guide changes presentation only; it does not rerun MediaPipe.

### Templates

Templates are reusable shots such as:

- Power Stance
- Wall Lean
- Over the Shoulder
- Couple Walk
- Plate + Glass
- Leading Lines
- Big Sky
- Peak + Anchor

Each template has a recommended/default display mode. Portrait geometry can generally be viewed in any of the four modes; food/scene templates currently use **Guide**.

### Live Coach is not a fifth mode

Live Coach is an orthogonal assistance layer. It can operate while a portrait is displayed as Outline, Skeleton, Ghost or Guide.

## Template library

The MVP template library is bootstrapped from public product documentation, official sites and store listings. We reproduce useful **functional geometry/patterns** as normalized `GuideSpec` data.

Current seed families include:

- **Outline:** standing, lean, seated, squat, look-back, duo/couple/group shapes.
- **Skeleton:** power stance, hip pop, casual walk, arms crossed, natural stance, wall lean, step forward, seated poses and couple interactions.
- **Ghost:** a **62-slot PoseGhost POC library** across Selfie Essentials, Female, Male, Couple, Wedding, and Friends & Groups. The public store states the total and category families; our current per-category allocation/geometry is a POC reconstruction, not a claim of exact internal PoseGhost ordering.
- **Guide:** reCompose-style Travel, Street, Food, Portrait, Selfie, Pets, Family, Landscape, Buildings and Basic composition patterns.

Guide mode supports reusable semantic primitives:

```text
line   -> horizon / eye line / leading line
zone   -> person / plate / landmark / foreground target
point  -> golden point / peak / subject anchor
frame  -> frame-within-frame / architecture / action area
```

See:

- [`docs/PRODUCT.md`](docs/PRODUCT.md) — authoritative product definition
- [`docs/BENCHMARKS.md`](docs/BENCHMARKS.md) — benchmark research and source mapping
- [`docs/POSEGHOST_POC.md`](docs/POSEGHOST_POC.md) — PoseGhost 62-slot POC source notes and extraction plan
- [`src/templates/`](src/templates/) — normalized vector/template geometry
- [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) — branch / PR / review workflow

## Development rule

Non-trivial work follows:

```text
branch -> implementation -> PR -> deliberate self-review -> resolve findings -> squash merge
```

GitHub Actions hosted-runner billing/availability is currently **not a merge gate**. A runner failure with zero executed steps is infrastructure status, not an application test result.

## What works now

- Expo / React Native shared UI for Web, iOS and Android
- Import your own portrait reference image
- Reference images resized/compressed before crossing the native/DOM analysis bridge
- MediaPipe Image Segmenter -> one-person outer contour
- MediaPipe Pose Landmarker -> body anchors
- MediaPipe Face Landmarker -> left / right / front look direction
- One shared `GuideSpec` geometry model
- Four portrait display renderers: Outline / Skeleton / Ghost / Guide
- Display-mode selector in reference preview and live camera
- Guide-only preview
- Move / scale / reset target geometry
- Source aspect-ratio preservation
- Food/object Guide zones
- Scene Guide primitives (lines / zones / points / frames)
- Benchmark-inspired template library
- 62-slot Ghost POC catalog generated from public PoseGhost category/family information
- **Sampled Live Coach** for portraits
  - subject position score
  - subject size score
  - relative pose score
  - face-direction score
  - one prioritized coaching hint
- Camera capture with captured thumbnail
- Temporary native sampled-analysis files cleaned after use

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

Expo Camera does not expose the high-FPS frame-processor path we ultimately want, so the MVP samples a small still roughly every 1.7 seconds and runs it through the local analyzer.

The match engine compares:

1. framing / subject center
2. scale / crop
3. relative pose geometry
4. face direction when meaningful

The primary camera UI still gives one action at a time, for example `Subject -> left`, `Move closer`, `Face -> right`, or `✓ Match`.

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

## Validation

Preferred checks when a local runtime is available:

```bash
npm install
npm run typecheck
npm run export:web
```

Do not claim these passed when Actions/billing or local network access prevented them from running.

## Current limits

- Automatic arbitrary-reference extraction targets one primary person.
- Live Coach is sampled rather than continuous frame inference.
- Multi-person templates work as predefined geometry, but arbitrary multi-person extraction is later.
- Food/scene templates are predefined semantic geometry; arbitrary user-photo object/scene understanding is later.
- The current 62 Ghost slots are category/family reconstruction POCs; exact one-to-one commercial overlay extraction requires source captures from an installed copy.
- First MediaPipe model/runtime load currently needs network access.
- Camera features still require physical-device smoke testing before being called stable.

## Next milestones

1. Replace approximate Ghost POC slots with screenshot/app-derived normalized geometry where useful.
2. Template browser search/filter by category and people count.
3. More benchmark/open-reference templates and better vector previews.
4. Temporal smoothing / stable-match window before green `Match`.
5. Optional auto-capture only after multiple stable matches.
6. True live frame processing (15–30 FPS target).
7. Better contour tracing around separated arms, legs and props.
8. Arbitrary multi-person / food / object extraction.
9. Bundle MediaPipe runtime/models for offline use.
10. Save/share captured photos.
