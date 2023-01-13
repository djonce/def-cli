'use strict';

const defCli = require('..');
const assert = require('assert').strict;

assert.strictEqual(defCli(), 'Hello from defCli');
console.info("defCli tests passed");
