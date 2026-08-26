# live-coach Delta Specification

## ADDED Requirements

### Requirement: Auto Capture is explicit opt-in
Portrait Auto Capture SHALL default to off and SHALL require the photographer to enable it explicitly in the camera session UI.

#### Scenario: Camera opens
- **WHEN** a portrait camera session opens and the user has not enabled Auto Capture
- **THEN** reaching stable match does not automatically take a photo

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

### Requirement: Auto Capture does not overlap sampled camera capture
The camera SHALL prevent the periodic sampled capture loop from starting another camera capture while an Auto Capture photo is in flight.

#### Scenario: Auto Capture fires
- **WHEN** a stable-entry transition initiates the high-quality capture
- **THEN** the sampled Live Coach camera lock remains busy until that photo capture finishes

### Requirement: Auto Capture failure is non-destructive
A failed automatic photo capture SHALL keep the camera usable and SHALL not claim that a photo was captured.

#### Scenario: Automatic capture fails
- **WHEN** `takePictureAsync()` fails during Auto Capture
- **THEN** the camera keeps Live Coach active, shows a lightweight capture error, and leaves the manual shutter available

### Requirement: Auto Capture remains portrait-only in the MVP
Food and scene Guide targets SHALL remain manual-capture-only.

#### Scenario: Food Guide camera
- **WHEN** a food template opens in the camera
- **THEN** no Auto Capture toggle or stable-match-triggered photo capture is active
