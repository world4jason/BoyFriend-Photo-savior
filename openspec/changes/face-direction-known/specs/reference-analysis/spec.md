# reference-analysis Delta Specification

## MODIFIED Requirements

### Requirement: Fail soft across ML subsystems
The system SHALL preserve useful output when optional pose or face analysis fails and SHALL provide an editable fallback when automatic extraction cannot complete. Shared portrait face direction SHALL distinguish a supported direction from a neutral placeholder.

A source-derived guide SHALL mark face direction as known when either dedicated Face Landmarker or trusted pose fallback provides enough evidence for a left/right/front conclusion. If trusted fallback evidence is insufficient, the guide SHALL remain usable with neutral `front` representation marked as not known rather than inventing a precise direction.

#### Scenario: Dedicated face model returns frontal direction
- **WHEN** dedicated face analysis concludes `front`
- **THEN** the guide stores `facing='front'` with face direction marked known

#### Scenario: Trusted pose fallback concludes frontal direction
- **WHEN** dedicated face analysis is unavailable but trusted nose plus eye/ear pose landmarks are available and centered
- **THEN** the guide stores `facing='front'` with face direction marked known

#### Scenario: Trusted pose fallback concludes side direction
- **WHEN** dedicated face analysis is unavailable but trusted pose landmarks support a left or right conclusion
- **THEN** the guide stores that side direction with face direction marked known

#### Scenario: Face direction evidence is insufficient
- **WHEN** neither dedicated face direction nor trusted fallback nose/pair evidence is available
- **THEN** the guide may use neutral `front` as the stored direction but marks the direction not known

#### Scenario: Dedicated face direction overrides fallback
- **WHEN** dedicated Face Landmarker produces a direction and pose fallback would disagree
- **THEN** the dedicated direction remains authoritative and is marked known
