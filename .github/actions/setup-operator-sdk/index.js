const tc = require('@actions/tool-cache');
const core = require('@actions/core');
const fs = require('fs');
const { Octokit } = require('@octokit/rest')
const semver = require('semver')

async function run() {
  try {
    const versionSpec = core.getInput('operator-sdk-version');
    let toolPath = tc.find('operatorSDK', versionSpec);
    if (!toolPath) {
      toolPath = await downloadOperatorSDK(versionSpec);
    } else {
      core.info(`Found in cache @ ${toolPath}`);
    }
    
    core.addPath(toolPath);
    core.info(`Successfully setup operator-sdk version ${versionSpec}`);
  } catch (error) {
    core.setFailed(error.message);
  }
}

async function downloadOperatorSDK(versionSpec) {
  let version = '';
  let downloadURL = '';
  let os = process.platform;
  let arch = process.arch;
  if (arch == 'x64') {
    arch = 'amd64';
  }
  let toolPath = ''
  
  const octokit = new Octokit();
  const releases = await octokit.rest.repos.listReleases({owner: 'operator-framework', repo: 'operator-sdk'});
  for (const release of releases.data.filter(r => !r.prerelease)) {
    if (versionSpec == 'latest' || semver.satisfies(version, versionSpec)) {
      version = release.name;
      for (const asset of release.assets) {
        if (asset.name == `operator-sdk_${os}_${arch}`) {
          downloadURL = asset.browser_download_url;
        }
      }
      break;
    }
  }
  
  if (!version) {
    throw new Error(`Unable to resolve version ${versionSpec}`);
  }
  if (!downloadURL) {
    throw new Error(`Unable to find download for version ${version} (${os}/${arch})`);
  }
  
  if (version != versionSpec) {
    toolPath = tc.find('operatorSDK', version);
    if (toolPath) {
      core.info(`Found in cache @ ${toolPath}`);
      return toolPath;
    }
  }
  
  core.info(`Attempting to download ${version} (${os}/${arch})...`);
  const downloadPath = await tc.downloadTool(downloadURL);
  fs.chmodSync(downloadPath, 0o755);
  
  toolPath = await tc.cacheFile(downloadPath, 'operator-sdk', 'operatorSDK', version);
  core.info(`Successfully cached operator-sdk to ${toolPath}`);
  return toolPath;
}

run();
