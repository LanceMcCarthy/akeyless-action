
import * as core from '@actions/core';
import { allowedAccessTypes } from './auth';

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

type Params = {
  accessId: string;
  accessType: string;
  apiUrl: string;
  producerForAwsAccess: string;
  staticSecrets: string | Record<string, string>;
  dynamicSecrets: string | Record<string, string>;
  exportSecretsToOutputs: boolean;
  exportSecretsToEnvironment: boolean;
  parseDynamicSecrets: boolean;
  timeout: number;
};

export function fetchAndValidateInput(): Params {
  const params: any = {
    accessId: core.getInput('access-id', { required: true }),
    accessType: core.getInput('access-type'),
    apiUrl: core.getInput('api-url'),
    producerForAwsAccess: core.getInput('producer-for-aws-access'),
    staticSecrets: core.getInput('static-secrets'),
    dynamicSecrets: core.getInput('dynamic-secrets'),
    exportSecretsToOutputs: core.getBooleanInput('export-secrets-to-outputs'),
    exportSecretsToEnvironment: core.getBooleanInput('export-secrets-to-environment'),
    parseDynamicSecrets: core.getBooleanInput('parse-dynamic-secrets'),
    timeout: Number(core.getInput('timeout') || '15')
  };

  // our only required parameter
  if (!params['accessId']) {
    throw new Error('You must provide the access id for your auth method via the access-id input');
  }
  // Set defaults for booleans if not provided
  if (typeof params.exportSecretsToOutputs !== 'boolean') params.exportSecretsToOutputs = true;
  if (typeof params.exportSecretsToEnvironment !== 'boolean') params.exportSecretsToEnvironment = true;
  if (typeof params.parseDynamicSecrets !== 'boolean') params.parseDynamicSecrets = false;

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
}
