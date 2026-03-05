vi.mock('@actions/core');
vi.mock('../src/akeyless_api');
vi.mock('akeyless');

import * as core from '@actions/core';
import * as akeylessApi from '../src/akeyless_api.js';
import akeyless from 'akeyless';
import * as secrets from '../src/secrets.js';

describe('Secrets module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Dynamic Secrets', () => {
    test('export dynamic secrets - default behavior (whole object)', async () => {
      // ARRANGE
      const dynamicSecret = {
        access_key_id: 'aws-access-key',
        secret_access_key: 'aws-secret-key',
        session_token: 'aws-session-token'
      };

      core.setSecret = vi.fn(() => {});
      core.setOutput = vi.fn(() => {});
      core.exportVariable = vi.fn(() => {});
      core.info = vi.fn(() => {});

      const api = vi.fn(() => {});
      api.getDynamicSecretValue = vi.fn(() => Promise.resolve(dynamicSecret));
      akeylessApi.api = vi.fn(() => api);
      akeyless.GetDynamicSecretValue.constructFromObject = vi.fn(() => 'get_dynamic_secret_body');

      // ACT
      await secrets.exportDynamicSecrets('akeyless-token', {'/path/to/dynamic/producer': 'my_secret'}, 'https://api.akeyless.io', true, true, false, false, 30);

      // ASSERT
      expect(api.getDynamicSecretValue).toHaveBeenCalledWith('get_dynamic_secret_body');
      expect(akeyless.GetDynamicSecretValue.constructFromObject).toHaveBeenCalledWith({
        token: 'akeyless-token',
        name: '/path/to/dynamic/producer',
        timeout: 30
      });
      expect(core.setSecret).toHaveBeenCalledWith(dynamicSecret);
      expect(core.setOutput).toHaveBeenCalledWith('my_secret', dynamicSecret);
      expect(core.exportVariable).toHaveBeenCalledWith('my_secret', dynamicSecret);
    });

    test('export dynamic secrets - separated outputs (parse-dynamic-secrets=true)', async () => {
      // ARRANGE
      const dynamicSecret = {
        access_key_id: 'aws-access-key',
        secret_access_key: 'aws-secret-key',
        session_token: 'aws-session-token'
      };

      core.setSecret = vi.fn(() => {});
      core.setOutput = vi.fn(() => {});
      core.exportVariable = vi.fn(() => {});
      core.info = vi.fn(() => {});

      const api = vi.fn(() => {});
      api.getDynamicSecretValue = vi.fn(() => Promise.resolve(dynamicSecret));
      akeylessApi.api = vi.fn(() => api);
      akeyless.GetDynamicSecretValue.constructFromObject = vi.fn(() => 'get_dynamic_secret_body');

      // ACT
      await secrets.exportDynamicSecrets('akeyless-token', {'/path/to/dynamic/producer': 'aws'}, 'https://api.akeyless.io', true, true, true, false, 30);

      // ASSERT
      expect(api.getDynamicSecretValue).toHaveBeenCalledWith('get_dynamic_secret_body');
      expect(akeyless.GetDynamicSecretValue.constructFromObject).toHaveBeenCalledWith({
        token: 'akeyless-token',
        name: '/path/to/dynamic/producer',
        timeout: 30
      });

      // Each key should be set as a separate secret/output/env var
      expect(core.setSecret).toHaveBeenCalledWith('aws-access-key');
      expect(core.setSecret).toHaveBeenCalledWith('aws-secret-key');
      expect(core.setSecret).toHaveBeenCalledWith('aws-session-token');

      expect(core.setOutput).toHaveBeenCalledWith('aws_access_key_id', 'aws-access-key');
      expect(core.setOutput).toHaveBeenCalledWith('aws_secret_access_key', 'aws-secret-key');
      expect(core.setOutput).toHaveBeenCalledWith('aws_session_token', 'aws-session-token');

      expect(core.exportVariable).toHaveBeenCalledWith('aws_access_key_id', 'aws-access-key');
      expect(core.exportVariable).toHaveBeenCalledWith('aws_secret_access_key', 'aws-secret-key');
      expect(core.exportVariable).toHaveBeenCalledWith('aws_session_token', 'aws-session-token');
    });

    test('export dynamic secrets - separated outputs with empty prefix', async () => {
      // ARRANGE
      const dynamicSecret = {
        username: 'admin',
        password: 'secret123'
      };

      core.setSecret = vi.fn(() => {});
      core.setOutput = vi.fn(() => {});
      core.exportVariable = vi.fn(() => {});
      core.info = vi.fn(() => {});

      const api = vi.fn(() => {});
      api.getDynamicSecretValue = vi.fn(() => Promise.resolve(dynamicSecret));
      akeylessApi.api = vi.fn(() => api);
      akeyless.GetDynamicSecretValue.constructFromObject = vi.fn(() => 'get_dynamic_secret_body');

      // ACT
      await secrets.exportDynamicSecrets('akeyless-token', {'/path/to/dynamic/producer': ''}, 'https://api.akeyless.io', true, true, true, false, 30);

      // ASSERT
      expect(core.setOutput).toHaveBeenCalledWith('username', 'admin');
      expect(core.setOutput).toHaveBeenCalledWith('password', 'secret123');
      expect(core.exportVariable).toHaveBeenCalledWith('username', 'admin');
      expect(core.exportVariable).toHaveBeenCalledWith('password', 'secret123');
    });

    test('export dynamic secrets - only outputs, no environment variables', async () => {
      // ARRANGE
      const dynamicSecret = {
        token: 'secret-token'
      };

      core.setSecret = vi.fn(() => {});
      core.setOutput = vi.fn(() => {});
      core.exportVariable = vi.fn(() => {});
      core.info = vi.fn(() => {});

      const api = vi.fn(() => {});
      api.getDynamicSecretValue = vi.fn(() => Promise.resolve(dynamicSecret));
      akeylessApi.api = vi.fn(() => api);
      akeyless.GetDynamicSecretValue.constructFromObject = vi.fn(() => 'get_dynamic_secret_body');

      // ACT
      await secrets.exportDynamicSecrets('akeyless-token', {'/path/to/dynamic/producer': 'my_token'}, 'https://api.akeyless.io', true, false, false, false, 30);

      // ASSERT
      expect(core.setSecret).toHaveBeenCalledWith(dynamicSecret);
      expect(core.setOutput).toHaveBeenCalledWith('my_token', dynamicSecret);
      expect(core.exportVariable).not.toHaveBeenCalled();
    });

    test('export dynamic secrets - only environment variables, no outputs', async () => {
      // ARRANGE
      const dynamicSecret = {
        token: 'secret-token'
      };

      core.setSecret = vi.fn(() => {});
      core.setOutput = vi.fn(() => {});
      core.exportVariable = vi.fn(() => {});
      core.info = vi.fn(() => {});

      const api = vi.fn(() => {});
      api.getDynamicSecretValue = vi.fn(() => Promise.resolve(dynamicSecret));
      akeylessApi.api = vi.fn(() => api);
      akeyless.GetDynamicSecretValue.constructFromObject = vi.fn(() => 'get_dynamic_secret_body');

      // ACT
      await secrets.exportDynamicSecrets('akeyless-token', {'/path/to/dynamic/producer': 'my_token'}, 'https://api.akeyless.io', false, true, false, false, 30);

      // ASSERT
      expect(core.setSecret).toHaveBeenCalledWith(dynamicSecret);
      expect(core.setOutput).not.toHaveBeenCalled();
      expect(core.exportVariable).toHaveBeenCalledWith('my_token', dynamicSecret);
    });

    test('export dynamic secrets - handles null response', async () => {
      // ARRANGE
      core.info = vi.fn(() => {});
      core.notice = vi.fn(() => {});

      const api = vi.fn(() => {});
      api.getDynamicSecretValue = vi.fn(() => Promise.resolve(null));
      akeylessApi.api = vi.fn(() => api);
      akeyless.GetDynamicSecretValue.constructFromObject = vi.fn(() => 'get_dynamic_secret_body');

      // ACT
      await secrets.exportDynamicSecrets('akeyless-token', {'/path/to/dynamic/producer': 'my_token'}, 'https://api.akeyless.io', true, true, false, false, 30);

      // ASSERT
      expect(core.notice).toHaveBeenCalledWith('Notice: /path/to/dynamic/producer was not found in Akeyless. Skipped.');
    });

    test('export dynamic secrets - handles API error', async () => {
      // ARRANGE
      core.error = vi.fn(() => {});
      core.setFailed = vi.fn(() => {});
      core.info = vi.fn(() => {});

      const api = vi.fn(() => {});
      const apiError = new Error('API error');
      api.getDynamicSecretValue = vi.fn(() => Promise.reject(apiError));
      akeylessApi.api = vi.fn(() => api);
      akeyless.GetDynamicSecretValue.constructFromObject = vi.fn(() => 'get_dynamic_secret_body');

      // ACT
      await secrets.exportDynamicSecrets('akeyless-token', {'/path/to/dynamic/producer': 'my_token'}, 'https://api.akeyless.io', true, true, false, false, 30);

      // ASSERT
      expect(core.error).toHaveBeenCalledWith(`getDynamicSecretValue Failed: ${JSON.stringify(apiError)}`);
      expect(core.setFailed).toHaveBeenCalledWith(`getDynamicSecretValue Failed: ${JSON.stringify(apiError)}`);
    });

    test('export dynamic secrets - handles general error', async () => {
      // ARRANGE
      core.error = vi.fn(() => {});
      core.setFailed = vi.fn(() => {});
      core.info = vi.fn(() => {});

      const api = vi.fn(() => {});
      api.getDynamicSecretValue = vi.fn(() => {
        throw new Error('General error');
      });
      akeylessApi.api = vi.fn(() => api);
      akeyless.GetDynamicSecretValue.constructFromObject = vi.fn(() => 'get_dynamic_secret_body');

      // ACT
      await secrets.exportDynamicSecrets('akeyless-token', {'/path/to/dynamic/producer': 'my_token'}, 'https://api.akeyless.io', true, true, false, 30);

      // ASSERT
      expect(core.error).toHaveBeenCalledWith(expect.stringContaining('Failed to export dynamic secrets:'));
      expect(core.setFailed).toHaveBeenCalledWith(expect.stringContaining('Failed to export dynamic secrets:'));
    });
  });

  describe('Static Secrets', () => {
    test('export static secrets successfully', async () => {
      // ARRANGE
      const staticSecretResponse = {
        '/path/to/static/secret': 'super secret value'
      };

      core.setSecret = vi.fn(() => {});
      core.setOutput = vi.fn(() => {});
      core.exportVariable = vi.fn(() => {});
      core.info = vi.fn(() => {});

      const api = vi.fn(() => {});
      api.getSecretValue = vi.fn(() => Promise.resolve(staticSecretResponse));
      akeylessApi.api = vi.fn(() => api);
      akeyless.GetSecretValue.constructFromObject = vi.fn(() => 'get_static_secret_body');

      // ACT
      await secrets.exportStaticSecrets('akeyless-token', {'/path/to/static/secret': 'my_secret'}, 'https://api.akeyless.io', true, true, false, 30);

      // ASSERT
      expect(api.getSecretValue).toHaveBeenCalledWith('get_static_secret_body');
      expect(akeyless.GetSecretValue.constructFromObject).toHaveBeenCalledWith({
        token: 'akeyless-token',
        names: ['/path/to/static/secret'],
        timeout: 30
      });
      expect(core.setSecret).toHaveBeenCalledWith('super secret value');
      expect(core.setOutput).toHaveBeenCalledWith('my_secret', 'super secret value');
      expect(core.exportVariable).toHaveBeenCalledWith('my_secret', 'super secret value');
    });

    test('export static secrets - only outputs, no environment variables', async () => {
      // ARRANGE
      const staticSecretResponse = {
        '/path/to/static/secret': 'super secret value'
      };

      core.setSecret = vi.fn(() => {});
      core.setOutput = vi.fn(() => {});
      core.exportVariable = vi.fn(() => {});
      core.info = vi.fn(() => {});

      const api = vi.fn(() => {});
      api.getSecretValue = vi.fn(() => Promise.resolve(staticSecretResponse));
      akeylessApi.api = vi.fn(() => api);
      akeyless.GetSecretValue.constructFromObject = vi.fn(() => 'get_static_secret_body');

      // ACT
      await secrets.exportStaticSecrets('akeyless-token', {'/path/to/static/secret': 'my_secret'}, 'https://api.akeyless.io', true, false, false, 30);

      // ASSERT
      expect(core.setSecret).toHaveBeenCalledWith('super secret value');
      expect(core.setOutput).toHaveBeenCalledWith('my_secret', 'super secret value');
      expect(core.exportVariable).not.toHaveBeenCalled();
    });

    test('export static secrets - only environment variables, no outputs', async () => {
      // ARRANGE
      const staticSecretResponse = {
        '/path/to/static/secret': 'super secret value'
      };

      core.setSecret = vi.fn(() => {});
      core.setOutput = vi.fn(() => {});
      core.exportVariable = vi.fn(() => {});
      core.info = vi.fn(() => {});

      const api = vi.fn(() => {});
      api.getSecretValue = vi.fn(() => Promise.resolve(staticSecretResponse));
      akeylessApi.api = vi.fn(() => api);
      akeyless.GetSecretValue.constructFromObject = vi.fn(() => 'get_static_secret_body');

      // ACT
      await secrets.exportStaticSecrets('akeyless-token', {'/path/to/static/secret': 'my_secret'}, 'https://api.akeyless.io', false, true, false, 30);

      // ASSERT
      expect(core.setSecret).toHaveBeenCalledWith('super secret value');
      expect(core.setOutput).not.toHaveBeenCalled();
      expect(core.exportVariable).toHaveBeenCalledWith('my_secret', 'super secret value');
    });

    test('export static secrets - handles undefined response', async () => {
      // ARRANGE
      core.info = vi.fn(() => {});
      core.notice = vi.fn(() => {});

      const api = vi.fn(() => {});
      api.getSecretValue = vi.fn(() => Promise.resolve(undefined));
      akeylessApi.api = vi.fn(() => api);
      akeyless.GetSecretValue.constructFromObject = vi.fn(() => 'get_static_secret_body');

      // ACT
      await secrets.exportStaticSecrets('akeyless-token', {'/path/to/static/secret': 'my_secret'}, 'https://api.akeyless.io', true, true, false, 30);

      // ASSERT
      expect(core.notice).toHaveBeenCalledWith('Notice: /path/to/static/secret was not found in Akeyless. Skipped.');
    });

    test('export static secrets - handles API error', async () => {
      // ARRANGE
      core.error = vi.fn(() => {});
      core.setFailed = vi.fn(() => {});
      core.info = vi.fn(() => {});

      const api = vi.fn(() => {});
      const apiError = new Error('API error');
      api.getSecretValue = vi.fn(() => Promise.reject(apiError));
      akeylessApi.api = vi.fn(() => api);
      akeyless.GetSecretValue.constructFromObject = vi.fn(() => 'get_static_secret_body');

      // ACT
      await secrets.exportStaticSecrets('akeyless-token', {'/path/to/static/secret': 'my_secret'}, 'https://api.akeyless.io', true, true, false, 30);

      // ASSERT
      expect(core.error).toHaveBeenCalledWith(`getSecretValue Failed: ${JSON.stringify(apiError)}`);
      expect(core.setFailed).toHaveBeenCalledWith(`getSecretValue Failed: ${JSON.stringify(apiError)}`);
    });

    test('export multiple static secrets', async () => {
      // ARRANGE
      const staticSecrets = {
        '/secret1': 'secret1_name',
        '/secret2': 'secret2_name'
      };

      core.setSecret = vi.fn(() => {});
      core.setOutput = vi.fn(() => {});
      core.exportVariable = vi.fn(() => {});
      core.info = vi.fn(() => {});

      const api = vi.fn(() => {});
      api.getSecretValue = vi.fn().mockResolvedValueOnce({'/secret1': 'value1'}).mockResolvedValueOnce({'/secret2': 'value2'});
      akeylessApi.api = vi.fn(() => api);
      akeyless.GetSecretValue.constructFromObject = vi.fn(() => 'get_static_secret_body');

      // ACT
      await secrets.exportStaticSecrets('akeyless-token', staticSecrets, 'https://api.akeyless.io', true, true, false, 30);

      // ASSERT
      expect(api.getSecretValue).toHaveBeenCalledTimes(2);
      expect(core.setOutput).toHaveBeenCalledWith('secret1_name', 'value1');
      expect(core.setOutput).toHaveBeenCalledWith('secret2_name', 'value2');
      expect(core.exportVariable).toHaveBeenCalledWith('secret1_name', 'value1');
      expect(core.exportVariable).toHaveBeenCalledWith('secret2_name', 'value2');
    });

    test('export static multiline secret as base64 when enabled', async () => {
      // ARRANGE
      const multilineSecret = '-----BEGIN PRIVATE KEY-----\nline1\nline2\n-----END PRIVATE KEY-----';
      const staticSecretResponse = {
        '/path/to/static/secret': multilineSecret
      };
      const expectedBase64 = Buffer.from(multilineSecret, 'utf8').toString('base64');

      core.setSecret = vi.fn(() => {});
      core.setOutput = vi.fn(() => {});
      core.exportVariable = vi.fn(() => {});
      core.info = vi.fn(() => {});

      const api = vi.fn(() => {});
      api.getSecretValue = vi.fn(() => Promise.resolve(staticSecretResponse));
      akeylessApi.api = vi.fn(() => api);
      akeyless.GetSecretValue.constructFromObject = vi.fn(() => 'get_static_secret_body');

      // ACT
      await secrets.exportStaticSecrets('akeyless-token', {'/path/to/static/secret': 'my_secret'}, 'https://api.akeyless.io', true, true, true, 30);

      // ASSERT
      expect(core.setSecret).toHaveBeenCalledWith(expectedBase64);
      expect(core.setOutput).toHaveBeenCalledWith('my_secret', expectedBase64);
      expect(core.exportVariable).toHaveBeenCalledWith('my_secret', expectedBase64);
    });
  });
});
