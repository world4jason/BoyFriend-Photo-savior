# Design

## Data flow

```text
ImagePicker asset
  -> request EXIF metadata
  -> lensHintFromExif(asset.exif)
  -> keep only LensHint result
  -> buildGuideFromContour(...)
  -> EXIF hint overrides crop heuristic when valid
  -> GuideOverlay shows Start at N×
```

The raw EXIF object is not stored in GuideSpec and is not passed into matching.

## Priority

Lens guidance priority for a picked reference is:

1. usable 35mm-equivalent EXIF;
2. explicit template metadata when applicable;
3. crop/framing heuristic.

## Supported EXIF keys

The helper accepts platform/bridge variants for the 35mm-equivalent tag:

- `FocalLengthIn35mmFilm` — AndroidX-style naming;
- `FocalLenIn35mmFilm` — Apple ImageIO/CoreGraphics EXIF dictionary naming;
- `FocalLengthIn35mmFormat`;
- `FocalLength35mm`;
- `FocalLengthIn35mm`.

Only explicit finite numeric forms are accepted:

- numeric values such as `50`;
- scalar strings such as `"50"` or `"50 mm"`;
- rational strings such as `"50/1"` or `"50/1 mm"`.

Arbitrary text is not stripped into a number. Malformed values return `null` and fall back safely.

## Multiplier buckets

The current practical phone-selector mapping remains:

- <20mm -> 0.5×
- 20..<40mm -> 1×
- 40..<70mm -> 2×
- >=70mm -> 3×

These are advisory buckets, not claims about exact physical equivalence across devices.

## Failure behavior

Missing, malformed, non-finite, zero, or negative metadata fails soft to the existing crop heuristic. Web platforms that do not provide EXIF behave like the existing no-EXIF path.

## iOS Photos / iCloud note

Expo ImagePicker's iOS EXIF path can request a Photos content-editing input with network access allowed when metadata is not already available locally. That may cause the system Photos/iCloud layer to fetch the selected asset's metadata/source input. The app still does not upload the reference to an application server, and only the derived LensHint is retained by this feature.

## Invariants

- EXIF changes only `GuideSpec.lensHint`.
- Target geometry, crop classification, matching, Stable Match and Auto Capture remain unchanged.
- No raw EXIF object is retained after deriving the hint.
