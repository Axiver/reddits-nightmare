//-- Import required libraries --//
const WordPOS = require("wordpos");
const fs = require("fs");
const sizeOf = require("image-size");

//Import utility functions and libs
const { parseImage, ocr } = require("../libs/image");
const { restoreSpecialCharacters } = require("../utils/index");

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
 * Generate hashtags from a string (Finds nouns and adjectives)
 * @param {string} imagePath The path to the image
 * @param {string} string A string to generate hashtags off of
 * @returns Generated hashtags
 */
function generateHashtags(imagePath, string) {
  return new Promise(async (resolve) => {
    //Load config file
    const configs = require("../configs/config.json").postProcess;

    //Checks if the user wants OCR
    let ocrText = "";
    if (configs["ocr"] == "yes") {
      //Perform OCR on the image
      ocrText = await ocr(imagePath);
    }

    //Combine OCR text with string provided
    string += ` ${ocrText}`;

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
 * @param {object} image The image to upload 
 * @param {string} filename The name of the image file 
 * @param {string} caption The image caption
 * @param {Object} ig Instagram client
 */
async function postToInsta(image, filename, caption, ig) {
  //Declares the path of the image
  const imagePath = "./assets/images/approved/" + filename;

  //Derive image caption
  const hashtags = await generateHashtags(imagePath, caption.toLowerCase());
  const customcaption = await getCustomCaption();
  const finalCaption = caption + customcaption + "\n\n\n" + hashtags;

  //Uploads the image to Instagram
  await ig.publish.photo({
    //Reads the file into buffer before uploading
    file: image,
    caption: finalCaption,
  }).then((result) => {
    //Checks if the image upload was successful
    if (result.status == "ok") {
      //The image upload was a success
      console.log("Uploaded image '" + caption + "' to Instagram.");

      //Ensures that the same image does not get reuploaded twice by moving it to the uploaded dir
      fs.rename(imagePath, "./assets/images/uploaded/" + filename, (err) => {
        if (err)
          console.log("There was an error while trying to mark the image as uploaded: " + err);
        else
          console.log("Image has been marked as uploaded!");
      });
    }
  }).catch((err) => {
    //An error occurred
    console.log("There was a problem uploading the Image to Instagram (Did they detect us as a bot?): " + err);
    fs.rename(imagePath, "./assets/images/error/" + filename, (err) => {
      if (err)
        console.log("There was an error while trying to unapprove the image: " + err);
      else
        console.log("The image has been unapproved.");
    });
  });
}

/**
 * Chooses an image to upload to Instagram
 * @returns Path of the image to upload
 * @param {Object} ig Instagram client
 */
 async function chooseInstaPhoto(ig) {
  //Retrieves an array of all approved images
  const files = fs.readdirSync("./assets/images/approved/");

  //Checks if there are any images to upload
  if (files.length === 0) {
    //There are no images to upload
    console.log("No images to upload to instagram!");
    return;
  }

  //Chooses a random image
  const fileName = files[Math.floor(Math.random() * files.length)];

  //Changes the caption from filesystem format back to human readable format
  const caption = restoreSpecialCharacters(fileName);
  console.log("Uploading post with caption: " + caption);

  //Obtains the size of the image
  sizeOf("./assets/images/approved/" + fileName, async (err, dimensions) => {
    if (err) {
      console.log("Error uploading image to Instagram: " + err);
      return; //Abort
    }
    
    //Parses the image such that it will fit instagram's allowed aspect ratio
    const parsedImage = await parseImage(fileName, [dimensions.width, dimensions.height]);

    //Checks if the image can be uploaded (Image matches allowed aspect ratio OR image could be resized to fit the allowed aspect ratio)
    if (!parsedImage) {
      //The aspect ratio is unacceptable
      console.log("Error encountered while uploading image: unapproving image due to an unacceptable aspect ratio");
      fs.rename("./assets/images/approved/" + fileName, "./assets/images/error/" + fileName, (err) => {
        if (err)
          console.log("Error encountered while unapproving image: " + err);
      });

      //Upload another image by repeating the process
      console.log("Uploading a different image...");
      chooseInstaPhoto(ig);
      return;
    }

    //The aspect ratio is acceptable, upload the image
    postToInsta(parsedImage, fileName, caption, ig);
    return;
  });
}

module.exports = {
  chooseInstaPhoto
};
