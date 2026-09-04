# Proposal: distinguish known face direction from neutral fallback

## Why

`PersonGuide.head.facing` currently has only three values: `left`, `right`, and `front`. `front` is overloaded:

1. analysis genuinely determined that the subject faces approximately toward the camera;
2. face direction could not be determined, so `front` is used as a neutral placeholder.

This ambiguity prevents Live Coach from reliably enforcing a genuinely frontal reference and can also treat missing live face evidence as if the live subject were actually front-facing.

For a photography guide, “face camera” is a real composition instruction and must not be confused with “unknown.”

## What changes

- Add optional `head.facingKnown` to the shared portrait model.
- Source-derived guides set `facingKnown=true` when dedicated Face Landmarker or trusted pose fallback produced a real left/right/front conclusion.
- Source-derived guides set `facingKnown=false` when fallback evidence is insufficient and `front` is only a neutral placeholder.
- Live Coach treats known target face intent—including known `front`—as a required match component.
- If target face intent is required but live face direction is unknown:
  - public `faceScore` remains unavailable;
  - face weight stays in the aggregate as unsatisfied instead of disappearing;
  - primary guidance can say `Show face clearly` after higher-priority framing/scale corrections.
- If target is known front and live face is known left/right, guidance says `Face camera` and raw match is blocked.

## Legacy compatibility

Existing templates/fixtures do not all encode `facingKnown`.

- legacy `left` / `right` targets remain face-required;
- legacy `front` targets remain neutral/not-required unless explicitly migrated with `facingKnown=true`;
- source-derived guides created after this change always encode `facingKnown` explicitly.

## Scope

Affected capabilities:
- `reference-analysis`
- `live-coach`

No Face Landmarker yaw threshold, pose threshold, camera sampling cadence, Stable Match streak, Auto Capture transition, display-mode geometry, or template migration is changed in this PR.