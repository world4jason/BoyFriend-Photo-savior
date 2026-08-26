# live-coach Delta Specification

## MODIFIED Requirements

### Requirement: Matched requires temporal stability
The system SHALL not expose the final stable matched state from a single sampled frame. A stable match SHALL require multiple consecutive raw matched samples, SHALL use hysteresis for minor misses, and SHALL clear immediately for a severe framing/scale miss.

#### Scenario: First raw matched frame
- **WHEN** one sampled frame is raw `matched`
- **THEN** the camera does not yet expose the final stable green match state

#### Scenario: Two consecutive matches
- **WHEN** two consecutive sampled frames are raw `matched`
- **THEN** the camera exposes a stable matched state

#### Scenario: One minor noisy miss after stable match
- **WHEN** the camera is stably matched and one subsequent sample is non-matched without severe framing/scale error
- **THEN** the stable matched state remains active

#### Scenario: Two consecutive minor misses after stable match
- **WHEN** the camera is stably matched and two consecutive non-severe samples are non-matched
- **THEN** the stable matched state clears

#### Scenario: Severe miss after stable match
- **WHEN** the camera is stably matched and the next sample shows severe aggregate, framing, or scale error
- **THEN** the stable matched state clears immediately

### Requirement: Headline score is temporally smoothed
The camera SHALL smooth the headline aggregate score across sampled frames while preserving raw component scores for diagnostics.

#### Scenario: Adjacent score jitter
- **WHEN** adjacent raw aggregate scores differ because of minor analysis noise
- **THEN** the displayed headline score changes using a bounded temporal smoothing function rather than copying each raw score directly

### Requirement: Stability is independent from display mode
Display-mode switches SHALL not reset stable-match state when the target geometry is unchanged.

#### Scenario: Switch Outline to Ghost while holding pose
- **WHEN** the photographer changes only the display mode while Live Coach is active
- **THEN** the temporal match history remains valid because target geometry did not change

### Requirement: Future Auto Capture gates on stable-entry transition
A future Auto Capture feature SHALL only trigger when temporal state transitions from non-stable to stable, never from a single raw match and never repeatedly while stable state remains active.

#### Scenario: Holding one stable pose
- **WHEN** the user enters stable match and continues holding the same pose across later samples
- **THEN** the stable-entry event occurs once for that stable period
