function isDescendantOfTag(element, tagName) {
	const normalizedTagName = tagName.toLowerCase();
	let currentElement = element;

	while (currentElement.parentElement) {
		if (currentElement.parentElement.tagName.toLowerCase() === normalizedTagName) {
			return true;
		}

		currentElement = currentElement.parentElement;
	}

	return false;
}


export function getUsername() {
	const links = document.querySelectorAll('a[href^="/users/"]');
	const link = [...links].find(link => !isDescendantOfTag(link, 'table'));
	return link?.href.split('/users/').at(1);
}
