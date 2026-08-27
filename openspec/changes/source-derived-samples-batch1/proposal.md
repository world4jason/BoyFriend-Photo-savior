# Proposal: first source-derived sample batch

## Why

Deployed Web testing showed that the current instant examples can visually diverge from their displayed photos because their geometry was hand-authored as rough pose seeds. The Low squat example is a concrete case: wrists, torso depth, knees and silhouette do not line up with the source photo.

## Goal

Replace the Low squat example's generic geometry with geometry deliberately reconstructed against its actual displayed source image, and label it `source-derived`.

## Non-goals

- Rebuild the full benchmark/template catalog in this change.
- Claim automated pixel-perfect extraction.
- Change Display Mode rendering or Live Coach scoring behavior.

## Follow-up

Use the same source-review process for the remaining instant photo examples and then benchmark/store-derived templates in small reviewed batches.
