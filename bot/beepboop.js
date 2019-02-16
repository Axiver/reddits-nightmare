//Include login details
var accdetails = require('./account.json');

var Client = require('instagram-private-api').V1;
var device = new Client.Device(accdetails["username"]);
var storage = new Client.CookieFileStorage('./cookies/gitgagged.json');
 
//Login
Client.Session.create(device, storage, accdetails["username"], accdetails["password"]).then(function(session) {
	//Follow an account as a test
	return [session, Client.Account.searchForUser(session, 'instagram')]   
}).spread(function(session, account) {
	return Client.Relationship.create(session, account.id);
}).then(function(relationship) {
	console.log(relationship.params)
	// {followedBy: ... , following: ... }
	// yayayay, you just followed @instagram
})
