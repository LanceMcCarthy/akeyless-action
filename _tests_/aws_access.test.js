jest.mock('@actions/core');
jest.mock('../src/akeyless_api');
jest.mock('akeyless');

const core = require('@actions/core');
const akeylessApi = require('../src/akeyless_api');
const akeyless = require('akeyless');
const awsAccess = require('../src/aws_access');

describe('AWS Access module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('successful AWS login with session token', async () => {
    core.setSecret = jest.fn(() => {});
    core.exportVariable = jest.fn(() => {});
    const api = jest.fn(() => {});
    api.getDynamicSecretValue = jest.fn(() =>
      Promise.resolve({
        access_key_id: 'aws-access-key',
        secret_access_key: 'aws-secret-key',
        security_token: 'aws-session-token'
      })
    );
    akeylessApi.api = jest.fn(() => api);
    akeyless.GetDynamicSecretValue.constructFromObject = jest.fn(() => 'get_dynamic_secret_body');

    await awsAccess.awsLogin('akeyless-token', '/path/to/dynamic/producer', 'https://api.akeyless.io');

    expect(api.getDynamicSecretValue).toHaveBeenCalledWith('get_dynamic_secret_body');
    expect(akeyless.GetDynamicSecretValue.constructFromObject).toHaveBeenCalledWith({
      token: 'akeyless-token',
      name: '/path/to/dynamic/producer'
    });
    expect(core.setSecret.mock.calls).toEqual([['aws-access-key'], ['aws-secret-key'], ['aws-session-token']]);
    expect(core.exportVariable.mock.calls).toEqual([
      ['AWS_ACCESS_KEY_ID', 'aws-access-key'],
      ['AWS_SECRET_ACCESS_KEY', 'aws-secret-key'],
      ['AWS_SESSION_TOKEN', 'aws-session-token']
    ]);
  });

  test('successful AWS login without session token', async () => {
    core.setSecret = jest.fn(() => {});
    core.exportVariable = jest.fn(() => {});
    const api = jest.fn(() => {});
    api.getDynamicSecretValue = jest.fn(() =>
      Promise.resolve({
        access_key_id: 'aws-access-key',
        secret_access_key: 'aws-secret-key'
        // no security_token
      })
    );
    akeylessApi.api = jest.fn(() => api);
    akeyless.GetDynamicSecretValue.constructFromObject = jest.fn(() => 'get_dynamic_secret_body');

    await awsAccess.awsLogin('akeyless-token', '/path/to/dynamic/producer', 'https://api.akeyless.io');

    expect(api.getDynamicSecretValue).toHaveBeenCalledWith('get_dynamic_secret_body');
    expect(akeyless.GetDynamicSecretValue.constructFromObject).toHaveBeenCalledWith({
      token: 'akeyless-token',
      name: '/path/to/dynamic/producer'
    });
    expect(core.setSecret.mock.calls).toEqual([['aws-access-key'], ['aws-secret-key']]);
    expect(core.exportVariable.mock.calls).toEqual([
      ['AWS_ACCESS_KEY_ID', 'aws-access-key'],
      ['AWS_SECRET_ACCESS_KEY', 'aws-secret-key']
    ]);
  });

  test('AWS login with empty session token', async () => {
    core.setSecret = jest.fn(() => {});
    core.exportVariable = jest.fn(() => {});
    const api = jest.fn(() => {});
    api.getDynamicSecretValue = jest.fn(() =>
      Promise.resolve({
        access_key_id: 'aws-access-key',
        secret_access_key: 'aws-secret-key',
        security_token: '' // empty string
      })
    );
    akeylessApi.api = jest.fn(() => api);
    akeyless.GetDynamicSecretValue.constructFromObject = jest.fn(() => 'get_dynamic_secret_body');

    await awsAccess.awsLogin('akeyless-token', '/path/to/dynamic/producer', 'https://api.akeyless.io');

    expect(core.setSecret.mock.calls).toEqual([['aws-access-key'], ['aws-secret-key']]);
    expect(core.exportVariable.mock.calls).toEqual([
      ['AWS_ACCESS_KEY_ID', 'aws-access-key'],
      ['AWS_SECRET_ACCESS_KEY', 'aws-secret-key']
    ]);
  });

  test('AWS login with null session token', async () => {
    core.setSecret = jest.fn(() => {});
    core.exportVariable = jest.fn(() => {});
    const api = jest.fn(() => {});
    api.getDynamicSecretValue = jest.fn(() =>
      Promise.resolve({
        access_key_id: 'aws-access-key',
        secret_access_key: 'aws-secret-key',
        security_token: null // null value
      })
    );
    akeylessApi.api = jest.fn(() => api);
    akeyless.GetDynamicSecretValue.constructFromObject = jest.fn(() => 'get_dynamic_secret_body');

    await awsAccess.awsLogin('akeyless-token', '/path/to/dynamic/producer', 'https://api.akeyless.io');

    expect(core.setSecret.mock.calls).toEqual([['aws-access-key'], ['aws-secret-key']]);
    expect(core.exportVariable.mock.calls).toEqual([
      ['AWS_ACCESS_KEY_ID', 'aws-access-key'],
      ['AWS_SECRET_ACCESS_KEY', 'aws-secret-key']
    ]);
  });

  test('AWS login fails when API call fails', async () => {
    const api = jest.fn(() => {});
    api.getDynamicSecretValue = jest.fn(() => Promise.reject(new Error('API call failed')));
    akeylessApi.api = jest.fn(() => api);
    akeyless.GetDynamicSecretValue.constructFromObject = jest.fn(() => 'get_dynamic_secret_body');

    await expect(awsAccess.awsLogin('akeyless-token', '/path/to/dynamic/producer', 'https://api.akeyless.io')).rejects.toThrow('API call failed');

    expect(api.getDynamicSecretValue).toHaveBeenCalledWith('get_dynamic_secret_body');
  });

  test('AWS login handles missing access_key_id', async () => {
    core.setSecret = jest.fn(() => {});
    core.exportVariable = jest.fn(() => {});
    const api = jest.fn(() => {});
    api.getDynamicSecretValue = jest.fn(() =>
      Promise.resolve({
        // missing access_key_id
        secret_access_key: 'aws-secret-key',
        security_token: 'aws-session-token'
      })
    );
    akeylessApi.api = jest.fn(() => api);
    akeyless.GetDynamicSecretValue.constructFromObject = jest.fn(() => 'get_dynamic_secret_body');

    await awsAccess.awsLogin('akeyless-token', '/path/to/dynamic/producer', 'https://api.akeyless.io');

    expect(core.setSecret.mock.calls).toEqual([[undefined], ['aws-secret-key'], ['aws-session-token']]);
    expect(core.exportVariable.mock.calls).toEqual([
      ['AWS_ACCESS_KEY_ID', undefined],
      ['AWS_SECRET_ACCESS_KEY', 'aws-secret-key'],
      ['AWS_SESSION_TOKEN', 'aws-session-token']
    ]);
  });
});
