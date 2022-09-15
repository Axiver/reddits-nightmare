//-- Import all libs --//
const setup = require("./setup");
const image = require("./image");
const post = require("./post");
const userAccount = require("./userAccount");

//-- Export them as one object --//
module.exports = {
  ...setup,
  ...image,
  ...post,
  ...userAccount,
};
