
import * as core from '@actions/core';
import * as github from '@actions/github';
import { akeylessLogin } from './auth';
import { awsLogin } from './aws_access';
import { exportStaticSecrets, exportDynamicSecrets } from './secrets';
import { fetchAndValidateInput } from './input';


export async function run() {
  core.debug('Fetching input');

  const { accessId, accessType, apiUrl, producerForAwsAccess, staticSecrets, dynamicSecrets, exportSecretsToOutputs, exportSecretsToEnvironment, parseDynamicSecrets, timeout } =
    fetchAndValidateInput();

  core.debug(`access id: ${accessId}`);
  core.debug(`Fetch akeyless token with access type ${accessType}`);

  let akeylessToken: string;

  try {
    const akeylessLoginResponse = await akeylessLogin(accessId, accessType, apiUrl);
    akeylessToken = akeylessLoginResponse['token'];
  } catch (error: any) {
    let message = `Failed to login to AKeyless: ${JSON.stringify(error)}`;
    if (message.includes('ACTIONS_ID_TOKEN_REQUEST_URL')) {
      message += '\nPlease check the GITHUB_TOKEN token permissions for the job. See:';
      message += '\n* https://github.com/LanceMcCarthy/akeyless-action#job-permissions-requirement';
      message += '\n* https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idpermissions';
    }

    core.error(message);
    core.setFailed(message);
    return;
  }

  core.debug(`AKeyless token length: ${akeylessToken.length}`);

  // AWS Access
  if (producerForAwsAccess) {
    core.debug(`AWS Access: Fetching credentials with producer ${producerForAwsAccess}`);

    try {
      await awsLogin(akeylessToken, producerForAwsAccess, apiUrl);
    } catch (error: any) {
      core.error(`Failed to fetch AWS producer credentials: ${JSON.stringify(error)}`);
      core.setFailed(`Failed to fetch AWS producer credentials: ${JSON.stringify(error)}`);
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
    } catch (error: any) {
      core.error(`Failed to fetch static secrets: ${JSON.stringify(error)}`);
      core.setFailed(`Failed to fetch static secrets: ${JSON.stringify(error)}`);
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
    } catch (error: any) {
      core.error(`Failed to fetch dynamic secrets: ${JSON.stringify(error)}`);
      core.setFailed(`Failed to fetch dynamic secrets: ${JSON.stringify(error)}`);
    }
  } else {
    core.debug(`Dynamic Secrets: Skipping step because no dynamic secrets were specified`);
  }
}

if (require.main === module) {
  (async () => {
    try {
      core.debug('Starting main run');
      core.info(`Note: Any AWS SDK warnings come from the Akeyless dependencies. Once they're addressed, this action will automatically inherit those fixes in the next update.`);
      await run();
    } catch (error: any) {
      core.debug(error.stack);
      core.setFailed(error.message);
      core.debug(error.message);
    }
  })();
}
