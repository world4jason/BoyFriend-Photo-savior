# Proposal: template fidelity and shooting aids

## Why

Built-in benchmark templates currently reuse hand-authored generic pose geometry. Switching Outline / Skeleton / Ghost changes rendering, but the shared target may still differ substantially from the benchmark/source pose. This makes the library look more precise than it is.

Photographers also benefit from two aids that are orthogonal to the four Display Modes:

- a translucent source-photo layer for direct visual alignment;
- a starting lens/zoom hint such as 1×, 2× or 3×.

## Goals

1. Make template fidelity explicit instead of implying approximate POC geometry is source-exact.
2. Add an optional Reference Overlay layer without creating a fifth Display Mode.
3. Add a non-binding starting zoom/lens hint.
4. Preserve the existing four-mode product model and shared GuideSpec matching semantics.

## Non-goals

- Automatically switching to an exact physical 2×/3× lens on every platform.
- Claiming focal length can always be recovered from an arbitrary screenshot.
- Rebuilding the entire benchmark catalog source-by-source in this single change.

## Follow-up

Harvest official benchmark/app-store sample images, extract source-derived geometry, and progressively replace `approximate` template slots with `source-derived` templates.