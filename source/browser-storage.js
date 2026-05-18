export const browserStorage = globalThis.browser?.storage.local ?? chrome.storage.local;

export async function getUserValue(username, key) {
	const userKey = `${username}-${key}`;
	const values = await browserStorage.get(userKey);
	return values[userKey];
}

export async function setUserValue(username, key, value) {
	const userKey = `${username}-${key}`;
	await browserStorage.set({ [userKey]: value });
}
