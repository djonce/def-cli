#! /usr/bin/env node
const assert = require("assert");
const { existsSync } = require("fs");
const { join } = require("fs");
const { log } = require("@jonce/utils");

console.log("hello def  ----");

// 1、 解析命令参数

// 3、 构建目标脚本，并进行执行

const args = process.argv.slice(2);

const [name, ...childArgs] = args;

console.log(name);

// 2、 检查命令，对应的文件

// assert(
//   existsSync(join(__dirname, `../${name}.ts`), `命令 ${chalk.red(name)} 不存在`)
// );

log.info("---jgoo");
