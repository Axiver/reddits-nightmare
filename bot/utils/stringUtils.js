//-- Import required libraries --//
const WordPOS = require("wordpos");

/**
 * Filters and formats nouns as hashtags
 * @param {string[]} nouns The nouns to format and filter
 * @returns Valid nouns as hashtags
 */
async function formatNouns(nouns) {
  return new Promise((resolve) => {
    //Loop through all nouns
    for (let i = 0; i < nouns.length; i++) {
      //Check if the noun is valid (Remove junk nouns like Aut Abg Oue)
      if (nouns[i].length < 4) {
        //The noun is junk
        nouns.splice(i, 1);
        i--;
      } else {
        //The noun is valid, format it into a hashtag
        nouns[i] = "#" + nouns[i].toLowerCase();
      }
    }

    //Loop over, resolve with the result
    resolve(nouns);
  });
}

/**
 * Filters and formats adjectives as hashtags
 * @param {string[]} nouns Nouns to filter against
 * @param {string[]} adjective The adjectives to format and filter
 * @returns Valid adjectives as hashtags
 */
async function formatAdjectives(nouns, adjective) {
  return new Promise((resolve) => {
    //Loop through all adjectives
    for (let i = 0; i < adjective.length; i++) {
      //Check if the adjective is valid (Remove junk adjectives like Aut Abh Oue)
      if (adjective[i].length < 4) {
        //The adjective is junk
        adjective.splice(i, 1);
        i--;
      } else {
        //The adjective is valid, format it into a hashtag
        adjective[i] = "#" + adjective[i].toLowerCase();

        //Check if it is a duplicate of a noun
        if (nouns.includes(adjective[i])) {
          //It is a duplicate, remove the adjective
          adjective.splice(i, 1);
          i--;
        }
      }
    }

    //Loop over, resolve with the result
    resolve(adjective);
  });
}

/**
 * Generate hashtags from a string (Finds nouns and adjectives)
 * @param {string} string A string to generate hashtags off of
 * @returns Generated hashtags
 */
async function generateHashtags(string) {
  return new Promise((resolve) => {
    //Initialise WordPOS
    const wordpos = new WordPOS();

    //Find nouns from the string
    wordpos.getNouns(string, async function (result) {
      //Filters the nouns and formats the result into hashtags
      const nouns = await formatNouns(result);

      //Find adjectives from the string
      wordpos.getAdjectives(string, async function (result) {
        //Filters the adjectives and formats the result into hashtags
        const adjective = await formatAdjectives(nouns, result);

        //Join both nouns and adjectives together
        const hashtags = nouns.join(" ") + " " + adjective.join(" ");

        //Resolves with the result
        resolve(hashtags);
      });
    });
  });
}

module.exports = {
  formatNouns,
  formatAdjectives,
  generateHashtags,
};
