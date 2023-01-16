#! /usr/bin/env node

"use strict";

const importLocal = require("import-local");
const { log } = require("@jonce/utils");

if (importLocal(__filename)) {
  log.info("cli", "使用def-cli 本地版本");
} else {
  require("../lib")(process.argv.slice(2));
}
