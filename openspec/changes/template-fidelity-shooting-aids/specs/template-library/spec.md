## ADDED Requirements

### Requirement: Template fidelity is explicit
Benchmark-derived templates SHALL declare whether their geometry is `approximate` or `source-derived`.

#### Scenario: Existing generic pose seed
- **WHEN** a template is generated from a reusable hand-authored pose family rather than a specific source image
- **THEN** the template is labeled `approximate` in product metadata and UI

#### Scenario: Source-derived template
- **WHEN** a template has been reconstructed and visually checked against a specific source sample
- **THEN** it MAY be labeled `source-derived` and MAY expose the source image as a Reference Overlay

### Requirement: Approximate templates do not imply exact reproduction
The system SHALL avoid copy that suggests `approximate` templates reproduce a source pose exactly.

#### Scenario: Opening an approximate template
- **WHEN** the photographer opens an approximate built-in template
- **THEN** the reference screen makes the approximate fidelity visible
