function getSubmissionLanguage(submissionDocument) {
	return submissionDocument.querySelector('#judge_table td[data-type="lang"]')?.textContent.trim()
		?? submissionDocument.querySelector('.source-highlight[data-language]')?.dataset.language
		?? '';
}

function getSourceFilename(link) {
	return link.getAttribute('href')?.split('/').at(-1) ?? 'main';
}

export function parseSubmissionFiles(html) {
	const parser = new DOMParser();
	const submissionDocument = parser.parseFromString(html, 'text/html');

	return [...submissionDocument.querySelectorAll('#submitted-files-tab a[href*="/source/"]')].map(link => ({
		code: '',
		filename: getSourceFilename(link),
		sourceUrl: link.getAttribute('href') ?? '',
	}));
}

export function formatSubmissionCode(files) {
	return files.length === 1
		? files[0].code
		: files.map(file => `===== ${file.filename} =====\n${file.code}`).join('\n\n');
}

export function parseSubmissionCode(html) {
	const parser = new DOMParser();
	const submissionDocument = parser.parseFromString(html, 'text/html');
	const files = parseSubmissionFiles(html);

	return {
		code: formatSubmissionCode(files),
		files,
		language: getSubmissionLanguage(submissionDocument),
	};
}
