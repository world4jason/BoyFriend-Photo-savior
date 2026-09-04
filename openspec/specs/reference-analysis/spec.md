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
The system SHALL preserve useful output when optional pose or face analysis fails and SHALL provide an editable fallback when automatic extraction cannot complete. When dedicated face analysis is unavailable, fallback left/right face direction inferred from pose landmarks SHALL use only finite pose coordinates. When confidence is present, it SHALL also be finite and meet the applicable reference-analysis trust threshold. If trusted fallback landmarks are insufficient, the system SHALL avoid inventing a precise left/right turn.

#### Scenario: Pose model unavailable
- **WHEN** segmentation succeeds but pose analysis fails
- **THEN** Outline/Ghost geometry remains usable and the user is not blocked from the reference screen

#### Scenario: Face model unavailable with trusted pose face landmarks
- **WHEN** dedicated face analysis is unavailable but trusted nose plus eye/ear pose landmarks are available
- **THEN** the guide may infer a fallback left/right face direction from those trusted points

#### Scenario: Face model unavailable with low-confidence pose face landmarks
- **WHEN** dedicated face analysis is unavailable and the pose eye/ear landmarks are below the fallback trust threshold
- **THEN** the guide remains usable without claiming a precise left/right turn

#### Scenario: Pose landmark has no confidence field
- **WHEN** a pose landmark has finite coordinates but no confidence value is available
- **THEN** the landmark may remain eligible for shared geometry and fallback inference according to the applicable geometric requirements

#### Scenario: Non-finite pose landmark
- **WHEN** a pose landmark has NaN/Infinity coordinates or a present confidence value is non-finite
- **THEN** that landmark is excluded from shared guide geometry and fallback face-direction inference

#### Scenario: Face model unavailable without trusted fallback landmarks
- **WHEN** dedicated face analysis fails and trusted pose face landmarks are also unavailable
- **THEN** the guide remains usable without a precise face-direction cue

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
