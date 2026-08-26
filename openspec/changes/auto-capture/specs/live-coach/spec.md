# live-coach Delta Specification

## ADDED Requirements

### Requirement: Auto Capture is explicit opt-in
Portrait Auto Capture SHALL default to off for each camera session and SHALL require the photographer to enable it explicitly in the camera UI.

#### Scenario: Camera opens
- **WHEN** a portrait camera session opens and the user has not enabled Auto Capture
- **THEN** reaching stable match does not automatically take a photo

#### Scenario: Live Coach is turned off
- **WHEN** Auto Capture is enabled and the photographer disables Live Coach
- **THEN** Auto Capture is also turned off and does not silently re-enable when Live Coach is later enabled

### Requirement: Enabling Auto Capture requires fresh stability
The system SHALL not consume a stable state accumulated before the photographer enabled Auto Capture.

#### Scenario: Auto is enabled while already stable
- **WHEN** the camera is already stably matched while Auto Capture is off and the photographer enables Auto Capture
- **THEN** temporal stability resets and the camera requires a fresh stable-entry confirmation before an automatic photo can fire

### Requirement: Auto Capture triggers on stable-entry transition
When Auto Capture is enabled, the system SHALL take one photo only when temporal state transitions from non-stable to stable.

#### Scenario: Stable match is reached
- **WHEN** Auto Capture is enabled and the second required consecutive raw match causes temporal state to enter stable match
- **THEN** the camera captures one high-quality photo

#### Scenario: Stable pose remains held
- **WHEN** Auto Capture already fired and subsequent samples remain in the same stable period
- **THEN** no additional automatic photos are taken

#### Scenario: Stable state is lost and regained
- **WHEN** stable state clears and later transitions into stable again while Auto Capture remains enabled
- **THEN** the camera may automatically capture once for the new stable period

### Requirement: Camera photo calls are serialized
Sampled low-quality capture, manual shutter capture, and automatic high-quality capture SHALL use a shared camera-capture lock so two `takePictureAsync()` calls do not overlap.

#### Scenario: Sample frame is being captured
- **WHEN** the periodic sampler is actively inside its low-quality `takePictureAsync()` call
- **THEN** manual or automatic high-quality capture does not start another camera capture concurrently

#### Scenario: Auto Capture fires
- **WHEN** a stable-entry transition initiates the high-quality automatic capture
- **THEN** the sampled Live Coach remains busy until that automatic photo capture finishes

#### Scenario: Camera screen is left during a capture
- **WHEN** a photo capture is already in flight and the photographer leaves the camera screen
- **THEN** the screen transition does not forcibly release the shared capture lock before the capture owner's `finally` path completes

### Requirement: Auto Capture failure is non-destructive
A failed automatic photo capture SHALL keep the camera usable and SHALL not claim that a photo was captured.

#### Scenario: Automatic capture fails
- **WHEN** `takePictureAsync()` fails during Auto Capture
- **THEN** the camera keeps Live Coach active, shows a lightweight capture error, and leaves the manual shutter available

### Requirement: Match messaging uses current temporal state
The stable-match message SHALL describe the current stable period and SHALL NOT infer current Auto Capture state from whether an older thumbnail was captured manually or automatically.

#### Scenario: Previous photo was automatically captured
- **WHEN** an older auto-captured thumbnail remains visible but the camera enters a different stable period
- **THEN** current stable messaging is based on current match and Auto Capture state rather than the older thumbnail source

### Requirement: Auto Capture remains portrait-only in the MVP
Food and scene Guide targets SHALL remain manual-capture-only.

#### Scenario: Food Guide camera
- **WHEN** a food template opens in the camera
- **THEN** no Auto Capture toggle or stable-match-triggered photo capture is active
