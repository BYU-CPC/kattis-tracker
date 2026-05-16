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

## Run the extension locally

Using [`web-ext`](https://extensionworkshop.com/documentation/develop/getting-started-with-web-ext/) is recommended during development. It starts a dedicated, temporary browser profile with the extension installed, so you do not have to load it into your normal Chrome or Firefox profile.

1. Install dependencies and build the extension:

	```sh
	npm ci
	npm run build
	```

2. In another terminal, run one of:

	```sh
	# Chrome / Chromium
	npx web-ext run --source-dir distribution --target chromium --start-url https://open.kattis.com

	# Firefox
	npx web-ext run --source-dir distribution --target firefox-desktop --start-url https://open.kattis.com
	```

3. For iterative development, keep Parcel rebuilding in one terminal and rerun or leave `web-ext` running in another:

	```sh
	npm run watch
	```

The same `sourceDir` and `startUrl` defaults are also recorded in `package.json` under `webExt`.

### Load manually instead

#### Chrome / Chromium

1. Run `npm run build` or keep `npm run watch` running.
2. Open `chrome://extensions`.
3. Enable Developer mode.
4. Click **Load unpacked**.
5. Select the `distribution/` directory.

#### Firefox

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
