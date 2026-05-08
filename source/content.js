import optionsStorage from './options-storage.js';

let username;

const browserStorage = globalThis.browser?.storage.local ?? chrome.storage.local;

async function get(key) {
	const userKey = `${username}-${key}`;
	const values = await browserStorage.get(userKey);
	return values[userKey];
}

async function set(key, value) {
	const userKey = `${username}-${key}`;
	await browserStorage.set({[userKey]: value});
}

function isDescendantOfTag(element, tagName) {
	const normalizedTagName = tagName.toLowerCase();
	let currentElement = element;

	while (currentElement.parentElement) {
		if (currentElement.parentElement.tagName.toLowerCase() === normalizedTagName) {
			return true;
		}

		currentElement = currentElement.parentElement;
	}

	return false;
}

function getUsername() {
	const links = document.querySelectorAll('a[href^="/users/"]');
	const link = [...links].find(link => !isDescendantOfTag(link, 'table'));

	return link?.href.split('/users/').at(1);
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

async function getSubmissionPages(username, getAllPages) {
	/* eslint-disable no-await-in-loop -- Submission pages must be fetched sequentially to respect pagination and rate limiting. */
	if (getAllPages) {
		await setSyncing();
	}

	const output = [];
	let page = 0;

	while (true) {
		const url = `/users/${username}?tab=submissions&page=${page}&status=AC`;
		page++;

		const response = await fetch(url);
		const rows = parseSubmissionRows(await response.text());

		output.push(...rows.map(row => getSubmission(row)).filter(Boolean));

		await timeout(1000);

		if (!getAllPages || rows.length === 0) {
			break;
		}
	}

	if (getAllPages) {
		await unsetSyncing();
	}

	/* eslint-enable no-await-in-loop */
	return output;
}

function isOverAMonthAgo(date) {
	return date < Date.now() - (1000 * 60 * 60 * 24 * 30);
}

async function submit(submissions, isAll) {
	const {backendUrl} = await optionsStorage.getAll();
	await fetch(backendUrl, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			username,
			submissions,
			isAll,
		}),
	});
}

async function setSyncing() {
	const badge = document.createElement('div');
	badge.id = 'syncing-badge';
	badge.classList.add('shrink');
	badge.innerHTML = 'Syncing <div class="lds-roller"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>';
	document.body.append(badge);
	await timeout(10);
	badge.classList.remove('shrink');
}

async function unsetSyncing() {
	const badge = document.querySelector('#syncing-badge');

	if (!badge) {
		return;
	}

	badge.classList.add('shrink');
	await timeout(500);
	badge.remove();
}

async function syncAndSubmit(username) {
	const lastFullSync = await get('last-full-sync');
	const lastId = await get('last-id');
	const getAllPages = !lastFullSync || isOverAMonthAgo(lastFullSync);
	const submissions = await getSubmissionPages(username, getAllPages);

	if (submissions[0]?.submissionId === lastId) {
		return;
	}

	await submit(submissions, getAllPages);

	if (getAllPages) {
		await set('last-full-sync', Date.now());
		await set('last-id', submissions[0]?.submissionId);
	}
}

async function main() {
	username = getUsername();

	if (!username || !globalThis.location.href.includes('submission')) {
		return;
	}

	await syncAndSubmit(username);
}

main();
