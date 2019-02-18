//Initialize needed libraries
const request = require('request');
const fs = require('fs');
var path = require('path');

//Variable Definitions
var accdetails = require('./assets/account.json');
let options = {
    listing: 'hot', // 'hot' OR 'rising' OR 'controversial' OR 'top_day' OR 'top_hour' OR 'top_month' OR 'top_year' OR 'top_all'
    limit: 25 // how many posts you want to watch? if any of these spots get overtaken by a new post an event will be emitted, 50 is 2 pages
}

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


var storage = new Client.CookieFileStorage('./cookies/' + accdetails["insta_username"] + '.json');

//Functions
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
		} else {
	    	filename = "./assets/images/approved/" + postTitle + path.extname(postUrl);
	    }
		resolve (filename);
	});
}

function formatForInsta(dir) {
	dir = dir.replace(".jpg", "");
	dir = dir.replace(".jpeg", "");
	dir = dir.replace(".png", "");
	return dir;
}

function contains(target, pattern){
    var value = 0;
    pattern.forEach(function(word){
      value = value + target.includes(word);
    });
    return (value === 1);
}

async function download(url, postTitle, nsfw) {
	/*return new Promise(resolve => {
		let filename = await formatFileName(postTitle, url, nsfw);
		request.head(url, function(err, res, body) {
			if (fs.existsSync(filename))
				fs.unlinkSync(filename);
			var filetoPipe = fs.createWriteStream(filename);
			filetoPipe.on('open', function() {
				request(url).pipe(filetoPipe).on('close', function() {
					filetoPipe.end();
					console.log("Downloaded: " + postTitle);
				});
			});
		});
		resolve (filename);
	});*/
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

function isImage(url) {
	let imageExts = [".png", ".jpg", ".jpeg"];
	let extension = path.extname(url);
	return (imageExts.includes(extension));
}

function snoopReddit(options) {
	snooper.watcher.getListingWatcher('all', options).on('item', function(item) {
	    if (item.kind = "t3" && isImage(item.data.url)) {
		  	let postUrl = item.data.url;
		  	let postTitle = item.data.title;
		  	let postID = item.data.id;
		  	let nsfw = item.data.over18;
			download(postUrl, postTitle, nsfw);
	    }
	}).on('error', console.error);
}

//Login
Client.Session.create(device, storage, accdetails["insta_username"], accdetails["insta_password"]).then(function(result) {
	session = result;
	//Post to instagram every (1) minute
	setTimeout(function() {
		//Choose random image
		var files = fs.readdirSync('./assets/images/approved/');
		let post = files[Math.floor(Math.random() * files.length)];
		if (post == undefined) {
			console.log("No images to upload to instagram!");
		} else {
			caption = formatForInsta(post);
			postToInsta(post, caption);
		}
	}, 6000);
});

async function postToInsta(filename, caption) {
	Client.Upload.photo(session, "./assets/images/approved/" + filename).then(function(upload) {
	    return Client.Media.configurePhoto(session, upload.params.uploadId, caption, function(err) {
	    	if (err)
	    		console.log(err);
	    });
	}).then(function(medium) {
		console.log("Uploaded image: " + caption + " to instagram");
		fs.rename("./assets/images/approved/" + filename, "./assets/images/uploaded/" + filename, function(err) {
			if (err)
				console.log(err);
		});
	});
};

//Start snooping
snoopReddit(options);