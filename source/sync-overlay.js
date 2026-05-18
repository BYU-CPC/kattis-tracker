import { browserStorage } from './browser-storage.js';

const overlayCollapsedKey = 'kattis-tracker-overlay-collapsed';

let syncOverlay;
let syncStatus;
let fullSyncButton;
let collapseButton;

export function updateSyncOverlay(isSyncing, signedOut) {
	if (!syncOverlay || !syncStatus || !fullSyncButton) {
		return;
	}

	syncOverlay.classList.toggle('is-syncing', isSyncing);
	syncOverlay.classList.toggle('is-signed-out', signedOut);
	fullSyncButton.hidden = signedOut;

	if (signedOut) {
		syncStatus.textContent = 'Sign in to sync';
	} else if (isSyncing) {
		syncStatus.textContent = 'Syncing';
	} else {
		syncStatus.textContent = 'Idle';
	}

	fullSyncButton.disabled = isSyncing || signedOut;
}

function setOverlayCollapsed(isCollapsed) {
	if (!syncOverlay || !collapseButton) {
		return;
	}

	syncOverlay.classList.toggle('is-collapsed', isCollapsed);
	collapseButton.setAttribute('aria-label', isCollapsed ? 'Expand sync overlay' : 'Collapse sync overlay');
	collapseButton.setAttribute('aria-expanded', String(!isCollapsed));
}

export async function createSyncOverlay(onFullSync, signedOut) {
	syncOverlay = document.createElement('div');
	syncOverlay.id = 'kattis-tracker-overlay';

	const statusContainer = document.createElement('div');
	statusContainer.className = 'kattis-tracker-status';

	const statusIndicator = document.createElement('span');
	statusIndicator.className = 'kattis-tracker-status-indicator';

	syncStatus = document.createElement('span');
	syncStatus.className = 'kattis-tracker-status-text';

	fullSyncButton = document.createElement('button');
	fullSyncButton.type = 'button';
	fullSyncButton.className = 'kattis-tracker-full-sync';
	fullSyncButton.textContent = 'Full sync';
	fullSyncButton.addEventListener('click', async () => {
		await onFullSync();
	});

	collapseButton = document.createElement('button');
	collapseButton.type = 'button';
	collapseButton.className = 'kattis-tracker-collapse';
	collapseButton.setAttribute('aria-label', 'Collapse sync overlay');
	collapseButton.setAttribute('aria-expanded', 'true');

	const collapseChevron = document.createElement('span');
	collapseChevron.className = 'kattis-tracker-chevron';
	collapseButton.append(collapseChevron);
	collapseButton.addEventListener('click', async () => {
		const isCollapsed = !syncOverlay.classList.contains('is-collapsed');
		setOverlayCollapsed(isCollapsed);
		await browserStorage.set({ [overlayCollapsedKey]: isCollapsed });
	});

	statusContainer.append(statusIndicator, syncStatus);
	syncOverlay.append(statusContainer, fullSyncButton, collapseButton);

	const values = await browserStorage.get(overlayCollapsedKey);
	setOverlayCollapsed(Boolean(values[overlayCollapsedKey]));
	document.body.append(syncOverlay);
	updateSyncOverlay(false, signedOut);
}
