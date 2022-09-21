//-- Import all utils --//
const fileUtils = require("./fileUtils");
const stringUtils = require("./stringUtils");

//-- Export them as one object --//
module.exports = {
  ...fileUtils,
  ...stringUtils,
};
