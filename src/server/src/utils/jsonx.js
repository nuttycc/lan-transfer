export function isValidJson(str) {
	try {
		JSON.parse(str);
	} catch (e) {
		// console.warn(e)
		return false;
	}
	return true;
}
