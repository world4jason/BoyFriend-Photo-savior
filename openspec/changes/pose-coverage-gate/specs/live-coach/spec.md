# live-coach Delta Specification

## MODIFIED Requirements

### Requirement: Target pose intent requires a live pose signal
When the target contains enough body-joint anchors to encode a meaningful pose, the final raw matched state SHALL require a usable live pose comparison rather than silently falling back to framing-only matching. For pose-required targets, a usable live comparison SHALL cover a majority of the target's encoded optional joint anchors, with a minimum of two matching optional anchors.

The minimum live optional-anchor coverage SHALL be:

```text
min(targetAnchorCount, max(2, ceil(targetAnchorCount * 0.60)))
```

#### Scenario: Small two-anchor pose is fully represented
- **WHEN** a target encodes exactly two optional pose anchors
- **THEN** both optional anchors must be available in the live sample before pose matching can satisfy the matched-state gate

#### Scenario: Full-body target is only partially visible
- **WHEN** a target encodes eight optional pose anchors but the live sample exposes only two of those anchors plus the shoulders
- **THEN** the pose comparison is not considered usable and the raw status cannot be `matched`

#### Scenario: Full-body target has majority coverage
- **WHEN** a target encodes eight optional pose anchors and the live sample exposes at least five matching optional anchors with sufficient geometric agreement
- **THEN** pose scoring may participate normally in the matched-state decision

#### Scenario: Pose landmarks disappear
- **WHEN** the target encodes pose anchors but the current live sample does not meet the required optional-anchor coverage
- **THEN** the raw status remains non-matched and the camera asks the photographer to keep enough of the pose visible for verification
