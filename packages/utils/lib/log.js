"use strict";

const log = require("npmlog");

log.heading = "DEF";
log.addLevel("success", 2000, { fg: "green", bold: true });

module.exports = log;
