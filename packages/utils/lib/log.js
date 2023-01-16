"use strict";

const log = require("npmlog");

log.heading = "def";
log.addLevel("success", 2000, { fg: "green", bold: true });

module.exports = log;
