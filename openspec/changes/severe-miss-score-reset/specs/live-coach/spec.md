# live-coach Delta Specification

## MODIFIED Requirements

### Requirement: Headline aggregate score is smoothed
The camera SHALL use temporal smoothing for the headline aggregate score while keeping raw component scores available for diagnostics. A sample that qualifies as a severe aggregate/framing/scale miss SHALL bypass prior smoothing history so the headline reflects the current severe error instead of lagging behind an already-invalid stable state.

#### Scenario: Adjacent sample jitter
- **WHEN** adjacent raw aggregate scores differ because of small analysis noise and neither sample is a severe miss
- **THEN** the headline score uses the temporal state rather than jumping directly to every raw aggregate score

#### Scenario: Severe miss after a high score
- **WHEN** the previous headline score is high and the next sample meets the existing severe-miss condition
- **THEN** the headline score resets to the current raw aggregate score for that sample rather than retaining the previous EMA history
