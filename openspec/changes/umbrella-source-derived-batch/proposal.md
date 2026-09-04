# Proposal: umbrella source-derived template batch

## Why

The template library still contains many useful but generic `APPROX POC` pose families. The user-provided umbrella portrait study gives us several concrete source frames that can be reconstructed into normalized geometry and visually checked, including frames with explicit 50mm and 102mm focal-length labels.

This is a better next step than adding more generic pose names: a smaller set of source-derived templates gives Outline/Skeleton/Ghost/Guide a trustworthy shared target and lets the shooting-aid layer show meaningful lens guidance.

## Goals

1. Add a first built-in `Photo study` template family that is not tied to a benchmark app brand.
2. Add three source-derived portrait templates reconstructed from the supplied umbrella portrait study:
   - 102mm umbrella look-back;
   - 50mm hands-on-hips;
   - umbrella balance action.
3. Keep one shared source-derived geometry usable across the four portrait Display Modes.
4. Represent the umbrella as semantic Guide annotations rather than pretending it is part of the human pose skeleton.
5. Preserve source provenance with timestamped source URLs while shipping only normalized geometry, not copied screenshot assets.

## Non-goals

- Bundle the supplied screenshots as application assets.
- Claim automatic pixel-perfect extraction.
- Reconstruct every frame from the source video in this change.
- Change matching thresholds, Stable Match, Auto Capture, or camera zoom behavior.
