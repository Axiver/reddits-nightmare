//-- Import required libraries --//
const { IgApiClient } = require("instagram-private-api");
const fs = require("fs");
const request = require("request");
const path = require("path");
const sizeOf = require("image-size");
const ratio = require("aspect-ratio");

//Initialise IG API client
const ig = new IgApiClient();

//Import utility functions and libs
const { checkRatio, contains, replaceSpecialChars, restoreSpecialCharacters } = require("./utils/index");
const { makeDirs, setup, login, postToInsta } = require("./libs/index");

//Initialize reddit api library
const Snooper = require("reddit-snooper");
const snooper = new Snooper({
  automatic_retries: true, // automatically handles condition when reddit says 'you are doing this too much'
  api_requests_per_minute: 60, // api requests will be spread out in order to play nicely with Reddit
});

//-- Functions --//
//Chooses an Instagram photo to upload
async function chooseInstaPhoto() {
  //Choose random image
  var files = fs.readdirSync("./assets/images/approved/");
  let post = files[Math.floor(Math.random() * files.length)];
  if (post == undefined) {
    //Abort uploading process
    console.log("No images to upload to instagram!");
    return;
  } else {
    //Change the caption from filesystem format back to human readable format
    let caption = restoreSpecialCharacters(post);
    console.log("Uploading post with caption: " + caption);

    //Obtain the size of the image
    sizeOf("./assets/images/approved/" + post, function (err, dimensions) {
      if (err) {
        console.log("Error uploading image to Instagram: " + err);
        return; //Abort
      }
      //Check aspect ratio of image before it reaches instagram
      //Even though there is a catch at the part where it uploads to catch this,
      //It is a good idea to catch it here first before it reaches their servers to
      //Prevent them from detecting us as a bot
      let aspectRatio = ratio(dimensions.width, dimensions.height);
      if (checkRatio(aspectRatio)) {
        postToInsta(post, caption, ig);
      } else {
        console.log("Error encountered while uploading image: unapproving image due to an unacceptable aspect ratio");
        fs.rename("./assets/images/approved/" + post, "./assets/images/error/" + post, function (err) {
          if (err) console.log("Error encountered while unapproving image: " + err);
        });

        //Upload another image by repeating the process
        console.log("Uploading a different image...");
        chooseInstaPhoto();
      }
    });
  }
}

//Fixes invalid subreddits
async function fixSubreddits(array) {
  return new Promise(function (resolve, reject) {
    let i = -1;
    array.forEach(function (element) {
      i++;
      if (element.length < 2) {
        console.log("Found a subreddit that does not reach the 2 character minimum, fixing...");
        array.splice(i, 1, "");
      }
    });
    array = array.filter(Boolean);
    array = array.join(",");
    resolve(array);
  });
}

//Strings subreddits from config into a searchable URL and helps to resolve any errors in the subreddit list
async function stringSubreddits() {
  return new Promise(function (resolve, reject) {
    //Check if the subreddit list exists
    if (!fs.existsSync("./configs/subreddits.txt")) {
      console.log("Subreddit config file does not exist, defaulting to r/all.");
      //Create the list with r/all as the subreddit
      fs.writeFile("./configs/subreddits.txt", "all", function () {
        console.log("Created missing file 'subreddits.txt' in './configs'");
      });
    } else {
      fs.readFile("./configs/subreddits.txt", "utf8", async function (err, data) {
        if (data == "") {
          data = "all";
          console.log("Subreddit list is empty, defaulting to r/all.");
          fs.writeFile("./configs/subreddits.txt", "all", function () {});
        }
        let array = data.split(",");
        let content = await fixSubreddits(array);
        if (content != data) {
          fs.writeFile("./configs/subreddits.txt", content, function () {
            console.log("Fixed the subreddit list");
          });
        }
        content = content.replace(/,/g, "+");
        resolve(content);
      });
    }
  });
}

//Formats file name to save to Filesystem
function formatFileName(postTitle, postUrl, nsfw) {
  return new Promise(async function (resolve, reject) {
    let forbiddenWords = ["reddit ", "r/ ", "comments ", "upvote ", "downvote ", "retweet ", "mods ", "me ", "i ", "my "];
    //Reformats the filename so that it complies with window's strict filesystem rules
    postTitle = replaceSpecialChars(postTitle);

    let filename;
    //Check if post is NSFW
    if (nsfw == true) {
      console.log("Found a potentially NSFW post (Will require manual approval): " + postTitle);
      filename = "./assets/images/nsfw/" + postTitle + path.extname(postUrl);
    } else if (contains(postTitle, forbiddenWords)) {
      console.log("Image: " + postTitle + " is rejected due to the title having reddit related words");
      filename = "./assets/images/rejected/" + postTitle + path.extname(postUrl);
      //Checks if the file was previously downloaded. If it is, returns the path of the old file and thus it will not be downloaded again
    } else if (fs.existsSync("./assets/images/uploaded/" + postTitle + path.extname(postUrl))) {
      filename = "./assets/images/uploaded/" + postTitle + path.extname(postUrl);
    } else if (fs.existsSync("./assets/images/error/" + postTitle + path.extname(postUrl))) {
      filename = "./assets/images/error/" + postTitle + path.extname(postUrl);
    } else {
      filename = "./assets/images/approved/" + postTitle + path.extname(postUrl);
    }
    resolve(filename);
  });
}

//Checks image url for file format
function isImage(url) {
  let imageExts = [".jpg", ".jpeg"];
  let extension = path.extname(url);
  return imageExts.includes(extension);
}

//Downloads posts from reddit
async function download(url, postTitle, nsfw) {
  //Check length of post title
  if (postTitle.length > 250) return;
  //Format the file name so that it can be stored in filesystem
  let filename = await formatFileName(postTitle, url, nsfw);
  request.head(url, function (err, res, body) {
    //If the file already exists, it means that it was downloaded before, thus it will not download again.
    if (!fs.existsSync(filename)) {
      var filetoPipe = fs.createWriteStream(filename);
      filetoPipe.on("open", function () {
        request(url)
          .pipe(filetoPipe)
          .on("close", function () {
            filetoPipe.end();
            console.log("Downloaded: " + postTitle);
          });
      });
    }
  });
}

//Crawls reddit for popular posts to leech on
async function snoopReddit() {
  //Configure the crawler
  let options = {
    listing: "hot", // 'hot' OR 'rising' OR 'controversial' OR 'top_day' OR 'top_hour' OR 'top_month' OR 'top_year' OR 'top_all'
    limit: 10, // how many posts you want to watch? if any of these spots get overtaken by a new post an event will be emitted, 50 is 2 pages
  };

  //Reformat the subreddit list
  subreddits = await stringSubreddits();
  snooper.watcher
    .getListingWatcher(subreddits, options)
    .on("item", function (item) {
      //If post is a image and has a supported file format
      if ((item.kind = "t3" && isImage(item.data.url))) {
        let postUrl = item.data.url;
        let postTitle = item.data.title;
        let postID = item.data.id;
        let nsfw = item.data.over18;
        download(postUrl, postTitle, nsfw);
      }
    })
    .on("error", console.error);
}

async function instagram() {
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
  const configs = require("./configs/account.json");

  //Request for user's Instagram password if they did not store it in account.json
  if (!configs["insta_password"]) {
    const question = "What is the password associated with '" + configs["insta_username"] + "'? (Required to login) \n";
    var insta_password = await askQuestion(question);
  } else {
    var insta_password = configs["insta_password"];
  }

  //Create a new Instagram session
  await login(configs["insta_username"], insta_password, ig);

  //Activates reddit crawler
  snoopReddit();

  //-- Upload every (25) minutes --//
  //You may change the upload frequency if you wish. (The number below is in milliseconds)
  setInterval(chooseInstaPhoto, 1.5e6);

  //chooseInstaPhoto();
}

//Activates the bot
instagram();
