#!/usr/bin/env node
process.env.AWS_SDK_LOAD_CONFIG = 1;
const program = require("commander");
const package = require("./package.json");
require("@mhlabs/aws-sdk-sso");
require("./src/commands/search");
require("./src/commands/stack");

program.version(package.version, "-v, --vers", "output the current version");

program.parse(process.argv);

if (process.argv.length < 3) {
  program.help();
}
