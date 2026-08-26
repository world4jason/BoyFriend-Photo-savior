# cross-platform-runtime Specification

## Purpose

Defines the platform contract for Web, iOS, and Android so shared product/domain behavior can remain portable while camera and ML adapters evolve.

## Requirements

### Requirement: Three first-class targets
The system SHALL treat Web, iOS, and Android as first-class product targets.

#### Scenario: Shared product behavior
- **WHEN** a core product capability is changed
- **THEN** its impact on Web, iOS, and Android is considered and platform-specific limitations are documented

### Requirement: Shared domain model
The system SHALL keep GuideSpec, display-mode semantics, template geometry, and matching logic independent from a specific camera or MediaPipe runtime.

#### Scenario: Replacing the camera adapter
- **WHEN** sampled Expo Camera analysis is later replaced with a frame-processor implementation
- **THEN** target geometry and match semantics can remain unchanged

### Requirement: Temporary native files are best-effort cleaned
Native analysis/camera cache files created by the app SHALL be cleaned after use without making cleanup failure block the shooting flow.

#### Scenario: Sample analysis completes
- **WHEN** a temporary native camera frame and resized analysis file are no longer needed
- **THEN** the app attempts to delete them and ignores cleanup-only failures

### Requirement: Web avoids native-only static dependencies
Shared Web modules SHALL not statically depend on APIs that are only available on iOS/Android.

#### Scenario: File cleanup on Web
- **WHEN** the Web bundle resolves temporary-file cleanup
- **THEN** it uses the Web-safe implementation rather than importing the native file-system module

### Requirement: Remote runtime assets are explicit
The system SHALL document that the current MediaPipe WASM/model runtime requires network access on first load even though image bytes remain local.

#### Scenario: Offline first launch
- **WHEN** MediaPipe assets have not been cached and the device has no network access
- **THEN** automatic analysis may fail softly and the limitation is not represented as fully offline support
