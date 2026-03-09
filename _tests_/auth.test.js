vi.mock('@actions/core');
vi.mock('../src/akeyless_api.js');
vi.mock('akeyless', () => ({
  default: {
    Auth: {
      constructFromObject: vi.fn(obj => obj)
    }
  }
}));
vi.mock('@aws-sdk/credential-providers', () => ({
  fromNodeProviderChain: vi.fn()
}));
vi.mock('@aws-sdk/signature-v4', () => ({
  SignatureV4: vi.fn()
}));

import * as core from '@actions/core';
import * as akeylessApi from '../src/akeyless_api.js';
import akeyless from 'akeyless';
import {fromNodeProviderChain} from '@aws-sdk/credential-providers';
import {SignatureV4} from '@aws-sdk/signature-v4';
import * as auth from '../src/auth.js';

describe('Authentication module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    core.debug = vi.fn();
    core.setFailed = vi.fn();
    core.getIDToken = vi.fn(async () => 'gh-jwt-token');
    akeylessApi.api = vi.fn(() => ({
      auth: vi.fn(() => ({token: 'akeyless-token'}))
    }));
    akeyless.Auth.constructFromObject.mockImplementation(obj => obj);
    fromNodeProviderChain.mockReturnValue(async () => ({
      accessKeyId: 'AKIA123',
      secretAccessKey: 'SECRET123',
      sessionToken: 'SESSION123'
    }));
    SignatureV4.mockImplementation(function (options) {
      options.sha256('cover-sha256-callback');
      return {
        sign: vi.fn(async request => ({
          ...request,
          headers: {
            authorization: 'AWS4-HMAC-SHA256 signed',
            'content-length': String(request.body.length),
            host: 'sts.amazonaws.com',
            'content-type': 'application/x-www-form-urlencoded; charset=utf-8',
            'x-amz-date': '20260309T000000Z',
            'x-amz-security-token': 'SESSION123'
          }
        }))
      };
    });
  });

  test('exports allowed access types', () => {
    expect(auth.allowedAccessTypes).toEqual(['jwt', 'aws_iam']);
  });

  test('jwt login success', async () => {
    const response = await auth.akeylessLogin('p-access', 'jwt', 'https://api.akeyless.io');

    expect(response).toEqual({token: 'akeyless-token'});
    expect(core.getIDToken).toHaveBeenCalledTimes(1);
    expect(akeylessApi.api).toHaveBeenCalledWith('https://api.akeyless.io');
    expect(akeyless.Auth.constructFromObject).toHaveBeenCalledWith({
      'access-type': 'jwt',
      'access-id': 'p-access',
      jwt: 'gh-jwt-token'
    });
  });

  test('jwt login fails when GitHub ID token fetch fails', async () => {
    core.getIDToken = vi.fn(async () => {
      throw new Error('oidc unavailable');
    });

    await expect(auth.akeylessLogin('p-access', 'jwt', 'https://api.akeyless.io')).rejects.toThrow('Failed to fetch Github JWT: oidc unavailable');
    expect(core.setFailed).toHaveBeenCalledWith('Failed to fetch Github JWT: oidc unavailable');
  });

  test('jwt login fails when AKeyless auth call throws synchronously', async () => {
    akeylessApi.api = vi.fn(() => ({
      auth: vi.fn(() => {
        throw new Error('akeyless auth failed');
      })
    }));

    await expect(auth.akeylessLogin('p-access', 'jwt', 'https://api.akeyless.io')).rejects.toThrow('Failed to login to AKeyless: akeyless auth failed');
    expect(core.setFailed).toHaveBeenCalledWith('Failed to login to AKeyless: akeyless auth failed');
  });

  test('aws iam login success includes cloud id', async () => {
    const apiAuth = vi.fn(() => ({token: 'aws-token'}));
    akeylessApi.api = vi.fn(() => ({auth: apiAuth}));

    const response = await auth.akeylessLogin('p-access', 'aws_iam', 'https://api.akeyless.io');

    expect(response).toEqual({token: 'aws-token'});
    expect(fromNodeProviderChain).toHaveBeenCalledTimes(1);
    expect(SignatureV4).toHaveBeenCalledTimes(1);

    const payload = akeyless.Auth.constructFromObject.mock.calls[0][0];
    expect(payload['access-type']).toBe('aws_iam');
    expect(payload['access-id']).toBe('p-access');
    expect(typeof payload['cloud-id']).toBe('string');
    expect(payload['cloud-id'].length).toBeGreaterThan(0);
  });

  test('aws iam login supports missing session token header', async () => {
    SignatureV4.mockImplementation(function (options) {
      options.sha256('cover-sha256-callback');
      return {
        sign: vi.fn(async request => ({
          ...request,
          headers: {
            authorization: 'AWS4-HMAC-SHA256 signed',
            'content-length': String(request.body.length),
            host: 'sts.amazonaws.com',
            'content-type': 'application/x-www-form-urlencoded; charset=utf-8',
            'x-amz-date': '20260309T000000Z'
          }
        }))
      };
    });

    await auth.akeylessLogin('p-access', 'aws_iam', 'https://api.akeyless.io');

    const payload = akeyless.Auth.constructFromObject.mock.calls[0][0];
    const decodedCloudId = JSON.parse(Buffer.from(payload['cloud-id'], 'base64').toString('utf8'));
    const decodedHeaders = JSON.parse(Buffer.from(decodedCloudId.sts_request_headers, 'base64').toString('utf8'));
    expect(decodedHeaders['X-Amz-Security-Token']).toBeUndefined();
  });

  test('aws iam login fails when cloud id generation fails', async () => {
    fromNodeProviderChain.mockImplementation(() => {
      throw new Error('credentials provider unavailable');
    });

    await expect(auth.akeylessLogin('p-access', 'aws_iam', 'https://api.akeyless.io')).rejects.toThrow(
      'Failed to fetch cloud id: Failed to get AWS cloud ID: credentials provider unavailable'
    );
    expect(core.setFailed).toHaveBeenCalledWith('Failed to fetch cloud id: Failed to get AWS cloud ID: credentials provider unavailable');
  });

  test('aws iam login fails when AKeyless auth call throws synchronously', async () => {
    akeylessApi.api = vi.fn(() => ({
      auth: vi.fn(() => {
        throw new Error('akeyless aws auth failed');
      })
    }));

    await expect(auth.akeylessLogin('p-access', 'aws_iam', 'https://api.akeyless.io')).rejects.toThrow('Failed to login to AKeyless: akeyless aws auth failed');
    expect(core.setFailed).toHaveBeenCalledWith('Failed to login to AKeyless: akeyless aws auth failed');
  });

  test('akeylessLogin fails for unsupported access type', async () => {
    await expect(auth.akeylessLogin('p-access', 'invalid', 'https://api.akeyless.io')).rejects.toThrow(
      'login[accessType] is not a function'
    );
    expect(core.setFailed).toHaveBeenCalled();
  });
});
