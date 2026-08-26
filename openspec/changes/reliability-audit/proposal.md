# Proposal: reliability-audit

## Why

A repo-wide reliability audit after Auto Capture identified several paths that could make the visible guide and Live Coach disagree, allow unsupported multi-person targets to reach matching logic, or let camera capture run against an unready/misaligned viewport.

These are correctness and capture-safety fixes rather than new product surface area.

## Affected capabilities

- `live-coach`
- `cross-platform-runtime`

## Proposed behavior

- Match target geometry in the same camera aspect-fit coordinate space used by the visible overlay.
- Limit sampled Live Coach and Auto Capture to exactly one-person portrait targets until multi-person extraction/matching exists.
- If a target encodes meaningful pose anchors, require a usable live pose signal before raw `matched` can occur.
- Measure the actual camera viewport rather than assuming full-window dimensions inside safe-area containers.
- Gate manual and automatic photo capture on CameraView readiness and surface mount failure.
- Disable CameraView shutter animation because the MVP takes hidden sampled stills roughly every 1–2 seconds.

## Platform impact

The fixes apply to Web, iOS, and Android. No new cloud service, permission, model, or image-upload path is introduced.
