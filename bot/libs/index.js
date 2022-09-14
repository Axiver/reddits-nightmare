//-- Import all libs --//
const image = require("./image");
const post = require("./post");
const userAccount = require("./userAccount");

//-- Export them as one object --//
module.exports = {
  ...image,
  ...post,
  ...userAccount,
};
