import { submitCode } from './kattis-code-submissions.js';
import { syncAndSubmit } from './kattis-submissions.js';
import { getUsername } from './current-user.js';
import { createSyncOverlay } from './sync-overlay.js';


async function main() {
	const username = getUsername();
	await createSyncOverlay(async () => syncAndSubmit(username, true), !username);

	if (!username) return;

	const submitPromise = submitCode(username);
	await syncAndSubmit(username);
	await submitPromise;
}

main();
