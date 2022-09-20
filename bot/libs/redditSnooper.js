//-- Import required libraries --//
const fs = require("fs");
const request = require("request");
const cliProgress = require('cli-progress');
const logger = require("./logger")("Snooper");

//Initialize reddit api library
const Snooper = require("reddit-snooper");
const snooper = new Snooper({
  automatic_retries: true, // automatically handles condition when reddit says 'you are doing this too much'
  api_requests_per_minute: 60, // api requests will be spread out in order to play nicely with Reddit
});

//Import utility functions and libs
const { formatFileName } = require("./image");
const { isImage } = require("../utils/imageUtils");

//-- Functions --//
/**
 * Fixes invalid subreddits
 * @param {string[]} subreddits An array of subreddits
 * @returns Valid array of subreddits
 */
function fixSubreddits(subreddits) {
  return new Promise((resolve, reject) => {
    /**
     * Filters out invalid subreddits
     * 1. Subreddits must have a minimum of 2 characters
     */
    const result = subreddits.filter((subreddit) => {
      //Removes any subreddit that does not meet the 2 character minimum
      if (subreddit.length < 2) {
        logger.info("Found a subreddit that does not reach the 2 character minimum, fixing...");
        return false;
      }

      if (!subreddit) {
        //Subreddit is an empty or null value
        return false;
      }

      //Subreddit has passed all checks
      return true;
    });

    //Resolve with the result
    resolve(result);
  });
}

/**
 * Strings subreddits from config into a searchable URL and helps to resolve any errors in the subreddit list
 * @returns Subreddits in the format of 'subreddit1+subreddit2+subreddit3'
 */
function stringSubreddits() {
  return new Promise((resolve, reject) => {
    //Check if the subreddit list exists
    if (!fs.existsSync("./configs/subreddits.txt")) {
      //Subreddit list does not exist
      logger.warn("Subreddit config file does not exist, defaulting to r/all.");
      
      //Create the list with r/all as the subreddit
      fs.writeFile("./configs/subreddits.txt", "all", () => {
        logger.info("Created missing file 'subreddits.txt' in './configs'");
      });

      //Resolve with the result
      return resolve(["all"]);
    }

    //The subreddit list exists, read from it
    fs.readFile("./configs/subreddits.txt", "utf8", async (err, data) => {
      //Checks if there was any error reading the file
      if (err) {
        //There was an error reading the file, default to r/all
        logger.error("An error occurred while reading file 'subreddits.txt' in './configs', defaulting to r/all");
        fs.writeFile("./configs/subreddits.txt", "all", () => {});
        return resolve(["all"]);
      }

      //File read successfully, check if the file is empty
      if (data.length === 0) {
        //The file is empty, default to r/all
        data = "all";
        logger.warn("Subreddit list is empty, defaulting to r/all.");
        fs.writeFile("./configs/subreddits.txt", "all", () => {});
        return resolve(["all"]);
      }

      //File is not empty, convert from string to array
      const subreddits = data.split(",");
      const content = await fixSubreddits(subreddits);

      //Checks if the subreddits.txt file was broken
      if (content.join() !== subreddits.join()) {
        //The file was broken and it has been fixed
        fs.writeFile("./configs/subreddits.txt", content, () => {
          logger.info("Fixed the subreddit list");
        });
      }

      //Joins the subreddits array with a "+" (For use in HTTP query)
      const result = content.join("+");
      resolve(result);
    });
  });
}

/**
 * Downloads posts from reddit
 * @param {string} url The url of the post
 * @param {string} postTitle The title of the post
 * @param {boolean} nsfw Whether or not the post is NSFW
 */
async function download(url, postTitle, nsfw) {
  //Checks the length of post title
  if (postTitle.length > 250) {
    //The post's title is over the 250 character limit
    return;
  }

  //Determines the path of the file for storage in the filesystem
  const filepath = await formatFileName(postTitle, url, nsfw);

  //Prepares to download the image
  request.head(url, (err, res, body) => {
    //If the file already exists, it means that it was downloaded before, thus it will not download again.
    if (!fs.existsSync(filepath)) {
      //-- The file has never been downloaded before, download it --//
      logger.verbose(`Downloading '${postTitle}' from ${url} to ${filepath}`);

      //Open a write stream to the target path
      const filetoPipe = fs.createWriteStream(filepath);

      //Creates a progress bar
      const progressBar = new cliProgress.SingleBar({
        format: `Downloading '${postTitle}' |{bar}| {percentage}% | {value}/{total} Chunks | Speed: {speed}`,
        barCompleteChar: '\u2588',
        barIncompleteChar: '\u2591',
        hideCursor: true,
        clearOnComplete: true,
        linewrap: true
      });

      //Initialises the bar
      progressBar.start(100, 0, {
        speed: "N/A"
      });

      //Download the image and pipe it to the file
      filetoPipe.on("open", () => {
        request(url)
          .pipe(filetoPipe)
          .on('response', (data) => {
            //Retrieve the total number of chunks of the payload
            const totalChunks = parseInt(data.headers['content-length']);

            //Start the progress bar
            progressBar.start(totalChunks);
          })
          .on("data", (chunk) => {
            //Update the progress bar on every chunk received
            progressBar.increment(chunk.length);
          })
          .on("close", () => {
            //Download complete, close pipe
            filetoPipe.end();

            //Stop the progress bar
            progressBar.stop();
            logger.info(`Downloaded '${postTitle}'`);
          });
      }).on('error', (err) => {
        //Stop the progress bar
        progressBar.stop();
        logger.error(`Unable to download '${postTitle}': `, err);
      });
    }
  });
}

/**
 * Crawls reddit for popular posts to leech off of
 */
async function snoopReddit() {
  //Load config file
  const configs = require("../configs/config.json").snooper;

  //Configure the crawler
  let options = {
    listing: configs.sort, // 'hot' OR 'rising' OR 'controversial' OR 'top_day' OR 'top_hour' OR 'top_month' OR 'top_year' OR 'top_all'
    limit: configs.top, // how many posts you want to watch? if any of these spots get overtaken by a new post an event will be emitted, 50 is 2 pages
  };

  //Reformat the subreddit list
  const subreddits = await stringSubreddits();

  //Begins snooping
  snooper.watcher
    .getListingWatcher(subreddits, options)
    .on("item", (item) => {
      //If post is a image and has a supported file format
      if ((item.kind = "t3" && isImage(item.data.url))) {
        //Retrieves information about the post
        const postUrl = item.data.url;
        const postTitle = item.data.title;
        const postID = item.data.id;
        const nsfw = item.data.over18;

        //Downloads the post
        download(postUrl, postTitle, nsfw);
      }
    })
    .on("error", logger.error);
}

module.exports = {
  snoopReddit
}