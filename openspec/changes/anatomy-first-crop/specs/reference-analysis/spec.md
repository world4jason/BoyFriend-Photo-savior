# reference-analysis Delta Specification

## ADDED Requirements

### Requirement: Portrait crop classification prefers trusted anatomy
Portrait crop metadata SHALL prefer trusted lower-body anatomy over absolute segmentation-bottom position. When no trusted lower-body anatomy is available but a trusted shoulder is available, the system SHALL distinguish a tight head/shoulders crop from a longer upper-body crop using the segmented subject extent below that trusted shoulder. Shoulder-based classification SHALL be used only when the trusted shoulder lies within the segmented subject's vertical bounds. Segmentation-bottom thresholds SHALL be used when neither trusted lower-body anatomy nor a usable trusted shoulder supports the crop decision.

#### Scenario: Waist-up subject touches the bottom edge
- **WHEN** trusted hip landmarks are visible, no trusted knees/ankles are available, and the silhouette extends below 0.92 of image height
- **THEN** the crop is `half` rather than `full`

#### Scenario: Shoulder is high within a bottom-touching silhouette
- **WHEN** no trusted hip/knee/ankle is available, a trusted shoulder lies within the segmented subject, and more than 38% of the segmented subject height remains below the shoulder
- **THEN** the crop is `half` rather than `headshot` or `full`

#### Scenario: Shoulder is near the bottom of the segmented subject
- **WHEN** no trusted hip/knee/ankle is available, a trusted shoulder lies within the segmented subject, and at most 38% of the segmented subject height remains below the shoulder
- **THEN** the crop is `headshot`

#### Scenario: Shoulder disagrees with segmentation bounds
- **WHEN** a trusted pose shoulder lies above the segmentation top or below the segmentation bottom
- **THEN** the shoulder is not used for shoulder-extent crop classification and the system falls back to lower-confidence segmentation-only crop inference

#### Scenario: Trusted knee without ankle
- **WHEN** a trusted knee is visible but no trusted ankle is available
- **THEN** the crop is `three-quarter`

#### Scenario: Trusted ankle
- **WHEN** a trusted ankle is visible
- **THEN** the crop is `full`

#### Scenario: Nose-only pose evidence
- **WHEN** a trusted nose is available but no trusted shoulder/hip/knee/ankle supports crop classification
- **THEN** the nose alone does not force `headshot` and the system may use the segmentation-only fallback

#### Scenario: Isolated hand or arm evidence
- **WHEN** an elbow/wrist is detected but no trusted shoulder/hip/knee/ankle supports crop classification
- **THEN** the isolated arm evidence alone does not force a crop label

#### Scenario: Pose anatomy unavailable
- **WHEN** neither trusted lower-body anatomy nor a usable trusted shoulder is available
- **THEN** the system may fall back to the existing segmentation-bottom heuristic and keeps that inference advisory
