import {describe, it, expect, vi, beforeEach} from 'vitest';
import * as core from '@actions/core';
import * as auth from '../src/auth';
import * as awsAccess from '../src/aws_access';
import * as secrets from '../src/secrets';
import * as input from '../src/input';
import {run} from '../src/index';

vi.mock('@actions/core');
vi.mock('../src/auth');
vi.mock('../src/aws_access');
vi.mock('../src/secrets');
vi.mock('../src/input');

describe('Main index module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls run without error with all steps', async () => {
    vi.mocked(input.fetchAndValidateInput).mockReturnValue({
      accessId: 'p-12345',
      accessType: 'jwt',
      apiUrl: 'https://api.akeyless.io',
      producerForAwsAccess: '/aws/producer',
      staticSecrets: {'/static/secret': 'secret_var'},
      dynamicSecrets: {'/dynamic/producer': 'dynamic_var'},
      exportSecretsToOutputs: true,
      exportSecretsToEnvironment: true,
      parseDynamicSecrets: false,
      timeout: 30
    });
    vi.mocked(auth.akeylessLogin).mockResolvedValue({token: 'akeyless-token-123'});
    vi.mocked(awsAccess.awsLogin).mockResolvedValue(undefined);
    vi.mocked(secrets.exportStaticSecrets).mockResolvedValue(undefined);
    vi.mocked(secrets.exportDynamicSecrets).mockResolvedValue(undefined);

    await expect(run()).resolves.not.toThrow();

    expect(vi.mocked(auth.akeylessLogin)).toHaveBeenCalledWith('p-12345', 'jwt', 'https://api.akeyless.io');
    expect(vi.mocked(awsAccess.awsLogin)).toHaveBeenCalledWith('akeyless-token-123', '/aws/producer', 'https://api.akeyless.io');
    expect(vi.mocked(secrets.exportStaticSecrets)).toHaveBeenCalled();
    expect(vi.mocked(secrets.exportDynamicSecrets)).toHaveBeenCalled();
  });

  it('skips AWS access when producerForAwsAccess is empty', async () => {
    vi.mocked(input.fetchAndValidateInput).mockReturnValue({
      accessId: 'p-12345',
      accessType: 'jwt',
      apiUrl: 'https://api.akeyless.io',
      producerForAwsAccess: '',
      staticSecrets: {},
      dynamicSecrets: {},
      exportSecretsToOutputs: true,
      exportSecretsToEnvironment: true,
      parseDynamicSecrets: false,
      timeout: 30
    });
    vi.mocked(auth.akeylessLogin).mockResolvedValue({token: 'akeyless-token-123'});

    await expect(run()).resolves.not.toThrow();

    expect(vi.mocked(awsAccess.awsLogin)).not.toHaveBeenCalled();
  });

  it('skips static secrets when not specified', async () => {
    vi.mocked(input.fetchAndValidateInput).mockReturnValue({
      accessId: 'p-12345',
      accessType: 'jwt',
      apiUrl: 'https://api.akeyless.io',
      producerForAwsAccess: '',
      staticSecrets: '',
      dynamicSecrets: {},
      exportSecretsToOutputs: true,
      exportSecretsToEnvironment: true,
      parseDynamicSecrets: false,
      timeout: 30
    } as unknown as ReturnType<typeof input.fetchAndValidateInput>);
    vi.mocked(auth.akeylessLogin).mockResolvedValue({token: 'akeyless-token-123'});

    await expect(run()).resolves.not.toThrow();

    expect(vi.mocked(secrets.exportStaticSecrets)).not.toHaveBeenCalled();
  });

  it('skips dynamic secrets when not specified', async () => {
    vi.mocked(input.fetchAndValidateInput).mockReturnValue({
      accessId: 'p-12345',
      accessType: 'jwt',
      apiUrl: 'https://api.akeyless.io',
      producerForAwsAccess: '',
      staticSecrets: {},
      dynamicSecrets: '',
      exportSecretsToOutputs: true,
      exportSecretsToEnvironment: true,
      parseDynamicSecrets: false,
      timeout: 30
    } as unknown as ReturnType<typeof input.fetchAndValidateInput>);
    vi.mocked(auth.akeylessLogin).mockResolvedValue({token: 'akeyless-token-123'});

    await expect(run()).resolves.not.toThrow();

    expect(vi.mocked(secrets.exportDynamicSecrets)).not.toHaveBeenCalled();
  });

  it('handles akeylessLogin failure gracefully', async () => {
    vi.mocked(input.fetchAndValidateInput).mockReturnValue({
      accessId: 'p-12345',
      accessType: 'jwt',
      apiUrl: 'https://api.akeyless.io',
      producerForAwsAccess: '',
      staticSecrets: {},
      dynamicSecrets: {},
      exportSecretsToOutputs: true,
      exportSecretsToEnvironment: true,
      parseDynamicSecrets: false,
      timeout: 30
    });
    vi.mocked(auth.akeylessLogin).mockRejectedValue(new Error('Login failed'));

    await run();

    // Test that it doesn't throw and handles the error
    expect(vi.mocked(input.fetchAndValidateInput)).toHaveBeenCalled();
  });

  it('handles AWS access failure gracefully', async () => {
    vi.mocked(input.fetchAndValidateInput).mockReturnValue({
      accessId: 'p-12345',
      accessType: 'jwt',
      apiUrl: 'https://api.akeyless.io',
      producerForAwsAccess: '/aws/producer',
      staticSecrets: {},
      dynamicSecrets: {},
      exportSecretsToOutputs: true,
      exportSecretsToEnvironment: true,
      parseDynamicSecrets: false,
      timeout: 30
    });
    vi.mocked(auth.akeylessLogin).mockResolvedValue({token: 'akeyless-token-123'});
    vi.mocked(awsAccess.awsLogin).mockRejectedValue(new Error('AWS failed'));

    await run();

    expect(vi.mocked(auth.akeylessLogin)).toHaveBeenCalled();
  });

  it('handles static secrets failure gracefully', async () => {
    vi.mocked(input.fetchAndValidateInput).mockReturnValue({
      accessId: 'p-12345',
      accessType: 'jwt',
      apiUrl: 'https://api.akeyless.io',
      producerForAwsAccess: '',
      staticSecrets: {'/static/secret': 'secret_var'},
      dynamicSecrets: {},
      exportSecretsToOutputs: true,
      exportSecretsToEnvironment: true,
      parseDynamicSecrets: false,
      timeout: 30
    });
    vi.mocked(auth.akeylessLogin).mockResolvedValue({token: 'akeyless-token-123'});
    vi.mocked(secrets.exportStaticSecrets).mockRejectedValue(new Error('Static secrets failed'));

    await run();

    expect(vi.mocked(secrets.exportStaticSecrets)).toHaveBeenCalled();
  });

  it('handles dynamic secrets failure gracefully', async () => {
    vi.mocked(input.fetchAndValidateInput).mockReturnValue({
      accessId: 'p-12345',
      accessType: 'jwt',
      apiUrl: 'https://api.akeyless.io',
      producerForAwsAccess: '',
      staticSecrets: {},
      dynamicSecrets: {'/dynamic/producer': 'dynamic_var'},
      exportSecretsToOutputs: true,
      exportSecretsToEnvironment: true,
      parseDynamicSecrets: false,
      timeout: 30
    });
    vi.mocked(auth.akeylessLogin).mockResolvedValue({token: 'akeyless-token-123'});
    vi.mocked(secrets.exportDynamicSecrets).mockRejectedValue(new Error('Dynamic secrets failed'));

    await run();

    expect(vi.mocked(secrets.exportDynamicSecrets)).toHaveBeenCalled();
  });

  it('handles parseDynamicSecrets true', async () => {
    vi.mocked(input.fetchAndValidateInput).mockReturnValue({
      accessId: 'p-12345',
      accessType: 'jwt',
      apiUrl: 'https://api.akeyless.io',
      producerForAwsAccess: '',
      staticSecrets: {},
      dynamicSecrets: {'/dynamic/producer': 'dynamic_var'},
      exportSecretsToOutputs: true,
      exportSecretsToEnvironment: true,
      parseDynamicSecrets: true,
      timeout: 30
    });
    vi.mocked(auth.akeylessLogin).mockResolvedValue({token: 'akeyless-token-123'});
    vi.mocked(secrets.exportDynamicSecrets).mockResolvedValue(undefined);

    await expect(run()).resolves.not.toThrow();

    expect(vi.mocked(secrets.exportDynamicSecrets)).toHaveBeenCalledWith(
      'akeyless-token-123',
      {'/dynamic/producer': 'dynamic_var'},
      'https://api.akeyless.io',
      true,
      true,
      true,
      30
    );
  });

  it('handles multiple static and dynamic secrets together', async () => {
    vi.mocked(input.fetchAndValidateInput).mockReturnValue({
      accessId: 'p-12345',
      accessType: 'jwt',
      apiUrl: 'https://api.akeyless.io',
      producerForAwsAccess: '/aws/producer',
      staticSecrets: {
        '/static/one': 'VAR_ONE',
        '/static/two': 'VAR_TWO'
      },
      dynamicSecrets: {
        '/dynamic/one': 'DYN_ONE',
        '/dynamic/two': 'DYN_TWO'
      },
      exportSecretsToOutputs: true,
      exportSecretsToEnvironment: false,
      parseDynamicSecrets: false,
      timeout: 45
    });
    vi.mocked(auth.akeylessLogin).mockResolvedValue({token: 'akeyless-token-123'});
    vi.mocked(awsAccess.awsLogin).mockResolvedValue(undefined);
    vi.mocked(secrets.exportStaticSecrets).mockResolvedValue(undefined);
    vi.mocked(secrets.exportDynamicSecrets).mockResolvedValue(undefined);

    await expect(run()).resolves.not.toThrow();

    expect(vi.mocked(awsAccess.awsLogin)).toHaveBeenCalledWith('akeyless-token-123', '/aws/producer', 'https://api.akeyless.io');
    expect(vi.mocked(secrets.exportStaticSecrets)).toHaveBeenCalledWith(
      'akeyless-token-123',
      {'/static/one': 'VAR_ONE', '/static/two': 'VAR_TWO'},
      'https://api.akeyless.io',
      true,
      false,
      45
    );
    expect(vi.mocked(secrets.exportDynamicSecrets)).toHaveBeenCalledWith(
      'akeyless-token-123',
      {'/dynamic/one': 'DYN_ONE', '/dynamic/two': 'DYN_TWO'},
      'https://api.akeyless.io',
      true,
      false,
      false,
      45
    );
  });

  it('handles debug logging throughout execution', async () => {
    vi.mocked(input.fetchAndValidateInput).mockReturnValue({
      accessId: 'p-12345',
      accessType: 'jwt',
      apiUrl: 'https://api.akeyless.io',
      producerForAwsAccess: '',
      staticSecrets: {},
      dynamicSecrets: {},
      exportSecretsToOutputs: true,
      exportSecretsToEnvironment: true,
      parseDynamicSecrets: false,
      timeout: 30
    });
    vi.mocked(auth.akeylessLogin).mockResolvedValue({token: 'akeyless-token-123'});
    vi.mocked(core.info).mockImplementation(() => {});
    vi.mocked(core.debug).mockImplementation(() => {});

    await expect(run()).resolves.not.toThrow();

    expect(vi.mocked(core.info)).toHaveBeenCalledWith(expect.stringContaining('[DEBUG]'));
  });

  it('parses stringified static secrets during execution', async () => {
    vi.mocked(input.fetchAndValidateInput).mockReturnValue({
      accessId: 'p-12345',
      accessType: 'jwt',
      apiUrl: 'https://api.akeyless.io',
      producerForAwsAccess: '',
      staticSecrets: '{"path": "VAR"}',
      dynamicSecrets: {},
      exportSecretsToOutputs: true,
      exportSecretsToEnvironment: true,
      parseDynamicSecrets: false,
      timeout: 30
    } as unknown as ReturnType<typeof input.fetchAndValidateInput>);
    vi.mocked(auth.akeylessLogin).mockResolvedValue({token: 'akeyless-token-123'});
    vi.mocked(secrets.exportStaticSecrets).mockResolvedValue(undefined);

    await expect(run()).resolves.not.toThrow();

    expect(vi.mocked(secrets.exportStaticSecrets)).toHaveBeenCalledWith('akeyless-token-123', {path: 'VAR'}, 'https://api.akeyless.io', true, true, 30);
  });

  it('parses stringified dynamic secrets during execution', async () => {
    vi.mocked(input.fetchAndValidateInput).mockReturnValue({
      accessId: 'p-12345',
      accessType: 'jwt',
      apiUrl: 'https://api.akeyless.io',
      producerForAwsAccess: '',
      staticSecrets: {},
      dynamicSecrets: '{"producer": "DVAR"}',
      exportSecretsToOutputs: true,
      exportSecretsToEnvironment: true,
      parseDynamicSecrets: false,
      timeout: 30
    } as unknown as ReturnType<typeof input.fetchAndValidateInput>);
    vi.mocked(auth.akeylessLogin).mockResolvedValue({token: 'akeyless-token-123'});
    vi.mocked(secrets.exportDynamicSecrets).mockResolvedValue(undefined);

    await expect(run()).resolves.not.toThrow();

    expect(vi.mocked(secrets.exportDynamicSecrets)).toHaveBeenCalledWith('akeyless-token-123', {producer: 'DVAR'}, 'https://api.akeyless.io', true, true, false, 30);
  });

  it('handles all export boolean combinations (true, true)', async () => {
    vi.mocked(input.fetchAndValidateInput).mockReturnValue({
      accessId: 'p-12345',
      accessType: 'jwt',
      apiUrl: 'https://api.akeyless.io',
      producerForAwsAccess: '',
      staticSecrets: {'/static': 'VAR'},
      dynamicSecrets: {},
      exportSecretsToOutputs: true,
      exportSecretsToEnvironment: true,
      parseDynamicSecrets: false,
      timeout: 30
    });
    vi.mocked(auth.akeylessLogin).mockResolvedValue({token: 'akeyless-token-123'});
    vi.mocked(secrets.exportStaticSecrets).mockResolvedValue(undefined);

    await expect(run()).resolves.not.toThrow();

    expect(vi.mocked(secrets.exportStaticSecrets)).toHaveBeenCalledWith('akeyless-token-123', {'/static': 'VAR'}, 'https://api.akeyless.io', true, true, 30);
  });

  it('handles all export boolean combinations (true, false)', async () => {
    vi.mocked(input.fetchAndValidateInput).mockReturnValue({
      accessId: 'p-12345',
      accessType: 'jwt',
      apiUrl: 'https://api.akeyless.io',
      producerForAwsAccess: '',
      staticSecrets: {'/static': 'VAR'},
      dynamicSecrets: {},
      exportSecretsToOutputs: true,
      exportSecretsToEnvironment: false,
      parseDynamicSecrets: false,
      timeout: 30
    });
    vi.mocked(auth.akeylessLogin).mockResolvedValue({token: 'akeyless-token-123'});
    vi.mocked(secrets.exportStaticSecrets).mockResolvedValue(undefined);

    await expect(run()).resolves.not.toThrow();

    expect(vi.mocked(secrets.exportStaticSecrets)).toHaveBeenCalledWith('akeyless-token-123', {'/static': 'VAR'}, 'https://api.akeyless.io', true, false, 30);
  });

  it('handles all export boolean combinations (false, true)', async () => {
    vi.mocked(input.fetchAndValidateInput).mockReturnValue({
      accessId: 'p-12345',
      accessType: 'jwt',
      apiUrl: 'https://api.akeyless.io',
      producerForAwsAccess: '',
      staticSecrets: {'/static': 'VAR'},
      dynamicSecrets: {},
      exportSecretsToOutputs: false,
      exportSecretsToEnvironment: true,
      parseDynamicSecrets: false,
      timeout: 30
    });
    vi.mocked(auth.akeylessLogin).mockResolvedValue({token: 'akeyless-token-123'});
    vi.mocked(secrets.exportStaticSecrets).mockResolvedValue(undefined);

    await expect(run()).resolves.not.toThrow();

    expect(vi.mocked(secrets.exportStaticSecrets)).toHaveBeenCalledWith('akeyless-token-123', {'/static': 'VAR'}, 'https://api.akeyless.io', false, true, 30);
  });

  it('handles all export boolean combinations (false, false)', async () => {
    vi.mocked(input.fetchAndValidateInput).mockReturnValue({
      accessId: 'p-12345',
      accessType: 'jwt',
      apiUrl: 'https://api.akeyless.io',
      producerForAwsAccess: '',
      staticSecrets: {'/static': 'VAR'},
      dynamicSecrets: {},
      exportSecretsToOutputs: false,
      exportSecretsToEnvironment: false,
      parseDynamicSecrets: false,
      timeout: 30
    });
    vi.mocked(auth.akeylessLogin).mockResolvedValue({token: 'akeyless-token-123'});
    vi.mocked(secrets.exportStaticSecrets).mockResolvedValue(undefined);

    await expect(run()).resolves.not.toThrow();

    expect(vi.mocked(secrets.exportStaticSecrets)).toHaveBeenCalledWith('akeyless-token-123', {'/static': 'VAR'}, 'https://api.akeyless.io', false, false, 30);
  });
});
