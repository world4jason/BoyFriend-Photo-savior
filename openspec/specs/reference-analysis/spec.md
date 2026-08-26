# reference-analysis Specification

## Purpose

Defines how an uploaded portrait is converted into reusable local geometry for all display modes while failing softly when individual ML subsystems are unavailable.

## Requirements

### Requirement: Analyze a portrait once into shared geometry
The system SHALL analyze an uploaded portrait into a shared geometry model containing the available contour, pose joints, face direction, source aspect ratio, and crop/framing metadata.

#### Scenario: Successful portrait analysis
- **WHEN** segmentation, pose, and face analysis succeed
- **THEN** one GuideSpec contains the resulting contour, pose anchors, and face direction for reuse by all supported display modes

### Requirement: Local image processing
The system SHALL keep user reference and sampled camera image bytes on-device/in-browser during analysis.

#### Scenario: MediaPipe analysis
- **WHEN** a reference or sampled frame is analyzed
- **THEN** the image bytes are processed locally and are not uploaded to an application backend

### Requirement: Bounded analysis payloads
The system SHALL resize/compress images before passing them through the native/DOM analysis bridge.

#### Scenario: Large reference image
- **WHEN** a selected image exceeds the configured analysis dimension
- **THEN** the analysis copy is reduced before Base64 bridge transfer while the original reference remains available for preview

### Requirement: Fail soft across ML subsystems
The system SHALL preserve useful output when optional pose or face analysis fails and SHALL provide an editable fallback when automatic extraction cannot complete.

#### Scenario: Pose model unavailable
- **WHEN** segmentation succeeds but pose analysis fails
- **THEN** Outline/Ghost geometry remains usable and the user is not blocked from the reference screen

#### Scenario: Face model unavailable
- **WHEN** segmentation/pose succeeds but face analysis fails
- **THEN** the guide remains usable without a precise face-direction cue

### Requirement: One primary person for arbitrary references
The current automatic reference pipeline SHALL target one primary person and SHALL not claim arbitrary multi-person instance extraction.

#### Scenario: Multi-person photo
- **WHEN** an uploaded photo contains multiple people
- **THEN** the app treats automatic extraction as one-primary-person MVP behavior and predefined multi-person templates remain a separate capability

### Requirement: Analysis initialization can recover
The analysis runtime SHALL allow a later request to retry model/runtime initialization after a transient initialization failure.

#### Scenario: First model load fails
- **WHEN** initial MediaPipe runtime/model setup fails because a remote runtime asset is temporarily unavailable
- **THEN** a later analysis request can attempt initialization again without requiring a full app reload
