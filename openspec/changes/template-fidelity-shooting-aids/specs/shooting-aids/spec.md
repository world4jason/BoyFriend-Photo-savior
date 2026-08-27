# shooting-aids delta

## ADDED Requirements

### Requirement: Reference Overlay is available for source-backed targets
When a target has a source image, the camera SHALL offer a translucent Reference Overlay layer independently of Display Mode.

#### Scenario: Default overlay strength
- **WHEN** the photographer enables Reference Overlay
- **THEN** 30% opacity is available as the primary/default overlay strength

#### Scenario: Overlay opacity choices
- **WHEN** the source image is available in camera
- **THEN** the photographer can choose Off, 15%, 30%, or 50% opacity

#### Scenario: Shared transform
- **WHEN** the target is moved or scaled
- **THEN** the Reference Overlay uses the same aspect-fit frame and target transform as GuideOverlay

### Requirement: Lens guidance is a hint, not a forced device zoom
The camera SHALL present an optional starting zoom hint such as `Start at 2×` when guidance is available.

#### Scenario: EXIF focal length
- **WHEN** an uploaded native photo exposes usable 35mm-equivalent focal-length EXIF
- **THEN** the app derives a nearest practical starting multiplier and labels the hint as EXIF-based

#### Scenario: Missing EXIF
- **WHEN** no usable focal metadata is available
- **THEN** the app MAY use template metadata or crop heuristics and labels the result accordingly

#### Scenario: Cross-platform behavior
- **WHEN** a 2× or 3× hint is shown
- **THEN** the app does not assume Expo Camera's normalized zoom property maps directly to that physical multiplier
