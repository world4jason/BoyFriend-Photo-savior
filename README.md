# BoyFriend Photo Savior

A **reference/template -> shared geometry -> display mode -> camera guide -> live coach** MVP for Web, iOS and Android.

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

This project now uses **OpenSpec** for behavior contracts.

- [`openspec/specs/`](openspec/specs/) — current observable capability requirements/scenarios
- [`openspec/config.yaml`](openspec/config.yaml) — project/spec workflow context and rules
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — implementation layers, invariants, technical debt
- [`docs/PRODUCT.md`](docs/PRODUCT.md) — product doctrine / UX intent
- [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) — OpenSpec + branch + PR + review workflow
- [`docs/BENCHMARKS.md`](docs/BENCHMARKS.md) — benchmark research/provenance
- [`docs/POSEGHOST_POC.md`](docs/POSEGHOST_POC.md) — 62-slot Ghost POC notes

For future non-trivial behavior changes, use an OpenSpec change rather than editing code first:

```text
proposal -> delta specs -> design -> tasks -> implementation -> verify -> archive
```

OpenSpec setup/usage is documented in `docs/DEVELOPMENT.md`.

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

Current seed families:

- **Outline:** standing, lean, seated, squat, look-back, duo/couple/group shapes.
- **Skeleton:** power stance, hip pop, casual walk, arms crossed, natural stance, wall lean, step forward, seated poses and couple interactions.
- **Ghost:** **62-slot PoseGhost POC** across Selfie Essentials, Female, Male, Couple, Wedding, Friends & Groups. The total/category families come from the public listing; our slot allocation and geometry are POC reconstruction, not claimed one-to-one commercial ordering.
- **Guide:** Travel, Street, Food, Portrait, Selfie, Pets, Family, Landscape, Buildings and Basic composition patterns.

Guide supports reusable semantic primitives:

```text
line   -> horizon / eye line / leading line
zone   -> person / plate / landmark / foreground target
point  -> golden point / peak / subject anchor
frame  -> frame-within-frame / architecture / action area
```

## What works now

- Expo / React Native shared UI for Web, iOS and Android
- Import a portrait reference photo
- Resize/compress reference images before native/DOM bridge transfer
- MediaPipe Image Segmenter -> one-person outer contour
- MediaPipe Pose Landmarker -> body anchors
- MediaPipe Face Landmarker -> approximate left/right/front look direction
- Retryable MediaPipe initialization after transient runtime/model-load failure
- Shared `GuideSpec` target geometry
- Canonical product `DisplayMode`: `outline | skeleton | ghost | guide`
- Compatibility mapping for older benchmark-shaped template keys while data migrates
- Four portrait renderers: Outline / Skeleton / Ghost / Guide
- Display-mode selector in reference preview and live camera
- Guide-only preview
- Move / scale / reset target geometry
- Source aspect-ratio preservation
- Food/object Guide zones
- Scene Guide primitives: lines / zones / points / frames
- Benchmark-inspired template library
- 62-slot Ghost POC catalog
- **Sampled Live Coach** for portraits
  - subject position score
  - subject size score
  - relative pose score when available
  - face-direction score when meaningful
  - one prioritized coaching hint
- Camera capture with captured thumbnail
- Best-effort cleanup of native temporary analysis/camera files

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

Pose and face are enhancements. If one optional subsystem fails, the app should preserve whatever useful guide geometry remains.

## Sampled Live Coach

The current Expo MVP samples a low-quality still roughly every 1.7 seconds rather than receiving a true camera frame stream.

The match engine compares:

1. framing / subject center
2. scale / crop
3. relative pose geometry
4. face direction when meaningful

The camera shows one prioritized correction such as `Subject -> left`, `Move closer`, `Face -> right`, or `✓ Match`.

This is intentionally labeled **sampled**, not 15–30 FPS live tracking. A future frame-processor adapter should replace the camera-analysis input layer without changing `GuideSpec` or match semantics.

## Development workflow

Non-trivial behavior work follows:

```text
branch
-> inspect current OpenSpec specs
-> create/review OpenSpec change
-> implement
-> PR
-> deliberate complete-diff review
-> resolve P0/P1
-> verify implementation vs specs
-> squash merge
-> archive/sync OpenSpec change
```

GitHub Actions hosted-runner billing/availability is currently **not a merge gate**. A runner failure with zero executed steps is infrastructure status, not an application test result.

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

A physical phone is recommended for camera testing. Web camera access outside localhost generally requires HTTPS.

### OpenSpec

```bash
npm install -g @fission-ai/openspec@latest
openspec list --specs
openspec validate --specs
```

## Validation

Preferred checks when a runnable environment is available:

```bash
openspec validate --specs
npm install
npm run typecheck
npm run export:web
```

Do not claim these passed when Actions billing or local network/runtime access prevented them from running.

## Current limits / technical debt

- Automatic arbitrary-reference extraction targets one primary person.
- Live Coach is sampled, not continuous frame inference.
- Multi-person templates are predefined geometry; arbitrary multi-person instance analysis is later.
- Food/scene templates are predefined semantic geometry; arbitrary food/object/scene understanding is later.
- Current 62 Ghost slots are category/family reconstruction POCs; exact one-to-one overlay extraction requires better source captures.
- MediaPipe WASM/models currently load from public URLs on first use; user image bytes remain local, but first analysis is not fully offline.
- `App.tsx` is still too monolithic and should be split incrementally by feature boundary.
- Ghost (62) and Guide (~40) catalog browsing needs category-first filtering/virtualization.
- Older template/sample records still use deprecated benchmark-shaped renderer keys and should migrate incrementally to canonical `displayMode`.
- No dedicated unit-test layer yet for pure geometry/matching/template invariants.
- Physical-device camera smoke testing is still required before calling camera behavior stable.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the reviewed architecture and prioritized debt.

## Next milestones

1. Category-first / virtualized template browser for large Ghost and Guide catalogs.
2. Migrate template/sample data fully to canonical `displayMode`.
3. Add unit tests for match scoring, mode mapping, catalog counts, and normalized-coordinate invariants.
4. Replace approximate Ghost POC slots with better source-derived normalized geometry where useful.
5. Temporal smoothing / stable-match window before green Match.
6. Optional auto-capture after multiple stable matches.
7. True live frame processing (15–30 FPS target).
8. Better contour tracing around separated arms, legs and props.
9. Arbitrary multi-person / food / object extraction.
10. Bundle MediaPipe runtime/models for offline use.
11. Save/share captured photos.
