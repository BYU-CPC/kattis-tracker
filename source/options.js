// eslint-disable-next-line import/no-unassigned-import
import "webext-base-css";
import optionsStorage from "./options-storage.js";

async function init() {
	await optionsStorage.syncForm("#options-form");
}

init();
