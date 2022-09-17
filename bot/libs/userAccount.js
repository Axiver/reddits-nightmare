//-- Import required libraries --//
const { IgCheckpointError, IgLoginBadPasswordError, IgChallengeWrongCodeError } = require("instagram-private-api");
const Bluebird = require("bluebird");
const fs = require("fs");

//-- Global Declarations --//
const cookieLocation = "./cookies/session.json";

//-- Functions --//
/**
 * Saves instagram session as a cookie
 * @param {Object} ig Instagram client
 */
function saveSession(ig) {
  return new Promise(async (resolve, reject) => {
    //Serializes the cookie
    const cookie = await ig.state.serialize();
    delete cookie.constants; //This deletes the version info, so you'll always use the version provided by the library

    //Saves the cookie to disk
    fs.writeFile(cookieLocation, JSON.stringify(cookie), (err, result) => {
      if (err)
        console.log("There was an error while saving session data: " + err);
    });

    resolve();
  });
}

/**
 * Check if a session exists
 * @returns Whether or not the session exists
 */
function findSession() {
  //Checks if the file exists
  return fs.existsSync(cookieLocation);
}

/**
 * Load the session
 * @returns The session object
 */
function loadSession() {
  /**
   * require() path is relative to the current file
   * However, the location of the cookie is provided relative to the file being ran (beepboop.js)
   * Therefore, we need to append a "." to the filepath because this file is in a sibling folder (/libs/) of /cookies/
   * :))))))))))))))
   */
  const session = require("." + cookieLocation);
  return session;
}

/**
 * Sends the challenge code to Instagram
 * @param {Object} ig Instagram client
 */
async function solveChallenge(ig) {
  return new Promise(async (resolve, reject) => {
    //Asks the user for the code
    const question = "What is the code Instagram sent you? (It can be found in your Email/SMS)\n";
    const challengeCode = await askQuestion(question);

    //Sends the code to Instagram
    await Bluebird.try(async () => {
      console.log(await ig.challenge.sendSecurityCode(challengeCode));
      if (ig.account) {
        //Serialize session cookie (This gets invoked after every call to Instagram)
        ig.request.end$.subscribe(async () => {
          await saveSession(ig);
        });
        console.log("Successfully logged in to Instagram!");
        resolve();
      }
    }).catch(IgChallengeWrongCodeError, async () => {
      //The code entered was wrong, so we call this function again
      console.log("The code given was incorrect! Please type it in again.");
      solveChallenge(ig);
    });
  });
}

/**
 * Logs in to Instagram
 * @param {string} username The account username
 * @param {string} password The account password
 * @param {Object} ig Instagram client
 */
async function login(username, password, ig) {
  return new Promise(async (resolve, reject) => {
    //Load config file
    const configs = require("../configs/config.json");

    //Generates a ID for Instagram
    ig.state.generateDevice(username);

    //-- Attempt to login via saved cookie --//
    //Check if a session cookie exists
    if (findSession()) {
      //A session cookie is saved on the disk, import the saved cookie
      await ig.state.deserialize(loadSession());

      //Checks if the cookie was loaded successfully
      if (ig.account) {
        //Serialize session cookie (This gets invoked after every call to Instagram)
        ig.request.end$.subscribe(async () => {
          await saveSession(ig);
        });

        //Login successful
        console.log("Successfully logged in to Instagram!");
        resolve();
      } else {
        //Attempt to relogin
        login(username, password, ig);
      }
    } else {
      //-- Unable to login via cookie, attempt logging in via username and password --//
      //Login procedure
      await Bluebird.try(async () => {
        //Execute usual requests in the android app, not required but reduces suspicion from Instagram
        // XXX await ig.simulate.preLoginFlow();

        //Login
        if (await ig.account.login(username, password, ig)) {
          //Serialize session cookie (This gets invoked after every call to Instagram)
          ig.request.end$.subscribe(async () => {
            await saveSession(ig);
          });
          console.log("Successfully logged in to Instagram!");
          resolve();
        }

        //Execute requests normally done post-login, reduces suspicion
        // XXX process.nextTick(async() => await ig.simulate.postLoginFlow());
      }).catch(IgLoginBadPasswordError, async () => {
        //The password entered is wrong, so we ask the user for the correct one
        const retryPassword = await askQuestion("\nThe password for the Instagram account '" + username + "'' is incorrect. Please type the correct password.\n");

        //-- Save the correct one to config.json if "Remember me" is enabled --//
        //Check if the user enabled "Remember me"
        if (configs["insta_password"]) {
          //"Remember me" is enabled, update the saved password
          configs["insta_password"] = retryPassword;
          fs.writeFile("./configs/config.json", JSON.stringify(configs), (err) => {
            if (err)
              console.log("There was an error while trying to update config.json with the new password: " + err);
          });
        }

        //-- Attempt to relogin --//
        login(username, retryPassword, ig);
        resolve();
      }).catch(IgCheckpointError, async () => {
        /**
         * This portion should THEORETICALLY work. I've never had my account get challenged before, so I have nothing to test it on.
         * In the event that this does not work, please open a new issue at https://github.com/Garlicvideos/reddits-nightmare/issues/new
         */
        //Instagram wants us to prove that we are human
        console.log("Human verification received from Instagram! Solving challenge...");

        //Initiates the challenge
        await Bluebird.try(async () => {
          await ig.challenge.auto(true);
          console.log(ig.state.challenge);
        }).catch(IgCheckpointError, async () => {
          //Call the checkpoint solving team
          await solveChallenge(ig);
          /*
          //Temporary workaround
          console.log("\nInstagram wants us to prove that we are human! Unfortunately, this means that you will need to login to this Instagram account manually using a web browser or your mobile phone.");
          console.log("After logging in, solve the challenge and re-run this bot. The bot will now exit.");
          process.exit(0);
          */
        });
      });
    }
  });
}

module.exports = {
  login
};