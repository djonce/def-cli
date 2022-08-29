#! /usr/bin/env node

const chalk = require('chalk')
const { program } = require('commander')
const packageInfo = require('../package.json')
const run = require('../src/publish.js')

;(async () => {
  program
    .version(packageInfo.version)
    .usage('<command> [options]')
    .command('pub')
    .description('-d 发布到日常/ -o 正式环境')
    .option('-d', '发布到日常环境')
    .option('-o', '发布到正式环境')

  program.parse(process.argv)

  console.log(chalk.green(`${packageInfo.name} ${packageInfo.version} start `))

  console.log(chalk.red(`${program.args}`))

  if (program.args.includes('-d')) {
    run('development')
  } else if (program.args.includes('-o')) {
    run('production')
  } else {
    console.log(chalk.red(`未设置正确的环境参数。例：def pub -d 或 def pub -o`))
  }

})()