# live-coach Delta Specification

## MODIFIED Requirements

### Requirement: Matched requires component quality
The system SHALL not mark a portrait as raw matched solely because an aggregate score is high when a required component is clearly outside its acceptable range. Face direction SHALL be required whenever the target explicitly marks its face direction as known, including known `front`.

For legacy targets without explicit face-direction knowledge metadata, existing left/right targets remain required while legacy `front` remains neutral/not-required.

If face direction is required but the live face direction is unknown, the aggregate SHALL retain the normal face weight as unsatisfied instead of renormalizing only other components.

#### Scenario: Known frontal target with known side-facing live subject
- **WHEN** the target explicitly requires known `front` and the live subject has a known left/right direction
- **THEN** raw status remains non-matched and the camera can instruct `Face camera`

#### Scenario: Known frontal target with known frontal live subject
- **WHEN** the target explicitly requires known `front` and the live subject also has known `front`
- **THEN** face scoring can satisfy the face component normally

#### Scenario: Required face direction with unknown live face
- **WHEN** target face direction is required but the live guide does not have known face direction
- **THEN** public face score may remain unavailable, the face weight remains unsatisfied in the aggregate, and raw status cannot be `matched`

#### Scenario: Legacy frontal template
- **WHEN** an existing target has `facing='front'` but no explicit face-direction knowledge metadata
- **THEN** Live Coach keeps legacy behavior and does not introduce a new mandatory frontal face gate

#### Scenario: Legacy side template
- **WHEN** an existing target has legacy `left` or `right` facing without explicit knowledge metadata
- **THEN** Live Coach continues to treat that side direction as required

### Requirement: One primary instruction
Live Coach SHALL present one prioritized actionable correction at a time.

#### Scenario: Required live face is unknown after framing/scale align
- **WHEN** higher-priority framing and scale are acceptable, target face direction is required, and live face direction is unknown
- **THEN** the primary instruction is `Show face clearly`

#### Scenario: Known frontal target with side-facing live subject after framing/scale align
- **WHEN** higher-priority framing and scale are acceptable, target face direction is known `front`, and the live face direction is known left/right
- **THEN** the primary instruction is `Face camera`
