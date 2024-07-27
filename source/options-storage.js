import OptionsSync from "webext-options-sync";

const optionsStorage = new OptionsSync({
	defaults: {
		backend_url:
			"https://byu-cpc-backend-tqxfeezgfa-uw.a.run.app/kattis_submit",
	},
});

export default optionsStorage;
