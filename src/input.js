const core = require('@actions/core');
const auth = require('./auth');

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

const fetchAndValidateInput = () => {
  const params = {
    accessId: core.getInput('access-id', {required: true}),
    accessType: core.getInput('access-type'),
    apiUrl: core.getInput('api-url'),
    producerForAwsAccess: core.getInput('producer-for-aws-access'),
    staticSecrets: core.getInput('static-secrets'),
    dynamicSecrets: core.getInput('dynamic-secrets'),
    exportSecretsToOutputs: core.getBooleanInput('export-secrets-to-outputs'),
    exportSecretsToEnvironment: core.getBooleanInput('export-secrets-to-environment'),
    parseDynamicSecrets: core.getBooleanInput('parse-dynamic-secrets')
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
      parsed = JSON.parse(params[paramKey]);
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
  if (!auth.allowedAccessTypes.includes(params['accessType'].toLowerCase())) {
    throw new Error(`access-type must be one of: ['${auth.allowedAccessTypes.join("', '")}']`);
  }
  params['accessType'] = params['accessType'].toLowerCase();

  return params;
};

exports.fetchAndValidateInput = fetchAndValidateInput;
