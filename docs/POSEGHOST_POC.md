# PoseGhost 62-slot POC

This branch expands **Ghost** mode into a 62-slot research/template library based on the public PoseGhost product listing.

## Public source facts

Google Play currently states:

- **62 hand-crafted pose overlays**
- six category families:
  - Selfie Essentials
  - Female Poses
  - Male Poses
  - Couple Poses
  - Wedding Poses
  - Friends & Groups
- public family examples include full-body, seated, walking, over-the-shoulder, relaxed stances, hugs, hand-holds, twirls and back-to-back poses.

Primary source:

- https://play.google.com/store/apps/details?id=nz.dev.poseghost

Public Google Play screenshot URLs surfaced by the store page:

1. https://play-lh.googleusercontent.com/Te3IAkG0QzQh9X2EXxud2RraNRQo5DHvEtTTra7XuPMAimMkCpA-kYUU4FZwoOqmxw_8HN65JJpIpzQ2pRiRbg=w526-h296
2. https://play-lh.googleusercontent.com/QP8lAzl_4yQSMkdpyUQ3HfWVWppBOozALjNm5gIFCgiQhq-nIkhpmF71COPrfGDoHUHYr0a7WvJlo8xh-aou6Nc=w526-h296
3. https://play-lh.googleusercontent.com/ovrHYijlHHePLKh0VefdG3JcjE-GqBaTlD6dXqB2_8dtPPMQ6VaZYQDWCFul9OlDuikJ8513Wwme_jB0incjiA=w526-h296
4. https://play-lh.googleusercontent.com/T6uZICQOZvSdeHbSpk9U-NPbvwigVMny9DhkxiDy9JrjgMncjJe3OI7kZJRHTSQsm5ZVe1VtgVVlGvGPWoYkkGE=w526-h296
5. https://play-lh.googleusercontent.com/nwT7QTSGAosTuLw2eYQmckhEvi2ZhleYS_4SKcrMyo540Bt4SPUPMtrI2Tz0VcThR7xJWUxtQHXm4AlnEXd0aP4=w526-h296

Additional listing mirrors used for cross-checking that screenshots/categories are public store material:

- https://appagg.com/android/photography/poseghost-pose-overlay-cam-43709682.html
- https://www.appbrain.com/app/poseghost-pose-overlay-cam/nz.dev.poseghost

## What this POC does

`src/templates/poseghostPocTemplates.ts` creates exactly **62 Ghost templates** and replaces the previous small Ghost seed set in the app template catalog.

Because the public Play listing exposes the total count and category families but does **not** expose all 62 individual names or a public per-category count, the current allocation is intentionally ours:

| POC family | Count |
| --- | ---: |
| Selfie Essentials | 8 |
| Female Poses | 14 |
| Male Poses | 10 |
| Couple Poses | 12 |
| Wedding Poses | 8 |
| Friends & Groups | 10 |
| **Total** | **62** |

These counts are **not claimed to be the commercial app's internal per-category counts**.

The geometry is reconstructed from the publicly described pose families and our existing normalized `GuideSpec` system. It is suitable for internal POC/UI testing and can be progressively replaced with screenshot/app-derived geometry when we have individual source captures.

## Next extraction pass

For closer one-to-one reconstruction:

1. capture/export the PoseGhost library screens from an installed copy;
2. save those captures only in a local research workspace (not the public app bundle);
3. crop each overlay or library tile;
4. estimate body skeleton / silhouette geometry;
5. normalize coordinates to 0..1;
6. map each result to `PersonGuide`;
7. compare against the current family-based POC slot;
8. replace the approximate geometry while keeping our renderer/style system.

The important architecture rule remains:

```text
source artwork / screenshot (research input)
        -> extracted geometry
        -> our GuideSpec
        -> our Ghost renderer
```

The shipping app should depend on the normalized geometry, not on the source image file.
