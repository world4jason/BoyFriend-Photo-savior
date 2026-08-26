# Proposal: auto-capture

## Why

Stable Match now confirms that a portrait composition stayed aligned across sampled analyses. The next useful shooting aid is optional hands-free capture once that stable state is reached.

Auto Capture must not fire from a single raw matched sample, must not repeatedly shoot while one stable pose is held, and must remain explicitly user-controlled.

## Affected capability

- `live-coach`

## Proposed behavior

- Add an **Auto Capture** toggle for portrait camera sessions.
- Default Auto Capture to **OFF**.
- When enabled, capture exactly once when temporal match state transitions from non-stable to stable.
- Do not capture again while the same stable period remains active.
- Re-arm only after stable state is lost and later re-entered.
- Manual shutter remains available regardless of Auto Capture setting.
- Auto Capture does not apply to food/scene Guide mode in this MVP.

## Platform impact

The trigger decision is shared TypeScript. The actual photo still uses the existing Expo Camera capture path on Web, iOS, and Android. No new network service, permission, or cloud dependency is introduced.
