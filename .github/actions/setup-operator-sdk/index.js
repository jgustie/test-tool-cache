const tc = require('@actions/tool-cache');
const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');


async function run() {
  try {
    const versionSpec = core.getInput('operator-sdk-version');
    let toolPath = tc.find('operatorSDK', versionSpec);
    if (!toolPath) {
      const octokit = github.getOctokit(process.env.GITHUB_TOKEN)
      const releases = octokit.rest.repos.listReleases({owner: 'operator-framework', repo: 'operator-sdk'});
      core.info(JSON.stringify(releases));
      
      // TODO Need to resolve versionSpec to version...
      let version = 'v1.11.0';
      
      let os = process.platform;
      let arch = process.arch;
      if (arch == 'x64') {
        arch = 'amd64';
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
