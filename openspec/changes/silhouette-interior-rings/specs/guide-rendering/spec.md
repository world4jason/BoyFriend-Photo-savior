# guide-rendering Delta

## MODIFIED Requirements

### Requirement: Outline renders a coherent outside body contour
For portrait targets, Outline SHALL render the detected/source person contour when available and SHALL use a coherent curved outside-envelope fallback for vector-only templates. When source-derived interior contour rings are available, Outline SHALL render them as part of the same quiet silhouette geometry so meaningful enclosed negative space remains visible. Outline SHALL NOT look like a center-line skeleton widened into disconnected parallel rails.

#### Scenario: Source contour contains interior rings
- **WHEN** a portrait GuideSpec contains an outer contour plus one or more interior contour rings and Outline is selected
- **THEN** the camera shows the smoothed outer contour and the smoothed interior boundaries with consistent silhouette styling
- **AND** no joint dots or semantic direction arrows are added to those rings

### Requirement: Ghost renders a translucent coherent stencil
Ghost SHALL render the portrait contour/body envelope as a translucent filled silhouette suitable for visual overlap, reusing the same coherent body-envelope geometry used by Outline when no source contour exists. When source-derived interior rings are present, Ghost SHALL preserve those regions as transparent negative space rather than filling the entire outer contour solid.

#### Scenario: Ghost source contour contains interior rings
- **WHEN** a portrait GuideSpec contains an outer contour plus interior contour rings and Ghost is selected
- **THEN** the compound silhouette uses even-odd fill behavior so the enclosed rings remain transparent
- **AND** the ring boundaries share the same consistent outline styling as the outer contour

#### Scenario: No interior-ring geometry
- **WHEN** a source portrait has only an outer contour
- **THEN** Outline and Ghost behave exactly as before and do not invent interior boundaries
