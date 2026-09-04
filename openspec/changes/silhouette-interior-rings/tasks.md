# Tasks

- [x] Define outer contour vs interior contour-ring data contract.
- [x] Define bounded/noise-gated ring extraction and fail-soft behavior.
- [x] Extend mask contour extraction to retain meaningful enclosed background rings.
- [x] Propagate interior rings through `PersonContourDetection` into `PersonGuide`.
- [x] Render source-derived Outline/Ghost as compound silhouette paths.
- [x] Use even-odd Ghost filling so retained interior rings stay transparent.
- [x] Add regression coverage for meaningful hole retention, tiny-hole rejection, ring budget, no-hole behavior, and GuideSpec propagation.
- [x] Sync current `reference-analysis` and `guide-rendering` specs.
- [ ] Review complete diff and resolve all P0/P1 findings.
