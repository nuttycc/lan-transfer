
/**
 * @param {string} str
 */
function isValidJSON(str) {  
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    console.error(`Invalid JSON string: ${str}. Error: ${e.message}`);
    return false;
  }
}

module.exports = { isValidJSON };