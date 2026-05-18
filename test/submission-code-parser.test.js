import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {DOMParser} from 'linkedom';
import {parseSubmissionCode, parseSubmissionFiles} from '../source/submission-code-parser.js';

globalThis.DOMParser = DOMParser;

test('parseSubmissionCode extracts language and submitted source links from Kattis HTML', async () => {
	const html = await readFile(new URL('../example.html', import.meta.url), 'utf8');
	const {code, files, language} = parseSubmissionCode(html);

	assert.equal(language, 'Python 3');
	assert.equal(code, '');
	assert.deepEqual(files, [
		{
			code: '',
			filename: 'eko.py',
			sourceUrl: '/submissions/17584054/source/eko.py',
		},
	]);
});

test('parseSubmissionFiles extracts multiple source links', () => {
	const files = parseSubmissionFiles(`
		<table id="judge_table">
			<tr><td data-type="lang">Python 3</td></tr>
		</table>
		<div id="submitted-files-tab">
			<a href="/submissions/17584054/source/eko.py">Download eko.py</a>
			<a href="/submissions/17584054/source/helper.py">Download helper.py</a>
		</div>
	`);

	assert.deepEqual(files, [
		{
			code: '',
			filename: 'eko.py',
			sourceUrl: '/submissions/17584054/source/eko.py',
		},
		{
			code: '',
			filename: 'helper.py',
			sourceUrl: '/submissions/17584054/source/helper.py',
		},
	]);
});
