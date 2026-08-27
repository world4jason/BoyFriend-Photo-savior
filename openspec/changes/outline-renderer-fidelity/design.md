# Design

## Benchmark visual contracts

### Outline / SOVS-like

A human target should read as one coherent pose silhouette:

- smooth outer contour;
- consistent thin-to-medium line weight;
- no joint dots;
- no rectangular torso treatment;
- no disconnected upper/lower-limb rail lines;
- minimal extra interior marks.

### Ghost / PoseGhost-like

Ghost reuses coherent silhouette geometry but favors legibility over exact anatomy:

- translucent body fill;
- consistent outline;
- same proportions across the library;
- remains readable at low opacity;
- no joint markers.

### Skeleton / PoseOverlay-like

Skeleton remains explicit joint/segment geometry:

- center lines;
- keypoint nodes;
- pose matching may use the same named anchors.

It SHALL NOT be visually disguised as Outline.

### Guide / reCompose-like

Guide remains semantic composition geometry and is outside this renderer change.

## Source contour path

When `PersonGuide.contour` exists, convert the normalized closed polygon into a smoothed closed quadratic path. The rendered contour still passes near all source samples but avoids visibly faceted line segments.

## Approximate fallback envelope

When no source contour exists:

1. Render the head as a clean ellipse.
2. Render the torso as a curved shoulder-to-hip envelope.
3. For each complete arm or leg chain, build one closed capsule/envelope path around the full chain rather than rendering separate rails per segment.
4. Use variable endpoint radii (shoulder/hip > elbow/knee > wrist/ankle) so the silhouette narrows naturally.
5. Outline uses transparent fill + outline stroke.
6. Ghost uses the same envelope paths with translucent fill + thinner outline.

## Face direction

Outline and Ghost should stay visually quiet. Facing arrows belong to semantic Guide/coach UI rather than the silhouette itself. Skeleton can rely on separate coaching/matching UI for head direction.

## Invariants

- Renderer changes do not mutate GuideSpec geometry.
- Matching continues to consume normalized target anchors, not rendered SVG paths.
- Source-derived contour remains preferred over fallback envelope.
- All Display Modes remain selectable from one shared target.
