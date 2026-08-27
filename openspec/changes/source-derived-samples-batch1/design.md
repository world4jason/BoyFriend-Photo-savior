# Design

## Calibration unit

A source-derived sample stores geometry in the displayed source image's normalized coordinate system (0..1). The source image remains the visual benchmark.

For a portrait sample the reviewed geometry includes:

- outer contour for Outline / Ghost;
- head center/extent and facing;
- shoulders;
- torso top/bottom/width;
- elbows/wrists/hips/knees/ankles for Skeleton;
- crop/look-space metadata.

## Left / right convention

Named pose anchors follow MediaPipe's anatomical convention, not viewer/frame left and right. For a person facing the camera, that person's `leftWrist` normally appears on the viewer's right side of the image. This convention is required because Live Coach compares target `left_*` anchors directly with MediaPipe live `left_*` anchors.

## Fidelity rule

`source-derived` means the geometry was deliberately reconstructed and visually checked against that specific source sample. It does not mean automatic pixel-perfect segmentation.

## Low squat calibration

The current generic Low squat guide places the wrists around y≈0.61 and torso bottom around y≈0.56, while the displayed source has the hands much lower and the crouched torso/hips extend deeper into the frame. The replacement therefore shifts the shared joints and adds a source-specific outer contour.

## Invariants

- All coordinates stay normalized to 0..1.
- Named left/right anchors follow the person's anatomical left/right.
- The same geometry remains reusable across Outline / Skeleton / Ghost / Guide.
- The source image remains available to the independent Reference Overlay layer.
- Live Coach continues to score the shared geometry; no special-case scoring is introduced for this sample.
