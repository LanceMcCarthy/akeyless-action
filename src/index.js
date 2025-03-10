const core = require('@actions/core');
const github = require('@actions/github');
const auth = require('./auth');
const awsAccess = require('./aws_access');
const secrets = require('./secrets');
const input = require('./input');

async function run() {
  core.debug('Fetching input');

  const {accessId, accessType, apiUrl, producerForAwsAccess, staticSecrets, dynamicSecrets, exportSecretsToOutputs, exportSecretsToEnvironment, parseDynamicSecrets} =
    input.fetchAndValidateInput();

  core.debug(`access id: ${accessId}`);
  core.debug(`Fetch akeyless token with access type ${accessType}`);

  let akeylessToken;

  try {
    const akeylessLoginResponse = await auth.akeylessLogin(accessId, accessType, apiUrl);
    akeylessToken = akeylessLoginResponse['token'];
  } catch (error) {
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
      await awsAccess.awsLogin(akeylessToken, producerForAwsAccess, apiUrl);
    } catch (error) {
      core.error(`Failed to fetch AWS producer credentials: ${JSON.stringify(error)}`);
      core.setFailed(`Failed to fetch AWS producer credentials: ${JSON.stringify(error)}`);
    }
  } else {
    core.debug(`AWS Access: Skipping because no AWS producer is specified`);
  }

  // static secrets
  if (staticSecrets) {
    core.debug(`Static Secrets: Fetching!`);

    try {
      await secrets.exportStaticSecrets(akeylessToken, staticSecrets, apiUrl, exportSecretsToOutputs, exportSecretsToEnvironment);
    } catch (error) {
      core.error(`Failed to fetch static secrets: ${JSON.stringify(error)}`);
      core.setFailed(`Failed to fetch static secrets: ${JSON.stringify(error)}`);
    }
  } else {
    core.debug(`Static Secrets: Skpping step because no static secrets were specified`);
  }

  // dynamic secrets
  if (dynamicSecrets) {
    core.debug(`Dynamic Secrets: Fetching!`);

    try {
      await secrets.exportDynamicSecrets(akeylessToken, dynamicSecrets, apiUrl, exportSecretsToOutputs, exportSecretsToEnvironment, parseDynamicSecrets);
    } catch (error) {
      core.error(`Failed to fetch dynamic secrets: ${JSON.stringify(error)}`);
      core.setFailed(`Failed to fetch dynamic secrets: ${JSON.stringify(error)}`);
    }
  } else {
    core.debug(`Dynamic Secrets: Skipping step because no dynamic secrets were specified`);
  }
}

exports.run = run;

if (require.main === module) {
  try {
    core.debug('Starting main run');
    core.info(`Note: Any AWS SDK warnings come from the Akeyless dependencies. Once they're addressed, this action will automatically inherit those fixes in the next update.`);
    run();
  } catch (error) {
    core.debug(error.stack);
    core.setFailed(error.message);
    core.debug(error.message);
  }
}
