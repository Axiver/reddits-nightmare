//Include login details
var accdetails = require('./account.json');

//Initialize instagram library
var Client = require('instagram-private-api').V1;
var device = new Client.Device(accdetails["username"]);
var storage = new Client.CookieFileStorage('./cookies/gitgagged.json');
 
//Login
Client.Session.create(device, storage, accdetails["username"], accdetails["password"]).then(function(session) {
	//Upload sample image
	Client.Upload.photo(session, './images/apple-fruit.jpg').then(function(upload) {
	    console.log(upload.params.uploadId);
	    return Client.Media.configurePhoto(session, upload.params.uploadId, 'korkymckorkface');
	}).then(function(medium) {
	    //Log post information to console (for dev stuff)
	    console.log(medium.params)
	})
})