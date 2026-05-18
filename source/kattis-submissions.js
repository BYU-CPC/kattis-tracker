import { getUserValue, setUserValue } from './browser-storage.js';
import optionsStorage from './options-storage.js';
import { updateSyncOverlay } from './sync-overlay.js';

const platform = 'kattis';
const syncStateKey = 'synced-submissions';

async function getBackendUrl() {
	const { backendUrl } = await optionsStorage.getAll();
	return backendUrl;
}

async function getSyncState(username) {
	return await getUserValue(username, syncStateKey) ?? {
		latestSubmissionId: undefined,
		submissionIds: [],
	};
}

async function mergeSyncedSubmissions(username, submissions) {
	if (submissions.length === 0) {
		return;
	}

	const syncState = await getSyncState(username);
	const submissionIds = new Set(syncState.submissionIds);

	for (const submission of submissions) {
		submissionIds.add(submission.submissionId);
	}

	await setUserValue(username, syncStateKey, {
		latestSubmissionId: submissions[0].submissionId,
		submissionIds: [...submissionIds],
	});
}

function needsEffectiveFullSync(backendInfo, syncState) {
	const localSubmissionCount = syncState.submissionIds.length;

	if (localSubmissionCount === 0) {
		return true;
	}

	return backendInfo.lastSubmittedId === syncState.latestSubmissionId
		&& backendInfo.submissionCount < localSubmissionCount;
}

function isFullSyncRequested(getAllPages, backendInfo, syncState) {
	return getAllPages || !backendInfo.lastSubmittedId || needsEffectiveFullSync(backendInfo, syncState);
}

async function timeout(ms) {
	return new Promise(resolve => {
		setTimeout(resolve, ms);
	});
}

function parseSubmissionRows(html) {
	const parser = new DOMParser();
	const htmlDocument = parser.parseFromString(html, 'text/html');
	return [...htmlDocument.querySelectorAll('#submissions tbody tr')];
}

function getTimestamp(row) {
	let time = row.querySelector('td[data-type="time"]')?.textContent.trim();

	if (!time) {
		return undefined;
	}

	if (time.length <= 10) {
		const currentDate = new Date();
		const year = currentDate.getFullYear();
		const month = String(currentDate.getMonth() + 1).padStart(2, '0');
		const day = String(currentDate.getDate()).padStart(2, '0');
		time = `${year}-${month}-${day} ${time}`;
	}

	return new Date(time).getTime();
}

function getSubmission(row) {
	const accepted = row.querySelector('div.is-status-accepted');

	if (!accepted) {
		return undefined;
	}

	const submissionId = row.querySelector('td[data-type="actions"] a')?.href.split('/').pop();
	const problemId = [...row.querySelectorAll('td[data-type="problem"] a')].at(-1)?.href.split('/').pop();
	const timestamp = getTimestamp(row);

	if (!submissionId || !problemId || !timestamp) {
		return undefined;
	}

	return {
		problemId,
		submissionId,
		timestamp,
	};
}

async function getSubmissionPages(username, lastSubmittedId) {
	const output = [];
	let page = 0;
	let foundLastSubmittedId = false;

	while (true) {
		const url = `/users/${username}?tab=submissions&page=${page}&status=AC`;
		page++;

		const response = await fetch(url);
		const rows = parseSubmissionRows(await response.text());
		const submissions = rows.map(row => getSubmission(row)).filter(Boolean);

		for (const submission of submissions) {
			if (lastSubmittedId && submission.submissionId === lastSubmittedId) {
				foundLastSubmittedId = true;
				break;
			}

			output.push(submission);
		}

		await timeout(1000);

		if (foundLastSubmittedId || rows.length === 0) {
			break;
		}
	}
	return output;
}

function getBackendTimestamp(timestamp) {
	return timestamp > 10_000_000_000 ? timestamp / 1000 : timestamp;
}

function getBackendSubmission(submission) {
	return {
		...submission,
		timestamp: getBackendTimestamp(submission.timestamp),
	};
}

async function getKattisSubmissionInfo(username) {
	const backendUrl = await getBackendUrl();
	const query = new URLSearchParams({ username });
	const response = await fetch(`${backendUrl}/kattis_submission_info?${query}`);

	if (!response.ok) {
		throw new Error('Failed to fetch Kattis submission info');
	}

	return response.json();
}

export async function submitSubmissions(username, submissions) {
	if (submissions.length === 0) {
		return;
	}

	const backendUrl = await getBackendUrl();
	const response = await fetch(`${backendUrl}/kattis_submit`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			username,
			platform,
			submissions: submissions.map(submission => getBackendSubmission(submission)),
		}),
	});

	if (!response.ok) {
		throw new Error('Failed to submit Kattis submissions');
	}
}

export async function syncAndSubmit(username, getAllPages) {

	try {
		const [backendInfo, syncState] = await Promise.all([
			getKattisSubmissionInfo(username),
			getSyncState(username),
		]);
		const shouldFetchAllPages = isFullSyncRequested(getAllPages, backendInfo, syncState);
		if (shouldFetchAllPages) updateSyncOverlay(true, false);
		const lastSubmittedId = shouldFetchAllPages ? undefined : backendInfo.lastSubmittedId;
		const submissions = await getSubmissionPages(username, lastSubmittedId);

		await submitSubmissions(username, submissions);
		await mergeSyncedSubmissions(username, submissions);
	} finally {
		updateSyncOverlay(false, false);
	}
}
