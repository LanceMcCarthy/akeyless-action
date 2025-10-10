jest.mock('@actions/core');
jest.mock('../src/akeyless_api');
jest.mock('akeyless');

const core = require('@actions/core');
const akeylessApi = require('../src/akeyless_api');
const akeyless = require('akeyless');
const secrets = require('../src/secrets');

describe('Secrets module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Dynamic Secrets', () => {
    test('export dynamic secrets - default behavior (whole object)', async () => {
      // ARRANGE
      const dynamicSecret = {
        access_key_id: 'aws-access-key',
        secret_access_key: 'aws-secret-key',
        session_token: 'aws-session-token'
      };

      core.setSecret = jest.fn(() => {});
      core.setOutput = jest.fn(() => {});
      core.exportVariable = jest.fn(() => {});
      core.info = jest.fn(() => {});

      const api = jest.fn(() => {});
      api.getDynamicSecretValue = jest.fn(() => Promise.resolve(dynamicSecret));
      akeylessApi.api = jest.fn(() => api);
      akeyless.GetDynamicSecretValue.constructFromObject = jest.fn(() => 'get_dynamic_secret_body');

      // ACT
      await secrets.exportDynamicSecrets('akeyless-token', {'/path/to/dynamic/producer': 'my_secret'}, 'https://api.akeyless.io', true, true, false, 30);

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

      core.setSecret = jest.fn(() => {});
      core.setOutput = jest.fn(() => {});
      core.exportVariable = jest.fn(() => {});
      core.info = jest.fn(() => {});

      const api = jest.fn(() => {});
      api.getDynamicSecretValue = jest.fn(() => Promise.resolve(dynamicSecret));
      akeylessApi.api = jest.fn(() => api);
      akeyless.GetDynamicSecretValue.constructFromObject = jest.fn(() => 'get_dynamic_secret_body');

      // ACT
      await secrets.exportDynamicSecrets('akeyless-token', {'/path/to/dynamic/producer': 'aws'}, 'https://api.akeyless.io', true, true, true, 30);

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

      core.setSecret = jest.fn(() => {});
      core.setOutput = jest.fn(() => {});
      core.exportVariable = jest.fn(() => {});
      core.info = jest.fn(() => {});

      const api = jest.fn(() => {});
      api.getDynamicSecretValue = jest.fn(() => Promise.resolve(dynamicSecret));
      akeylessApi.api = jest.fn(() => api);
      akeyless.GetDynamicSecretValue.constructFromObject = jest.fn(() => 'get_dynamic_secret_body');

      // ACT
      await secrets.exportDynamicSecrets('akeyless-token', {'/path/to/dynamic/producer': ''}, 'https://api.akeyless.io', true, true, true, 30);

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

      core.setSecret = jest.fn(() => {});
      core.setOutput = jest.fn(() => {});
      core.exportVariable = jest.fn(() => {});
      core.info = jest.fn(() => {});

      const api = jest.fn(() => {});
      api.getDynamicSecretValue = jest.fn(() => Promise.resolve(dynamicSecret));
      akeylessApi.api = jest.fn(() => api);
      akeyless.GetDynamicSecretValue.constructFromObject = jest.fn(() => 'get_dynamic_secret_body');

      // ACT
      await secrets.exportDynamicSecrets('akeyless-token', {'/path/to/dynamic/producer': 'my_token'}, 'https://api.akeyless.io', true, false, false, 30);

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

      core.setSecret = jest.fn(() => {});
      core.setOutput = jest.fn(() => {});
      core.exportVariable = jest.fn(() => {});
      core.info = jest.fn(() => {});

      const api = jest.fn(() => {});
      api.getDynamicSecretValue = jest.fn(() => Promise.resolve(dynamicSecret));
      akeylessApi.api = jest.fn(() => api);
      akeyless.GetDynamicSecretValue.constructFromObject = jest.fn(() => 'get_dynamic_secret_body');

      // ACT
      await secrets.exportDynamicSecrets('akeyless-token', {'/path/to/dynamic/producer': 'my_token'}, 'https://api.akeyless.io', false, true, false, 30);

      // ASSERT
      expect(core.setSecret).toHaveBeenCalledWith(dynamicSecret);
      expect(core.setOutput).not.toHaveBeenCalled();
      expect(core.exportVariable).toHaveBeenCalledWith('my_token', dynamicSecret);
    });

    test('export dynamic secrets - handles null response', async () => {
      // ARRANGE
      core.info = jest.fn(() => {});
      core.notice = jest.fn(() => {});

      const api = jest.fn(() => {});
      api.getDynamicSecretValue = jest.fn(() => Promise.resolve(null));
      akeylessApi.api = jest.fn(() => api);
      akeyless.GetDynamicSecretValue.constructFromObject = jest.fn(() => 'get_dynamic_secret_body');

      // ACT
      await secrets.exportDynamicSecrets('akeyless-token', {'/path/to/dynamic/producer': 'my_token'}, 'https://api.akeyless.io', true, true, false, 30);

      // ASSERT
      expect(core.notice).toHaveBeenCalledWith('Notice: /path/to/dynamic/producer was not found in Akeyless. Skipped.');
    });

    test('export dynamic secrets - handles API error', async () => {
      // ARRANGE
      core.error = jest.fn(() => {});
      core.setFailed = jest.fn(() => {});
      core.info = jest.fn(() => {});

      const api = jest.fn(() => {});
      const apiError = new Error('API error');
      api.getDynamicSecretValue = jest.fn(() => Promise.reject(apiError));
      akeylessApi.api = jest.fn(() => api);
      akeyless.GetDynamicSecretValue.constructFromObject = jest.fn(() => 'get_dynamic_secret_body');

      // ACT
      await secrets.exportDynamicSecrets('akeyless-token', {'/path/to/dynamic/producer': 'my_token'}, 'https://api.akeyless.io', true, true, false, 30);

      // ASSERT
      expect(core.error).toHaveBeenCalledWith(`getDynamicSecretValue Failed: ${JSON.stringify(apiError)}`);
      expect(core.setFailed).toHaveBeenCalledWith(`getDynamicSecretValue Failed: ${JSON.stringify(apiError)}`);
    });

    test('export dynamic secrets - handles general error', async () => {
      // ARRANGE
      core.error = jest.fn(() => {});
      core.setFailed = jest.fn(() => {});
      core.info = jest.fn(() => {});

      const api = jest.fn(() => {});
      api.getDynamicSecretValue = jest.fn(() => {
        throw new Error('General error');
      });
      akeylessApi.api = jest.fn(() => api);
      akeyless.GetDynamicSecretValue.constructFromObject = jest.fn(() => 'get_dynamic_secret_body');

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

      core.setSecret = jest.fn(() => {});
      core.setOutput = jest.fn(() => {});
      core.exportVariable = jest.fn(() => {});
      core.info = jest.fn(() => {});

      const api = jest.fn(() => {});
      api.getSecretValue = jest.fn(() => Promise.resolve(staticSecretResponse));
      akeylessApi.api = jest.fn(() => api);
      akeyless.GetSecretValue.constructFromObject = jest.fn(() => 'get_static_secret_body');

      // ACT
      await secrets.exportStaticSecrets('akeyless-token', {'/path/to/static/secret': 'my_secret'}, 'https://api.akeyless.io', true, true, 30);

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

      core.setSecret = jest.fn(() => {});
      core.setOutput = jest.fn(() => {});
      core.exportVariable = jest.fn(() => {});
      core.info = jest.fn(() => {});

      const api = jest.fn(() => {});
      api.getSecretValue = jest.fn(() => Promise.resolve(staticSecretResponse));
      akeylessApi.api = jest.fn(() => api);
      akeyless.GetSecretValue.constructFromObject = jest.fn(() => 'get_static_secret_body');

      // ACT
      await secrets.exportStaticSecrets('akeyless-token', {'/path/to/static/secret': 'my_secret'}, 'https://api.akeyless.io', true, false, 30);

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

      core.setSecret = jest.fn(() => {});
      core.setOutput = jest.fn(() => {});
      core.exportVariable = jest.fn(() => {});
      core.info = jest.fn(() => {});

      const api = jest.fn(() => {});
      api.getSecretValue = jest.fn(() => Promise.resolve(staticSecretResponse));
      akeylessApi.api = jest.fn(() => api);
      akeyless.GetSecretValue.constructFromObject = jest.fn(() => 'get_static_secret_body');

      // ACT
      await secrets.exportStaticSecrets('akeyless-token', {'/path/to/static/secret': 'my_secret'}, 'https://api.akeyless.io', false, true, 30);

      // ASSERT
      expect(core.setSecret).toHaveBeenCalledWith('super secret value');
      expect(core.setOutput).not.toHaveBeenCalled();
      expect(core.exportVariable).toHaveBeenCalledWith('my_secret', 'super secret value');
    });

    test('export static secrets - handles undefined response', async () => {
      // ARRANGE
      core.info = jest.fn(() => {});
      core.notice = jest.fn(() => {});

      const api = jest.fn(() => {});
      api.getSecretValue = jest.fn(() => Promise.resolve(undefined));
      akeylessApi.api = jest.fn(() => api);
      akeyless.GetSecretValue.constructFromObject = jest.fn(() => 'get_static_secret_body');

      // ACT
      await secrets.exportStaticSecrets('akeyless-token', {'/path/to/static/secret': 'my_secret'}, 'https://api.akeyless.io', true, true, 30);

      // ASSERT
      expect(core.notice).toHaveBeenCalledWith('Notice: /path/to/static/secret was not found in Akeyless. Skipped.');
    });

    test('export static secrets - handles API error', async () => {
      // ARRANGE
      core.error = jest.fn(() => {});
      core.setFailed = jest.fn(() => {});
      core.info = jest.fn(() => {});

      const api = jest.fn(() => {});
      const apiError = new Error('API error');
      api.getSecretValue = jest.fn(() => Promise.reject(apiError));
      akeylessApi.api = jest.fn(() => api);
      akeyless.GetSecretValue.constructFromObject = jest.fn(() => 'get_static_secret_body');

      // ACT
      await secrets.exportStaticSecrets('akeyless-token', {'/path/to/static/secret': 'my_secret'}, 'https://api.akeyless.io', true, true, 30);

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

      core.setSecret = jest.fn(() => {});
      core.setOutput = jest.fn(() => {});
      core.exportVariable = jest.fn(() => {});
      core.info = jest.fn(() => {});

      const api = jest.fn(() => {});
      api.getSecretValue = jest.fn()
        .mockResolvedValueOnce({ '/secret1': 'value1' })
        .mockResolvedValueOnce({ '/secret2': 'value2' });
      akeylessApi.api = jest.fn(() => api);
      akeyless.GetSecretValue.constructFromObject = jest.fn(() => 'get_static_secret_body');

      // ACT
      await secrets.exportStaticSecrets('akeyless-token', staticSecrets, 'https://api.akeyless.io', true, true, 30);

      // ASSERT
      expect(api.getSecretValue).toHaveBeenCalledTimes(2);
      expect(core.setOutput).toHaveBeenCalledWith('secret1_name', 'value1');
      expect(core.setOutput).toHaveBeenCalledWith('secret2_name', 'value2');
      expect(core.exportVariable).toHaveBeenCalledWith('secret1_name', 'value1');
      expect(core.exportVariable).toHaveBeenCalledWith('secret2_name', 'value2');
    });
  });
});
