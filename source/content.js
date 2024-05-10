import axios from "axios";
let username;
let isChrome = false;

//storage helpers
let browserStorage;
if (typeof browser === "undefined") {
	browserStorage = chrome.storage.local;
	isChrome = true;
} else {
	browserStorage = browser.storage.local;
}
async function get(key) {
	const userKey = `${username}-${key}`;
	return (await browserStorage.get(userKey))[userKey];
}
async function set(key, val) {
	const data = {};
	const userKey = `${username}-${key}`;
	data[userKey] = val;
	await browserStorage.set(data);
}

function isDescendantOfTag(element, tagName) {
	while (element.parentElement) {
		if (element.parentElement.tagName.toLowerCase() === tagName.toLowerCase()) {
			return true;
		}
		element = element.parentElement;
	}
	return false;
}

function getUsername() {
	const links = document.querySelectorAll('a[href^="/users/"]');
	const link = Array.from(links).find(
		(link) => !isDescendantOfTag(link, "table"),
	);
	if (!link || !link.href) return undefined;
	const parts = link.href.split("/users/");
	if (parts.length > 1) {
		return parts[1]; // Returns everything after "users/"
	}
}
async function timeout(ms) {
	return await new Promise((resolve) => setTimeout(resolve, ms));
}

async function getSubmissionPages(username, getAllPages) {
	const output = [];
	let page = 0;
	while (true) {
		const url = `/users/${username}?tab=submissions&page=${page}&status=AC`;
		page++;
		const { data } = await axios.get(url);
		const parser = new DOMParser();
		const htmlDoc = parser.parseFromString(data, "text/html");
		const rows = htmlDoc.querySelectorAll("#submissions tbody tr");
		rows.forEach((row) => {
			const accepted = row.querySelector("div.is-status-accepted");
			if (accepted) {
				const time = row
					.querySelector('td[data-type="time"]')
					.textContent.trim();
				const submissionId = row
					.querySelector('td[data-type="actions"] a')
					.href.split("/")
					.pop();
				const problemLinks = row.querySelectorAll('td[data-type="problem"] a');
				const problemId = problemLinks[problemLinks.length - 1].href
					.split("/")
					.pop();
				output.push({
					problemId,
					submissionId,
					timestamp: new Date(time).getTime(),
				});
			}
		});
		await timeout(1000);
		if (!getAllPages || rows.length === 0) {
			break;
		}
	}
	return output;
}
function isOverADayAgo(date) {
	return date < Date.now() - 1000 * 60 * 60 * 24;
}

async function submit(submissions, isAll) {
	await axios.post(
		"https://byu-cpc-backend-tqxfeezgfa-uw.a.run.app/kattis_submit",
		{
			username,
			submissions,
			isAll,
		},
	);
}
async function setSubmitting() {
	const badge = document.createElement("div");
	badge.id = "syncingBadge";
	badge.classList.add("shrink");
	badge.innerHTML = `Syncing <div class="lds-roller"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>`;
	document.body.appendChild(badge);
	const newBadge = document.getElementById("syncingBadge");
	await timeout(10);
	newBadge.classList.remove("shrink");
}

async function unsetSubmitting() {
	const badge = document.getElementById("syncingBadge");
	badge.classList.add("shrink");
	await timeout(500);
	if (badge) {
		document.body.removeChild(badge);
	}
}

async function syncAndSubmit(username) {
	setSubmitting();
	const initialSync = await get("initial-sync");
	const lastFullSync = await get("last-full-sync");
	const getAllPages =
		!initialSync || !lastFullSync || isOverADayAgo(lastFullSync);
	const submissions = await getSubmissionPages(username, getAllPages);
	await submit(submissions, getAllPages);
	if (getAllPages) {
		await set("initial-sync", true);
		await set("last-full-sync", Date.now());
	}
	unsetSubmitting();
}

async function main() {
	username = getUsername();
	if (!username) {
		return;
	}
	await syncAndSubmit(username);
}

main();
