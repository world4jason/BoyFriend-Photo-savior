# Distribution / Release Guide

This project has two practical POC distribution targets:

1. **Web URL** — open the app directly in a browser.
2. **Android APK** — download and install directly on an Android phone.

GitHub-hosted Actions are currently not required for either path.

## Web: fastest path

The repository is public and has a static `app.json`, so Expo Launch can start from the GitHub repository directly.

Open:

https://launch.expo.dev/?github=https://github.com/world4jason/BoyFriend-Photo-savior&projectName=BoyFriend%20Photo%20Savior&projectDomain=boyfriend-photo-savior

Then:

1. Sign in to an Expo account.
2. Choose **Web / EAS Hosting**.
3. Confirm or change the requested `*.expo.app` subdomain if it is already taken.
4. Finish the deployment.
5. Copy the resulting production URL back into this README / Usage Guide.

Expo Launch handles the initial EAS project configuration in the browser. The final production URL normally has the form:

```text
https://<chosen-domain>.expo.app/
```

Do not document a production URL until the first deployment has actually completed.

### CLI alternative

After the project has been linked to an Expo account, Web can also be exported/deployed with:

```bash
npm run deploy:web
```

This runs the Web export first and then requests a production EAS Hosting deployment.

## Android: installable APK

`eas.json` contains a `preview` build profile that explicitly produces an APK:

```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

The Android package id is:

```text
com.world4jason.boyfriendphotosavior
```

### First-time setup

```bash
npx eas-cli@latest login
npm run build:apk
```

On the first build, EAS may ask to connect/create the Expo project and generate an Android keystore. For this POC, letting EAS generate and securely store a new Android keystore is the simplest path.

### After the build finishes

EAS provides a build page / install URL. On an Android phone you can open that URL, download the APK, and install it directly.

You can also download the latest Android build artifact to a computer:

```bash
npm run download:apk
```

The APK can then be attached to a GitHub Release manually so the repository's **Releases** section becomes the stable download location.

## GitHub Release recommendation

For the first installable POC release:

```text
Tag:   v0.4.1-poc.1
Title: BoyFriend Photo Savior POC 0.4.1
Asset: boyfriend-photo-savior-v0.4.1-poc.1.apk
```

Release notes should mention:

- Web / iOS / Android shared Expo codebase
- Outline / Skeleton / Ghost / Guide
- sampled single-person Live Coach
- optional Auto Capture
- duo/group is manual-guide only
- captured photos are not yet saved to Photos/Gallery
- first MediaPipe analysis requires network access

## Free-tier note

As of August 2026, Expo's Free plan includes a limited monthly allocation of low-priority Android/iOS builds. Free-plan accounts do not incur overage charges after the quota is exhausted; additional builds wait until the monthly quota resets unless the account is upgraded.

EAS Hosting is also available to Free-plan Expo accounts. Custom domains are a paid feature, so the free Web deployment should use the provided `*.expo.app` domain.

## What still requires a human sign-in

The repository can be prepared for distribution automatically, but the first EAS action requires authentication to an Expo account. This is the one step that cannot be completed anonymously from the repository itself.

After that one-time linkage, future Web deployments and APK builds can reuse the same project and credentials.
