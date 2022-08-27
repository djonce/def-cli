/*
 * @泽柏/jonce
 *
 * @description:
 * development: 拉取远程同名分支（云构建忽略）-> 上传至 OSS
 * production：确认远程有同名分支（云构建忽略）-> 确认代码已提交（云构建忽略）-> 拉取并合并 master 分支 -> 创建 tag 标签 -> 上传至 OSS
 */
const fs = require("fs");
const path = require("path");
const OSS = require("ali-oss");
const shell = require("shelljs");
const chalk = require("chalk");
const getFills = require("./takefile");

const ProgressBar = require("./progress");
const pb = new ProgressBar("上传进度", 10);

const distPaths = ["./dist"];

let { bucket, region, accessKeyId, accessKeySecret, cdnPathDaily, cdnPath } =
  process.env || {};

// console.log(
//   'process.env',
//   distPaths,
//   bucket,              // 19ba
//   region,              // oss-cn-hangzhou
//   accessKeyId,         // 
//   accessKeySecret,     // 
//   cdnPathDaily,        // https://19ba-daily.oss-cn-hangzhou.aliyuncs.com
//   cdnPath              // https://19ba.oss-cn-hangzhou.aliyuncs.com
// );

let CDN_PATH = {
  development: cdnPathDaily,
  production: cdnPath,
};

// #region 抽取函数
// 执行流程
function run(env) {
  // 判断环境是否正常
  if (!accessKeyId) {
    console.log(chalk.red(`process.env 里未获取到所需配置~`));
    process.exit(0);
  }

  // 上传需要有git
  if (!shell.exec("git --version")) {
    shell.echo("sorry, git is undefined");
    shell.exit();
  }

  // 当前分支信息
  const { projectName, branchName, version } = getCurrentBranchInfo();

  // 拉取最新代码，production 检查是否远程分支已同步
  pull({ env, branchName, version });

  // 上传到OSS
  distPaths.forEach((distPath) =>
    uploadToOSS({ env, projectName, version, distPath, cdnPath: CDN_PATH[env] })
  );
}

// 获取项目名
function getCurrentBranchInfo() {
  const names = shell.exec("git remote -v", { silent: true }).split("\n");
  const projectName =
    names[0]
      .split("/")
      .pop()
      .replace(/\.git(\s|\S)+$/, "") || "def";

  const branches = shell.exec("git branch", { silent: true }).split("\n");
  const currentBranch = branches.filter((e) => e.startsWith("*"))[0];
  const branchName = currentBranch.split("/")[0].replace(/^\*\s+/, "");
  // 除了第一个控制分支组,后面作为多级目录模块分组并加上模块版本号
  // 1. 单一模块开发时可以定义feature/0.0.1,daily/0.0.1等分支名,将后面的版本号作为release的tag版本号且是oss的资源版本号；
  const version = currentBranch.split("/").slice(1).join("/");

  return { projectName, branchName, version };
}

// pull 拉取 远程 分支
function pull({ env, branchName, version }) {
  let branchA = shell.exec(`git branch -a`, { silent: true });

  // 发布线上，判断当前分支是否已发布过，是否已上传开发分支，是否将最新代码上传到远程开发分支
  if (env === "production") {
    if (!branchA.stdout.includes(`remotes/origin/${branchName}/${version}`)) {
      console.error(
        chalk.red(
          `[error] 远程无当前开发分支 ${branchName}/${version}，请将当前分支上传远程，经过 Code Review 后，再发布到正式环境！`
        )
      );
      return process.exit(0);
    } else {
      // 上传当前分支代码
      let status = shell.exec(`git status`, { silent: true });
      if (
        !status.stdout.includes("nothing to commit") &&
        !status.stdout.includes("无文件要提交，干净的工作区")
      ) {
        console.error(
          chalk.red(
            `[error] 有内容没提交，请先提交最新代码，经过 Code Review 后，再发布到正式环境！`
          )
        );
        return process.exit(0);
      }
    }

    // 线上环境拉取master分支
    pullFromOrigin("master");

    // 线上创建 tag 分支
    createReleaseTag({ version });
  }

  // 拉取当前线上分支代码
  if (!branchA.stdout.includes(`remotes/origin/${branchName}/${version}`)) {
    return console.log(
      chalk.green(`[info] 远程没有分支 ${branchName}/${version} 跳过 pull`)
    );
  } else {
    pullFromOrigin(`${branchName}/${version}`);
  }
}

// 上传到 OSS
function uploadToOSS({ env, projectName, version, distPath, cdnPath }) {
  // oss上传
  const client = new OSS({
    region,
    accessKeyId,
    accessKeySecret,
    bucket: `${bucket}${env === "development" ? "-daily" : ""}`,
  });

  // 上传成功后，cdn地址
  const cdnPathList = [];

  // 上传文件
  const put = (name) => {
    cdnPathList.push(`${cdnPath}/${projectName}/${version}/${name}`);
    return client.put(
      `${projectName}/${version}/${name}`,
      `${name}`
    );
  };

  //  轮询上传dist的文件
  function upload(index = 0, maxLength, files) {
    put(files[index])
      .then(() => {
        index++;
        pb.render({ completed: index, total: maxLength });
        if (index >= maxLength) {
          console.log("\n"); // 进度条后换行
          console.log(
            chalk.blue(
              `[success] ${version} 【${
                env === "production" ? "正式" : "日常"
              }】发布完成`
            )
          );
          console.log(cdnPathList);
          if (env === "production") {
            console.log(
              chalk.red(
                `[action] 请到 xx 合并 master 分支`
              )
            );
          }
        } else {
          upload(index, maxLength, files);
        }
      })
      .catch((e) => console.log(chalk.blue(e)));
  }

  const files = getFills(distPath);

  upload(0, files.length, files);
}

// 合并到 master，创建 release 分支
function createReleaseTag({ version }) {
  let codePull = `git tag release/${version} && git push origin --tag release/${version}`;
  console.log(chalk.blue(`[run] ${codePull}`));
  let res = shell.exec(codePull);

  if (res.stderr.includes("已存在") || res.stderr.includes("exist")) {
    let _codePull = `git tag -d release/${version} && git push origin :refs/tags/release/${version}`;
    console.log(
      chalk.red(
        `[error] 当前分支已发布到线上环境。\n如需覆盖，请先执行 '${_codePull}' 删除 tag 记录，再执行发布。\n如不覆盖，请自行创建新的开发分支，在进行发布线上。`
      )
    );

    return process.exit(0);
  }
}

// 拉取分支并合并
function pullFromOrigin(path) {
  let codePull = `git pull origin ${path}`;
  console.log(chalk.blue(`[run] ${codePull}`));
  let pullRes = shell.exec(codePull);
  if (pullRes.stdout.includes("fatal")) {
    console.error(chalk.red(`[error] 拉取远程${path}分支失败，请先解决再发布`));
    return process.exit(0);
  } else if (pullRes.stdout.includes("CONFLICT")) {
    console.error(
      chalk.red(`[error] 代码与远程${path}分支有冲突，请先解决冲突再发布`)
    );
    return process.exit(0);
  }
}
// #endregion

module.exports = run;
