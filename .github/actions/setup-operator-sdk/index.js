const tc = require('@actions/tool-cache');
const core = require('@actions/core');

try {
  const versionSpec = core.getInput('operator-sdk-version');

  let toolPath = tc.find('operatorSDK', versionSpec);
  
  if (!toolPath) {
    core.info(`Attempting to download ${versionSpec}...`);
    
    let semver = '1.11.0';
    let version = `v${semver}`;
    
    let os = process.platform;
    let arch = process.arch;
    if (arch == 'x64') {
      arch = 'amd64';
    }
    
    const downloadPath = await tc.downloadTool(`https://github.com/operator-framework/operator-sdk/releases/download/${version}/operator-sdk_${os}_${arch}`);
    
    toolPath = await tc.cacheFile(downloadPath, 'operator-sdk', 'operatorSDK', version);
  }
  
  core.addPath(toolPath);
} catch (error) {
  core.setFailed(error.message);
}