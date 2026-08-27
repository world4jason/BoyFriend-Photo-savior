## MODIFIED Requirements

### Requirement: Four display modes
The system SHALL expose exactly four core photographer-facing display modes: Outline, Skeleton, Ghost, and Guide. A raw source-photo Reference Overlay SHALL be treated as an optional presentation layer, not a fifth Display Mode.

#### Scenario: Reference Overlay with Skeleton
- **WHEN** a source photo is available and the photographer enables Reference Overlay while Skeleton is active
- **THEN** the source photo and Skeleton may be shown together without changing the shared target geometry or selected Display Mode
