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
	if (getAllPages) setSyncing();
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
				let time = row.querySelector('td[data-type="time"]').textContent.trim();
				if (time.length <= 10) {
					const currentDate = new Date();
					const year = currentDate.getFullYear();
					const month = String(currentDate.getMonth() + 1).padStart(2, "0"); // Month starts from 0
					const day = String(currentDate.getDate()).padStart(2, "0");
					const formattedDate = `${year}-${month}-${day} `;
					time = formattedDate + time;
				}
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
	if (getAllPages) unsetSyncing();
	return output;
}
function isOverAMonthAgo(date) {
	return date < Date.now() - 1000 * 60 * 60 * 24 * 30;
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
async function setSyncing() {
	const badge = document.createElement("div");
	badge.id = "syncingBadge";
	badge.classList.add("shrink");
	badge.innerHTML = `Syncing <div class="lds-roller"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>`;
	document.body.appendChild(badge);
	const newBadge = document.getElementById("syncingBadge");
	await timeout(10);
	newBadge.classList.remove("shrink");
}

async function unsetSyncing() {
	const badge = document.getElementById("syncingBadge");
	badge.classList.add("shrink");
	await timeout(500);
	if (badge) {
		document.body.removeChild(badge);
	}
}

async function syncAndSubmit(username) {
	const lastFullSync = await get("last-full-sync");
	const lastId = await get("last-id");
	const getAllPages = !lastFullSync || isOverAMonthAgo(lastFullSync);
	const submissions = await getSubmissionPages(username, getAllPages);
	if (submissions[0]?.submissionId === lastId) return;
	await submit(submissions, getAllPages);
	if (getAllPages) {
		await set("last-full-sync", Date.now());
		await set("last-id", submissions[0]?.submissionId);
	}
}

async function main() {
	username = getUsername();
	if (!username || !window.location.href.includes("submission")) {
		return;
	}
	await syncAndSubmit(username);
}

main();
