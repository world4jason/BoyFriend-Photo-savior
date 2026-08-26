# template-library Specification

## Purpose

Defines reusable pose and composition targets independently from display rendering, including benchmark provenance and POC limitations.

## Requirements

### Requirement: Templates are normalized geometry
The system SHALL store reusable templates as normalized geometry and semantic annotations rather than requiring copied source screenshots at shooting time.

#### Scenario: Opening a template
- **WHEN** the user selects a template
- **THEN** the app loads a GuideSpec target that can be rendered directly in the camera

### Requirement: Template has a recommended mode
Each template SHALL identify a recommended/default Display Mode, while portrait templates MAY be viewed in other supported modes when their geometry is sufficient.

#### Scenario: Power stance template
- **WHEN** the user selects a pose template whose recommended mode is Skeleton
- **THEN** Skeleton is selected initially and the user may switch to other portrait modes without changing target geometry

### Requirement: Scene and food templates use semantic Guide geometry
Food and scene templates SHALL use Guide annotations/objects such as zones, lines, points, frames, labels, and relationships rather than pretending to have human skeletons.

#### Scenario: Plate and glass
- **WHEN** the user selects a Plate + Glass template
- **THEN** Guide mode shows the relative placement/size targets for the plate and glass

### Requirement: Benchmark provenance is explicit
Benchmark-derived templates SHALL retain source/benchmark metadata separately from product display-mode names.

#### Scenario: Benchmark template card
- **WHEN** a template was inspired by a public benchmark product
- **THEN** its benchmark source may be shown as secondary provenance while the product mode remains Outline, Skeleton, Ghost, or Guide

### Requirement: PoseGhost POC catalog is labeled approximate
The Ghost catalog SHALL distinguish the 62-slot family-based POC reconstruction from a verified one-to-one commercial overlay catalog.

#### Scenario: Ghost catalog count
- **WHEN** the POC Ghost library is loaded
- **THEN** it contains exactly 62 generated slots across the documented public category families without claiming the internal PoseGhost ordering or per-category distribution

### Requirement: Template browser filters by display mode
The template browser SHALL let the user narrow the visible catalog by the four Display Modes.

#### Scenario: Selecting Ghost in the library
- **WHEN** the user selects the Ghost template filter
- **THEN** the visible catalog contains Ghost-recommended templates and does not mix in Outline, Skeleton, or Guide cards
