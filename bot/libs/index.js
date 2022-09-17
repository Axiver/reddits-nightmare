//-- Import all libs --//
const setup = require("./setup");
const image = require("./image");
const post = require("./post");
const userAccount = require("./userAccount");
const redditSnooper = require("./redditSnooper");

//-- Export them as one object --//
module.exports = {
  ...setup,
  ...image,
  ...post,
  ...userAccount,
  ...redditSnooper
};
