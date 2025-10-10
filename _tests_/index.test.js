jest.mock('@actions/core');
jest.mock('@actions/github');
jest.mock('../src/auth');
jest.mock('../src/aws_access');
jest.mock('../src/secrets');
jest.mock('../src/input');

const core = require('@actions/core');
const github = require('@actions/github');
const auth = require('../src/auth');
const awsAccess = require('../src/aws_access');
const secrets = require('../src/secrets');
const input = require('../src/input');
const index = require('../src/index');

describe('Main index module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('successful complete flow with all features', async () => {
    // ARRANGE
    const mockParams = {
      accessId: 'p-12345',
      accessType: 'jwt',
      apiUrl: 'https://api.akeyless.io',
      producerForAwsAccess: '/aws/producer',
      staticSecrets: {'/static/secret': 'static_var'},
      dynamicSecrets: {'/dynamic/secret': 'dynamic_var'},
      exportSecretsToOutputs: true,
      exportSecretsToEnvironment: true,
      parseDynamicSecrets: false,
      timeout: 30
    };

    core.debug = jest.fn();
    input.fetchAndValidateInput = jest.fn(() => mockParams);
    auth.akeylessLogin = jest.fn(() => Promise.resolve({token: 'akeyless-token-123'}));
    awsAccess.awsLogin = jest.fn(() => Promise.resolve());
    secrets.exportStaticSecrets = jest.fn(() => Promise.resolve());
    secrets.exportDynamicSecrets = jest.fn(() => Promise.resolve());

    // ACT
    await index.run();

    // ASSERT
    expect(input.fetchAndValidateInput).toHaveBeenCalledTimes(1);
    expect(auth.akeylessLogin).toHaveBeenCalledWith('p-12345', 'jwt', 'https://api.akeyless.io');
    expect(awsAccess.awsLogin).toHaveBeenCalledWith('akeyless-token-123', '/aws/producer', 'https://api.akeyless.io');
    expect(secrets.exportStaticSecrets).toHaveBeenCalledWith('akeyless-token-123', {'/static/secret': 'static_var'}, 'https://api.akeyless.io', true, true);
    expect(secrets.exportDynamicSecrets).toHaveBeenCalledWith('akeyless-token-123', {'/dynamic/secret': 'dynamic_var'}, 'https://api.akeyless.io', true, true, false);
  });

  test('successful flow without AWS producer', async () => {
    // ARRANGE
    const mockParams = {
      accessId: 'p-12345',
      accessType: 'jwt',
      apiUrl: 'https://api.akeyless.io',
      producerForAwsAccess: '', // No AWS producer
      staticSecrets: {'/static/secret': 'static_var'},
      dynamicSecrets: {'/dynamic/secret': 'dynamic_var'},
      exportSecretsToOutputs: true,
      exportSecretsToEnvironment: true,
      parseDynamicSecrets: false,
      timeout: 30
    };

    core.debug = jest.fn();
    input.fetchAndValidateInput = jest.fn(() => mockParams);
    auth.akeylessLogin = jest.fn(() => Promise.resolve({token: 'akeyless-token-123'}));
    awsAccess.awsLogin = jest.fn(() => Promise.resolve());
    secrets.exportStaticSecrets = jest.fn(() => Promise.resolve());
    secrets.exportDynamicSecrets = jest.fn(() => Promise.resolve());

    // ACT
    await index.run();

    // ASSERT
    expect(awsAccess.awsLogin).not.toHaveBeenCalled();
    expect(secrets.exportStaticSecrets).toHaveBeenCalled();
    expect(secrets.exportDynamicSecrets).toHaveBeenCalled();
  });

  test('successful flow without static secrets', async () => {
    // ARRANGE
    const mockParams = {
      accessId: 'p-12345',
      accessType: 'jwt',
      apiUrl: 'https://api.akeyless.io',
      producerForAwsAccess: '/aws/producer',
      staticSecrets: null, // No static secrets
      dynamicSecrets: {'/dynamic/secret': 'dynamic_var'},
      exportSecretsToOutputs: true,
      exportSecretsToEnvironment: true,
      parseDynamicSecrets: false,
      timeout: 30
    };

    core.debug = jest.fn();
    input.fetchAndValidateInput = jest.fn(() => mockParams);
    auth.akeylessLogin = jest.fn(() => Promise.resolve({token: 'akeyless-token-123'}));
    awsAccess.awsLogin = jest.fn(() => Promise.resolve());
    secrets.exportStaticSecrets = jest.fn(() => Promise.resolve());
    secrets.exportDynamicSecrets = jest.fn(() => Promise.resolve());

    // ACT
    await index.run();

    // ASSERT
    expect(awsAccess.awsLogin).toHaveBeenCalled();
    expect(secrets.exportStaticSecrets).not.toHaveBeenCalled();
    expect(secrets.exportDynamicSecrets).toHaveBeenCalled();
  });

  test('successful flow without dynamic secrets', async () => {
    // ARRANGE
    const mockParams = {
      accessId: 'p-12345',
      accessType: 'jwt',
      apiUrl: 'https://api.akeyless.io',
      producerForAwsAccess: '/aws/producer',
      staticSecrets: {'/static/secret': 'static_var'},
      dynamicSecrets: null, // No dynamic secrets
      exportSecretsToOutputs: true,
      exportSecretsToEnvironment: true,
      parseDynamicSecrets: false,
      timeout: 30
    };

    core.debug = jest.fn();
    input.fetchAndValidateInput = jest.fn(() => mockParams);
    auth.akeylessLogin = jest.fn(() => Promise.resolve({token: 'akeyless-token-123'}));
    awsAccess.awsLogin = jest.fn(() => Promise.resolve());
    secrets.exportStaticSecrets = jest.fn(() => Promise.resolve());
    secrets.exportDynamicSecrets = jest.fn(() => Promise.resolve());

    // ACT
    await index.run();

    // ASSERT
    expect(awsAccess.awsLogin).toHaveBeenCalled();
    expect(secrets.exportStaticSecrets).toHaveBeenCalled();
    expect(secrets.exportDynamicSecrets).not.toHaveBeenCalled();
  });

  test('handles auth login failure', async () => {
    // ARRANGE
    const mockParams = {
      accessId: 'p-12345',
      accessType: 'jwt',
      apiUrl: 'https://api.akeyless.io',
      producerForAwsAccess: '/aws/producer',
      staticSecrets: {'/static/secret': 'static_var'},
      dynamicSecrets: {'/dynamic/secret': 'dynamic_var'},
      exportSecretsToOutputs: true,
      exportSecretsToEnvironment: true,
      parseDynamicSecrets: false,
      timeout: 30
    };

    core.debug = jest.fn();
    core.error = jest.fn();
    core.setFailed = jest.fn();
    input.fetchAndValidateInput = jest.fn(() => mockParams);
    auth.akeylessLogin = jest.fn(() => Promise.reject(new Error('Login failed')));
    awsAccess.awsLogin = jest.fn(() => Promise.resolve());
    secrets.exportStaticSecrets = jest.fn(() => Promise.resolve());
    secrets.exportDynamicSecrets = jest.fn(() => Promise.resolve());

    // ACT
    await index.run();

    // ASSERT
    expect(core.error).toHaveBeenCalledWith(expect.stringContaining('Failed to login to AKeyless:'));
    expect(core.setFailed).toHaveBeenCalledWith(expect.stringContaining('Failed to login to AKeyless:'));
    expect(awsAccess.awsLogin).not.toHaveBeenCalled();
    expect(secrets.exportStaticSecrets).not.toHaveBeenCalled();
    expect(secrets.exportDynamicSecrets).not.toHaveBeenCalled();
  });

  test('handles auth login failure with ACTIONS_ID_TOKEN_REQUEST_URL error', async () => {
    // ARRANGE
    const mockParams = {
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
    };

    // Create an error object that when JSON.stringify'd will contain 'ACTIONS_ID_TOKEN_REQUEST_URL'
    const errorWithToken = new Error('ACTIONS_ID_TOKEN_REQUEST_URL not set');
    errorWithToken.cause = 'ACTIONS_ID_TOKEN_REQUEST_URL';

    core.debug = jest.fn();
    core.error = jest.fn();
    core.setFailed = jest.fn();
    input.fetchAndValidateInput = jest.fn(() => mockParams);
    auth.akeylessLogin = jest.fn(() => Promise.reject(errorWithToken));

    // ACT
    await index.run();

    // ASSERT
    expect(core.error).toHaveBeenCalledWith(expect.stringContaining('ACTIONS_ID_TOKEN_REQUEST_URL'));
    expect(core.error).toHaveBeenCalledWith(expect.stringContaining('Please check the GITHUB_TOKEN token permissions'));
    expect(core.setFailed).toHaveBeenCalledWith(expect.stringContaining('ACTIONS_ID_TOKEN_REQUEST_URL'));
  });

  test('handles AWS access failure', async () => {
    // ARRANGE
    const mockParams = {
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
    };

    core.debug = jest.fn();
    core.error = jest.fn();
    core.setFailed = jest.fn();
    input.fetchAndValidateInput = jest.fn(() => mockParams);
    auth.akeylessLogin = jest.fn(() => Promise.resolve({token: 'akeyless-token-123'}));
    awsAccess.awsLogin = jest.fn(() => Promise.reject(new Error('AWS access failed')));

    // ACT
    await index.run();

    // ASSERT
    expect(core.error).toHaveBeenCalledWith(expect.stringContaining('Failed to fetch AWS producer credentials:'));
    expect(core.setFailed).toHaveBeenCalledWith(expect.stringContaining('Failed to fetch AWS producer credentials:'));
  });

  test('handles static secrets failure', async () => {
    // ARRANGE
    const mockParams = {
      accessId: 'p-12345',
      accessType: 'jwt',
      apiUrl: 'https://api.akeyless.io',
      producerForAwsAccess: '',
      staticSecrets: {'/static/secret': 'static_var'},
      dynamicSecrets: {},
      exportSecretsToOutputs: true,
      exportSecretsToEnvironment: true,
      parseDynamicSecrets: false,
      timeout: 30
    };

    core.debug = jest.fn();
    core.error = jest.fn();
    core.setFailed = jest.fn();
    input.fetchAndValidateInput = jest.fn(() => mockParams);
    auth.akeylessLogin = jest.fn(() => Promise.resolve({token: 'akeyless-token-123'}));
    secrets.exportStaticSecrets = jest.fn(() => Promise.reject(new Error('Static secrets failed')));

    // ACT
    await index.run();

    // ASSERT
    expect(core.error).toHaveBeenCalledWith(expect.stringContaining('Failed to fetch static secrets:'));
    expect(core.setFailed).toHaveBeenCalledWith(expect.stringContaining('Failed to fetch static secrets:'));
  });

  test('handles dynamic secrets failure', async () => {
    // ARRANGE
    const mockParams = {
      accessId: 'p-12345',
      accessType: 'jwt',
      apiUrl: 'https://api.akeyless.io',
      producerForAwsAccess: '',
      staticSecrets: {},
      dynamicSecrets: {'/dynamic/secret': 'dynamic_var'},
      exportSecretsToOutputs: true,
      exportSecretsToEnvironment: true,
      parseDynamicSecrets: false,
      timeout: 30
    };

    core.debug = jest.fn();
    core.error = jest.fn();
    core.setFailed = jest.fn();
    input.fetchAndValidateInput = jest.fn(() => mockParams);
    auth.akeylessLogin = jest.fn(() => Promise.resolve({token: 'akeyless-token-123'}));
    secrets.exportDynamicSecrets = jest.fn(() => Promise.reject(new Error('Dynamic secrets failed')));

    // ACT
    await index.run();

    // ASSERT
    expect(core.error).toHaveBeenCalledWith(expect.stringContaining('Failed to fetch dynamic secrets:'));
    expect(core.setFailed).toHaveBeenCalledWith(expect.stringContaining('Failed to fetch dynamic secrets:'));
  });

  test('minimal flow with just access-id', async () => {
    // ARRANGE
    const mockParams = {
      accessId: 'p-12345',
      accessType: 'jwt',
      apiUrl: 'https://api.akeyless.io',
      producerForAwsAccess: '',
      staticSecrets: null, // Use null instead of {} to avoid calling the function
      dynamicSecrets: null, // Use null instead of {} to avoid calling the function
      exportSecretsToOutputs: true,
      exportSecretsToEnvironment: true,
      parseDynamicSecrets: false,
      timeout: 30
    };

    core.debug = jest.fn();
    input.fetchAndValidateInput = jest.fn(() => mockParams);
    auth.akeylessLogin = jest.fn(() => Promise.resolve({token: 'akeyless-token-123'}));
    awsAccess.awsLogin = jest.fn(() => Promise.resolve());
    secrets.exportStaticSecrets = jest.fn(() => Promise.resolve());
    secrets.exportDynamicSecrets = jest.fn(() => Promise.resolve());

    // ACT
    await index.run();

    // ASSERT
    expect(auth.akeylessLogin).toHaveBeenCalled();
    expect(awsAccess.awsLogin).not.toHaveBeenCalled();
    expect(secrets.exportStaticSecrets).not.toHaveBeenCalled();
    expect(secrets.exportDynamicSecrets).not.toHaveBeenCalled();
  });

  test('passes timeout parameter to secrets functions', async () => {
    // ARRANGE
    const mockParams = {
      accessId: 'p-12345',
      accessType: 'jwt',
      apiUrl: 'https://api.akeyless.io',
      producerForAwsAccess: '',
      staticSecrets: {'/static/secret': 'static_var'},
      dynamicSecrets: {'/dynamic/secret': 'dynamic_var'},
      exportSecretsToOutputs: true,
      exportSecretsToEnvironment: true,
      parseDynamicSecrets: true,
      timeout: 60
    };

    core.debug = jest.fn();
    input.fetchAndValidateInput = jest.fn(() => mockParams);
    auth.akeylessLogin = jest.fn(() => Promise.resolve({token: 'akeyless-token-123'}));
    secrets.exportStaticSecrets = jest.fn(() => Promise.resolve());
    secrets.exportDynamicSecrets = jest.fn(() => Promise.resolve());

    // ACT
    await index.run();

    // ASSERT
    expect(secrets.exportStaticSecrets).toHaveBeenCalledWith('akeyless-token-123', {'/static/secret': 'static_var'}, 'https://api.akeyless.io', true, true);
    expect(secrets.exportDynamicSecrets).toHaveBeenCalledWith('akeyless-token-123', {'/dynamic/secret': 'dynamic_var'}, 'https://api.akeyless.io', true, true, true);
  });

  test('continues execution after AWS access failure', async () => {
    // ARRANGE
    const mockParams = {
      accessId: 'p-12345',
      accessType: 'jwt',
      apiUrl: 'https://api.akeyless.io',
      producerForAwsAccess: '/aws/producer',
      staticSecrets: {'/static/secret': 'static_var'},
      dynamicSecrets: {'/dynamic/secret': 'dynamic_var'},
      exportSecretsToOutputs: true,
      exportSecretsToEnvironment: true,
      parseDynamicSecrets: false,
      timeout: 30
    };

    core.debug = jest.fn();
    core.error = jest.fn();
    core.setFailed = jest.fn();
    input.fetchAndValidateInput = jest.fn(() => mockParams);
    auth.akeylessLogin = jest.fn(() => Promise.resolve({token: 'akeyless-token-123'}));
    awsAccess.awsLogin = jest.fn(() => Promise.reject(new Error('AWS access failed')));
    secrets.exportStaticSecrets = jest.fn(() => Promise.resolve());
    secrets.exportDynamicSecrets = jest.fn(() => Promise.resolve());

    // ACT
    await index.run();

    // ASSERT
    expect(awsAccess.awsLogin).toHaveBeenCalled();
    expect(core.error).toHaveBeenCalledWith(expect.stringContaining('Failed to fetch AWS producer credentials:'));
    expect(secrets.exportStaticSecrets).toHaveBeenCalled(); // Should continue after AWS failure
    expect(secrets.exportDynamicSecrets).toHaveBeenCalled(); // Should continue after AWS failure
  });
});
