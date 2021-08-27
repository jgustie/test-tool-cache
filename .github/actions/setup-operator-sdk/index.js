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
      let os = process.platform;
      let arch = process.arch;
      if (arch == 'x64') {
        arch = 'amd64';
      }
    
      let version = '';
      const octokit = new Octokit();
      const releases = await octokit.rest.repos.listReleases({owner: 'operator-framework', repo: 'operator-sdk'});
      for (const release of releases.data) {
        if (release.prerelease) {
          continue;
        }
        if (versionSpec == 'latest' || semver.satisfies(version, versionSpec)) {
          version = release.name;
          break;
        }
      }
      if (!version) {
        throw new Error(`Unable to resolve version ${versionSpec}`);
      }
      
      core.info(`Attempting to download ${version} (${os}/${arch})...`);
      const downloadPath = await tc.downloadTool(`https://github.com/operator-framework/operator-sdk/releases/download/${version}/operator-sdk_${os}_${arch}`);
      fs.chmodSync(downloadPath, 0o755);
      
      toolPath = await tc.cacheFile(downloadPath, 'operator-sdk', 'operatorSDK', version);
      core.info(`Successfully cached operator-sdk to ${toolPath}`);
    } else {
      core.info(`Found in cache @ ${toolPath}`);
    }
    
    core.addPath(toolPath);
    core.info(`Successfully setup operator-sdk version ${versionSpec}`);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
