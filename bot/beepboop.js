//-- Import required libraries --//
const { IgApiClient } = require("instagram-private-api");

//Initialise IG API client
const ig = new IgApiClient();

//Import utility functions and libs
const { makeDirs, setup, login, snoopReddit, askQuestion, chooseInstaPhoto } = require("./libs/index");

//-- Functions --//
async function start() {
  //-- Fail-safe checks --//
  //List of needed directories
  const directories = [
    "./configs",
    "./cookies",
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
  console.log(await setup());

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
  //You may change the upload frequency if you wish. (The number below is in milliseconds)
  setInterval(() => { chooseInstaPhoto(ig) }, 1.5e6);

  chooseInstaPhoto(ig);
}

//Activates the bot
start();
