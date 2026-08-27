# Tasks

- [x] Define Reference Overlay as an orthogonal layer, not a fifth Display Mode.
- [x] Define template fidelity metadata.
- [x] Define lens-hint behavior and cross-platform limitations.
- [x] Add fidelity and lens-hint fields to domain types.
- [x] Mark existing benchmark templates approximate by default.
- [x] Show approximate/source-derived fidelity on rendered template/reference geometry.
- [x] Add camera Reference Overlay with Off / 15% / 30% / 50%.
- [x] Keep source overlay transform aligned with GuideOverlay.
- [x] Add crop-based zoom fallback.
- [x] Display `Start at N×` in camera UI.
- [x] Update current OpenSpec specs.
- [x] Complete PR diff review and resolve all P0/P1 before merge.

## Follow-up changes

- Wire native ImagePicker EXIF retrieval into the existing `lensHintFromExif` helper.
- Replace approximate pose/template geometry with source-derived batches that are visually checked against specific source samples.
- Tune the shooting-aid panel layout after phone-width visual smoke testing.
