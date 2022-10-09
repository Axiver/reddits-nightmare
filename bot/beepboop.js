//-- Import required libraries --//
const { IgApiClient } = require("instagram-private-api");
const logger = require("./libs/logger")("Instagram");

//Initialise IG API client
const ig = new IgApiClient();

//Import utility functions and libs
const { makeDirs, setup, login, snoopReddit, askQuestion, chooseInstaPhoto } = require("./libs/");

//-- Functions --//
/**
 * Retrieves the configured upload frequency
 * @param {object} configs Config data
 */
function getUploadFrequency(configs) {
  //Retrieve upload frequency from configs
  const frequency = configs["frequency"];

  //Check if a valid upload frequency is configured
  if (Number.isNaN(frequency)) {
    //Invalid frequency configured
    logger.warn("Invalid upload frequency configured, defaulting to once every 25 mins");
    return 1.5e+6;
  }

  //Check if the upload frequency configured is less than a minute
  if (frequency < 60 * 1000) {
    //Upload frequency is too short
    logger.warn("Configured upload frequency is too short (must be > 1 min), defaulting to once every 25 mins");
    return 1.5e+6;
  }

  return frequency;
}

async function start() {
  //-- Fail-safe checks --//
  //List of needed directories
  const directories = [
    "./configs",
    "./cookies",
    "./logs",
    {
      "./assets": [
        {
          "/images": [
            "/approved",
            "/nsfw",
            "/rejected",
            "/uploaded",
            "/error",
          ]
        },
      ]
    },
  ];

  //Create any required directories that do not exist
  await makeDirs(directories, "");

  //Perform first time setup if required
  await setup();

  //-- Login to Instagram --//
  //Load config file
  const configs = require("./configs/config.json").instagram;

  //Initialises the instagram password
  let insta_password;

  //Request for user's Instagram password if they did not store it in config.json
  if (!configs["insta_password"]) {
    const question = "What is the password associated with '" + configs["insta_username"] + "'? (Required to login) \n";
    insta_password = await askQuestion(question);
  } else {
    insta_password = configs["insta_password"];
  }

  //Create a new Instagram session
  await login(configs["insta_username"], insta_password, ig);

  //Activates reddit crawler
  //snoopReddit();

  //-- Upload every (25) minutes --//
  //Retrieve the configured upload frequency
  const frequency = getUploadFrequency(configs);
  logger.info(`Uploading with a frequency of every ${frequency}ms`);

  //You may change the upload frequency if you wish. (The number below is in milliseconds)
  setInterval(() => { 
    chooseInstaPhoto(ig) 
  }, frequency);

  chooseInstaPhoto(ig);
}

//Activates the bot
start();
