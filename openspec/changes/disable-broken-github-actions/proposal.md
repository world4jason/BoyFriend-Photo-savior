# Proposal: disable broken GitHub Actions

## Why

GitHub-hosted Actions are currently unusable for this repository because runner execution is blocked by the account billing/runner issue. The workflow therefore creates misleading red checks without validating the application.

## Goal

Remove the active GitHub Actions workflow from the repository and document the supported validation paths until GitHub-hosted Actions are intentionally reintroduced.

## Validation paths while GHA is disabled

- OpenSpec change/spec review for behavior changes;
- branch + PR complete-diff review with P0/P1 gate;
- local `npm run spec:validate`, `npm run typecheck`, and `npm run export:web` when a runnable environment is available;
- EAS Hosting/Web runtime smoke for deployable Web behavior;
- device smoke testing for camera/native behavior.

## Non-goals

- Replace GHA with another paid CI service.
- Claim local/build checks passed when they did not run.
