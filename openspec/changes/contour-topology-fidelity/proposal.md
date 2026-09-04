# Change: Preserve person contour topology from segmentation masks

## Why

The renderer now draws source-derived Outline/Ghost geometry as a smooth silhouette, but the upstream mask conversion still collapses every segmentation row to only its leftmost and rightmost foreground pixel. That scanline hull erases exterior concavities such as the negative space between an arm and torso or between separated legs before the renderer ever sees them.

This is a source-fidelity problem rather than a stroke-style problem. SOVS-like Outline should read as the outside shape of a person, so a source-derived contour must preserve meaningful exterior silhouette topology instead of converting the mask into a per-row envelope.

## What changes

- Trace the boundary of the largest connected person component from the MediaPipe category mask.
- Preserve exterior concavities that are connected to background.
- Select the largest-area outer loop when the component also contains interior holes.
- Normalize and simplify the traced loop to a bounded point count suitable for GuideSpec rendering.
- Keep the current scanline hull as a fail-soft fallback only when boundary tracing cannot produce a usable contour.
- Add deterministic mask-topology regression coverage.
- Keep pose, face, crop, matching, Stable Match, Auto Capture, and camera lifecycle behavior unchanged.

## Non-goals

- Multi-person instance segmentation.
- Representing interior holes as separate GuideSpec contour rings.
- Prop/object segmentation.
- Changing MediaPipe models or thresholds.
- Replacing the existing Outline/Ghost renderer contract.

## Affected capability

- `reference-analysis`
