## MODIFIED Requirements

### Requirement: Outline renders a coherent body contour
Outline SHALL render a portrait target as a clean silhouette/outer contour without joint dots, skeleton center-lines, or disconnected per-segment limb rails.

#### Scenario: Source-derived contour
- **WHEN** a portrait target contains `PersonGuide.contour`
- **THEN** Outline renders a smoothed closed path derived from that contour
- **AND** does not replace it with generic limb geometry

#### Scenario: Approximate portrait seed
- **WHEN** a portrait target has pose anchors but no source contour
- **THEN** Outline renders curved torso and continuous arm/leg envelope paths that read as a person silhouette rather than a widened skeleton

### Requirement: Ghost uses silhouette geometry optimized for low opacity
Ghost SHALL reuse coherent silhouette/envelope geometry with translucent fill and consistent outline styling.

#### Scenario: Approximate Ghost seed
- **WHEN** a portrait target lacks a source contour
- **THEN** Ghost uses the same continuous body envelopes as Outline with low-opacity fill rather than independent thick skeleton strokes

### Requirement: Skeleton remains explicit pose geometry
Skeleton SHALL render named body anchors as center-line segments and joint nodes, independently from Outline/Ghost silhouette styling.

#### Scenario: Switching Outline to Skeleton
- **WHEN** the user switches a portrait target from Outline to Skeleton
- **THEN** the presentation changes from silhouette geometry to explicit pose segments/nodes without changing the target anchors

### Requirement: Silhouette modes stay visually quiet
Outline and Ghost SHALL avoid face-direction arrows or semantic labels inside the body silhouette.

#### Scenario: Side-facing portrait
- **WHEN** a target's head faces left or right
- **THEN** Outline/Ghost preserve the body silhouette without adding a direction arrow; direction may be communicated by Guide or Live Coach instead
