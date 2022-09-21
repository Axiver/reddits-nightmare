//-- Import required libraries --//
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format;

//Import utility functions and libs
const { capitalizeFirstLetter: capitalFirst } = require("../utils/stringUtils");

//-- Create Winston logger --//
//Create the logging format
const customFormat = printf(({ level, message, label = "General", timestamp }) => {
  return `[${timestamp}] [${label}] ${level}: ${message}`;
});

/**
 * Creates a logger format
 * @param {string} loggerName The name of the logger
 * @param {boolean} enableColor Whether or not to enable colors
 * @returns A logger format object
 */
const loggerFormat = (loggerName, enableColor) => combine(
  label({ label: loggerName }),
  timestamp(),
  //Make the first letter of every logger level uppercase
  format(logLevel => {
    logLevel.level = capitalFirst(logLevel.level);
    return logLevel;
  })(),
  //Dynamically adds support for colors
  ...(enableColor ? [format.colorize(), customFormat]: [customFormat]),
);

/**
 * Creates a new winston logger instance
 * @param {string} loggerName The name of the logger (Used as the label)
 */
function create(loggerName) {
  //Creates the logger
  const logger = createLogger({
    level: 'debug',
    format: loggerFormat(loggerName),
    transports: [
      /**
       * Logs of "Info" level and below gets printed to console
       * Logs of "Error" level and below gets written to the error log
       * Logs of "Debug" level and below gets written to the combined log
       */
      new transports.Console({ level: "info", format: loggerFormat(loggerName, true)}),
      new transports.File({ filename: './logs/error.log', level: 'error' }),
      new transports.File({ filename: './logs/combined.log' }),
      /**
       * Log to a module-specific log file
       */
      new transports.File({ filename: `./logs/${loggerName.toLowerCase()}.log` }),
    ],
  });

  return logger;
}

//Export the logger instance
module.exports = create;