//Initialize needed libraries
const request = require('request');
const fs = require('fs');
var path = require('path');

//Variable Definitions
var accdetails = require('./assets/account.json');
let options = {
    listing: 'hot', // 'hot' OR 'rising' OR 'controversial' OR 'top_day' OR 'top_hour' OR 'top_month' OR 'top_year' OR 'top_all'
    limit: 5 // how many posts you want to watch? if any of these spots get overtaken by a new post an event will be emitted, 50 is 2 pages
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

if (!fs.existsSync('./cookies/')){
    fs.mkdirSync('./cookies/');
}

if (!fs.existsSync('./assets/')){
    fs.mkdirSync('./assets/');
}

if (!fs.existsSync('./assets/images/')){
    fs.mkdirSync('./assets/images/');
}

var storage = new Client.CookieFileStorage('./cookies/' + accdetails["insta_username"] + '.json');

//Functions
function formatFileName(postTitle, postUrl) {
	return new Promise(resolve => {
		let forbiddenWords = ["reddit", "r/", "comments", "upvote", "downvote", "retweet", "mods"];
		if (contains(postTitle, forbiddenWords)) {
			//console.log("Post: " + postTitle + " is rejected");
			return;
		}
		postTitle = postTitle.replace(/\?/g, "[que]");
		postTitle = postTitle.replace(/\//g, "[sla]");
		let filename = "./assets/images/" + postTitle + path.extname(postUrl);
		resolve (filename);
	});
}

function contains(target, pattern){
    var value = 0;
    pattern.forEach(function(word){
      value = value + target.includes(word);
    });
    return (value === 1)
}

async function download(url, postTitle) {
	let filename = await formatFileName(postTitle, url);
/*	request.head(url, function(err, res, body) {
		if (fs.existsSync(filename)) {
			fs.unlinkSync(filename);
		}
		var filetoPipe = fs.createWriteStream(filename);
		filetoPipe.on('open', function() {
			request(url).pipe(filetoPipe).on('close', function() {
				filetoPipe.end();
				//console.log("Downloaded: " + postTitle);
			});
		})
	}); */
	return new Promise(resolve => {
		request.head(url, function(err, res, body) {
			if (fs.existsSync('./assets/images' + filename)) {
				fs.unlink(filename);
			}
			var filetoPipe = fs.createWriteStream(filename);
			filetoPipe.on('open', function() {
				request(url).pipe(filetoPipe).on('close', function() {
					filetoPipe.end();
					//console.log("Downloaded: " + postTitle);
				});
			})
		});
		resolve (filename);
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
			//console.log(item);
		  	//let postUrl = item.data.url;
		  	//let postTitle = item.data.title;
		  	//let postID = item.data.id;
			//download(item.data.url, postTitle);
			postToInsta(item);
	    }
	}).on('error', console.error);
}


//Login
Client.Session.create(device, storage, accdetails["insta_username"], accdetails["insta_password"]).then(function(result) {
	session = result;
	snoopReddit(options);
});

function postToInsta(item) {
	//Upload sample image
	//Commented out for now so that it doesn't do it everytime on boot
	download(item.data.url, item.data.title).then(function(filename) {
	Client.Upload.photo(session, filename).then(function(upload) {
	    //console.log(upload.params.uploadId);
	    return Client.Media.configurePhoto(session, upload.params.uploadId, item.data.title);
	}).then(function(medium) {
	    //Log post information to console (for dev stuff)
	    //console.log(medium.params);
	});
});
};