"use strict";
const axios = require("axios");
const urlJoin = require("url-join");
const semver = require("semver");

function getNpmInfo(npmName, registry) {
  if (!npmName) return;

  registry = registry || getDefaultRegistry();

  const npmPackageInfoUrl = urlJoin(registry, npmName);

  console.log(npmPackageInfoUrl);

  return axios
    .get(npmPackageInfoUrl)
    .then((res) => {
      if (res.status === 200) {
        return res.data;
      }
      return null;
    })
    .catch((err) => {
      return Promise.reject(err);
    });
}

async function getLatestNpmInfo(npmName, registry) {
  const npmInfo = await getNpmInfo(npmName, registry);
  if (npmInfo) {
    // 版本号倒序
    const versions = semver.rsort(Object.keys(npmInfo.versions));
    if (versions && versions.length > 0) {
      const latestVersion = versions[0];
      // 最新发布时间
      const latestTime = npmInfo.time[latestVersion];
      return { latestVersion, latestTime };
    }
    return null;
  }
  return null;
}

function getDefaultRegistry() {
  return "https://registry.npmjs.org";
}

module.exports = { getNpmInfo, getLatestNpmInfo };
