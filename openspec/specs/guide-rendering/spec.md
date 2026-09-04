# guide-rendering Specification

## Purpose

Defines how one shared target geometry is translated into the four photographer-facing display modes without changing the target itself.

## Requirements

### Requirement: Outline renders a coherent outside body contour
For portrait targets, Outline SHALL render the detected/source person contour when available and SHALL use a coherent curved outside-envelope fallback for vector-only templates. When source-derived interior contour rings are available, Outline SHALL render them as part of the same quiet silhouette geometry so meaningful enclosed negative space remains visible. Outline SHALL NOT look like a center-line skeleton widened into disconnected parallel rails.

#### Scenario: Source contour exists
- **WHEN** a portrait GuideSpec contains a closed person contour and Outline is selected
- **THEN** the camera shows a smoothed closed path derived from that contour rather than a faceted polygon or center-line skeleton

#### Scenario: Source contour contains interior rings
- **WHEN** a portrait GuideSpec contains an outer contour plus one or more interior contour rings and Outline is selected
- **THEN** the camera shows the smoothed outer contour and smoothed interior boundaries with consistent silhouette styling
- **AND** no joint dots or semantic direction arrows are added to those rings

#### Scenario: Vector-only portrait template
- **WHEN** a portrait template has pose/body geometry but no source contour
- **THEN** Outline renders a readable curved body envelope around the head, torso, arms, and legs
- **AND** each available arm/leg chain reads as a continuous limb shape rather than separate upper/lower parallel rails

### Requirement: Skeleton renders curated pose geometry
Skeleton SHALL render meaningful head/body segments and joint anchors without exposing the full raw landmark/debug set or pretending those center-lines are an outer contour.

#### Scenario: Skeleton selected
- **WHEN** a portrait with available shoulder/joint geometry is shown in Skeleton mode
- **THEN** the photographer sees a curated head/shoulder/spine/hip/limb graph and useful joint anchors

### Requirement: Ghost renders a translucent coherent stencil
Ghost SHALL render the portrait contour/body envelope as a translucent filled silhouette suitable for visual overlap, reusing the same coherent body-envelope geometry used by Outline when no source contour exists. When source-derived interior contour rings are present, Ghost SHALL preserve those regions as transparent negative space rather than filling the entire outer contour solid.

#### Scenario: Ghost with detected/source contour
- **WHEN** a portrait has a contour and Ghost is selected
- **THEN** the smoothed contour is visibly filled/translucent with a consistent outline rather than appearing as only a thin line

#### Scenario: Ghost source contour contains interior rings
- **WHEN** a portrait GuideSpec contains an outer contour plus interior contour rings and Ghost is selected
- **THEN** the compound silhouette uses even-odd fill behavior so the enclosed rings remain transparent
- **AND** the ring boundaries share the same consistent outline styling as the outer contour

#### Scenario: Ghost vector template
- **WHEN** a Ghost template has no source contour
- **THEN** the fallback head, torso, and continuous limb envelopes are filled enough to read as a stencil rather than a stick figure

#### Scenario: No interior-ring geometry
- **WHEN** a source portrait has only an outer contour
- **THEN** Outline and Ghost do not invent interior boundaries

### Requirement: Guide renders shot-specific semantics
Guide SHALL render semantic composition information such as subject/object zones, eye/look space, relationships, lines, points, and frames.

#### Scenario: Scene has semantic annotations
- **WHEN** a scene GuideSpec contains shot-specific annotations
- **THEN** Guide renders those annotations and does not blindly add a generic rule-of-thirds grid over them

#### Scenario: Basic rule-of-thirds template
- **WHEN** a Guide template intentionally represents basic thirds and has no stronger semantic annotations
- **THEN** the generic thirds grid may be rendered as the actual guide

### Requirement: Display transforms apply consistently
Move/scale transforms and source aspect ratio SHALL be applied consistently to the target geometry regardless of selected portrait Display Mode.

#### Scenario: User scales a portrait target
- **WHEN** the user changes target scale and switches between Outline, Skeleton, Ghost, and Guide
- **THEN** all supported representations remain aligned to the same transformed target placement

### Requirement: Silhouette modes stay visually quiet
Outline and Ghost SHALL avoid face-direction arrows, raw face-mesh points, joint dots, and semantic labels inside the body silhouette. Face/look direction belongs to Guide or Live Coach presentation.

#### Scenario: Side-facing portrait
- **WHEN** a target face direction is meaningfully left or right
- **THEN** Outline and Ghost preserve a clean silhouette while Guide or Live Coach may communicate the direction separately
