import * as core from '@actions/core';
import * as auth from '../src/auth';
import {fetchAndValidateInput} from '../src/input';

jest.mock('@actions/core');
jest.mock('../src/auth');

describe('Input validation module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (auth as {allowedAccessTypes: string[]}).allowedAccessTypes = ['jwt', 'aws_iam'];
  });

  test('valid input with all parameters', () => {
    jest.spyOn(core, 'getInput').mockImplementation((name: string) => {
      switch (name) {
        case 'access-id':
          return 'p-asdf';
        case 'access-type':
          return 'JWT';
        case 'api-url':
          return 'https://api.akeyless.io';
        case 'producer-for-aws-access':
          return '/path/to/aws/producer';
        case 'static-secrets':
          return '{"/some/static/secret":"secret_key"}';
        case 'dynamic-secrets':
          return '{"/some/dynamic/secret":"other_key"}';
        case 'timeout':
          return '30';
        default:
          return '';
      }
    });
    jest.spyOn(core, 'getBooleanInput').mockImplementation((name: string) => {
      switch (name) {
        case 'export-secrets-to-outputs':
          return true;
        case 'export-secrets-to-environment':
          return true;
        case 'parse-dynamic-secrets':
          return false;
        default:
          return false;
      }
    });

    const params = fetchAndValidateInput();

    expect(params).toEqual({
      accessId: 'p-asdf',
      accessType: 'jwt',
      apiUrl: 'https://api.akeyless.io',
      producerForAwsAccess: '/path/to/aws/producer',
      staticSecrets: {'/some/static/secret': 'secret_key'},
      dynamicSecrets: {'/some/dynamic/secret': 'other_key'},
      exportSecretsToOutputs: true,
      exportSecretsToEnvironment: true,
      parseDynamicSecrets: false,
      timeout: 30
    });
  });
});
