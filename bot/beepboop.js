//Initialise required libraries
const instagram_api = require("instagram-private-api");
const ig = new instagram_api.IgApiClient();
const Bluebird = require("Bluebird");
const fs = require("fs");
const request = require('request');
var path = require('path');
var sizeOf = require('image-size');
var ratio = require('aspect-ratio');
const { createWorker } = require('tesseract.js');
const worker = createWorker({
	logger: m => console.log("OCR:",m["progress"]*100 + "%")
});
var customcaption = ""; //Temporary global variable. To be implemented as a feature.

//Initialize WordPOS library (Finds adjectives and verbs and nouns, that cool stuff)
var WordPOS = require('wordpos'),
    wordpos = new WordPOS();

//Initialize reddit api library
var Snooper = require('reddit-snooper');
snooper = new Snooper({
    automatic_retries: true, // automatically handles condition when reddit says 'you are doing this too much'
    api_requests_per_minute: 60 // api requests will be spread out in order to play nicely with Reddit
});

//Functions
//Directory creation
async function makeDirs() {
	return new Promise(function(resolve, reject) {
		//List of needed directories
		let directories = ["./configs", "./assets", "./assets/images", "./assets/images/approved", "./assets/images/nsfw", "./assets/images/rejected", "./assets/images/uploaded", "./assets/images/error"];
		//Create every directory in the array
		directories.forEach(function(dir) {
			if (!fs.existsSync(dir)) {
			    fs.mkdirSync(dir);
			    console.log("Created missing directory:" + dir);
			}
		});
		resolve();
	});
}

//First time setup
async function setup() {
	return new Promise(function(resolve, reject) {
		//Check if account credential file exists
		if (!fs.existsSync("./configs/account.json")) {
			//If no, perform first time setup
			console.log("Performing first time setup. Login details are required.");
			//Hook to console
			var readline = require('readline');
			var rl = readline.createInterface({
			  	input: process.stdin,
			  	output: process.stdout
			});
			//Ask a question
			//console.log("Would you like to automatically configure the config file? (You will have to do this manually if you answer no) [y/n]");
			rl.question('Would you like to automatically configure the config file? (You will have to do this manually if you answer no) [y/n] \n', async function (answer) {
			  	rl.pause();
			  	answer = answer.toLowerCase();
			  	if (answer == "y" || answer == "yes") {
			  		//Request for user's Instagram login details
			  		let logindetails = await setupInstagram(rl);
			  		if (!fs.existsSync("./configs/subreddits.txt")) {
  						var subreddits = await setupSubreddits(rl);
  					}
  					if (await createConfigs(subreddits, logindetails)) {
  						resolve("Setup complete. Booting!");
  					}
			  	} else {
			    	console.log("Okay, but you need to perform manual setup or the bot will refuse to start.");
			    	console.log("Read the documentation at https://github.com/Garlicvideos/reddits-nightmare for more information.");
			    	//End readline and exit nodejs
			    	rl.close();
			    	process.exit(0);
			    }
			});
		} else {
			resolve("Prerequisites present, booting!");
		}
	});
}

//Asks user for their login details and other things
async function setupInstagram(rl) {
	return new Promise(function(resolve, reject) {
		let settings = {};
		rl.resume();
		rl.question('What is your Instagram account username? \n', async function (answer) {
			settings["insta_username"] = answer;
			rl.question('Would you like the bot to automatically generate hashtags for you? [y/cancel] \n', async function(answer) {
				answer = answer.toLowerCase();
				if (answer == "y" || answer == "yes") {
					settings["autohashtags"] = "yes";
				} else {
					settings["autohashtags"] = "no";
				}
				rl.question('Would you like OCR to be enabled? (Scans images for text and uses them as hashtags) [y/cancel] \n', async function(answer) {
					answer = answer.toLowerCase();
					if (answer == "y" || answer == "yes") {
						settings["ocr"] = "yes";
					} else {
						settings["ocr"] = "no";
					}
					resolve(JSON.stringify(settings));
				});
			});
		});
	});
}

//Asks the user for subreddit configuration
async function setupSubreddits(rl) {
	return new Promise(function(resolve, reject) {
		console.log("What subreddit(s) do you want to whitelist?");
		console.log("(r/all works too. Do NOT include 'r/'. Seperate using commas. Make sure the subreddit exists, or the bot will spit out errors/crash later on.)")
		rl.resume();
		rl.question('', function (answer) {
			rl.pause();
			if (answer.includes("r/")) {
				//Removes "r/"s from user's input
				answer = answer.replace(/r\//g, '');
				console.log("\"r/\"s aren't required. Your input has been rectified");
			}
			//Removes spaces in user's input
			subreddits = answer.replace(/ /g, '');
			//End readline session as it is no longer required
			rl.close();
			resolve(subreddits);
		});
	});
}

//Creates config files
async function createConfigs(subreddits, logindetails) {
	return new Promise(function(resolve, reject) {
		//Create general config file
		fs.writeFile("./configs/account.json", logindetails, function(err) {
			if (!err) {
				console.log("Created account.json containing configurations");
				//Create subreddit config file
				if (!fs.existsSync("./configs/subreddits.txt")) {
					fs.writeFile("./configs/subreddits.txt", subreddits, function(err) {
						if (!err) {
							console.log("Created subreddits.txt containing a list of subreddits to read from.");
							//Create file to store user's custom caption
					  		if (!fs.existsSync("./configs/customcaption.txt")) {
								fs.writeFile("./configs/customcaption.txt", "", function(err) {
									if (!err) {
										console.log("Created missing file: ./configs/customcaption.txt");
										//Check if all the config files are present. If so, return true.
										if (fs.existsSync("./configs/customcaption.txt") && fs.existsSync("./configs/account.json") && fs.existsSync("./configs/subreddits.txt")) {
											resolve(true);
										} else {
											console.log("There was a problem creating the config files. The bot will now exit.");
											process.exit(1);
										}
									} else {
										console.log("Encountered an error creating './configs/customcaption.txt'! Error: " + err);
										process.exit(1);
									}
								});
							}
						} else {
							console.log("Encountered an error creating './configs/subreddits.txt'! Error: " + err);
							process.exit(1);
						}
					});
		  		}
			} else {
				console.log("Encountered an error creating './configs/account.json'! Error: " + err);
				process.exit(1);
			}
		});
	});
}

//Asks the user for their password
async function askPassword(username) {
	return new Promise(function(resolve, reject) {
		//Hook to console
		var readline = require('readline');
		var rl = readline.createInterface({
		  	input: process.stdin,
		  	output: process.stdout
		});
		rl.question("What is the password associated with '" + username + "'? (Required to login) \n", function (answer) {
			rl.close();
			resolve(answer);
		});
	});
}

//Login to Instagram
async function login(username, password) {
  	//Basic login procedure
  	ig.state.generateDevice(username);
  	await ig.account.login(username, password);
}

//Makes sure aspect ratio of image can be uploaded to instagram
function checkRatio(aspectRatio) {
	aspectRatio = aspectRatio.split(":");
	if (aspectRatio[0] <= 2048 && aspectRatio[1] <= 2048 || aspectRatio[0] <= 1080 && aspectRatio[1] <= 566 || aspectRatio[0] <= 600 && aspectRatio[1] <= 400) {
		if (aspectRatio[0] + ":" + aspectRatio[1] != "4:3") {
			return true;
		} else {
			return false;
		}
	} else {
		return false;
	}
}

async function filterNouns(nouns) {
	return new Promise(resolve => {
		for (var i = 0; i < nouns.length; i++) {
			if (nouns[i].length < 4) {
				nouns.splice(i, 1);
				i--;
			} else {
		    	nouns[i]="#"+nouns[i].toLowerCase();
			}
		}
		resolve(nouns);
	});
}

async function filterAdjectives(nouns, adjective) {
	return new Promise(resolve => {
		for (var i = 0; i < adjective.length; i++) {
			if (adjective[i].length < 4) {
				adjective.splice(i, 1);
				i--;
			} else {
		    	adjective[i]="#"+adjective[i].toLowerCase();
		    	if (nouns.includes(adjective[i])) {
		    		adjective.splice(i, 1);
		    		i--;
		    	}
			}
		}
		resolve(adjective);
	});
}

//Works black magic on the image being uploaded
async function ocr(myImage) {
	return new Promise(async function(resolve, reject) {
		await worker.load();
	  	await worker.loadLanguage('eng');
	  	await worker.initialize('eng');
	  	var { data: { text } } = await worker.recognize(myImage);
	  	await worker.terminate();
	  	resolve(text);
	});
}

async function getNounsAdjectives(wordpos, caption) {
	return new Promise(resolve => {
		wordpos.getNouns(caption, async function(result) {
			let nouns = await filterNouns(result);
			wordpos.getAdjectives(caption, async function(result) {
				let adjective = await filterAdjectives(nouns, result);
				let hashtags = nouns.join(" ") + " " + adjective.join(" ");
				console.log("Autohashtag done. This is to be passed through the function: " + hashtags);
				resolve(hashtags);
			});
		});
	});
}

//Generates hashtags for the post
async function autoHashtag(caption, config, myImage) {
	return new Promise(async function(resolve, reject) {
		if (config["autohashtags"] != "yes")
			resolve();
		else if (config["autohashtags"] == "yes") {
			if (config["ocr"] == "yes") {
				var ocrtext = await ocr(myImage);
				console.log("OCR Result:" + ocrtext);
			} else {
				var ocrtext = "";
			}
			let hashtags = await getNounsAdjectives(wordpos, caption + " " + ocrtext.toLowerCase());
			console.log("The final result of autoHashtag is: " + hashtags);
			resolve(hashtags);
		} else {
			console.log("Your account.json file is broken. Please delete it and rerun the bot.");
			resolve(hashtags);
		}
	});
}

//Post to instagram
async function postToInsta(filename, caption) {
	//Declare some variables
	var configs = require('./configs/account.json');
	let path = "./assets/images/approved/" + filename;
	let hashtags = await autoHashtag(caption.toLowerCase(), configs, "./assets/images/approved/" + filename);
	console.log("The gathered hashtags are: " + hashtags);
	let finalCaption = caption + "\n\n\n" + hashtags;
	//Uploads the image to Instagram
	var upload = await ig.publish.photo({
		//Reads the file into buffer before uploading
	    file: await Bluebird.fromCallback(cb => fs.readFile(path, cb)),
	    caption: finalCaption
	}).then(function(result) {
		if (result.status == "ok") {
			console.log("Uploaded image '" + caption + "' to Instagram.");
			//Ensures that the same image does not get reuploaded twice by moving it to the uploaded dir
			fs.rename("./assets/images/approved/" + filename, "./assets/images/uploaded/" + filename, function(err) {
				if (err)
					console.log("There was an error while trying to mark the image as uploaded: " + err);
				else
					console.log("Image has been marked as uploaded!");
			});
		}
	}).catch(function(err) {
		console.log("There was a problem uploading the Image to Instagram (Did they detect us as a bot?): " + err);
		fs.rename("./assets/images/approved/" + filename, "./assets/images/error/" + filename, function(err) {
			if (err)
				console.log("There was an error while trying to unapprove the image: " + err);
			else
				console.log("The image has been unapproved.");
		});
	});
};

//Chooses an Instagram photo to upload
async function chooseInstaPhoto() {
	//Choose random image
	var files = fs.readdirSync('./assets/images/approved/');
	let post = files[Math.floor(Math.random() * files.length)];
	if (post == undefined) {
		//Abort uploading process
		console.log("No images to upload to instagram!");
		return;
	} else {
		//Change the caption from filesystem format back to human readable format
		caption = formatForInsta(post);
		console.log("Uploading post with caption: " + caption);
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
				postToInsta(post, caption);
			} else {
				console.log("Error encountered while uploading image: unapproving image due to an unacceptable aspect ratio");
				fs.rename("./assets/images/approved/" + post, "./assets/images/error/" + post, function(err) {
					if (err)
						console.log("Error encountered while unapproving image: " + err);
				});
			}
		});
	}
}

//Fixes invalid subreddits
async function fixSubreddits(array) {
	return new Promise(function(resolve, reject) {
		let i = -1;
		array.forEach(function(element) {
			i++;
			if (element.length < 2) {
				console.log("Found a subreddit that does not reach the 2 character minimum, fixing...");
				array.splice(i, 1, '');
			}
		});
		array = array.filter(Boolean);
		array = array.join(',');
		resolve(array);
	});
}

//Strings subreddits from config into a searchable URL and helps to resolve any errors in the subreddit list
async function stringSubreddits() {
	return new Promise(function(resolve, reject) {
		//Check if the subreddit list exists
		if (!fs.existsSync("./configs/subreddits.txt")) {
			console.log("Subreddit config file does not exist, defaulting to r/all.");
			//Create the list with r/all as the subreddit
			fs.writeFile("./configs/subreddits.txt", "all", function() {
				console.log("Created missing file 'subreddits.txt' in './configs'");
			});
		} else {
			fs.readFile('./configs/subreddits.txt', "utf8", async function(err, data) {
				if (data == '') {
					data = "all";
					console.log("Subreddit list is empty, defaulting to r/all.")
					fs.writeFile("./configs/subreddits.txt", "all", function() {});
				}
				let array = data.split(",");
				let content = await fixSubreddits(array);
				if (content != data) {
					fs.writeFile("./configs/subreddits.txt", content, function() {
						console.log("Fixed the subreddit list");
					});
				}
			    content = content.replace(/,/g, '+');
			    resolve(content);
			});
		}
	});
}

//Formats caption to submit to ig
function formatForInsta(dir) {
	//Remove file extensions from caption and add back special characters
	let specialCharacters = [/\?/g, /\//g, /\</g, /\>/g, /\"/g, /\*/g, /\\/g, "", "", ""];
	let replacement = ["[q]", "[s]", "[l]", "[m]", "[quo]", "[st]", "[bs]", ".jpg", ".jpeg", ".png"];
	for (var i = 0; i < extensions.length; i++) {
		dir = dir.replace(replacement[i], replacement[i]);
	}
	
	return dir;
}

//Checks if string contains an element in a array
function contains(target, pattern){
    var value = 0;
    pattern.forEach(function(word){
      value = value + target.includes(word);
    });
    return (value === 1);
}

//Replaces special characters in the filename of files
async function replaceSpecialChars(postTitle) {
	return new Promise(function(resolve, reject) {
		let specialCharacters = [/\?/g, /\//g, /\</g, /\>/g, /\"/g, /\*/g, /\\/g];
		let replacement = ["[q]", "[s]", "[l]", "[m]", "[quo]", "[st]", "[bs]"];

		//Replace special characters into filesystem-compatible ones
		for (var i = 0; i < specialCharacters.length; i++) {
			postTitle = postTitle.replace(specialCharacters[i], replacement[i]);
		}
		console.log(postTitle);
		resolve(postTitle);
	});
}

//Formats file name to save to Filesystem
function formatFileName(postTitle, postUrl, nsfw) {
	return new Promise(async function(resolve, reject) {
		let forbiddenWords = ["reddit ", "r/ ", "comments ", "upvote ", "downvote ", "retweet ", "mods ", "me ", "i ", "my "];
		//Reformats the filename so that it complies with window's strict filesystem rules
		postTitle = await replaceSpecialChars(postTitle);

		let filename;
		//Check if post is NSFW
		if (nsfw == true) {
	    	console.log("Found a potentially NSFW post (Will require manual approval): " + postTitle);
	    	filename = "./assets/images/nsfw/" + postTitle + path.extname(postUrl);
	    } else if (contains(postTitle, forbiddenWords)) {
			console.log("Image: " + postTitle + " is rejected due to the title having reddit related words");
			filename = "./assets/images/rejected/" + postTitle + path.extname(postUrl);
		//I have no clue what the stuff below does, but I'm just gonna leave it here in case
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
	return (imageExts.includes(extension));
}

//Downloads posts from reddit
async function download(url, postTitle, nsfw) {
	//Check length of post title
	if (postTitle.length > 250)
		return;
	//Format the file name so that it can be stored in filesystem
	let filename = await formatFileName(postTitle, url, nsfw);
		request.head(url, function(err, res, body) {
		if (!fs.existsSync(filename)) {
			var filetoPipe = fs.createWriteStream(filename);
			filetoPipe.on('open', function() {
				request(url).pipe(filetoPipe).on('close', function() {
					filetoPipe.end();
					console.log("Downloaded: " + postTitle);
				});
			});
		}
	});
};

//Crawls reddit for popular posts to leech on
async function snoopReddit() {
	//Configure the crawler
	let options = {
	    listing: 'hot', // 'hot' OR 'rising' OR 'controversial' OR 'top_day' OR 'top_hour' OR 'top_month' OR 'top_year' OR 'top_all'
	    limit: 10 // how many posts you want to watch? if any of these spots get overtaken by a new post an event will be emitted, 50 is 2 pages
	}

	//Reformat the subreddit list
	subreddits = await stringSubreddits();
	snooper.watcher.getListingWatcher(subreddits, options).on('item', function(item) {
		//If post is a image and has a supported file format
	    if (item.kind = "t3" && isImage(item.data.url)) {
		  	let postUrl = item.data.url;
		  	let postTitle = item.data.title;
		  	let postID = item.data.id;
		  	let nsfw = item.data.over18;
			download(postUrl, postTitle, nsfw);
	    }
	}).on('error', console.error);
}

async function instagram() {
	//-- Fail-safe checks --//
	//Create any required directories that do not exist
	await makeDirs();
	//Perform first time setup if required
	console.log(await setup());

	//-- Login to Instagram --//
	//Load config files
	var configs = require('./configs/account.json');
	var customcaption = require("./configs/customcaption.txt");

	//Request for user's Instagram password
	var insta_password = await askPassword(configs["insta_username"]);

	//Activates reddit crawler
	snoopReddit();

	//Create a new Instagram session
	await login(configs["insta_username"], insta_password);

	//-- Upload every (25) minutes --//
	//You may change the upload frequency if you wish.
	setInterval(chooseInstaPhoto, 1.5e+6);
}

//Activates the bot
instagram();