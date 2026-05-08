# Kattis Tracker

Kattis Tracker is a Manifest V3 browser extension that watches accepted Kattis submissions and sends them to a configurable backend endpoint.

The extension runs on `https://*.kattis.com/*`, detects the signed-in Kattis username, reads accepted submissions from the user's submissions tab, and submits newly discovered accepted submissions to the backend.

## Features

- Cross-browser WebExtension built with Parcel.
- Manifest V3 extension with a module service worker.
- Tracks accepted Kattis submissions per user.
- Performs a full sync periodically and lightweight incremental syncs otherwise.
- Configurable backend URL from the extension options page.

## Install

```sh
npm ci
```

## Development

Build once:

```sh
npm run build
```

Watch and rebuild on changes:

```sh
npm run watch
```

The built extension is written to `distribution/`.

## Load the extension locally

### Chrome / Chromium

1. Run `npm run build` or keep `npm run watch` running.
2. Open `chrome://extensions`.
3. Enable Developer mode.
4. Click **Load unpacked**.
5. Select the `distribution/` directory.

### Firefox

1. Run `npm run build` or keep `npm run watch` running.
2. Open `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on...**.
4. Select `distribution/manifest.json`.

## Extension options

Open the extension options page to configure the backend URL. The default is:

```text
https://api.cpleaderboard.com/kattis_submit
```

The content script sends a JSON payload like:

```json
{
	"username": "example-user",
	"submissions": [
		{
			"problemId": "hello",
			"submissionId": "123456",
			"timestamp": 1710000000000
		}
	],
	"isAll": false
}
```

## Scripts

- `npm run build` - Build the extension into `distribution/`.
- `npm run watch` - Rebuild the extension on file changes.
- `npm run lint` - Run JavaScript and CSS linting.
- `npm run lint-fix` - Run lint autofixers.
- `npm test` - Run the build used by CI.

## Notes for maintainers

- Source files live in `source/`.
- `source/manifest.json` is the Parcel entrypoint.
- `source/content.js` performs Kattis page scraping and backend submission.
- `source/options-storage.js` owns option defaults.
