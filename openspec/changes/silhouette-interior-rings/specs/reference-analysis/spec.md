# reference-analysis Delta

## MODIFIED Requirements

### Requirement: Preserve meaningful exterior silhouette topology
For source-derived portrait geometry, the system SHALL derive an ordered contour from the boundary of the largest coherent foreground component rather than reducing each mask row to only its leftmost and rightmost foreground pixel. The contour SHALL preserve meaningful exterior concavities that remain connected to background, SHALL stay normalized and within a bounded point budget suitable for shared rendering, and SHALL fail soft to the legacy scanline-envelope strategy if topology-preserving tracing cannot produce a usable loop. Primary-component eligibility SHALL use row-based silhouette evidence compatible with the previous extractor rather than a fixed percentage of mask area so higher mask resolution does not disproportionately reject small but sufficiently wide subjects. When ordered tracing yields meaningful enclosed background loops belonging to the selected primary component, the system SHALL retain those loops as bounded interior contour rings rather than flattening them into the outer silhouette.

#### Scenario: Foreground component contains a meaningful enclosed background hole
- **WHEN** the selected primary component contains an outer boundary plus an enclosed background loop large enough to pass the interior-ring noise gate
- **THEN** the outer loop remains `PersonGuide.contour`
- **AND** the enclosed loop is retained as source-derived interior contour geometry

#### Scenario: Tiny segmentation pinhole
- **WHEN** an enclosed background loop is below the minimum area or span threshold
- **THEN** it is ignored rather than becoming visible Outline/Ghost noise

#### Scenario: Several meaningful enclosed holes
- **WHEN** more enclosed loops are present than the supported ring budget
- **THEN** the system keeps the largest meaningful rings up to the documented limit

#### Scenario: Boundary tracing falls back to scanline geometry
- **WHEN** ordered boundary tracing cannot produce a usable outer contour but scanline fallback can
- **THEN** the guide remains usable with the fallback outer contour
- **AND** the system does not claim interior-ring fidelity for that fallback result
