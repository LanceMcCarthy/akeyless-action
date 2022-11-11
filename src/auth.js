const core = require('@actions/core');
const akeylessApi = require('./akeyless_api');
const akeyless = require('akeyless');
const akeylessCloudId = require('akeyless-cloud-id');

function action_fail(message) {
  core.debug(message);
  core.setFailed(message);
  throw new Error(message);
}

async function jwtLogin(apiUrl, accessId) {
  api = akeylessApi.api(apiUrl);
  core.debug(apiUrl);
  let githubToken = undefined;
  //const akeylessResponse = undefined;

  try {
    core.debug('Fetching JWT from Github');
    githubToken = await core.getIDToken();
  } catch (error) {
    action_fail(`Failed to fetch Github JWT: ${error.message}`);
  }
  try {
    core.debug('Fetching token from AKeyless');
    return api.auth(
      akeyless.Auth.constructFromObject({
        'access-type': 'jwt',
        'access-id': accessId,
        jwt: githubToken
      })
    );
  } catch (error) {
    action_fail(`Failed to login to AKeyless: ${error.message}`);
  }
}

async function awsIamLogin(apiUrl, accessId) {
  api = akeylessApi.api(apiUrl);
  let cloudId = undefined;

  try {
    cloudId = await akeylessCloudId();
  } catch (error) {
    action_fail(`Failed to fetch cloud id: ${error.message}`);
  }

  if (cloudId === undefined) {
    action_fail(`CloudId is undefined.`);
  }

  try {
    return api.auth(
      akeyless.Auth.constructFromObject({
        'access-type': 'aws_iam',
        'access-id': accessId,
        'cloud-id': cloudId
      })
    );
  } catch (error) {
    action_fail(`Failed to login to AKeyless: ${error.message}`);
  }
}

const login = {
  jwt: jwtLogin,
  aws_iam: awsIamLogin
};

const allowedAccessTypes = Object.keys(login);

async function akeylessLogin(accessId, accessType, apiUrl) {
  try {
    core.debug('fetch token');
    return login[accessType](apiUrl, accessId);
  } catch (error) {
    action_fail(error.message);
  }
}

exports.akeylessLogin = akeylessLogin;
exports.allowedAccessTypes = allowedAccessTypes;
