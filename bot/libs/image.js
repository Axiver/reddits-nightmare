//-- Import required libraries --//
const fs = require("fs");
const path = require("path");
const sharp = require('sharp');
const cliProgress = require('cli-progress');
const { createWorker } = require("tesseract.js");

//Import utility functions and libs
const { replaceSpecialChars, contains, capitalizeFirstLetter } = require("../utils/stringUtils");

//-- Functions --//
/**
 * Formats the file name to save to Filesystem
 * @param {string} postTitle The title of the post
 * @param {string} postUrl The url of the post
 * @param {boolean} nsfw Whether or not the post is nsfw
 * @returns The formatted file path for the image
 */
function formatFileName(postTitle, postUrl, nsfw) {
  return new Promise(async (resolve, reject) => {
    //Define an array of forbidden words
    const forbiddenWords = ["reddit", "r/", "comments", "upvote", "downvote", "retweet", "mods", "me", "i", "my", "i've"];

    //Reformats the filename so that it complies with window's strict filesystem rules
    postTitle = replaceSpecialChars(postTitle);

    //Initialises the resultant filename
    let filename;

    //-- Determines the directory the image should be stored in --//
    //Checks if post is NSFW
    if (nsfw) {
      //The post is NSFW
      console.log("Found a potentially NSFW post (Will require manual approval): " + postTitle);
      filename = "./assets/images/nsfw/" + postTitle + path.extname(postUrl);
      return resolve(filename);
    }
    
    //Checks if the post contains words in the forbidden list
    if (contains(postTitle, forbiddenWords)) {
      //The post contains forbidden words
      console.log("Image: " + postTitle + " is rejected due to the title having reddit related words");
      filename = "./assets/images/rejected/" + postTitle + path.extname(postUrl);
      return resolve(filename);
    }

    //Checks if the file was previously downloaded. If it is, returns the path of the old file and thus it will not be downloaded again
    if (fs.existsSync("./assets/images/uploaded/" + postTitle + path.extname(postUrl))) {
      //It has been downloaded before
      filename = "./assets/images/uploaded/" + postTitle + path.extname(postUrl);
      return resolve(filename);
    }
    
    //Checks if the post has been previously downloaded and has previously caused an error
    if (fs.existsSync("./assets/images/error/" + postTitle + path.extname(postUrl))) {
      //The post has caused an error before
      filename = "./assets/images/error/" + postTitle + path.extname(postUrl);
      return resolve(filename);
    }

    //The post is brand new!
    filename = "./assets/images/approved/" + postTitle + path.extname(postUrl);
    resolve(filename);
  });
}

/**
 * Uses OCR to obtain words from the image
 * @param {string} imagePath The path to the image
 * @returns OCR result
 */
 function ocr(imagePath) {
  return new Promise(async (resolve, reject) => {
    //-- Creates a new progress bar in CLI --//
    //Derives the name of the file to be processed
    const fileName = path.basename(imagePath);

    //Creates the bar
    const progressBar = new cliProgress.SingleBar({
      format: `[OCR] Processing '${fileName}' | {status} |{bar}| {percentage}%`,
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true,
      clearOnComplete: true,
      linewrap: true
    });

    //Initialises the bar
    progressBar.start(100, 0, {
      speed: "N/A",
      status: "N/A"
    });
    
    //-- Creates and configures OCR worker --//
    const worker = createWorker({
      logger: (m) => { 
        progressBar.update(m.progress * 100, {
          status: capitalizeFirstLetter(m.status)
        });
      },
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

    //Stop the bar
    progressBar.stop();

    //Print OCR complete log
    console.log(`[OCR] Processed '${fileName}'`);

    //Resolve with the result
    resolve(text);
  });
}

/**
 * Checks if the aspect ratio of a image can be uploaded to instagram, and if it can't it will attempt to resize it
 * Even though there is a catch at the part where it uploads to catch rejected aspect ratios,
 * It is a good idea to catch it here first before it reaches their servers to
 * Prevent them from detecting us as a bot
 * @param {string} imagePath Path to the image being checked
 * @returns Whether or not the ratio of the image is acceptable
 */
function parseImage(imagePath) {
  return new Promise(async (resolve, reject) => {
    //-- Auto scales and crops images that do not fit the allowed aspect ratios --//
    //Define allowed aspect ratios
    //Allowed aspect ratios are obtained from https://help.instagram.com/1631821640426723
    const allowedRatios = {
      width: {
        lowerLimit: 320,
        upperLimit: 1080
      },
      height: {
        lowerLimit: 566,
        upperLimit: 1350
      }
    }

    //Read the image to buffer (Also obtains image metadata)
    let image = await sharp(imagePath).rotate().toBuffer({resolveWithObject: true});

    /**
     * Resizes/crops image based on width
     */
    //Check if the image fits the allowed width
    if (image.info.width < allowedRatios.width.lowerLimit || image.info.width > allowedRatios.width.upperLimit) {
      //-- Image does not meet the allowed width, attempt to resize it --//
      //Check if the image is closer to the lower limit
      if (allowedRatios.width.lowerLimit - image.info.width >= image.info.width - allowedRatios.width.upperLimit) {
        //The image is closer to the lower limit, resize it to match
        image = await sharp(image.data).resize({ width: allowedRatios.width.lowerLimit}).toBuffer({resolveWithObject: true});
      } else {
        //The image is closer to the upper limit, resize it to match
        image = await sharp(image.data).resize({ width: allowedRatios.width.upperLimit}).toBuffer({resolveWithObject: true});
      }
    }

    /**
     * Resizes/crops image based on height
     */
    //Check if the image fits the allowed height
    if (image.info.height < allowedRatios.height.lowerLimit || image.info.height > allowedRatios.height.upperLimit) {
      //-- Image does not meet the allowed height, attempt to trim/letterbox it --//
      //Check if the image is closer to the lower limit
      if (allowedRatios.height.lowerLimit - image.info.height >= image.info.height - allowedRatios.height.upperLimit) {
        //The image is closer to the lower limit, calculate the width to resize to
        const newWidth = Math.floor((allowedRatios.height.lowerLimit / image.info.height) * image.info.width);

        //Check if the newly calculated width exceeds the maximum acceptable width
        if (newWidth > allowedRatios.width.upperLimit) {
          //The newly calculated width exceeds the maximum allowed
          //Resize the image to the max width
          const resizedImage = await sharp(image.data).resize({ width: allowedRatios.width.upperLimit }).toBuffer({resolveWithObject: true});

          //-- Add blurred borders to the side of the image --//
          //Generate a blurred image and overlay the resized image on top of it
          image = await sharp(image.data).resize({ width: resizedImage.info.width, height: resizedImage.info.width }).blur(400).composite([{input: resizedImage.data, gravity: "center"}]).toBuffer({resolveWithObject: true});
        } else {
          //The newly calculated width is ok
          //Resize the image
          image = await sharp(image.data).resize(newWidth, allowedRatios.height.lowerLimit).toBuffer({resolveWithObject: true});
        }
      } else {
        //The image is closer to the upper limit, crop the image (Vertically and horizontally anchored)
        image = await sharp(image.data).resize(image.info.width, allowedRatios.height.upperLimit).toBuffer({resolveWithObject: true});
      }
    }

    //The image has been parsed
    resolve(image.data);
  });
}

module.exports = {
  formatFileName,
  ocr,
  parseImage
};
