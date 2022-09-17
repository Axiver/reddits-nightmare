//-- Import required libraries --//
const fs = require("fs");
const path = require("path");

//Import utility functions and libs
const { replaceSpecialChars, contains } = require("../utils/index");

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
    const forbiddenWords = ["reddit ", "r/ ", "comments ", "upvote ", "downvote ", "retweet ", "mods ", "me ", "i ", "my "];

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

module.exports = {
  formatFileName
};
