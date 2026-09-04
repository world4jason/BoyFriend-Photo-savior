# Tasks

- [x] Define outer contour vs interior contour-ring data contract.
- [x] Define bounded/noise-gated ring extraction and fail-soft behavior.
- [ ] Extend mask contour extraction to retain meaningful enclosed background rings.
- [ ] Propagate interior rings through `PersonContourDetection` into `PersonGuide`.
- [ ] Render source-derived Outline/Ghost as compound silhouette paths.
- [ ] Use even-odd Ghost filling so retained interior rings stay transparent.
- [ ] Add regression coverage for meaningful hole retention, tiny-hole rejection, ring budget, fallback-without-holes, and GuideSpec propagation.
- [ ] Sync current `reference-analysis` and `guide-rendering` specs.
- [ ] Review complete diff and resolve all P0/P1 findings.
