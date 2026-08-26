# OpenSpec Changes

`openspec/specs/` is the current behavior source of truth. This directory is for **proposed changes**.

For non-trivial observable behavior changes, use the OpenSpec workflow instead of editing the current specs directly:

```text
/opsx:explore   # optional when requirements are unclear
/opsx:propose <change-name>
/opsx:apply <change-name>
/opsx:sync <change-name>
/opsx:archive <change-name>
```

The default `spec-driven` change is expected to contain:

```text
<change-name>/
├── proposal.md
├── specs/<affected-capability>/spec.md   # delta requirements only
├── design.md
└── tasks.md
```

Use `proposal -> specs -> design -> tasks` to agree on the change before implementation. Archive completed changes so their delta specs are merged into `openspec/specs/` and the historical decision remains available under the archive.

The initial capability specs were backfilled from the existing MVP during the OpenSpec architecture audit; there is intentionally no fabricated change history for work that predates OpenSpec adoption.
