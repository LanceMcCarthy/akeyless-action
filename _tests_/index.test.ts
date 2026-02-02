import {describe, it, expect, vi, beforeEach} from 'vitest';
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
});
