# product-model Specification

## Purpose

Defines the stable user-facing product concepts so reference analysis, templates, rendering, and coaching can evolve without conflating benchmark brands with product features.

## Requirements

### Requirement: Four display modes
The system SHALL expose exactly four core photographer-facing display modes: Outline, Skeleton, Ghost, and Guide. A raw source-photo Reference Overlay is an optional presentation layer and SHALL NOT be modeled as a fifth Display Mode.

#### Scenario: Portrait mode selection
- **WHEN** a portrait reference or portrait template is ready
- **THEN** the user can choose any supported mode among Outline, Skeleton, Ghost, and Guide without rerunning reference analysis

#### Scenario: Reference Overlay with Skeleton
- **WHEN** a source photo is available and the photographer enables Reference Overlay while Skeleton is active
- **THEN** the source photo and Skeleton can be shown together without changing the shared target geometry or selected Display Mode

### Requirement: Mode and Template are independent
The system SHALL treat Display Mode as how guidance is rendered and Template as the target pose/composition geometry.

#### Scenario: Reusing one portrait template
- **WHEN** a portrait template contains sufficient shared geometry
- **THEN** changing its Display Mode changes presentation only and does not create a second incompatible copy of the target

### Requirement: Benchmark brands are metadata
The system SHALL keep SOVS/SOVS2, PoseOverlay, PoseGhost, and reCompose as benchmark/research metadata rather than primary product taxonomy.

#### Scenario: User-facing labels
- **WHEN** the app presents mode choices
- **THEN** the primary labels are Outline, Skeleton, Ghost, and Guide

### Requirement: Outline is the default uploaded-portrait mode
The system SHALL default arbitrary uploaded portrait references to Outline after analysis begins or completes.

#### Scenario: Importing a portrait
- **WHEN** the user selects a new portrait photo
- **THEN** the target is initially shown as Outline unless the user explicitly selects another supported mode

### Requirement: Live Coach is orthogonal
The system SHALL treat Live Coach as an assistance layer rather than a fifth Display Mode.

#### Scenario: Switching portrait mode during coaching
- **WHEN** Live Coach is enabled and the user switches from Outline to Skeleton, Ghost, or Guide
- **THEN** matching continues against the same underlying target geometry
