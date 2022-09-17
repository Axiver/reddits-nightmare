//-- Import required libraries --//
const path = require("path");

//-- Functions --//
/**
 * Checks if the aspect ratio of a image can be uploaded to instagram
 * @param {string} aspectRatio The aspect ratio of the image
 * @returns Whether or not the ratio of the image is acceptable
 */
function checkRatio(aspectRatio) {
  //Obtains the width and the height of the image
  const [width, height] = aspectRatio.split(":");

  //Define the allowed height and width ratio of the image
  const allowedWidth = [2048, 1080, 600];
  const allowedHeight = [2048, 566, 400];

  //Checks if the width and height fits any of the allowed aspect ratios
  for (let i = 0; i < allowedWidth.length; i++) {
    if (width <= allowedWidth[i] && height <= allowedHeight[i]) {
      //The aspect ratio is allowed
      //Checks if the aspect ratio is 4:3 (Instagram does not allow this aspect ratio)
      if (width + ":" + height != "4:3") {
        //All checks passed
        return true;
      } else {
        //The aspect ratio is 4:3, that is not allowed
        return false;
      }
    }
  }
  //The image does not match any of the allowed aspect ratios
  return false;
}

/**
 * Checks a url to determine whether or not it points to an image
 * @param {string} url The url to check
 * @returns Whether or the url points to an image
 */
 function isImage(url) {
  //Defines accepted image extensions
  const imageExts = [".jpg", ".jpeg"];
  
  //Derives the extension of the file (if any) from the url
  const extension = path.extname(url);

  //Determines whether or not the url leads to an image and returns the result
  return imageExts.includes(extension);
}

module.exports = {
  checkRatio,
  isImage
};
