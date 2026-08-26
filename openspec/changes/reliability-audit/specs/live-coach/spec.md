# live-coach Delta Specification

## MODIFIED Requirements

### Requirement: Single-person portrait sampled coaching in the MVP
Live Coach SHALL only produce match/stability state for exactly one-person portrait targets.

#### Scenario: Multi-person portrait
- **WHEN** a portrait target contains more than one person
- **THEN** the overlay remains available but Live Coach and Auto Capture cannot reach matched/stable state

### Requirement: Match coordinates follow rendered camera geometry
The match engine SHALL evaluate target position, scale, and pose after mapping target geometry into the same aspect-fit camera coordinate space used by the visible overlay.

#### Scenario: Different reference and camera aspect ratios
- **WHEN** the reference aspect differs from the camera viewport aspect
- **THEN** a subject visually aligned with the rendered guide receives matching position/scale geometry rather than instructions caused by raw-coordinate mismatch

### Requirement: Target pose intent requires a live pose signal
When a target contains meaningful joint anchors, raw matched status SHALL require a usable live pose comparison.

#### Scenario: Pose signal drops out
- **WHEN** the target expresses pose intent but the live sample lacks enough corresponding pose anchors
- **THEN** the system remains non-matched and asks the photographer to show enough of the pose for verification

### Requirement: Camera capture requires a ready viewport
Manual and automatic photo capture SHALL only run after CameraView is ready and SHALL stop when the camera reports a mount error.

#### Scenario: Camera is still starting
- **WHEN** the shutter is invoked before `onCameraReady`
- **THEN** no `takePictureAsync()` call begins

#### Scenario: Camera mount fails
- **WHEN** CameraView emits `onMountError`
- **THEN** live stability is invalidated, capture is disabled, and the user sees camera-unavailable feedback
