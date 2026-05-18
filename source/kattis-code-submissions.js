import { getFirstKattisSubmissionWithoutCode } from './kattis-backend.js';
import optionsStorage from './options-storage.js';
import { formatSubmissionCode, parseSubmissionCode } from './submission-code-parser.js';
import { submitSubmissions } from './kattis-submissions.js';
import { timeout } from './timing.js';

const getRandomSubmissionDelay = () => 1000 + Math.random() * 1000;

async function getSubmissionCode(submissionId) {
	const response = await fetch(`/submissions/${submissionId}`);

	if (!response.ok) {
		throw new Error(`Failed to fetch Kattis submission ${submissionId}`);
	}
	await timeout(getRandomSubmissionDelay());

	const submission = parseSubmissionCode(await response.text());
	const files = [];
	for (const file of submission.files) {
		if (files.length > 0) {
			await timeout(getRandomSubmissionDelay());
		}

		const sourceResponse = await fetch(file.sourceUrl);

		if (!sourceResponse.ok) {
			throw new Error(`Failed to fetch Kattis submission source ${file.sourceUrl}`);
		}
		files.push({
			...file,
			code: await sourceResponse.text(),
		});
	}


	return {
		code: formatSubmissionCode(files),
		language: submission.language,
	};
}

export async function submitCode(username) {
	const { submitCode: shouldSubmitCode } = await optionsStorage.getAll();

	if (!shouldSubmitCode) {
		return;
	}

	const attemptedSubmissionIds = new Set();

	/* eslint-disable no-await-in-loop -- Missing code submissions must be processed sequentially to avoid hammering Kattis/backend. */
	while (true) {
		try {
			const submission = await getFirstKattisSubmissionWithoutCode(username);

			if (!submission || attemptedSubmissionIds.has(submission.submissionId)) {
				break;
			}

			attemptedSubmissionIds.add(submission.submissionId);

			await timeout(getRandomSubmissionDelay());
			const { code, language } = await getSubmissionCode(submission.submissionId);
			await submitSubmissions(username, [
				{
					...submission,
					code,
					language,
				},
			]);
			await timeout(getRandomSubmissionDelay());
		} catch (error) {
			console.error(`Error when attempting to submit code: ${error}`);
			break;
		}
	}
	/* eslint-enable no-await-in-loop */
}
