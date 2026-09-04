## MODIFIED Requirements

### Requirement: Lens guidance prefers reliable source metadata
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

#### Scenario: No forced device zoom
- **WHEN** an EXIF-derived 2× or 3× hint is shown
- **THEN** the app does not assume Expo Camera's normalized 0–1 `zoom` value maps directly to that physical multiplier
