# reference-analysis Delta Specification

## ADDED Requirements

### Requirement: Portrait crop classification prefers trusted anatomy
When trusted pose anatomy is available, portrait crop metadata SHALL be derived from the lowest meaningful trusted anatomical evidence rather than from whether the segmentation silhouette touches the image bottom. Segmentation-bottom thresholds SHALL be used only when no trusted pose anatomy is available.

#### Scenario: Waist-up subject touches the bottom edge
- **WHEN** trusted hip landmarks are visible, no trusted knees/ankles are available, and the silhouette extends below 0.92 of image height
- **THEN** the crop is `half` rather than `full`

#### Scenario: Face-and-shoulders subject touches the bottom edge
- **WHEN** trusted face/shoulder pose evidence is available but no trusted arm/hip/knee/ankle evidence is available
- **THEN** the crop is `headshot` regardless of the silhouette bottom coordinate

#### Scenario: Upper-body arms are visible without lower-body anatomy
- **WHEN** a trusted elbow or wrist is visible but no trusted hip/knee/ankle evidence is available
- **THEN** the crop is `half`

#### Scenario: Trusted knee without ankle
- **WHEN** a trusted knee is visible but no trusted ankle is available
- **THEN** the crop is `three-quarter`

#### Scenario: Trusted ankle
- **WHEN** a trusted ankle is visible
- **THEN** the crop is `full`

#### Scenario: Pose anatomy unavailable
- **WHEN** no trusted pose anatomy is available
- **THEN** the system may fall back to the existing segmentation-bottom heuristic and keeps that inference advisory
