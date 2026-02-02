import * as core from '@actions/core';
import {fileURLToPath} from 'url';
// import * as github from '@actions/github';
import {akeylessLogin} from './auth';
import {awsLogin} from './aws_access';
import {exportStaticSecrets, exportDynamicSecrets} from './secrets';
import {fetchAndValidateInput} from './input';

export async function run() {
  const {accessId, accessType, apiUrl, producerForAwsAccess, staticSecrets, dynamicSecrets, exportSecretsToOutputs, exportSecretsToEnvironment, parseDynamicSecrets, timeout} =
    fetchAndValidateInput();

  core.info(`[DEBUG] accessId: ${accessId}`);
  core.info(`[DEBUG] accessType: ${accessType}`);
  core.info(`[DEBUG] apiUrl: ${apiUrl}`);
  core.info(`[DEBUG] producerForAwsAccess: ${producerForAwsAccess}`);
  core.info(`[DEBUG] staticSecrets: ${JSON.stringify(staticSecrets)}`);
  core.info(`[DEBUG] dynamicSecrets: ${JSON.stringify(dynamicSecrets)}`);
  core.info(`[DEBUG] exportSecretsToOutputs: ${exportSecretsToOutputs}`);
  core.info(`[DEBUG] exportSecretsToEnvironment: ${exportSecretsToEnvironment}`);
  core.info(`[DEBUG] parseDynamicSecrets: ${parseDynamicSecrets}`);
  core.info(`[DEBUG] timeout: ${timeout}`);

  let akeylessToken: string;

  try {
    core.info(`[DEBUG] Calling akeylessLogin with accessId: ${accessId}, accessType: ${accessType}, apiUrl: ${apiUrl}`);
    const akeylessLoginResponse = await akeylessLogin(accessId, accessType, apiUrl);
    core.info(`[DEBUG] akeylessLoginResponse: ${JSON.stringify(akeylessLoginResponse)}`);
    akeylessToken = (akeylessLoginResponse as {token: string}).token;
  } catch (err) {
    core.error(`[DEBUG] Failed to login to AKeyless. Error: ${err instanceof Error ? err.stack : JSON.stringify(err)}`);
    core.setFailed('Failed to login to AKeyless.');
    return;
  }

  core.debug(`AKeyless token length: ${akeylessToken.length}`);

  // AWS Access
  if (producerForAwsAccess) {
    core.debug(`AWS Access: Fetching credentials with producer ${producerForAwsAccess}`);

    try {
      await awsLogin(akeylessToken, producerForAwsAccess, apiUrl);
    } catch {
      core.setFailed('Failed to fetch AWS producer credentials.');
    }
  } else {
    core.debug(`AWS Access: Skipping because no AWS producer is specified`);
  }

  // static secrets
  if (staticSecrets) {
    core.debug(`Static Secrets: Fetching!`);
    const staticSecretsObj = typeof staticSecrets === 'string' ? JSON.parse(staticSecrets) : staticSecrets;
    try {
      await exportStaticSecrets(akeylessToken, staticSecretsObj, apiUrl, exportSecretsToOutputs, exportSecretsToEnvironment, timeout);
    } catch {
      core.setFailed('Failed to fetch static secrets.');
    }
  } else {
    core.debug(`Static Secrets: Skpping step because no static secrets were specified`);
  }

  // dynamic secrets
  if (dynamicSecrets) {
    core.debug(`Dynamic Secrets: Fetching!`);
    const dynamicSecretsObj = typeof dynamicSecrets === 'string' ? JSON.parse(dynamicSecrets) : dynamicSecrets;
    try {
      await exportDynamicSecrets(akeylessToken, dynamicSecretsObj, apiUrl, exportSecretsToOutputs, exportSecretsToEnvironment, parseDynamicSecrets, timeout);
    } catch {
      core.setFailed('Failed to fetch dynamic secrets.');
    }
  } else {
    core.debug(`Dynamic Secrets: Skipping step because no dynamic secrets were specified`);
  }
}

// ES module check for if this file is being run directly
const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);

if (isMainModule) {
  (async () => {
    try {
      core.debug('Starting main run');
      core.info(`Note: Any AWS SDK warnings come from the Akeyless dependencies. Once they're addressed, this action will automatically inherit those fixes in the next update.`);
      await run();
    } catch {
      core.setFailed('Action failed with an unexpected error.');
    }
  })();
}
