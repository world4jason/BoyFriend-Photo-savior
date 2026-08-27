# shooting-aids Specification

## Purpose

Defines photographer-facing aids that sit alongside the four Display Modes without changing the shared target geometry or matching semantics.

## Requirements

### Requirement: Reference Overlay is available for source-backed targets
When a target has a source image, the camera SHALL offer a translucent Reference Overlay layer independently of Display Mode.

#### Scenario: Default overlay strength
- **WHEN** a source-backed target opens in camera
- **THEN** the Reference Overlay defaults to 30% opacity

#### Scenario: Overlay opacity choices
- **WHEN** the source image is available in camera
- **THEN** the photographer can choose Off, 15%, 30%, or 50% opacity

#### Scenario: Shared transform
- **WHEN** the target is moved or scaled
- **THEN** Reference Overlay uses the same aspect-fit frame and target transform as GuideOverlay

#### Scenario: Matching independence
- **WHEN** the photographer changes Reference Overlay opacity
- **THEN** Live Coach target geometry and Stable Match state are not changed by that presentation setting

### Requirement: Lens guidance is advisory
The camera SHALL present a non-binding starting lens hint such as `Start at 2×` when guidance is available.

#### Scenario: Framing heuristic
- **WHEN** no reliable focal metadata exists
- **THEN** the app may estimate a starting multiplier from crop/framing and labels the hint as estimated

#### Scenario: EXIF-based guidance
- **WHEN** future/native reference selection exposes usable 35mm-equivalent focal metadata
- **THEN** the lens-hint helper can convert that metadata to the nearest practical 0.5× / 1× / 2× / 3× starting hint

#### Scenario: No forced zoom
- **WHEN** a 2× or 3× hint is displayed
- **THEN** the app does not assume Expo Camera's normalized 0–1 `zoom` value corresponds to that physical multiplier
