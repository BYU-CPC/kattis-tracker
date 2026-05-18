import OptionsSync from 'webext-options-sync';

const optionsStorage = new OptionsSync({
	defaults: {
		backendUrl: 'https://api.cpleaderboard.com',
		submitCode: true,
	},
});

export default optionsStorage;
