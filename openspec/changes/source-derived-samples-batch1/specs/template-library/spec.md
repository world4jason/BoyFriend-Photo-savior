## ADDED Requirements

### Requirement: Source-backed instant examples may carry source-derived geometry
An instant example MAY be labeled `source-derived` only when its shared geometry was reconstructed and visually checked against that specific displayed source image.

#### Scenario: Low squat example
- **WHEN** the photographer opens the Low squat instant example
- **THEN** its contour and pose anchors correspond to the displayed Low squat source rather than the reusable generic squat pose family
- **AND** the target remains usable in Outline, Skeleton, Ghost, and Guide
- **AND** the source image remains available to Reference Overlay
