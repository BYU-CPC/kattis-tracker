import optionsStorage from './options-storage.js';

export const platform = 'kattis';

async function getBackendUrl() {
	const {backendUrl} = await optionsStorage.getAll();
	return backendUrl;
}

async function fetchBackend(path, options) {
	const backendUrl = await getBackendUrl();
	return fetch(`${backendUrl}${path}`, options);
}

function getUsernameQuery(username) {
	return new URLSearchParams({username});
}

export async function getKattisSubmissionInfo(username) {
	const query = getUsernameQuery(username);
	const response = await fetchBackend(`/kattis_submission_info?${query}`);

	if (!response.ok) {
		throw new Error('Failed to fetch Kattis submission info');
	}

	return response.json();
}

export async function getFirstKattisSubmissionWithoutCode(username) {
	const query = getUsernameQuery(username);
	const response = await fetchBackend(`/first_kattis_submission_without_code?${query}`);

	if (!response.ok) {
		throw new Error('Failed to fetch first Kattis submission without code');
	}

	return response.json();
}

export async function postKattisSubmissions(username, submissions) {
	const response = await fetchBackend('/kattis_submit', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			username,
			platform,
			submissions,
		}),
	});

	if (!response.ok) {
		throw new Error('Failed to submit Kattis submissions');
	}
}
