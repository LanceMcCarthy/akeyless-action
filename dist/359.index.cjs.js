"use strict";
exports.id = 359;
exports.ids = [359];
exports.modules = {

/***/ 42359:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {


// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  run: () => (/* binding */ run)
});

// UNUSED EXPORTS: bootstrap, main

// EXTERNAL MODULE: ./node_modules/@actions/core/lib/core.js + 14 modules
var core = __webpack_require__(96421);
// EXTERNAL MODULE: ./node_modules/@actions/github/lib/github.js + 21 modules
var github = __webpack_require__(50157);
// EXTERNAL MODULE: ./node_modules/akeyless/dist/index.js
var dist = __webpack_require__(94896);
;// CONCATENATED MODULE: ./src/akeyless_api.js


function akeyless_api_api(url) {
  const client = new dist/* ApiClient */.OWz();
  client.basePath = url;
  return new dist/* V2Api */.fsI(client);
}



// EXTERNAL MODULE: ./node_modules/@aws-sdk/credential-providers/dist-cjs/index.js
var dist_cjs = __webpack_require__(29719);
// EXTERNAL MODULE: ./node_modules/@smithy/signature-v4/dist-cjs/index.js
var signature_v4_dist_cjs = __webpack_require__(75118);
// EXTERNAL MODULE: ./node_modules/@aws-crypto/sha256-js/build/main/index.js
var main = __webpack_require__(23156);
;// CONCATENATED MODULE: ./src/auth.js







function action_fail(message) {
  core.debug(message);
  core.setFailed(message);
  throw new Error(message);
}

async function getAwsCloudIdV3() {
  try {
    // Get AWS credentials using the v3 credential provider
    const credentialsProvider = (0,dist_cjs.fromNodeProviderChain)();
    const credentials = await credentialsProvider();

    // Create the STS request body and URL
    const body = 'Action=GetCallerIdentity&Version=2011-06-15';
    const url = 'https://sts.amazonaws.com/';
    const region = 'us-east-1';

    // Create a signature using AWS SDK v3
    const signer = new signature_v4_dist_cjs.SignatureV4({
      credentials: credentials,
      region: region,
      service: 'sts',
      sha256: main.Sha256
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
  const api = akeyless_api_api(apiUrl);
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
      dist/* Auth */.Njn.constructFromObject({
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
  const api = akeyless_api_api(apiUrl);
  let cloudId;

  try {
    cloudId = await getAwsCloudIdV3();
  } catch (error) {
    action_fail(`Failed to fetch cloud id: ${error.message}`);
  }

  try {
    return api.auth(
      dist/* Auth */.Njn.constructFromObject({
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



;// CONCATENATED MODULE: ./src/aws_access.js




async function awsLogin(akeylessToken, producerForAwsAccess, apiUrl) {
  const api = akeyless_api_api(apiUrl);
  return new Promise((resolve, reject) => {
    return api
      .getDynamicSecretValue(
        dist/* GetDynamicSecretValue */.HlO.constructFromObject({
          token: akeylessToken,
          name: producerForAwsAccess
        })
      )
      .then(awsCredentials => {
        const accessKeyId = awsCredentials['access_key_id'];
        const secretAccessKey = awsCredentials['secret_access_key'];
        const sessionToken = awsCredentials['security_token'];

        core.setSecret(accessKeyId);
        core.exportVariable('AWS_ACCESS_KEY_ID', accessKeyId);
        core.setSecret(secretAccessKey);
        core.exportVariable('AWS_SECRET_ACCESS_KEY', secretAccessKey);
        if (sessionToken) {
          core.setSecret(sessionToken);
          core.exportVariable('AWS_SESSION_TOKEN', sessionToken);
        }
        resolve();
      })
      .catch(error => {
        reject(error);
      });
  });
}



;// CONCATENATED MODULE: ./src/secrets.js




async function exportDynamicSecrets(akeylessToken, dynamicSecrets, apiUrl, exportSecretsToOutputs, exportSecretsToEnvironment, generateSeparateOutputs, timeout) {
  const api = akeyless_api_api(apiUrl);

  for (const [akeylessPath, variableName] of Object.entries(dynamicSecrets)) {
    core.info(`Requesting ${akeylessPath}...`);

    try {
      const param = dist/* GetDynamicSecretValue */.HlO.constructFromObject({
        token: akeylessToken,
        name: akeylessPath,
        timeout: timeout
      });

      const dynamicSecret = await api.getDynamicSecretValue(param).catch(error => {
        core.error(`getDynamicSecretValue Failed: ${JSON.stringify(error)}`);
        core.setFailed(`getDynamicSecretValue Failed: ${JSON.stringify(error)}`);
      });

      if (dynamicSecret === null || dynamicSecret === undefined) {
        core.info(`Could not fetch ${akeylessPath}. Skipping...`);
        core.notice(`Notice: ${akeylessPath} was not found in Akeyless. Skipped.`);
        return;
      }

      // toggled by parse-dynamic-secrets
      if (generateSeparateOutputs === false) {
        // **** Option 1 (DEFAULT BEHAVIOR) ***** //
        // Exports the entire dynamic secret value as one object

        // Switch 1 -
        // set outputs
        if (exportSecretsToOutputs) {
          // obscure values in visible output and logs
          core.setSecret(dynamicSecret);

          // KEY TAKAWAY: Set the output using the entire dynamic secret object
          core.setOutput(variableName, dynamicSecret);
        }

        // Switch 2 -
        // export env variables
        if (exportSecretsToEnvironment) {
          const toEnvironment = dynamicSecret;
          // if (dynamicSecret.constructor === Array || dynamicSecret.constructor === Object) {
          //   toEnvironment = JSON.stringify(dynamicSecret);
          // }
          // obscure values in visible output and logs
          core.setSecret(toEnvironment);

          // KEY TAKAWAY: Set the output using the entire dynamic secret object
          // export to environment
          core.exportVariable(variableName, toEnvironment);
        }
      } else {
        // **** Option 2 (parse-secrets =true) ***** //
        // Generate separate output/env vars for each value in the dynamic secret

        for (const key in dynamicSecret) {
          // get the value for the key
          const value = dynamicSecret[key];

          // obscure value in visible output and logs
          core.setSecret(value);

          // if the user set an output variable name, use it to prefix the output/env var's name
          let finalVarName = variableName;
          if (variableName === null || variableName.trim() === '') {
            finalVarName = `${key}`;
          } else {
            finalVarName = `${variableName}_${key}`;
          }

          // Switch 1 - set outputs
          if (exportSecretsToOutputs) {
            core.setOutput(finalVarName, value);
          }

          // Switch 2 - export env variables
          if (exportSecretsToEnvironment) {
            core.exportVariable(finalVarName, value);
          }

          // Debugging
          // if (dynamicSecret.hasOwnProperty(key)) {
          //   core.info(`Property ${key} is NOT from prototype chain`);
          // } else {
          //   core.info(`Property ${key} is from prototype chain. contact developer to shate special dynamic secret situation.`);
          // }
        }

        core.info(`Successfully exported ${akeylessPath} to ${variableName}.`);
      }
    } catch (error) {
      core.error(`Failed to export dynamic secrets: ${JSON.stringify(error)}`);
      core.setFailed(`Failed to export dynamic secrets: ${JSON.stringify(error)}`);
    }
  }
}

async function exportStaticSecrets(akeylessToken, staticSecrets, apiUrl, exportSecretsToOutputs, exportSecretsToEnvironment, timeout) {
  const api = akeyless_api_api(apiUrl);

  for (const [akeylessPath, variableName] of Object.entries(staticSecrets)) {
    core.info(`Requesting ${akeylessPath}...`);

    const name = akeylessPath;

    const param = dist/* GetSecretValue */.myv.constructFromObject({
      token: akeylessToken,
      names: [name],
      timeout: timeout
    });

    const staticSecret = await api.getSecretValue(param).catch(error => {
      core.error(`getSecretValue Failed: ${JSON.stringify(error)}`);
      core.setFailed(`getSecretValue Failed: ${JSON.stringify(error)}`);
    });

    if (staticSecret === undefined) {
      core.info(`Could not fetch ${akeylessPath}. Skipping...`);
      core.notice(`Notice: ${akeylessPath} was not found in Akeyless. Skipped.`);
      return;
    }

    const secretValue = staticSecret[name];

    core.setSecret(secretValue);

    // Switch 1 - set outputs
    if (exportSecretsToOutputs) {
      core.setOutput(variableName, secretValue);
    }

    // Switch 2 - export env variables
    if (exportSecretsToEnvironment) {
      core.exportVariable(variableName, secretValue);
    }

    core.info(`Successfully exported ${akeylessPath} to ${variableName}.`);
  }
}



;// CONCATENATED MODULE: ./src/input.js



const stringInputs = {
  accessId: 'access-id',
  accessType: 'access-type',
  apiUrl: 'api-url',
  producerForAwsAccess: 'producer-for-aws-access'
};

const boolInputs = {
  exportSecretsToOutputs: 'export-secrets-to-outputs',
  exportSecretsToEnvironment: 'export-secrets-to-environment',
  parseDynamicSecrets: 'parse-dynamic-secrets'
};

const dictInputs = {
  staticSecrets: 'static-secrets',
  dynamicSecrets: 'dynamic-secrets'
};

const numberInputs = {
  timeout: 'timeout'
};

const fetchAndValidateInput = () => {
  const params = {
    accessId: core.getInput('access-id', {required: true}),
    accessType: core.getInput('access-type'),
    apiUrl: core.getInput('api-url'),
    producerForAwsAccess: core.getInput('producer-for-aws-access'),
    staticSecrets: core.getInput('static-secrets'),
    dynamicSecrets: core.getInput('dynamic-secrets'),
    exportSecretsToOutputs: core.getBooleanInput('export-secrets-to-outputs', {default: true}),
    exportSecretsToEnvironment: core.getBooleanInput('export-secrets-to-environment', {default: true}),
    parseDynamicSecrets: core.getBooleanInput('parse-dynamic-secrets', {default: false}),
    timeout: Number(core.getInput('timeout') || '15')
  };

  // our only required parameter
  if (!params['accessId']) {
    throw new Error('You must provide the access id for your auth method via the access-id input');
  }

  // check for string types
  for (const [paramKey, inputId] of Object.entries(stringInputs)) {
    if (typeof params[paramKey] !== 'string') {
      throw new Error(`Input '${inputId}' should be a string`);
    }
  }

  // check for bool types
  for (const [paramKey, inputId] of Object.entries(boolInputs)) {
    if (typeof params[paramKey] !== 'boolean') {
      throw new Error(`Input '${inputId}' should be a boolean`);
    }
  }

  // check for dict types
  for (const [paramKey, inputId] of Object.entries(dictInputs)) {
    if (typeof params[paramKey] !== 'string') {
      throw new Error(`Input '${inputId}' should be a serialized JSON dictionary with the secret path as a key and the output name as the value`);
    }
    if (!params[paramKey]) {
      continue;
    }
    try {
      const parsed = JSON.parse(params[paramKey]);
      if (parsed.constructor !== Object) {
        throw new Error(`Input '${inputId}' did not contain a valid JSON dictionary`);
      }
      params[paramKey] = parsed;
    } catch (e) {
      if (e instanceof SyntaxError) {
        throw new Error(`Input '${inputId}' did not contain valid JSON`);
      } else {
        throw e;
      }
    }
  }

  // check access types
  if (!allowedAccessTypes.includes(params['accessType'].toLowerCase())) {
    throw new Error(`access-type must be one of: ['${allowedAccessTypes.join("', '")}']`);
  }

  // check for number types
  for (const [paramKey, inputId] of Object.entries(numberInputs)) {
    const parsedNumber = Number(params[paramKey]);
    if (isNaN(parsedNumber)) {
      throw new Error(`Input '${inputId}' should be a number`);
    }
    if (parsedNumber < 15 || parsedNumber > 120) {
      throw new Error(`Input '${inputId}' should be between 15 and 120`);
    }
  }
  params['accessType'] = params['accessType'].toLowerCase();

  return params;
};



;// CONCATENATED MODULE: ./src/index.js







async function run() {
  core.debug('Fetching input');

  const {accessId, accessType, apiUrl, producerForAwsAccess, staticSecrets, dynamicSecrets, exportSecretsToOutputs, exportSecretsToEnvironment, parseDynamicSecrets, timeout} =
    fetchAndValidateInput();

  core.debug(`access id: ${accessId}`);
  core.debug(`Fetch akeyless token with access type ${accessType}`);

  let akeylessToken;

  try {
    const akeylessLoginResponse = await akeylessLogin(accessId, accessType, apiUrl);
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
      await awsLogin(akeylessToken, producerForAwsAccess, apiUrl);
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
      await exportStaticSecrets(akeylessToken, staticSecrets, apiUrl, exportSecretsToOutputs, exportSecretsToEnvironment);
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
      await exportDynamicSecrets(akeylessToken, dynamicSecrets, apiUrl, exportSecretsToOutputs, exportSecretsToEnvironment, parseDynamicSecrets);
    } catch (error) {
      core.error(`Failed to fetch dynamic secrets: ${JSON.stringify(error)}`);
      core.setFailed(`Failed to fetch dynamic secrets: ${JSON.stringify(error)}`);
    }
  } else {
    core.debug(`Dynamic Secrets: Skipping step because no dynamic secrets were specified`);
  }
}



async function src_main(runner = run) {
  try {
    core.debug('Starting main run');
    core.info(`Note: Any AWS SDK warnings come from the Akeyless dependencies. Once they're addressed, this action will automatically inherit those fixes in the next update.`);
    await runner();
  } catch (error) {
    core.debug(error.stack);
    core.setFailed(error.message);
    core.debug(error.message);
  }
}



function bootstrap(importMetaUrl = require("url").pathToFileURL(__filename).href, argvPath = process.argv[1], runMain = src_main) {
  if (importMetaUrl === `file://${argvPath}`) {
    runMain();
  }
}



bootstrap();


/***/ })

};
;