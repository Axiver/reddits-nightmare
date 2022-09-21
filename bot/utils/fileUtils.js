//-- Import required libraries --//
const path = require("path");

//-- Functions --//
/**
 * Checks a url to determine whether or not it points to an image
 * @param {string} url The url to check
 * @returns Whether or the url points to an image
 */
 function isImage(url) {
  //Defines accepted image extensions
  const imageExts = [".png", ".jpg", ".jpeg"];
  
  //Derives the extension of the file (if any) from the url
  const extension = path.extname(url);

  //Determines whether or not the url leads to an image and returns the result
  return imageExts.includes(extension);
}

/**
 * Checks a url to determine whether or not it points to a video
 * @param {string} url The url to check
 * @returns Whether or the url points to a video
 */
 function isVideo(url) {
  //Defines accepted video extensions
  const videoExts = [".mp4", ".gif"];
  
  //Derives the extension of the file (if any) from the url
  const extension = path.extname(url);

  //Determines whether or not the url leads to a video and returns the result
  return videoExts.includes(extension);
}

module.exports = {
  isImage,
  isVideo
};
