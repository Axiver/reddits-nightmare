//-- Import required libraries --//
const WordPOS = require("wordpos");
const { createWorker } = require("tesseract.js");
const Bluebird = require("bluebird");
const fs = require("fs");

//-- Functions --//
/**
 * Filters and formats nouns as hashtags
 * @param {string[]} nouns The nouns to format and filter
 * @returns Valid nouns as hashtags
 */
function formatNouns(nouns) {
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
function formatAdjectives(nouns, adjective) {
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
 * Uses OCR to obtain words from the image
 * @param {string} imagePath The path to the image to generate hashtags for
 * @returns OCR result
 */
function ocr(imagePath) {
  return new Promise(async (resolve, reject) => {
    //-- Creates and configures OCR worker --//
    const worker = createWorker({
      logger: (m) => console.log("[OCR] '" + imagePath + "' : ", m["progress"] * 100 + "%"),
    });

    //Load the worker and sets its language to english
    await worker.load();
    await worker.loadLanguage("eng");
    await worker.initialize("eng");

    //Perform OCR on the image
    const {
      data: { 
        text
      },
    } = await worker.recognize(imagePath);

    //Terminate the OCR worker
    await worker.terminate();

    //Resolve with the result
    resolve(text);
  });
}

/**
 * Generate hashtags from a string (Finds nouns and adjectives)
 * @param {string} imagePath The path to the image to generate hashtags for
 * @param {string} string A string to generate hashtags off of
 * @returns Generated hashtags
 */
function generateHashtags(imagePath, string) {
  return new Promise(async (resolve) => {
    //Load config file
    const configs = require("../configs/account.json");

    //Checks if the user wants OCR
    let ocrText = "";
    if (configs["ocr"] == "yes") {
      //Perform OCR on the image
      ocrText = await ocr(imagePath);
    }

    //Initialise WordPOS
    const wordpos = new WordPOS();

    //Find nouns from the string
    wordpos.getNouns(string, async (result) => {
      //Filters the nouns and formats the result into hashtags
      const nouns = await formatNouns(result);

      //Find adjectives from the string
      wordpos.getAdjectives(string, async (result) => {
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

/**
 * Gets the custom caption set by the user in customcaption.txt
 * @returns The custom caption set by the user
 */
function getCustomCaption() {
  return new Promise((resolve, reject) => {
    //Reads the file
    fs.readFile("./configs/customcaption.txt", "utf8", (err, data) => {
      //Resolve with the result
      resolve(data);
    });
  });
}

/**
 * Post to instagram
 * @param {string} filename The name of the image file 
 * @param {string} caption The image caption
 * @param {Object} ig Instagram client
 */
async function postToInsta(filename, caption, ig) {
  //Declares the path of the image
  const imagePath = "./assets/images/approved/" + filename;

  //Derive image caption
  const hashtags = await generateHashtags(imagePath, caption.toLowerCase());
  const customcaption = await getCustomCaption();
  const finalCaption = caption + customcaption + "\n\n\n" + hashtags;

  //Uploads the image to Instagram
  await ig.publish.photo({
    //Reads the file into buffer before uploading
    file: await Bluebird.fromCallback((cb) => fs.readFile(imagePath, cb)),
    caption: finalCaption,
  }).then((result) => {
    //Checks if the image upload was successful
    if (result.status == "ok") {
      //The image upload was a success
      console.log("Uploaded image '" + caption + "' to Instagram.");

      //Ensures that the same image does not get reuploaded twice by moving it to the uploaded dir
      fs.rename("./assets/images/approved/" + filename, "./assets/images/uploaded/" + filename, (err) => {
        if (err)
          console.log("There was an error while trying to mark the image as uploaded: " + err);
        else
          console.log("Image has been marked as uploaded!");
      });
    }
  }).catch((err) => {
    //An error occurred
    console.log("There was a problem uploading the Image to Instagram (Did they detect us as a bot?): " + err);
    fs.rename("./assets/images/approved/" + filename, "./assets/images/error/" + filename, (err) => {
      if (err)
        console.log("There was an error while trying to unapprove the image: " + err);
      else
        console.log("The image has been unapproved.");
    });
  });
}

module.exports = {
  formatNouns,
  formatAdjectives,
  postToInsta
};
