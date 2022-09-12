//-- Import all utils --//
const aspectRatio = require("./aspectRatio");
const stringUtils = require("./stringUtils");

//-- Export them as one object --//
module.exports = {
  ...aspectRatio,
  ...stringUtils,
};
