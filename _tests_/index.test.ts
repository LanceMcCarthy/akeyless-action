import * as auth from '../src/auth';
import * as awsAccess from '../src/aws_access';
import * as secrets from '../src/secrets';
import * as input from '../src/input';
import {run} from '../src/index';

jest.mock('@actions/core');
jest.mock('../src/auth');
jest.mock('../src/aws_access');
jest.mock('../src/secrets');
jest.mock('../src/input');

describe('Main index module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('calls run without error', async () => {
    jest.spyOn(input, 'fetchAndValidateInput').mockReturnValue({
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
    jest.spyOn(auth, 'akeylessLogin').mockResolvedValue({token: 'akeyless-token-123'});
    jest.spyOn(awsAccess, 'awsLogin').mockResolvedValue(undefined);
    jest.spyOn(secrets, 'exportStaticSecrets').mockResolvedValue(undefined);
    jest.spyOn(secrets, 'exportDynamicSecrets').mockResolvedValue(undefined);

    await expect(run()).resolves.not.toThrow();
  });
});
