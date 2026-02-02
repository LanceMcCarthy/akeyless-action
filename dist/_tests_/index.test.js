import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as auth from '../src/auth';
import * as awsAccess from '../src/aws_access';
import * as secrets from '../src/secrets';
import * as input from '../src/input';
import { run } from '../src/index';
vi.mock('@actions/core');
vi.mock('../src/auth');
vi.mock('../src/aws_access');
vi.mock('../src/secrets');
vi.mock('../src/input');
describe('Main index module', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    it('calls run without error', async () => {
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
        vi.mocked(auth.akeylessLogin).mockResolvedValue({ token: 'akeyless-token-123' });
        vi.mocked(awsAccess.awsLogin).mockResolvedValue(undefined);
        vi.mocked(secrets.exportStaticSecrets).mockResolvedValue(undefined);
        vi.mocked(secrets.exportDynamicSecrets).mockResolvedValue(undefined);
        await expect(run()).resolves.not.toThrow();
    });
});
