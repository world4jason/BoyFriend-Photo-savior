# Delta for template-library

## MODIFIED Requirements

### Requirement: Template browser filters by display mode
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

## ADDED Requirements

### Requirement: Large catalogs default to a category subset
The template browser SHALL avoid presenting every template in a large mode as the initial visible list.

#### Scenario: Opening Ghost templates
- **WHEN** Ghost contains 62 templates across multiple categories
- **THEN** the browser defaults to a real Ghost category instead of rendering all 62 cards

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
