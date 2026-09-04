# Tasks

- [x] Define known-vs-neutral face-direction behavior in reference-analysis and live-coach delta specs.
- [ ] Add optional `facingKnown` metadata to shared portrait head geometry.
- [ ] Make reference analysis mark dedicated/trusted fallback directions known and insufficient fallback neutral/unknown.
- [ ] Make Live Coach require known target face intent including frontal intent while preserving legacy template compatibility.
- [ ] Keep required-but-unknown live face weight unsatisfied in the aggregate instead of renormalizing it away.
- [ ] Add regression tests for known front, unknown neutral, legacy front/side compatibility, and missing live face evidence.
- [ ] Sync current `reference-analysis` and `live-coach` specs.
- [ ] Review complete PR diff and resolve all P0/P1 findings.
- [ ] Record validation honestly; GitHub Actions billing/runner availability is not a merge gate.
