"use strict";

const { log, getNpmInfo, getLatestNpmInfo } = require("@jonce/utils");
const pkg = require("../package.json");
const semver = require("semver");
const colors = require("colors");
const commander = require("commander");

module.exports = main;

const program = new commander.Command();

// 1. 检查 def-cli版本、 node 版本、 用户权限、 用户目录

function main(argv) {
  checkPkgVersion();

  checkNodeVersion();

  checkRoot();

  checkClientUpdate();

  registerCommand();
  return;
}

function registerCommand() {
  program
    .name("def")
    .usage("<command> [option]")
    .version(pkg.version)
    .option("-d, --debug", "是否开启调试模式", true)
    .parse(process.argv);
}

async function checkClientUpdate() {
  // 1、获取当前def-cli版本号
  const currentVersion = pkg.version;
  const npmName = pkg.name;
  // 2、通过npm api, 获取显示def-cli版本号
  const { latestVersion, latestTime } = await getLatestNpmInfo(npmName);
  console.log(currentVersion, latestVersion);
  log.info(`当前架手架版本:${currentVersion}`);
  // 3、解析出所有线上版本号，比对版本号
  // 4、根据版本比对结果，是否提示版本更新
  if (latestVersion != null && semver.gt(latestVersion, currentVersion)) {
    log.warn(
      colors.yellow(
        `有新版本更新，当前版本:${currentVersion}, 最新版本:${latestVersion} (发布时间:${latestTime})
         请手动更新 ${npmName}, 更新命令: npm install -g ${npmName}`
      )
    );
  }
}

function checkEnv() {
  const dotenv = require("dotenv");
}

function checkRoot() {
  require("root-check")();
}

function checkPkgVersion() {
  log.info(pkg.version);
}

function checkNodeVersion() {
  const currentVersion = process.version;
  const lowerVersion = pkg.engines.node;

  log.info(currentVersion, lowerVersion);

  try {
    if (!semver.gte(currentVersion, lowerVersion)) {
      throw new Error(
        colors.red(
          `当前nodejs 版本为 ${currentVersion}, def-cli 需要安装 ${lowerVersion} 以上版本的 Nodejs`
        )
      );
    }
  } catch (e) {
    log.error(e.message);
  }
}
