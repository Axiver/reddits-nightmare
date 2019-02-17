//Initialize needed libraries
const request = require('request');
const fs = require('fs');
var path = require('path');

//Variable Definitions
var accdetails = require('./assets/account.json');
let options = {
    listing: 'hot', // 'hot' OR 'rising' OR 'controversial' OR 'top_day' OR 'top_hour' OR 'top_month' OR 'top_year' OR 'top_all'
    limit: 50 // how many posts you want to watch? if any of these spots get overtaken by a new post an event will be emitted, 50 is 2 pages
}

//Initialize reddit api library
var Snooper = require('reddit-snooper');
snooper = new Snooper({
    automatic_retries: true, // automatically handles condition when reddit says 'you are doing this too much'
    api_requests_per_minuite: 60 // api requests will be spread out in order to play nicely with Reddit
});

//Initialize instagram library
var Client = require('instagram-private-api').V1;
var device = new Client.Device(accdetails["insta_username"]);
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
	request.head(url, function(err, res, body) {
		if (fs.existsSync(filename)) {
			//console.log(filename + " already exists!");
			return;
		}
		var filetoPipe = fs.createWriteStream(filename);
		filetoPipe.on('open', function() {
			request(url).pipe(filetoPipe).on('close', function() {
				filetoPipe.end();
				//console.log("Downloaded: " + postTitle);
			});
		})
	});
};

function isImage(url) {
	let imageExts = [".png", ".jpg", ".jpeg"];
	let extension = path.extname(url);
	if (imageExts.includes(extension)) {
		return true;
	} else
		return false;
}

function snoopReddit(options) {
	snooper.watcher.getListingWatcher('all', options).on('item', function(item) {
	    if (item.kind = "t3" && isImage(item.data.url)) {
		  	let postUrl = item.data.url;
		  	let postTitle = item.data.title;
		  	let postID = item.data.id;
			download(item.data.url, postTitle);
	    }
	}).on('error', console.error);
}

snoopReddit(options);

//Login
Client.Session.create(device, storage, accdetails["insta_username"], accdetails["insta_password"]).then(function(session) {
	//Upload sample image
	//Commented out for now so that it doesn't do it everytime on boot
	/*Client.Upload.photo(session, './images/apple-fruit.jpg').then(function(upload) {
	    console.log(upload.params.uploadId);
	    return Client.Media.configurePhoto(session, upload.params.uploadId, 'korkymckorkface');
	}).then(function(medium) {
	    //Log post information to console (for dev stuff)
	    console.log(medium.params);
	});*/
});