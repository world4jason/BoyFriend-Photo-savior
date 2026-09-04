# reference-analysis Delta Specification

## MODIFIED Requirements

### Requirement: Fail soft across ML subsystems
The system SHALL preserve useful output when optional pose or face analysis fails and SHALL provide an editable fallback when automatic extraction cannot complete. When dedicated face analysis is unavailable, fallback left/right face direction inferred from pose landmarks SHALL use only finite pose coordinates whose confidence meets the reference-analysis trust threshold. If trusted fallback landmarks are insufficient, the system SHALL avoid inventing a precise left/right turn.

#### Scenario: Face model unavailable with trusted pose face landmarks
- **WHEN** dedicated face analysis is unavailable but trusted nose plus eye/ear pose landmarks are available
- **THEN** the guide may infer a fallback left/right face direction from those trusted points

#### Scenario: Face model unavailable with low-confidence pose face landmarks
- **WHEN** dedicated face analysis is unavailable and the pose eye/ear landmarks are below the fallback trust threshold
- **THEN** the guide remains usable without claiming a precise left/right turn

#### Scenario: Non-finite pose landmark
- **WHEN** a pose landmark has NaN/Infinity coordinates or non-finite confidence
- **THEN** that landmark is excluded from shared guide geometry and fallback face-direction inference

#### Scenario: Face model unavailable
- **WHEN** segmentation/pose succeeds but face analysis fails
- **THEN** the guide remains usable without a precise face-direction cue
