# template-library Specification

## Purpose

Defines reusable pose and composition targets independently from display rendering, including benchmark provenance, browsing behavior, fidelity, and POC limitations.

## Requirements

### Requirement: Templates are normalized geometry
The system SHALL store reusable templates as normalized geometry and semantic annotations rather than requiring copied source screenshots at shooting time.

#### Scenario: Opening a template
- **WHEN** the user selects a template
- **THEN** the app loads a GuideSpec target that can be rendered directly in the camera

### Requirement: Template fidelity is explicit
Benchmark-derived templates and source-backed instant examples SHALL declare whether their geometry is `approximate` or `source-derived`.

#### Scenario: Existing generic pose seed
- **WHEN** a template is generated from a reusable hand-authored pose family rather than a specific source image
- **THEN** the template is labeled `approximate` in product metadata/UI and SHALL NOT imply exact source reproduction

#### Scenario: Source-derived template
- **WHEN** a template has been reconstructed and visually checked against a specific source sample
- **THEN** it MAY be labeled `source-derived` and MAY expose that source image as a Reference Overlay

#### Scenario: Source-derived instant example
- **WHEN** an instant example is deliberately calibrated against its displayed source image
- **THEN** its contour and pose geometry correspond to that specific source and it MAY be labeled `source-derived`

### Requirement: Template has a recommended mode
Each template SHALL identify a recommended/default Display Mode, while portrait templates MAY be viewed in other supported modes when their geometry is sufficient.

#### Scenario: Power stance template
- **WHEN** the user selects a pose template whose recommended mode is Skeleton
- **THEN** Skeleton is selected initially and the user may switch to other portrait modes without changing target geometry

### Requirement: Scene and food templates use semantic Guide geometry
Food and scene templates SHALL use Guide annotations/objects such as zones, lines, points, frames, labels, and relationships rather than pretending to have human skeletons.

#### Scenario: Plate and glass
- **WHEN** the user selects a Plate + Glass template
- **THEN** Guide mode shows the relative placement/size targets for the plate and glass

### Requirement: Benchmark provenance is explicit
Benchmark-derived templates SHALL retain source/benchmark metadata separately from product display-mode names.

#### Scenario: Benchmark template card
- **WHEN** a template was inspired by a public benchmark product
- **THEN** its benchmark source may be shown as secondary provenance while the product mode remains Outline, Skeleton, Ghost, or Guide

### Requirement: PoseGhost POC catalog is labeled approximate
The Ghost catalog SHALL distinguish the 62-slot family-based POC reconstruction from a verified one-to-one commercial overlay catalog.

#### Scenario: Ghost catalog count
- **WHEN** the POC Ghost library is loaded
- **THEN** it contains exactly 62 generated slots across the documented public category families without claiming the internal PoseGhost ordering or per-category distribution

### Requirement: Template browser filters by display mode and category
The template browser SHALL let the user narrow the visible catalog first by the four Display Modes and then by an applicable template category.

#### Scenario: Selecting Ghost in the library
- **WHEN** the user selects the Ghost Display Mode filter
- **THEN** the browser shows Ghost template categories and does not mix in Outline, Skeleton, or Guide cards

#### Scenario: Selecting a Ghost category
- **WHEN** the user selects `Female Poses` while Ghost is active
- **THEN** only Ghost templates in the `Female Poses` category are shown

#### Scenario: Switching display mode
- **WHEN** the user switches to another Display Mode
- **THEN** an invalid previous category selection is replaced with an appropriate category for the new mode

### Requirement: Large catalogs default to a category subset
The template browser SHALL avoid presenting every template in a large mode as the initial visible list.

#### Scenario: Opening Ghost templates
- **WHEN** Ghost contains 62 templates across multiple categories
- **THEN** the browser defaults to a real Ghost category instead of presenting all 62 cards as the initial list

#### Scenario: Small mode catalog
- **WHEN** a Display Mode has a small template catalog
- **THEN** the browser MAY expose an `All` category as the default

### Requirement: Template cards are virtualized
The template browser SHALL use a virtualized list implementation for template cards so off-screen SVG previews are not all mounted simultaneously.

#### Scenario: Scrolling a category
- **WHEN** the user scrolls horizontally through template cards
- **THEN** the browser renders a bounded window of cards and preserves template selection behavior

#### Scenario: Cross-platform rendering
- **WHEN** the browser runs on Web, iOS, or Android
- **THEN** category filtering and virtualized template scrolling have equivalent product behavior
