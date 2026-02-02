// Lint fix: removed @ts-nocheck
import * as core from '@actions/core';
// Removed unused akeylessApi import
import * as akeyless from 'akeyless';
jest.mock('@actions/core');
jest.mock('../src/akeyless_api', () => ({
    api: jest.fn(() => ({
        getDynamicSecretValue: jest.fn(() => Promise.resolve({
            access_key_id: 'aws-access-key',
            secret_access_key: 'aws-secret-key',
            security_token: 'aws-session-token'
        }))
    }))
}));
jest.mock('akeyless', () => {
    return {
        GetDynamicSecretValue: { constructFromObject: jest.fn(() => 'get_dynamic_secret_body') },
        ApiClient: jest.fn(() => ({ basePath: '' })),
        V2Api: jest.fn(() => ({}))
    };
});
describe('AWS Access module', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    test('successful AWS login with session token', async () => {
        jest.spyOn(core, 'setSecret').mockImplementation(() => { });
        jest.spyOn(core, 'exportVariable').mockImplementation(() => { });
        // Call the function under test
        const { awsLogin } = await import('../src/aws_access');
        await awsLogin('akeyless-token', '/path/to/dynamic/producer', 'https://api.akeyless.io');
        // Get the actual mock instance used
        const { api } = await import('../src/akeyless_api');
        const apiClientInstance = api.mock.results[0].value;
        expect(apiClientInstance.getDynamicSecretValue).toHaveBeenCalledWith('get_dynamic_secret_body');
        expect(akeyless.GetDynamicSecretValue.constructFromObject).toHaveBeenCalledWith({
            token: 'akeyless-token',
            name: '/path/to/dynamic/producer'
        });
        expect(jest.mocked(core.setSecret).mock.calls).toEqual([['aws-access-key'], ['aws-secret-key'], ['aws-session-token']]);
        expect(jest.mocked(core.exportVariable).mock.calls).toEqual([
            ['AWS_ACCESS_KEY_ID', 'aws-access-key'],
            ['AWS_SECRET_ACCESS_KEY', 'aws-secret-key'],
            ['AWS_SESSION_TOKEN', 'aws-session-token']
        ]);
    });
    // ...other cases...
});
