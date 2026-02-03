import {describe, test, expect, beforeEach, vi} from 'vitest';

// Mock modules
vi.mock('@actions/core', () => ({
  setSecret: vi.fn(),
  exportVariable: vi.fn()
}));

vi.mock('../src/akeyless_api.js', () => ({
  api: vi.fn()
}));

vi.mock('akeyless', () => ({
  default: {
    GetDynamicSecretValue: {
      constructFromObject: vi.fn()
    }
  }
}));

import * as core from '@actions/core';
import * as akeylessApi from '../src/akeyless_api.js';
import akeyless from 'akeyless';
import * as awsAccess from '../src/aws_access.js';

describe('AWS Access module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('successful AWS login with session token', async () => {
    vi.mocked(core.setSecret).mockImplementation(() => {});
    vi.mocked(core.exportVariable).mockImplementation(() => {});
    const api = vi.fn(() => {});
    api.getDynamicSecretValue = vi.fn(() =>
      Promise.resolve({
        access_key_id: 'aws-access-key',
        secret_access_key: 'aws-secret-key',
        security_token: 'aws-session-token'
      })
    );
    vi.mocked(akeylessApi.api).mockReturnValue(api);
    vi.mocked(akeyless.GetDynamicSecretValue.constructFromObject).mockReturnValue('get_dynamic_secret_body');

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
    core.setSecret = vi.fn(() => {});
    core.exportVariable = vi.fn(() => {});
    const api = vi.fn(() => {});
    api.getDynamicSecretValue = vi.fn(() =>
      Promise.resolve({
        access_key_id: 'aws-access-key',
        secret_access_key: 'aws-secret-key'
        // no security_token
      })
    );
    akeylessApi.api = vi.fn(() => api);
    akeyless.GetDynamicSecretValue.constructFromObject = vi.fn(() => 'get_dynamic_secret_body');

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
    core.setSecret = vi.fn(() => {});
    core.exportVariable = vi.fn(() => {});
    const api = vi.fn(() => {});
    api.getDynamicSecretValue = vi.fn(() =>
      Promise.resolve({
        access_key_id: 'aws-access-key',
        secret_access_key: 'aws-secret-key',
        security_token: '' // empty string
      })
    );
    akeylessApi.api = vi.fn(() => api);
    akeyless.GetDynamicSecretValue.constructFromObject = vi.fn(() => 'get_dynamic_secret_body');

    await awsAccess.awsLogin('akeyless-token', '/path/to/dynamic/producer', 'https://api.akeyless.io');

    expect(core.setSecret.mock.calls).toEqual([['aws-access-key'], ['aws-secret-key']]);
    expect(core.exportVariable.mock.calls).toEqual([
      ['AWS_ACCESS_KEY_ID', 'aws-access-key'],
      ['AWS_SECRET_ACCESS_KEY', 'aws-secret-key']
    ]);
  });

  test('AWS login with null session token', async () => {
    core.setSecret = vi.fn(() => {});
    core.exportVariable = vi.fn(() => {});
    const api = vi.fn(() => {});
    api.getDynamicSecretValue = vi.fn(() =>
      Promise.resolve({
        access_key_id: 'aws-access-key',
        secret_access_key: 'aws-secret-key',
        security_token: null // null value
      })
    );
    akeylessApi.api = vi.fn(() => api);
    akeyless.GetDynamicSecretValue.constructFromObject = vi.fn(() => 'get_dynamic_secret_body');

    await awsAccess.awsLogin('akeyless-token', '/path/to/dynamic/producer', 'https://api.akeyless.io');

    expect(core.setSecret.mock.calls).toEqual([['aws-access-key'], ['aws-secret-key']]);
    expect(core.exportVariable.mock.calls).toEqual([
      ['AWS_ACCESS_KEY_ID', 'aws-access-key'],
      ['AWS_SECRET_ACCESS_KEY', 'aws-secret-key']
    ]);
  });

  test('AWS login fails when API call fails', async () => {
    const api = vi.fn(() => {});
    api.getDynamicSecretValue = vi.fn(() => Promise.reject(new Error('API call failed')));
    akeylessApi.api = vi.fn(() => api);
    akeyless.GetDynamicSecretValue.constructFromObject = vi.fn(() => 'get_dynamic_secret_body');

    await expect(awsAccess.awsLogin('akeyless-token', '/path/to/dynamic/producer', 'https://api.akeyless.io')).rejects.toThrow('API call failed');

    expect(api.getDynamicSecretValue).toHaveBeenCalledWith('get_dynamic_secret_body');
  });

  test('AWS login handles missing access_key_id', async () => {
    core.setSecret = vi.fn(() => {});
    core.exportVariable = vi.fn(() => {});
    const api = vi.fn(() => {});
    api.getDynamicSecretValue = vi.fn(() =>
      Promise.resolve({
        // missing access_key_id
        secret_access_key: 'aws-secret-key',
        security_token: 'aws-session-token'
      })
    );
    akeylessApi.api = vi.fn(() => api);
    akeyless.GetDynamicSecretValue.constructFromObject = vi.fn(() => 'get_dynamic_secret_body');

    await awsAccess.awsLogin('akeyless-token', '/path/to/dynamic/producer', 'https://api.akeyless.io');

    expect(core.setSecret.mock.calls).toEqual([[undefined], ['aws-secret-key'], ['aws-session-token']]);
    expect(core.exportVariable.mock.calls).toEqual([
      ['AWS_ACCESS_KEY_ID', undefined],
      ['AWS_SECRET_ACCESS_KEY', 'aws-secret-key'],
      ['AWS_SESSION_TOKEN', 'aws-session-token']
    ]);
  });
});

