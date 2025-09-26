import OptionsSync from "webext-options-sync";

const optionsStorage = new OptionsSync({
	defaults: {
		backend_url: "https://api.cpleaderboard.com/kattis_submit",
	},
});

export default optionsStorage;
