//-- Functions --//
/**
 * Checks if string contains an element in a array
 * @param {*} string The string to check
 * @param {*} pattern An array of strings to check for
 * @returns Whether or not the string contains an element in a array
 */
function contains(string, pattern) {
  //Loops through the string array
  pattern.forEach((word) => {
    //Checks if the string contains the current element
    if (string.includes(word)) {
      //The string contains the current element
      return true;
    }
  });

  //The string does not contain any of the elements in the array
  return false;
}

/**
 * Replaces special characters in a string
 * @param {string} string A string to replace the special characters of
 * @returns A string without special characters
 */
function replaceSpecialChars(string) {
  //Define the replacement for each special character
  const specialCharacters = [/\?/g, /\//g, /\</g, /\>/g, /\"/g, /\*/g, /\\/g, /\:/g];
  const replacement = ["[q]", "[s]", "[l]", "[m]", "[quo]", "[st]", "[bs]", "[col]"];

  //Replace special characters into filesystem-compatible ones
  for (let i = 0; i < specialCharacters.length; i++) {
    string = string.replace(specialCharacters[i], replacement[i]);
  }
  
  return string;
}

/**
 * Adds special characters back to a string
 * @param {string} string A string to restore the special characters back to
 * @returns A string with its special characters restored
 */
function restoreSpecialCharacters(string) {
  //Remove file extensions from caption and add back special characters
  const specialCharacters = [/\?/g, /\//g, /\</g, /\>/g, /\"/g, /\*/g, /\\/g, /\:/g, "", "", ""];
  const replacement = ["[q]", "[s]", "[l]", "[m]", "[quo]", "[st]", "[bs]", "[col]", ".jpg", ".jpeg", ".png"];

  //Replace filesystem-compatible characters with the special characters they represent
  for (let i = 0; i < specialCharacters.length; i++) {
    string = string.replace(replacement[i], specialCharacters[i]);
  }

  return string;
}

module.exports = {
  contains,
  replaceSpecialChars,
  restoreSpecialCharacters
};
