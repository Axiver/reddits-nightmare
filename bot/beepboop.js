//Initialize needed libraries
const request = require('request');
const fs = require('fs');
var path = require('path');
var sizeOf = require('image-size');
var ratio = require('aspect-ratio');

//Variable declarations
var accdetails = require('./assets/account.json');
let options = {
    listing: 'hot', // 'hot' OR 'rising' OR 'controversial' OR 'top_day' OR 'top_hour' OR 'top_month' OR 'top_year' OR 'top_all'
    limit: 25 // how many posts you want to watch? if any of these spots get overtaken by a new post an event will be emitted, 50 is 2 pages
}
let golbali = 0;

//Initialize reddit api library
var Snooper = require('reddit-snooper');
snooper = new Snooper({
    automatic_retries: true, // automatically handles condition when reddit says 'you are doing this too much'
    api_requests_per_minute: 60 // api requests will be spread out in order to play nicely with Reddit
});

//Initialize instagram library
var Client = require('instagram-private-api').V1;
var device = new Client.Device(accdetails["insta_username"]);
var session;

//Create directories if they don't exist
if (!fs.existsSync('./cookies/')){
    fs.mkdirSync('./cookies/');
}

if (!fs.existsSync('./assets/')){
    fs.mkdirSync('./assets/');
}

if (!fs.existsSync('./assets/images/')){
    fs.mkdirSync('./assets/images/');
}

if (!fs.existsSync('./assets/images/approved')){
    fs.mkdirSync('./assets/images/approved');
}

if (!fs.existsSync('./assets/images/nsfw')){
    fs.mkdirSync('./assets/images/nsfw');
}

if (!fs.existsSync('./assets/images/rejected')){
    fs.mkdirSync('./assets/images/rejected');
}

if (!fs.existsSync('./assets/images/uploaded')){
    fs.mkdirSync('./assets/images/uploaded');
}

if (!fs.existsSync('./assets/images/error')){
    fs.mkdirSync('./assets/images/error');
}


var storage = new Client.CookieFileStorage('./cookies/' + accdetails["insta_username"] + '.json');

//Functions

//Formats file name to save to Filesystem
//This function is so fucking spaghetti italians will compliment you for it
//Any PRs to make this shit better is VERY welcome lol
function formatFileName(postTitle, postUrl, nsfw) {
	return new Promise(resolve => {
		//Filter out bad reddit stuff
		let forbiddenWords = ["reddit", "r/", "comments", "upvote", "downvote", "retweet", "mods"];
		//Filter out bad characters
		postTitle = postTitle.replace(/\?/g, "[q]");
		postTitle = postTitle.replace(/\//g, "[s]");
		postTitle = postTitle.replace(/\</g, "[l]");
		postTitle = postTitle.replace(/\>/g, "[m]");
		postTitle = postTitle.replace(/\"/g, "[quo]");
		postTitle = postTitle.replace(/\*/g, "[st]");

		let filename;
		//Check if post is NSFW
		if (nsfw == true) {
	    	console.log("Found potentially NSFW post: " + postTitle);
	    	filename = "./assets/images/nsfw/" + postTitle + path.extname(postUrl);
	    } else if (contains(postTitle, forbiddenWords)) {
			console.log("Post: " + postTitle + " is rejected");
			filename = "./assets/images/rejected/" + postTitle + path.extname(postUrl);
		} else if (fs.existsSync("./assets/images/uploaded/" + postTitle + path.extname(postUrl))) {
			filename = "./assets/images/uploaded/" + postTitle + path.extname(postUrl);
		} else if (fs.existsSync("./assets/images/error/" + postTitle + path.extname(postUrl))) {
			filename = "./assets/images/error/" + postTitle + path.extname(postUrl);
		} else {
	    	filename = "./assets/images/approved/" + postTitle + path.extname(postUrl);
	    }
		resolve (filename);
	});
}

//Formats caption to submit to ig
function formatForInsta(dir) {
	//Remove file extensions from caption
	dir = dir.replace(".jpg", "");
	dir = dir.replace(".jpeg", "");
	dir = dir.replace(".png", "");

	//Add back special characters
	dir = dir.replace("[q]", "?");
	dir = dir.replace("[s]", "/");
	dir = dir.replace("[l]", "<");
	dir = dir.replace("[m]", ">");
	dir = dir.replace("[quo]", "\"");
	dir = dir.replace("[st]", "*");

	//Replaces "my" to "this"
	dir = dir.replace("my", "this");

	return dir;
}

function contains(target, pattern){
    var value = 0;
    pattern.forEach(function(word){
      value = value + target.includes(word);
    });
    return (value === 1);
}

//Downloads posts from reddit
async function download(url, postTitle, nsfw) {
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

//Checks image url for file format
function isImage(url) {
	let imageExts = [".jpg", ".jpeg"];
	let extension = path.extname(url);
	return (imageExts.includes(extension));
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

//Searches reddit for posts to download
function snoopReddit(options) {
	snooper.watcher.getListingWatcher('all', options).on('item', function(item) {
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

//Chooses a photo randomly from /images/approved and posts it to ig
function chooseInstaPhoto() {
	//Choose random image
	var files = fs.readdirSync('./assets/images/approved/');
	let post = files[Math.floor(Math.random() * files.length)];
	if (post == undefined) {
		console.log("No images to upload to instagram!");
	} else {
		caption = formatForInsta(post);
		sizeOf("./assets/images/approved/" + post, function (err, dimensions) {
			if (err) {
				console.log(err);
				return;
			}
			//Check aspect ratio of image before it reaches instagram
			//Even though there is a catch at the part where it uploads to catch this,
			//It is a good idea to catch it here first before it reaches their servers to
			//Prevent them from detecting us as a bot
			let aspectRatio = ratio(dimensions.width, dimensions.height);
			if (checkRatio(aspectRatio)) {
				postToInsta(post, caption);
			} else {
				fs.rename("./assets/images/approved/" + post, "./assets/images/error/" + post, function(err) {
					if (err)
						console.log(err);
					console.log("Aspect ratio of \"" + post + "\" is bad");
				});
			}
		});
	}
}

//Login
Client.Session.create(device, storage, accdetails["insta_username"], accdetails["insta_password"]).then(function(result) {
	session = result;
	//Post to instagram every (20) seconds
	//Development only. Change the time to something less frequent on production
	setInterval(chooseInstaPhoto, 20000);
});

//Post to instagram
async function postToInsta(filename, caption) {
	Client.Upload.photo(session, "./assets/images/approved/" + filename).then(function(upload) {
    	Client.Media.configurePhoto(session, upload.params.uploadId, caption).then(function(medium) {
			console.log("Uploaded image: \"" + caption + "\" to instagram");
			fs.rename("./assets/images/approved/" + filename, "./assets/images/uploaded/" + filename, function(err) {
				if (err)
					console.log(err);
			});
		}).catch(function(err) {
    		fs.rename("./assets/images/approved/" + filename, "./assets/images/error/" + filename, function(err) {
				if (err)
					console.log(err);
				console.log("Image \"" + filename + "\" is bad");
				return;
			});
    	});
	});
};

//Start snooping
snoopReddit(options);