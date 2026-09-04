# Proposal: Preserve silhouette interior rings

## Why

The current source-derived portrait pipeline preserves only the largest outer silhouette loop. That fixes exterior arm/torso and leg concavities, but enclosed background regions inside the person mask are still discarded. A hand-on-hip loop, an arm arch touching the torso, or another fully enclosed negative-space region therefore becomes solid in Ghost and has no interior boundary in Outline.

That is a visible fidelity gap against the product contract: Outline should read as a coherent human contour, and Ghost should read as a stencil rather than a filled blob.

## What changes

- Extend shared portrait geometry with optional source-derived interior contour rings.
- Preserve meaningful enclosed background loops from the selected primary-person mask while ignoring tiny segmentation pinholes/noise.
- Keep the ring count and point budget bounded.
- Render Outline as one compound silhouette path so both outer and interior boundaries remain visible.
- Render Ghost with the same compound path using even-odd filling so enclosed negative space stays transparent.
- Keep scanline fallback fail-soft: when topology tracing is unavailable, the guide remains usable with no claimed interior rings.

## Non-goals

- Inferring semantic overlap lines where there is no background hole (for example, a forearm lying in front of the torso).
- Multi-person instance segmentation.
- Changing pose scoring, Stable Match, Auto Capture, camera lifecycle, or template geometry.

## Affected capabilities

- `reference-analysis`
- `guide-rendering`
