jest.mock('@actions/core');
jest.mock('../src/auth');

const core = require('@actions/core');
const auth = require('../src/auth');
const input = require('../src/input');

describe('Input validation module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock the auth module to return allowed access types
    auth.allowedAccessTypes = ['jwt', 'aws_iam'];
  });

  test('valid input with all parameters', () => {
    core.getInput = jest.fn();
    core.getInput.mockReturnValueOnce('p-asdf');
    core.getInput.mockReturnValueOnce('JWT');
    core.getInput.mockReturnValueOnce('https://api.akeyless.io');
    core.getInput.mockReturnValueOnce('/path/to/aws/producer');
    core.getInput.mockReturnValueOnce('{"/some/static/secret":"secret_key"}');
    core.getInput.mockReturnValueOnce('{"/some/dynamic/secret":"other_key"}');
    core.getBooleanInput = jest.fn();
    core.getBooleanInput.mockReturnValueOnce(true);
    core.getBooleanInput.mockReturnValueOnce(true);
    core.getBooleanInput.mockReturnValueOnce(false);
    core.getInput.mockReturnValueOnce('30');

    const params = input.fetchAndValidateInput();

    expect(params).toEqual({
      accessId: 'p-asdf',
      accessType: 'jwt',
      apiUrl: 'https://api.akeyless.io',
      producerForAwsAccess: '/path/to/aws/producer',
      staticSecrets: {'/some/static/secret': 'secret_key'},
      dynamicSecrets: {'/some/dynamic/secret': 'other_key'},
      exportSecretsToOutputs: true,
      exportSecretsToEnvironment: true,
      parseDynamicSecrets: false,
      timeout: 30
    });

    expect(core.getInput.mock.calls).toEqual([
      ['access-id', {required: true}],
      ['access-type'],
      ['api-url'],
      ['producer-for-aws-access'],
      ['static-secrets'],
      ['dynamic-secrets'],
      ['timeout']
    ]);

    expect(core.getBooleanInput.mock.calls).toEqual([
      ['export-secrets-to-outputs', {default: true}],
      ['export-secrets-to-environment', {default: true}],
      ['parse-dynamic-secrets', {default: false}]
    ]);
  });

  test('valid input with minimal parameters', () => {
    core.getInput = jest.fn();
    core.getInput.mockReturnValueOnce('p-asdf');
    core.getInput.mockReturnValueOnce('jwt');
    core.getInput.mockReturnValueOnce('');
    core.getInput.mockReturnValueOnce('');
    core.getInput.mockReturnValueOnce('{}'); // Use valid empty JSON instead of empty string
    core.getInput.mockReturnValueOnce('{}'); // Use valid empty JSON instead of empty string
    core.getBooleanInput = jest.fn();
    core.getBooleanInput.mockReturnValueOnce(true);
    core.getBooleanInput.mockReturnValueOnce(true);
    core.getBooleanInput.mockReturnValueOnce(false);
    core.getInput.mockReturnValueOnce('');

    const params = input.fetchAndValidateInput();

    expect(params).toEqual({
      accessId: 'p-asdf',
      accessType: 'jwt',
      apiUrl: '',
      producerForAwsAccess: '',
      staticSecrets: {},
      dynamicSecrets: {},
      exportSecretsToOutputs: true,
      exportSecretsToEnvironment: true,
      parseDynamicSecrets: false,
      timeout: 15
    });
  });

  test('throws error when access-id is missing', () => {
    core.getInput = jest.fn();
    core.getInput.mockReturnValueOnce('');

    expect(() => {
      input.fetchAndValidateInput();
    }).toThrow('You must provide the access id for your auth method via the access-id input');
  });

  test('throws error when access-type is not a string', () => {
    core.getInput = jest.fn();
    core.getInput.mockReturnValueOnce('p-asdf');
    core.getInput.mockReturnValueOnce(343);
    core.getInput.mockReturnValue('sup');

    expect(() => {
      input.fetchAndValidateInput();
    }).toThrow("Input 'access-type' should be a string");
  });

  test('throws error for invalid access type', () => {
    core.getInput = jest.fn();
    core.getInput.mockReturnValueOnce('p-asdf');
    core.getInput.mockReturnValueOnce('invalid-type');
    core.getInput.mockReturnValueOnce('https://api.akeyless.io');
    core.getInput.mockReturnValueOnce('/path/to/aws/producer');
    core.getInput.mockReturnValueOnce('{}');
    core.getInput.mockReturnValueOnce('{}');
    core.getBooleanInput = jest.fn();
    core.getBooleanInput.mockReturnValueOnce(true);
    core.getBooleanInput.mockReturnValueOnce(true);
    core.getBooleanInput.mockReturnValueOnce(false);
    core.getInput.mockReturnValueOnce('30');

    expect(() => {
      input.fetchAndValidateInput();
    }).toThrow("access-type must be one of: ['jwt', 'aws_iam']");
  });

  test('throws error when boolean input is not boolean', () => {
    core.getInput = jest.fn();
    core.getInput.mockReturnValueOnce('p-asdf');
    core.getInput.mockReturnValueOnce('jwt');
    core.getInput.mockReturnValueOnce('');
    core.getInput.mockReturnValueOnce('');
    core.getInput.mockReturnValueOnce('');
    core.getInput.mockReturnValueOnce('');
    core.getBooleanInput = jest.fn();
    core.getBooleanInput.mockReturnValueOnce('not-a-boolean'); // Invalid boolean

    expect(() => {
      input.fetchAndValidateInput();
    }).toThrow("Input 'export-secrets-to-outputs' should be a boolean");
  });

  test('throws error for invalid JSON in static-secrets', () => {
    core.getInput = jest.fn();
    core.getInput.mockReturnValueOnce('p-asdf');
    core.getInput.mockReturnValueOnce('jwt');
    core.getInput.mockReturnValueOnce('');
    core.getInput.mockReturnValueOnce('');
    core.getInput.mockReturnValueOnce('invalid-json');
    core.getInput.mockReturnValueOnce('');
    core.getBooleanInput = jest.fn();
    core.getBooleanInput.mockReturnValueOnce(true);
    core.getBooleanInput.mockReturnValueOnce(true);
    core.getBooleanInput.mockReturnValueOnce(false);
    core.getInput.mockReturnValueOnce('30');

    expect(() => {
      input.fetchAndValidateInput();
    }).toThrow("Input 'static-secrets' did not contain valid JSON");
  });

  test('throws error for invalid JSON dictionary in dynamic-secrets', () => {
    core.getInput = jest.fn();
    core.getInput.mockReturnValueOnce('p-asdf');
    core.getInput.mockReturnValueOnce('jwt');
    core.getInput.mockReturnValueOnce('');
    core.getInput.mockReturnValueOnce('');
    core.getInput.mockReturnValueOnce('');
    core.getInput.mockReturnValueOnce('["not", "a", "dict"]'); // Array instead of object
    core.getBooleanInput = jest.fn();
    core.getBooleanInput.mockReturnValueOnce(true);
    core.getBooleanInput.mockReturnValueOnce(true);
    core.getBooleanInput.mockReturnValueOnce(false);
    core.getInput.mockReturnValueOnce('30');

    expect(() => {
      input.fetchAndValidateInput();
    }).toThrow("Input 'dynamic-secrets' did not contain a valid JSON dictionary");
  });

  test('throws error when timeout is not a number', () => {
    core.getInput = jest.fn();
    core.getInput.mockReturnValueOnce('p-asdf');
    core.getInput.mockReturnValueOnce('jwt');
    core.getInput.mockReturnValueOnce('');
    core.getInput.mockReturnValueOnce('');
    core.getInput.mockReturnValueOnce('');
    core.getInput.mockReturnValueOnce('');
    core.getBooleanInput = jest.fn();
    core.getBooleanInput.mockReturnValueOnce(true);
    core.getBooleanInput.mockReturnValueOnce(true);
    core.getBooleanInput.mockReturnValueOnce(false);
    core.getInput.mockReturnValueOnce('not-a-number');

    expect(() => {
      input.fetchAndValidateInput();
    }).toThrow("Input 'timeout' should be a number");
  });

  test('throws error when timeout is below minimum', () => {
    core.getInput = jest.fn();
    core.getInput.mockReturnValueOnce('p-asdf');
    core.getInput.mockReturnValueOnce('jwt');
    core.getInput.mockReturnValueOnce('');
    core.getInput.mockReturnValueOnce('');
    core.getInput.mockReturnValueOnce('');
    core.getInput.mockReturnValueOnce('');
    core.getBooleanInput = jest.fn();
    core.getBooleanInput.mockReturnValueOnce(true);
    core.getBooleanInput.mockReturnValueOnce(true);
    core.getBooleanInput.mockReturnValueOnce(false);
    core.getInput.mockReturnValueOnce('10'); // Below minimum of 15

    expect(() => {
      input.fetchAndValidateInput();
    }).toThrow("Input 'timeout' should be between 15 and 120");
  });

  test('throws error when timeout is above maximum', () => {
    core.getInput = jest.fn();
    core.getInput.mockReturnValueOnce('p-asdf');
    core.getInput.mockReturnValueOnce('jwt');
    core.getInput.mockReturnValueOnce('');
    core.getInput.mockReturnValueOnce('');
    core.getInput.mockReturnValueOnce('');
    core.getInput.mockReturnValueOnce('');
    core.getBooleanInput = jest.fn();
    core.getBooleanInput.mockReturnValueOnce(true);
    core.getBooleanInput.mockReturnValueOnce(true);
    core.getBooleanInput.mockReturnValueOnce(false);
    core.getInput.mockReturnValueOnce('150'); // Above maximum of 120

    expect(() => {
      input.fetchAndValidateInput();
    }).toThrow("Input 'timeout' should be between 15 and 120");
  });

  test('converts access type to lowercase', () => {
    core.getInput = jest.fn();
    core.getInput.mockReturnValueOnce('p-asdf');
    core.getInput.mockReturnValueOnce('AWS_IAM'); // Uppercase
    core.getInput.mockReturnValueOnce('');
    core.getInput.mockReturnValueOnce('');
    core.getInput.mockReturnValueOnce('');
    core.getInput.mockReturnValueOnce('');
    core.getBooleanInput = jest.fn();
    core.getBooleanInput.mockReturnValueOnce(true);
    core.getBooleanInput.mockReturnValueOnce(true);
    core.getBooleanInput.mockReturnValueOnce(false);
    core.getInput.mockReturnValueOnce('30');

    const params = input.fetchAndValidateInput();

    expect(params.accessType).toBe('aws_iam');
  });

  test('uses default timeout when empty', () => {
    core.getInput = jest.fn();
    core.getInput.mockReturnValueOnce('p-asdf');
    core.getInput.mockReturnValueOnce('jwt');
    core.getInput.mockReturnValueOnce('');
    core.getInput.mockReturnValueOnce('');
    core.getInput.mockReturnValueOnce('');
    core.getInput.mockReturnValueOnce('');
    core.getBooleanInput = jest.fn();
    core.getBooleanInput.mockReturnValueOnce(true);
    core.getBooleanInput.mockReturnValueOnce(true);
    core.getBooleanInput.mockReturnValueOnce(false);
    core.getInput.mockReturnValueOnce(''); // Empty timeout

    const params = input.fetchAndValidateInput();

    expect(params.timeout).toBe(15); // Default value
  });
});
