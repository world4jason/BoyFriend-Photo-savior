# Proposal: Virtualized Template Browser

## Why

Ghost now contains 62 POC templates and Guide contains roughly 40 composition templates. The current Home screen renders every card for the selected Display Mode inside a horizontal `ScrollView`, which makes browsing noisy and mounts many SVG previews at once.

## What Changes

- Add a second template-browser filter for category within the selected Display Mode.
- Default large catalogs to a real category subset instead of `All`.
- Replace the template-card `ScrollView` with a horizontal `FlatList` so off-screen cards are virtualized.
- Preserve existing template selection behavior and recommended Display Mode behavior.
- Keep category/filter state as UI state only; it must not mutate template geometry or `GuideSpec`.

## Capabilities

### Modified Capabilities

- `template-library` — add category-first browsing and virtualized rendering requirements.

## Platform Impact

The behavior must stay shared across Web, iOS, and Android using React Native `FlatList`; no native-only dependency is introduced.
