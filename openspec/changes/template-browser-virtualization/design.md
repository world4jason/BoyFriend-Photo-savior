# Design: Virtualized Template Browser

## Context

The Home screen already filters templates by recommended Display Mode, but the selected mode is rendered as a horizontal `ScrollView`. Ghost now has 62 POC entries, and Guide has a large multi-category catalog. Every visible-mode card currently creates a `GuideOverlay` SVG preview even when far off-screen.

React Native `FlatList` is a cross-platform wrapper around `VirtualizedList` and is appropriate for this flat, fixed-width horizontal catalog.

## Design

### Category derivation

Derive a product category label from each template's existing `category` string. Current catalog convention is `<Mode> / <Category>`, e.g.:

- `Ghost / Female Poses`
- `Guide / Travel`
- `Skeleton / Solo / movement`

For browser grouping, strip the first mode segment and keep the remaining path as the category label. No template data migration is required in this change.

### Selection state

Add UI-only `templateCategory` state.

For the current Display Mode:

1. collect mode templates;
2. derive unique categories;
3. if the mode has more than a large-catalog threshold (24), default to its first category;
4. otherwise expose `All` and default to `All`;
5. when mode changes, reset category deterministically.

The filter state must never be written into `GuideSpec` or template records.

### Virtualized cards

Replace only the template-card horizontal `ScrollView` with `FlatList`:

- `horizontal`
- stable `keyExtractor` from template id
- fixed 174 px card width
- 12 px separator
- bounded `initialNumToRender`
- bounded `maxToRenderPerBatch`
- small `windowSize`
- `removeClippedSubviews` on native where safe
- `getItemLayout` because item extent is fixed

The outer Home vertical `ScrollView` remains unchanged. A horizontal virtualized list inside a vertical scroll surface uses a different orientation and does not require navigation/layout redesign.

## Failure / Edge Cases

- If a mode has no templates, show an empty-state label rather than crashing.
- If a category becomes invalid after a mode switch, resolve to the new default.
- Category parsing must tolerate categories without `/` and use the full value.
- Template selection must still clone/load the same `GuideSpec` and recommended mode.

## Validation

When runnable:

- `npm run spec:validate`
- `npm run typecheck`
- `npm run export:web`
- manual Web browse through all four modes/categories
- iOS/Android physical-device scroll smoke test

Actions billing remains non-blocking if zero jobs execute.
