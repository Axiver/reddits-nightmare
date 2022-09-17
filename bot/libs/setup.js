//-- Import required libraries --//
const fs = require("fs");
const readline = require("readline");

//-- Functions --//
/**
 * Asks the user a question
 * @param {string} question The question to be asked
 * @param {object} rl An existing readline instance
 * @returns The user's response
 */
function askQuestion(question, rl) {
  return new Promise((resolve, reject) => {
    //Check if a readline instance was provided
    if (rl != null) {
      //A readline instance was provided, resume the instance
      rl.resume();

      //Prompt the user with the question
      rl.question(question, (answer) => {
        //Pause the readline instance
        rl.pause();

        //Resolve with the result
        resolve(answer);
      });
    } else {
      //No readline instance was provided
      //Create one and hook to console
      rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      //Prompt the user with the question
      rl.question(question, (answer) => {
        //Unhook readline
        rl.close();

        //Resolve with the result
        resolve(answer);
      });
    }
  });
}

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

/**
 * Creates the necessary config files
 * @param {string[]} subreddits An array of whitelisted subreddits
 * @param {object} logindetails Instagram login details
 * @param {object} postProcessConfig Post-processing configurations
 * @param {object} snooperConfig Reddit snooper configurations
 */
async function createConfigs(subreddits, logindetails, postProcessConfig, snooperConfig) {
  return new Promise((resolve, reject) => {
    //-- Create general config file (config.json) --//
    //Joins login configuration, postProcess configuration and snooper configurations together
    const joinedConfigs = { instagram: logindetails, postProcess: postProcessConfig, snooper: snooperConfig };

    //Create general config file
    fs.writeFile("./configs/config.json", JSON.stringify(joinedConfigs), (err) => {
      //Checks for any errors
      if (!err) {
        //File creation successful
        console.log("Created config.json containing configurations");
      } else {
        console.log("Encountered an error creating './configs/config.json'! Error: " + err);
        process.exit(1);
      }
    });

    //Checks if the subreddits file exists
    if (!fs.existsSync("./configs/subreddits.txt")) {
      //It does not exist, string the subreddits together and create the subreddit config file
      fs.writeFile("./configs/subreddits.txt", subreddits.join(), (err) => {
        if (err) {
          console.log("Encountered an error creating './configs/subreddits.txt'! Error: " + err);
          process.exit(1);
        } else {
          console.log("Created subreddits.txt containing a list of subreddits to read from.");
        }
      });
    }

    //Checks if the custom caption file exists
    if (!fs.existsSync("./configs/customcaption.txt")) {
      //It does note exist, create file to store user's custom caption
      fs.writeFile("./configs/customcaption.txt", "", (err) => {
        if (err) {
          console.log("Encountered an error creating './configs/customcaption.txt'! Error: " + err);
          process.exit(1);
        } else {
          console.log("Created missing file: ./configs/customcaption.txt");
        }
      });
    }
    
    //Wait a second for everything to be created. There's gotta be a better way to do this, I'll figure it out in the future.
    setTimeout(() => {
      //Check if all the config files are present. If so, return true.
      if (fs.existsSync("./configs/customcaption.txt") && fs.existsSync("./configs/config.json") && fs.existsSync("./configs/subreddits.txt")) {
        resolve(true);
      } else {
        console.log("There was a problem creating the config files. The bot will now exit.");
        process.exit(1);
      }
    }, 1000);
  });
}

/**
 * Configures the reddit snooper
 * @param {Object} rl Readline instance
 * @returns Reddit snooper settings
 */
function setupSnooper(rl) {
  return new Promise(async (resolve, reject) => {
    //Initialises the settings object
    const settings = {};

    //-- Configures post sorting order --//
    //Asks the user which sorting method they'd prefer
    const answer = await askQuestion("\nHow would you like the bot to sort? (Defaults to hot) [hot/top_24/top_day/controversial/rising] \n", rl);
    const sortingMethod = answer.toLowerCase();

    //Checks for and saves a valid response
    switch (sortingMethod) {
      case "hot":
        settings["sort"] = "hot";
        break;
      case "top_24":
        settings["sort"] = "top_24";
        break;
      case "top_day":
        settings["sort"] = "top_day";
        break;
      case "controversial":
        settings["sort"] = "controversial";
        break;
      case "rising":
        settings["sort"] = "rising";
        break;
      default:
        settings["sort"] = "hot";
        console.log("Invalid response received, defaulting to 'hot'");
    }

    //-- Configures the number of posts to be monitored --//
    //Asks the user how many posts they'd like the bot to monitor
    const monitorCount = await askQuestion("\nHow many posts would you like to monitor? (E.g. Top 10 posts of hot | Defaults to 15) [1-100]\n", rl);

    //Checks for and saves a valid response
    if (!isNaN(monitorCount) && monitorCount > 0) {
      settings["top"] = monitorCount;
    } else {
      console.log("Invalid response received, defaulting to 15.");
      settings["top"] = 15;
    }

    //Resolve with the result
    resolve(settings);
  });
}

/**
 * Asks user for their instgram login details
 * @param {object} rl Readline instance
 * @returns Instagram client settings
 */
function setupInstagram(rl) {
  return new Promise(async (resolve, reject) => {
    //Initialise settings object
    const settings = {};
    
    //-- Configures the Instagram login credentials --//
    //Asks the user for their instagram username
    const username = await askQuestion("\nWhat is your Instagram account username? \n", rl);
    
    //Saves the username to the settings object
    settings["insta_username"] = username;

    //Asks the user for whether or not they'd like the "Remember me" feature
    const answer = await askQuestion('\nWould you like to enable "Remember me"? (This stores your Instagram password as plaintext on your local machine, resulting in weaker security. (It is not recommended to enable this as you only need to type in your password once every now and then anyways, due to the usage of sessions)\n', rl);
    const rememberMe = answer.toLowerCase();
    
    //Checks for a valid response
    if (rememberMe != "y" && rememberMe != "yes") {
      //User does not want the "Remember Me" feature
      //Resolve and return early
      resolve(settings);
      return;
    }

    //The user wants the "Remember Me" feature
    //Asks the user for their password
    const password = await askQuestion('\nWhat is the password associated with Instagram account "' + settings["insta_username"] + '"?\n', rl);
    
    //Saves the password to the settings object
    settings["insta_password"] = password;
    
    //Resolves with the result
    resolve(settings);
  });
}

/**
 * Configures the snooper's whitelisted subreddits
 * @param {object} rl Readline instance
 * @returns Whitelisted subreddits
 */
function setupSubreddits(rl) {
  return new Promise(async (resolve, reject) => {
    //-- Configures the subreddits to whitelist --//
    //Asks the user for the subreddits they'd like to whitelist
    let subreddits = await askQuestion("\nWhat subreddit(s) do you want to whitelist? \n(r/all works too. Do NOT include 'r/'. Seperate using commas. Make sure the subreddit exists, or the bot will spit out errors/crash later on.)", rl);

    //Formats the response
    //Checks if the user has any "r/"s
    if (subreddits.includes("r/")) {
      //Removes any "r/" from the input
      subreddits = subreddits.replace(/r\//g, "");
    }

    //Removes spaces in the user's input
    subreddits = subreddits.replace(/ /g, "");

    //Parses the response into an array
    const result = subreddits.split(",");

    //Resolves with the result
    resolve(result);
  });
}

/**
 * Configures post-processing options
 * @param {object} rl Readline instance
 * @returns Post-processing options
 */
function setupPostProcessing(rl) {
  return new Promise(async (resolve, reject) => {
    //Initialises the settings object
    const settings = {};

    //-- Configures automatic hashtags --//
    //Asks the user whether or not they'd like for hashtags to be generated automatically
    let answer = await askQuestion("\nWould you like the bot to automatically generate hashtags for you? [y/cancel] \n", rl);
    const autoHashtags = answer.toLowerCase();

    //Checks for and saves a valid response
    if (autoHashtags == "y" || autoHashtags == "yes") {
      settings["autohashtags"] = "yes";
    } else {
      settings["autohashtags"] = "no";
    }

    //-- Configures OCR --//
    //Asks the user if they'd like for OCR to be enabled
    answer = await askQuestion("\nWould you like OCR to be enabled? (Scans images for text and uses them as hashtags) [y/cancel] \n", rl);
    const enableOCR = answer.toLowerCase();

    //Checks for and saves a valid response
    if (enableOCR == "y" || enableOCR == "yes") {
      settings["ocr"] = "yes";
    } else {
      settings["ocr"] = "no";
    }

    //Resolves with the result
    resolve(settings);
  });
}

/**
 * Performs first time setup
 */
 function setup() {
  return new Promise(async (resolve, reject) => {
    //Check if account credential file exists
    if (!fs.existsSync("./configs/config.json")) {
      //If no, perform first time setup
      console.log("Performing first time setup");

      //Hook to console
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      //Asks if the user wants automatic setup
      const response = await askQuestion("Would you like to automatically configure the config file? (You will have to do this manually if you answer no) [y/n] \n", rl);
      const answer = response.toLowerCase();

      //Checks for a valid response
      if (answer !== "y" && answer !== "yes") {
        //User does not want automatic configuration
        console.log("Okay, but you need to perform manual setup or the bot will refuse to start.");
        console.log("Read the documentation at https://github.com/Garlicvideos/reddits-nightmare/wiki for more information.");

        //End readline and exit nodejs
        rl.close();
        process.exit(0);
      }

      //User wants automatic configuration
      //Request for user's Instagram login details
      const logindetails = await setupInstagram(rl);

      //Configures the reddit snooper
      const snooperConfig = await setupSnooper(rl);

      //Check if the subreddits file exists
      let subreddits = undefined;
      if (!fs.existsSync("./configs/subreddits.txt")) {
        //The subreddit file does not exist, create it
        subreddits = await setupSubreddits(rl);
      }

      //Request for post-processing configuration
      const postProcessConfig = await setupPostProcessing(rl);

      //Creates remaining configuration files
      if (!await createConfigs(subreddits, logindetails, postProcessConfig, snooperConfig)) {
        //An error has occurred
        reject("An unknown error has occurred while performing automatic setup.");
      }

      //Setup complete, end readline
      rl.close();
      resolve("Setup complete. Booting!");
    } else {
      //No setup is required, all prerequisites are present
      resolve("Prerequisites present, booting!");
    }
  });
}

module.exports = {
  askQuestion,
  makeDirs,
  setup
};