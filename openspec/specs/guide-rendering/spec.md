# guide-rendering Specification

## Purpose

Defines how one shared target geometry is translated into the four photographer-facing display modes without changing the target itself.

## Requirements

### Requirement: Outline renders an outside body envelope
For portrait targets, Outline SHALL render the detected person contour when available and SHALL use an outside-envelope fallback for vector-only templates.

#### Scenario: Segmentation contour exists
- **WHEN** a portrait GuideSpec contains a closed person contour and Outline is selected
- **THEN** the camera shows that outside contour rather than a center-line skeleton

#### Scenario: Vector-only portrait template
- **WHEN** a portrait template has pose/body geometry but no segmentation contour
- **THEN** Outline renders a readable outside body envelope around the head, torso, arms, and legs

### Requirement: Skeleton renders curated pose geometry
Skeleton SHALL render meaningful head/body segments and joint anchors without exposing the full raw landmark/debug set.

#### Scenario: Skeleton selected
- **WHEN** a portrait with available shoulder/joint geometry is shown in Skeleton mode
- **THEN** the photographer sees a curated head/shoulder/spine/hip/limb graph and useful joint anchors

### Requirement: Ghost renders a translucent stencil
Ghost SHALL render the portrait contour/body envelope as a translucent filled silhouette suitable for visual overlap.

#### Scenario: Ghost with detected contour
- **WHEN** a portrait has a segmentation contour and Ghost is selected
- **THEN** the contour is visibly filled/translucent rather than appearing as only a thin outline

#### Scenario: Ghost vector template
- **WHEN** a Ghost template has no segmentation contour
- **THEN** the fallback head, torso, and limb envelopes are filled enough to read as a stencil rather than a stick figure

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

### Requirement: Face direction is a semantic cue, not debug mesh
Outline, Skeleton, and Guide MAY show a small face/look-direction cue when useful; raw face-mesh landmarks SHALL not be exposed as the normal guide.

#### Scenario: Side-facing portrait
- **WHEN** the target face direction is meaningfully left or right
- **THEN** supported modes may show a concise direction cue without rendering a dense face mesh
