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

### Requirement: Auto Capture is explicit and portrait-only
Auto Capture SHALL be available only for portrait Live Coach sessions and SHALL default to OFF whenever a camera session opens.

#### Scenario: Portrait camera opens
- **WHEN** the portrait camera screen opens
- **THEN** Auto Capture is OFF until the photographer explicitly enables it

#### Scenario: Food or scene camera opens
- **WHEN** a food or scene guide opens the camera
- **THEN** Auto Capture is unavailable

### Requirement: Enabling Auto Capture requires fresh stability
Enabling Auto Capture SHALL invalidate prior temporal stability and require a new stable period after opt-in.

#### Scenario: User enables Auto Capture while already stable
- **WHEN** the photographer turns Auto Capture ON after a previous stable match
- **THEN** existing temporal match history is cleared and Auto Capture waits for a new stable-entry transition

### Requirement: Auto Capture fires once per stable period
Auto Capture SHALL trigger only when temporal state transitions from non-stable to stable and SHALL not repeatedly capture while stable remains active.

#### Scenario: Stable entry
- **WHEN** Auto Capture is enabled and temporal state enters stable match
- **THEN** one high-quality photo capture is requested

#### Scenario: User keeps holding the same pose
- **WHEN** subsequent samples remain stable
- **THEN** no additional automatic photo is captured

#### Scenario: Stability is lost and regained
- **WHEN** stable match clears and later a new stable period is reached while Auto Capture is still enabled
- **THEN** one new automatic photo may be captured for the new stable-entry transition

### Requirement: Camera captures are serialized
Sampled analysis captures, manual shutter captures, and automatic captures SHALL not overlap `takePictureAsync()` calls.

#### Scenario: Manual shutter during another capture
- **WHEN** the photographer presses the manual shutter while another camera capture is still active
- **THEN** the app does not start a second overlapping capture and provides lightweight feedback

### Requirement: Stale live callbacks cannot trigger Auto Capture
Live analysis results SHALL be associated with the active camera/coach session so results from an invalidated session cannot capture a photo or overwrite current live state.

#### Scenario: User leaves camera while analysis is running
- **WHEN** an older live-analysis result returns after the camera session has been invalidated
- **THEN** the result is ignored for stability, feedback, and Auto Capture while its temporary resources are still cleaned up

### Requirement: Auto Capture failure falls back to manual shutter
A failed automatic photo capture SHALL not block manual shooting or crash the camera session.

#### Scenario: Automatic capture fails
- **WHEN** an Auto Capture request fails
- **THEN** the camera displays lightweight failure feedback and the manual shutter remains available
