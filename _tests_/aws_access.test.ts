// @ts-nocheck
import * as core from '@actions/core';
import { api as akeylessApi } from '../src/akeyless_api';
import * as akeyless from 'akeyless';

jest.mock('@actions/core');
jest.mock('../src/akeyless_api');
jest.mock('akeyless');

describe('AWS Access module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('successful AWS login with session token', async () => {
    jest.spyOn(core, 'setSecret').mockImplementation(() => {});
    jest.spyOn(core, 'exportVariable').mockImplementation(() => {});
    const api = jest.fn(() => {});
    (api as any).getDynamicSecretValue = jest.fn(() =>
      Promise.resolve({
        access_key_id: 'aws-access-key',
        secret_access_key: 'aws-secret-key',
        security_token: 'aws-session-token'
      })
    );
    (akeylessApi as any).api = jest.fn(() => api);
    (akeyless as any).GetDynamicSecretValue = { constructFromObject: jest.fn(() => 'get_dynamic_secret_body') };

    await require('../src/aws_access').awsLogin('akeyless-token', '/path/to/dynamic/producer', 'https://api.akeyless.io');

    expect((api as any).getDynamicSecretValue).toHaveBeenCalledWith('get_dynamic_secret_body');
    expect((akeyless as any).GetDynamicSecretValue.constructFromObject).toHaveBeenCalledWith({
      token: 'akeyless-token',
      name: '/path/to/dynamic/producer'
    });
    expect(jest.mocked(core.setSecret).mock.calls).toEqual([['aws-access-key'], ['aws-secret-key'], ['aws-session-token']]);
    expect(jest.mocked(core.exportVariable).mock.calls).toEqual([
      ['AWS_ACCESS_KEY_ID', 'aws-access-key'],
      ['AWS_SECRET_ACCESS_KEY', 'aws-secret-key'],
      ['AWS_SESSION_TOKEN', 'aws-session-token']
    ]);
  });

  // ...other cases...
});
