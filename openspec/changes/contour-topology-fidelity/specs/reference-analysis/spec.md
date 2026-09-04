# reference-analysis Delta

## ADDED Requirements

### Requirement: Source-derived contour preserves exterior silhouette topology
When segmentation succeeds, the system SHALL derive the source person contour from ordered mask boundary geometry rather than reducing every row to only its leftmost and rightmost foreground pixel. The selected source contour SHALL preserve meaningful exterior concavities that remain connected to background while staying within a bounded normalized point budget suitable for shared GuideSpec rendering.

#### Scenario: Arm is separated from the torso below the shoulder
- **WHEN** the segmented primary person contains connected shoulder geometry but visible exterior background between the hanging arm and torso
- **THEN** the resulting source contour follows the arm/torso concavity instead of filling that gap with a row-wise hull

#### Scenario: Legs contain exterior negative space
- **WHEN** the segmented primary person has an exterior gap between separated legs
- **THEN** the resulting source contour preserves that exterior indentation when it belongs to the outer boundary

### Requirement: Primary contour ignores disconnected foreground noise
The system SHALL trace the largest coherent foreground component for the current one-primary-person automatic reference flow rather than allowing a small disconnected mask island to determine the source contour.

#### Scenario: Small disconnected foreground island
- **WHEN** a person mask contains one large coherent person component plus a much smaller disconnected foreground blob
- **THEN** the source contour is derived from the large component and the small island does not expand or displace the person's bounds

### Requirement: Primary-contour eligibility remains resolution-safe
The primary component SHALL be accepted using row-based silhouette evidence compatible with the previous extractor rather than a fixed percentage of total mask area. The evidence gate SHALL keep small but sufficiently wide subjects eligible as mask resolution increases while rejecting long foreground slivers that never reach a believable person width.

#### Scenario: Small subject in a higher-resolution mask
- **WHEN** the largest coherent component has at least eight rows whose foreground width exceeds the previous scanline evidence threshold
- **THEN** the component remains eligible for boundary tracing even when its total area is below a fixed percentage of the full mask

#### Scenario: Long one-pixel foreground sliver
- **WHEN** the largest coherent component spans many rows but never exceeds the minimum per-row foreground width
- **THEN** analysis does not accept that sliver as a valid person contour solely because it has enough total pixels

### Requirement: Contour tracing fails soft
The system SHALL retain a bounded fallback contour path when topology-preserving boundary tracing cannot produce a usable closed outer loop.

#### Scenario: Boundary trace is unusable
- **WHEN** foreground exists but the boundary walker cannot produce a valid source loop
- **THEN** reference analysis falls back to the legacy scanline-envelope strategy for the selected primary component rather than failing the whole portrait solely because the improved tracer failed

### Requirement: Single-ring contour does not overclaim interior-hole fidelity
The current shared person contour SHALL continue to represent one outer ring. Interior holes MAY be ignored until GuideSpec supports multiple contour rings.

#### Scenario: Foreground component contains an enclosed background hole
- **WHEN** the selected person component contains both an outer boundary and one or more enclosed background holes
- **THEN** the system chooses the largest-area outer loop for `PersonGuide.contour` and does not claim the hole is represented as a separate contour
