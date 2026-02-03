const core = require('@actions/core');
const akeylessApi = require('./akeyless_api');
const akeyless = require('akeyless');

const {fromNodeProviderChain} = require('@aws-sdk/credential-providers');
const {SignatureV4} = require('@aws-sdk/signature-v4');
const {createHash} = require('crypto');

function action_fail(message) {
  core.debug(message);
  core.setFailed(message);
  throw new Error(message);
}

async function getAwsCloudIdV3() {
  try {
    // Get AWS credentials using the v3 credential provider
    const credentialsProvider = fromNodeProviderChain();
    const credentials = await credentialsProvider();

    // Create the STS request body and URL
    const body = 'Action=GetCallerIdentity&Version=2011-06-15';
    const url = 'https://sts.amazonaws.com/';
    const region = 'us-east-1';

    // Create a signature using AWS SDK v3
    const signer = new SignatureV4({
      credentials: credentials,
      region: region,
      service: 'sts',
      sha256: data => createHash('sha256').update(data).digest('hex')
    });

    // Sign the request
    const request = {
      method: 'POST',
      protocol: 'https:',
      hostname: 'sts.amazonaws.com',
      path: '/',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
        'Content-Length': body.length.toString(),
        Host: 'sts.amazonaws.com'
      },
      body: body
    };

    const signedRequest = await signer.sign(request);

    // Format headers according to the original akeyless-cloud-id format
    const headers = {
      Authorization: [signedRequest.headers['authorization']],
      'Content-Length': [signedRequest.headers['content-length']],
      Host: [signedRequest.headers['host']],
      'Content-Type': [signedRequest.headers['content-type']],
      'X-Amz-Date': [signedRequest.headers['x-amz-date']]
    };

    // Add session token if present
    if (signedRequest.headers['x-amz-security-token']) {
      headers['X-Amz-Security-Token'] = [signedRequest.headers['x-amz-security-token']];
    }

    // Create the cloud ID object in the same format as the original
    const cloudIdObj = {
      sts_request_method: 'POST',
      sts_request_url: Buffer.from(url).toString('base64'),
      sts_request_body: Buffer.from(body).toString('base64'),
      sts_request_headers: Buffer.from(JSON.stringify(headers)).toString('base64')
    };

    const awsData = JSON.stringify(cloudIdObj);
    return Buffer.from(awsData).toString('base64');
  } catch (error) {
    throw new Error(`Failed to get AWS cloud ID: ${error.message}`);
  }
}

async function jwtLogin(apiUrl, accessId) {
  const api = akeylessApi.api(apiUrl);
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
  const api = akeylessApi.api(apiUrl);
  let cloudId = undefined;

  try {
    cloudId = await getAwsCloudIdV3();
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
