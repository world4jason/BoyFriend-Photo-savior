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

### Requirement: Lens guidance is advisory and prefers reliable source metadata
The camera SHALL present a non-binding starting lens hint such as `Start at 2×` when guidance is available. For a user-picked reference, usable 35mm-equivalent EXIF SHALL take precedence over crop/framing heuristics.

#### Scenario: EXIF focal length available
- **WHEN** ImagePicker exposes a finite positive 35mm-equivalent focal length for the selected reference
- **THEN** the app derives the nearest supported 0.5× / 1× / 2× / 3× starting hint from that metadata
- **AND** labels the hint as EXIF-based

#### Scenario: EXIF missing or invalid
- **WHEN** no supported positive finite 35mm-equivalent focal value is available
- **THEN** the app falls back to the existing crop/framing lens hint
- **AND** labels the result as estimated

#### Scenario: Cross-platform no-EXIF path
- **WHEN** the current platform does not expose EXIF for the selected asset
- **THEN** reference analysis and matching still proceed normally using the existing heuristic hint

#### Scenario: No forced zoom
- **WHEN** a 2× or 3× hint is displayed
- **THEN** the app does not assume Expo Camera's normalized 0–1 `zoom` value corresponds to that physical multiplier
