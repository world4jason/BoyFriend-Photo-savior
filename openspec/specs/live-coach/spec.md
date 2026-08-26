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
The system SHALL not mark a portrait as raw matched solely because an aggregate score is high when a required component is clearly outside its acceptable range.

#### Scenario: High overall score with wrong face direction
- **WHEN** the aggregate score is high but a meaningful target face direction is not matched
- **THEN** the raw status remains non-matched and the face-direction correction may be prioritized

### Requirement: Final match state requires temporal stability
The camera SHALL distinguish raw per-sample match status from the final stable match state. Stable match requires two consecutive raw matched samples.

#### Scenario: First raw matched sample
- **WHEN** one sampled frame is raw `matched`
- **THEN** the camera shows a hold/progress state instead of the final green stable state

#### Scenario: Two consecutive raw matched samples
- **WHEN** two consecutive sampled frames are raw `matched`
- **THEN** the camera exposes the final stable matched state

### Requirement: Stable match uses asymmetric exit hysteresis
A stable match SHALL tolerate one minor non-matched sample, SHALL clear after two consecutive minor misses, and SHALL clear immediately when aggregate/framing/scale error is severe.

#### Scenario: One minor miss after stable
- **WHEN** one non-severe sample misses after stable match
- **THEN** stable match remains active

#### Scenario: Two minor misses after stable
- **WHEN** two consecutive non-severe samples miss after stable match
- **THEN** stable match clears

#### Scenario: Severe miss after stable
- **WHEN** the aggregate score is below 55, framing score below 40, or scale score below 40
- **THEN** stable match clears immediately

### Requirement: Headline aggregate score is smoothed
The camera SHALL use temporal smoothing for the headline aggregate score while keeping the raw component scores available for diagnostics.

#### Scenario: Adjacent sample jitter
- **WHEN** adjacent raw aggregate scores differ because of small analysis noise
- **THEN** the headline score uses the temporal state rather than jumping directly to every raw aggregate score

### Requirement: Display mode does not change match truth or stability
Switching Outline, Skeleton, Ghost, or Guide SHALL not change target geometry or reset temporal match history when the target itself is unchanged.

#### Scenario: Switch mode in camera
- **WHEN** the photographer switches portrait display mode while Live Coach is enabled
- **THEN** the same target position, scale, pose, face geometry, and temporal stability history remain the basis of scoring

### Requirement: Untrusted analysis clears stale stable state
When the camera can no longer produce a trustworthy live analysis result, the final stable state SHALL reset rather than continuing to present a stale green match.

#### Scenario: Live analysis fails
- **WHEN** a sampled frame cannot be captured or analyzed into a usable portrait guide
- **THEN** temporal stable state and stale match feedback are cleared until a new valid sample arrives

### Requirement: Future Auto Capture uses stable-entry transition
A future Auto Capture feature SHALL trigger only when temporal state transitions from non-stable to stable, never from one raw sample and never repeatedly while stable state remains active.

#### Scenario: User holds a stable pose
- **WHEN** stable match is reached and later samples remain stable
- **THEN** the stable-entry event occurs once for that stable period
