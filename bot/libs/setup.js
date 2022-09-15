//-- Import required libraries --//
const fs = require("fs");

//-- Functions --//
/**
 * Directory creation
 * @param {string | string[] | object} dirs The directories to create
 * @param {string} parentDir The parent directory
 */
 function makeDirs(dirs, parentDir) {
  return new Promise((resolve, reject) => {
    /**
     * Creates a directory from a string
     */
    //Check if the element is a string
    if (typeof dirs === "string") {
      //Check if the directory already exists
      if (!fs.existsSync(parentDir + dirs)) {
        //The directory does not exist, create it
        fs.mkdirSync(parentDir + dirs);
        console.log("Created missing directory:" + parentDir + dirs);

        resolve();
        return;
      }
    }

    /**
     * Creates directories from an array
     */
    //Check if the dirs passed in is an array
    if (Array.isArray(dirs)) {
      //An array of directories was passed in
      //Create every directory in the array
      dirs.forEach((dir) => {
        //Creates the directory
        makeDirs(dir, parentDir);
      });

      resolve();
      return;
    }
    
    /**
     * Creates directories from an object
     */
    //Check if the element is an object
    if (typeof dirs === "object") {
      //The item is an object, loop through it
      for (const key in dirs) {
        //Checks if the object has any keys to check through
        if (Object.prototype.hasOwnProperty.call(dirs, key)) {
          //Yes it does, create the directory
          makeDirs(key, parentDir);

          //Parent directory created, create its sub-directories
          makeDirs(dirs[key], parentDir + key);

          resolve();
          return;
        }
      }
    }

    resolve();
  });
}

module.exports = {
  makeDirs
};