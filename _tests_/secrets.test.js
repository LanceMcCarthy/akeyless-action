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

      core.setSecret = vi.fn(() => {});
      core.setOutput = vi.fn(() => {});
      core.exportVariable = vi.fn(() => {});
      core.info = vi.fn(() => {});

      const api = vi.fn(() => {});
      api.getDynamicSecretValue = vi.fn(() => Promise.resolve(dynamicSecret));
      akeylessApi.api = vi.fn(() => api);
      akeyless.GetDynamicSecretValue.constructFromObject = vi.fn(() => 'get_dynamic_secret_body');

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

      core.setSecret = vi.fn(() => {});
      core.setOutput = vi.fn(() => {});
      core.exportVariable = vi.fn(() => {});
      core.info = vi.fn(() => {});

      const api = vi.fn(() => {});
      api.getDynamicSecretValue = vi.fn(() => Promise.resolve(dynamicSecret));
      akeylessApi.api = vi.fn(() => api);
      akeyless.GetDynamicSecretValue.constructFromObject = vi.fn(() => 'get_dynamic_secret_body');

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

      core.setSecret = vi.fn(() => {});
      core.setOutput = vi.fn(() => {});
      core.exportVariable = vi.fn(() => {});
      core.info = vi.fn(() => {});

      const api = vi.fn(() => {});
      api.getDynamicSecretValue = vi.fn(() => Promise.resolve(dynamicSecret));
      akeylessApi.api = vi.fn(() => api);
      akeyless.GetDynamicSecretValue.constructFromObject = vi.fn(() => 'get_dynamic_secret_body');

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

      core.setSecret = vi.fn(() => {});
      core.setOutput = vi.fn(() => {});
      core.exportVariable = vi.fn(() => {});
      core.info = vi.fn(() => {});

      const api = vi.fn(() => {});
      api.getDynamicSecretValue = vi.fn(() => Promise.resolve(dynamicSecret));
      akeylessApi.api = vi.fn(() => api);
      akeyless.GetDynamicSecretValue.constructFromObject = vi.fn(() => 'get_dynamic_secret_body');

      // ACT
      await secrets.exportDynamicSecrets('akeyless-token', {'/path/to/dynamic/producer': 'my_token'}, 'https://api.akeyless.io', false, true, false, 30);

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
      await secrets.exportDynamicSecrets('akeyless-token', {'/path/to/dynamic/producer': 'my_token'}, 'https://api.akeyless.io', true, true, false, 30);

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
      await secrets.exportDynamicSecrets('akeyless-token', {'/path/to/dynamic/producer': 'my_token'}, 'https://api.akeyless.io', true, true, false, 30);

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

      core.setSecret = vi.fn(() => {});
      core.setOutput = vi.fn(() => {});
      core.exportVariable = vi.fn(() => {});
      core.info = vi.fn(() => {});

      const api = vi.fn(() => {});
      api.getSecretValue = vi.fn(() => Promise.resolve(staticSecretResponse));
      akeylessApi.api = vi.fn(() => api);
      akeyless.GetSecretValue.constructFromObject = vi.fn(() => 'get_static_secret_body');

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

      core.setSecret = vi.fn(() => {});
      core.setOutput = vi.fn(() => {});
      core.exportVariable = vi.fn(() => {});
      core.info = vi.fn(() => {});

      const api = vi.fn(() => {});
      api.getSecretValue = vi.fn(() => Promise.resolve(staticSecretResponse));
      akeylessApi.api = vi.fn(() => api);
      akeyless.GetSecretValue.constructFromObject = vi.fn(() => 'get_static_secret_body');

      // ACT
      await secrets.exportStaticSecrets('akeyless-token', {'/path/to/static/secret': 'my_secret'}, 'https://api.akeyless.io', false, true, 30);

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
      await secrets.exportStaticSecrets('akeyless-token', {'/path/to/static/secret': 'my_secret'}, 'https://api.akeyless.io', true, true, 30);

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

      core.setSecret = vi.fn(() => {});
      core.setOutput = vi.fn(() => {});
      core.exportVariable = vi.fn(() => {});
      core.info = vi.fn(() => {});

      const api = vi.fn(() => {});
      api.getSecretValue = vi.fn().mockResolvedValueOnce({'/secret1': 'value1'}).mockResolvedValueOnce({'/secret2': 'value2'});
      akeylessApi.api = vi.fn(() => api);
      akeyless.GetSecretValue.constructFromObject = vi.fn(() => 'get_static_secret_body');

      // ACT
      await secrets.exportStaticSecrets('akeyless-token', staticSecrets, 'https://api.akeyless.io', true, true, 30);

      // ASSERT
      expect(api.getSecretValue).toHaveBeenCalledTimes(2);
      expect(core.setOutput).toHaveBeenCalledWith('secret1_name', 'value1');
      expect(core.setOutput).toHaveBeenCalledWith('secret2_name', 'value2');
      expect(core.exportVariable).toHaveBeenCalledWith('secret1_name', 'value1');
      expect(core.exportVariable).toHaveBeenCalledWith('secret2_name', 'value2');
    });

    test('export static secrets - multiline value succeeds', async () => {
      const multilineSecret = `-----BEGIN RSA PRIVATE KEY-----
8P9d61xphReeoxlOrHZLKHwri/JOiIB3/pvnTeT9gbk8lrf1wvC3CtHzS8EW+MzU
JClyiR3qPndT4JzeC9bgRCOS8qWmF8KeDtgmGkr6NcNnFELq7AFP4FxgUwY7s5Lb
NtqS8Vx4ewijN8YF3GYOg6+2+WGiqMLbMGDFjpywkqpsmB0ZGtsaW6NNxIoeJ/ni
2HiHmv1eNlj5DEt7Qxjm37iDPoArfHAIQrAQBwIDAQABAoIBAEeDe2ES9U+nQgbq
8tHKrW/erwi6V8J6m3C5JtrOfZXUpiVV5//Uz4qKWiK1woqcv/jUfallPJQqAIZj
tjmpfjbAgdRUrUa9YtvV79eGofup4H9+6fP1ZrNwHUnMw33ADbJtn99poL3emWq5
Iojzi6O3qN/FrAufLD4g7rbTB+0VMxMnLTqDiKVv0MBrfG73j2yxx0iVnh8or2PY
APEoB0K71MKH32M/WHtnQKPBzKOnO0ya9ZHVttsW3nJB8pzESDic8KuE4u7DjLVq
MIIEowIBAAKCAQEAld8l0zD5JRrMk1PXXpzGyF4I1hkFaN5i+4TPX5fwlGsbyLG3
XsfwqLWaC4JZvBploj9DWa4wceIWo6btQP0TNurKxNfk7LQFJK+N0Id2uqT0LQtV
Oks2hwKWxCSzOE7sEYQEoN+B01CHQk1MxLw79SjYYxcW9qqXTx3lPetDNQT08rfi
63XPC0ECgYEAx0HjhxwtLp5VqFMHnUG+oQSib5ByVTu2RTSo+ZAhC/z1JX5Jsq6C
20lpRekX1AU2OHqWH0NtvHveByalvX9FjLZ1Iie2yekyv+/3eZWqxnpKZYDnmjC2
uyr/DAS5qdxp+Xme6WInayz8HhN4MCb+iF3P0Ducxr+uRXHEbFnfW5UCgYEAwIz6
t9TU4UgJPQGJismqcvT9IltObWrpO/qudj/nCYXlt2QA3DCVMz03vFXyOVlfYOhA
oSBTB3BWvkViyr/YhC0JiXc8dXLjizguVsEECsr9sM/y6nyVMEovczm/YE1JUDHN
G0/vIHNlJ+jFjy+2s3V1ZNT0X+Quoowpx9jhdisCgYEAxMkZwFHffW76AacemfxY
HAXLtordn7e9J1P+nZnuSTylj0XN2x3mNlOmGFlAIzCSf+zxXibltYRPnphYj3Gm
anW38Odv6rDYYh7INdfONP6Jgv1vviPmE6s+/8ua4VrBfpTSkINTktF2nO11gXjB
YEPl/S0ihFbB8euNpcSMhpECgYAonNO4+HQaPDZunqdjFZwU+SV3HKkTHQyqsPoh
SOMzOAG2x6oCx2CA2TWrTLl1bStX5kTTd1zr4b76DOqEdyh04Ib1bqfa4euqjqP/
emCe4ifWJlZHLRXOhKczd4etCUAgYRCw5RA72PsKCue4hsjTWz/yj5QnsZpAgK3D
vwIGaaaUPr0L/NnGaiFSbzm+2VlunZp2g+Tzn9mxc6SW2egb+WRcUepVz4DrDfHM
UDRl1wKBgBWmY6RcjaF4XzJsa4WAl5YSZTR0Z+3RYJp2Z4nTH1q5RNnRLFoE1LC4
vp2PSQ3Hm+TnwqIENf5hgbbSun123Tjw8wrpM6zczcmKwUbV0h6/
-----END RSA PRIVATE KEY-----`;

      // ARRANGE
      const staticSecretResponse = {
        '/path/to/static/secret': multilineSecret
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
      await secrets.exportStaticSecrets('akeyless-token', {'/path/to/static/secret': 'my_secret'}, 'https://api.akeyless.io', true, true, 30);

      // ASSERT
      expect(api.getSecretValue).toHaveBeenCalledWith('get_static_secret_body');
      expect(akeyless.GetSecretValue.constructFromObject).toHaveBeenCalledWith({
        token: 'akeyless-token',
        names: ['/path/to/static/secret'],
        timeout: 30
      });
      expect(core.setSecret).toHaveBeenCalledWith(multilineSecret);
      expect(core.setOutput).toHaveBeenCalledWith('my_secret', multilineSecret);
      expect(core.exportVariable).toHaveBeenCalledWith('my_secret', multilineSecret);
    });
  });
});
