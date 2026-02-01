import * as core from '@actions/core';
// Removed unused akeylessApi import
import {exportStaticSecrets, exportDynamicSecrets} from '../src/secrets';

jest.mock('@actions/core');
jest.mock('../src/akeyless_api', () => ({
  api: jest.fn(() => ({
    getSecretValue: jest.fn(() => Promise.resolve({'/path/to/static/secret': 'super secret value'})),
    getDynamicSecretValue: jest.fn(() => Promise.resolve({access_key_id: 'aws-access-key', secret_access_key: 'aws-secret-key', session_token: 'aws-session-token'}))
  }))
}));
jest.mock('akeyless', () => {
  return {
    GetSecretValue: {constructFromObject: jest.fn(() => 'get_static_secret_body')},
    GetDynamicSecretValue: {constructFromObject: jest.fn(() => 'get_dynamic_secret_body')},
    ApiClient: jest.fn(() => ({basePath: ''})),
    V2Api: jest.fn(() => ({}))
  };
});

describe('Secrets module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('calls exportStaticSecrets without error', async () => {
    jest.spyOn(core, 'setSecret').mockImplementation(() => {});
    jest.spyOn(core, 'setOutput').mockImplementation(() => {});
    jest.spyOn(core, 'exportVariable').mockImplementation(() => {});
    jest.spyOn(core, 'info').mockImplementation(() => {});

    await expect(exportStaticSecrets('akeyless-token', {'/path/to/static/secret': 'my_secret'}, 'https://api.akeyless.io', true, true, 30)).resolves.not.toThrow();
  });

  test('calls exportDynamicSecrets without error', async () => {
    jest.spyOn(core, 'setSecret').mockImplementation(() => {});
    jest.spyOn(core, 'setOutput').mockImplementation(() => {});
    jest.spyOn(core, 'exportVariable').mockImplementation(() => {});
    jest.spyOn(core, 'info').mockImplementation(() => {});

    await expect(exportDynamicSecrets('akeyless-token', {'/path/to/dynamic/producer': 'my_secret'}, 'https://api.akeyless.io', true, true, false, 30)).resolves.not.toThrow();
  });
});
