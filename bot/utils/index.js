//-- Import all utils --//
const imageUtils = require("./imageUtils");
const stringUtils = require("./stringUtils");

//-- Export them as one object --//
module.exports = {
  ...imageUtils,
  ...stringUtils,
};
