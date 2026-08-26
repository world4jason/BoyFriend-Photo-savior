# live-coach Specification

## Purpose

Defines photography-oriented sampled alignment feedback for portrait targets without overstating frame rate or turning pose matching into exercise-form scoring.

## Requirements

### Requirement: Portrait-only sampled coaching in the MVP
The current Live Coach SHALL run only for portrait targets and SHALL be labeled as sampled rather than continuous real-time tracking.

#### Scenario: Portrait camera opens
- **WHEN** a portrait guide enters the camera and Live Coach is enabled
- **THEN** the app periodically samples camera stills for local analysis and labels the feature `LIVE COACH · SAMPLED`

#### Scenario: Food or scene camera opens
- **WHEN** a food or scene guide enters the camera
- **THEN** portrait pose matching is not invoked

### Requirement: Photography-oriented match components
Live Coach SHALL prioritize framing and scale, then use pose and face direction when those signals are available.

#### Scenario: Subject is horizontally displaced
- **WHEN** the live subject center is meaningfully left or right of the target
- **THEN** the primary hint tells the photographer to move the subject horizontally before smaller pose corrections

### Requirement: One primary instruction
Live Coach SHALL present one prioritized actionable correction at a time.

#### Scenario: Multiple components differ
- **WHEN** framing, scale, and pose all differ from the target
- **THEN** the camera presents the highest-priority correction rather than a simultaneous checklist of actions

### Requirement: Matched requires component quality
The system SHALL not mark a portrait as matched solely because an aggregate score is high when a required component is clearly outside its acceptable range.

#### Scenario: High overall score with wrong face direction
- **WHEN** the aggregate score is high but a meaningful target face direction is not matched
- **THEN** the status remains non-matched and the face-direction correction may be prioritized

### Requirement: Display mode does not change match truth
Switching Outline, Skeleton, Ghost, or Guide SHALL not change the target geometry used by the match engine.

#### Scenario: Switch mode in camera
- **WHEN** the photographer switches portrait display mode while Live Coach is enabled
- **THEN** the same target position, scale, pose, and face geometry remain the basis of scoring
