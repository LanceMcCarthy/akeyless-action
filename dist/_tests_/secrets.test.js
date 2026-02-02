import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as core from '@actions/core';
import { exportStaticSecrets, exportDynamicSecrets } from '../src/secrets';
vi.mock('@actions/core');
vi.mock('../src/akeyless_api');
vi.mock('akeyless', () => ({
    GetSecretValue: { constructFromObject: vi.fn(() => 'get_static_secret_body') },
    GetDynamicSecretValue: { constructFromObject: vi.fn(() => 'get_dynamic_secret_body') },
    ApiClient: vi.fn(() => ({ basePath: '' })),
    V2Api: vi.fn(() => ({}))
}));
describe('Secrets module', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    describe('exportStaticSecrets', () => {
        it('calls exportStaticSecrets without error', async () => {
            const { api } = await import('../src/akeyless_api');
            vi.mocked(api).mockReturnValue({
                getSecretValue: vi.fn().mockResolvedValue('secret_value')
            });
            vi.mocked(core.setSecret).mockImplementation(() => { });
            vi.mocked(core.setOutput).mockImplementation(() => { });
            vi.mocked(core.exportVariable).mockImplementation(() => { });
            vi.mocked(core.info).mockImplementation(() => { });
            await expect(exportStaticSecrets('akeyless-token', { '/path/to/static/secret': 'my_secret' }, 'https://api.akeyless.io', true, true, 30)).resolves.not.toThrow();
        });
        it('exports static secrets to outputs only', async () => {
            const { api } = await import('../src/akeyless_api');
            vi.mocked(api).mockReturnValue({
                getSecretValue: vi.fn().mockResolvedValue('secret_value')
            });
            vi.mocked(core.setSecret).mockImplementation(() => { });
            vi.mocked(core.setOutput).mockImplementation(() => { });
            vi.mocked(core.exportVariable).mockImplementation(() => { });
            vi.mocked(core.info).mockImplementation(() => { });
            await exportStaticSecrets('akeyless-token', { '/path/to/static/secret': 'my_secret' }, 'https://api.akeyless.io', true, false, 30);
            expect(vi.mocked(core.setOutput)).toHaveBeenCalled();
            expect(vi.mocked(core.exportVariable)).not.toHaveBeenCalled();
        });
        it('exports static secrets to environment only', async () => {
            const { api } = await import('../src/akeyless_api');
            vi.mocked(api).mockReturnValue({
                getSecretValue: vi.fn().mockResolvedValue('secret_value')
            });
            vi.mocked(core.setSecret).mockImplementation(() => { });
            vi.mocked(core.setOutput).mockImplementation(() => { });
            vi.mocked(core.exportVariable).mockImplementation(() => { });
            vi.mocked(core.info).mockImplementation(() => { });
            await exportStaticSecrets('akeyless-token', { '/path/to/static/secret': 'my_secret' }, 'https://api.akeyless.io', false, true, 30);
            expect(vi.mocked(core.exportVariable)).toHaveBeenCalled();
            expect(vi.mocked(core.setOutput)).not.toHaveBeenCalled();
        });
        it('exports static secrets to both outputs and environment', async () => {
            const { api } = await import('../src/akeyless_api');
            vi.mocked(api).mockReturnValue({
                getSecretValue: vi.fn().mockResolvedValue('secret_value')
            });
            vi.mocked(core.setSecret).mockImplementation(() => { });
            vi.mocked(core.setOutput).mockImplementation(() => { });
            vi.mocked(core.exportVariable).mockImplementation(() => { });
            vi.mocked(core.info).mockImplementation(() => { });
            await exportStaticSecrets('akeyless-token', { '/path/to/static/secret': 'my_secret' }, 'https://api.akeyless.io', true, true, 30);
            expect(vi.mocked(core.setOutput)).toHaveBeenCalled();
            expect(vi.mocked(core.exportVariable)).toHaveBeenCalled();
        });
        it('handles multiple static secrets', async () => {
            const { api } = await import('../src/akeyless_api');
            vi.mocked(api).mockReturnValue({
                getSecretValue: vi.fn().mockResolvedValue('secret_value')
            });
            vi.mocked(core.setSecret).mockImplementation(() => { });
            vi.mocked(core.setOutput).mockImplementation(() => { });
            vi.mocked(core.exportVariable).mockImplementation(() => { });
            vi.mocked(core.info).mockImplementation(() => { });
            const secrets = {
                '/secret/one': 'secret_one',
                '/secret/two': 'secret_two',
                '/secret/three': 'secret_three'
            };
            await exportStaticSecrets('akeyless-token', secrets, 'https://api.akeyless.io', true, true, 30);
            expect(vi.mocked(core.setSecret)).toHaveBeenCalledTimes(3);
            expect(vi.mocked(core.setOutput)).toHaveBeenCalledTimes(3);
        });
        it('handles empty static secrets dictionary', async () => {
            const { api } = await import('../src/akeyless_api');
            vi.mocked(api).mockReturnValue({
                getSecretValue: vi.fn().mockResolvedValue('secret_value')
            });
            vi.mocked(core.setSecret).mockImplementation(() => { });
            vi.mocked(core.setOutput).mockImplementation(() => { });
            vi.mocked(core.info).mockImplementation(() => { });
            await expect(exportStaticSecrets('akeyless-token', {}, 'https://api.akeyless.io', true, true, 30)).resolves.not.toThrow();
            expect(vi.mocked(core.setSecret)).not.toHaveBeenCalled();
        });
        it('handles API error when fetching static secrets', async () => {
            vi.mocked(core.error).mockImplementation(() => { });
            vi.mocked(core.setFailed).mockImplementation(() => { });
            vi.mocked(core.info).mockImplementation(() => { });
            // Mock the api to reject
            const { api: mockApi } = await import('../src/akeyless_api');
            vi.mocked(mockApi).mockReturnValue({
                getSecretValue: vi.fn().mockRejectedValue(new Error('API Error'))
            });
            await exportStaticSecrets('akeyless-token', { '/path/to/static/secret': 'my_secret' }, 'https://api.akeyless.io', true, true, 30);
            expect(vi.mocked(core.setFailed)).toHaveBeenCalled();
        });
    });
    describe('exportDynamicSecrets', () => {
        it('calls exportDynamicSecrets without error', async () => {
            const { api } = await import('../src/akeyless_api');
            vi.mocked(api).mockReturnValue({
                getDynamicSecretValue: vi.fn().mockResolvedValue({ access_key_id: 'test' })
            });
            vi.mocked(core.setSecret).mockImplementation(() => { });
            vi.mocked(core.setOutput).mockImplementation(() => { });
            vi.mocked(core.exportVariable).mockImplementation(() => { });
            vi.mocked(core.info).mockImplementation(() => { });
            await expect(exportDynamicSecrets('akeyless-token', { '/path/to/dynamic/producer': 'my_secret' }, 'https://api.akeyless.io', true, true, false, 30)).resolves.not.toThrow();
        });
        it('exports dynamic secrets with generateSeparateOutputs false to outputs and env', async () => {
            const { api } = await import('../src/akeyless_api');
            vi.mocked(api).mockReturnValue({
                getDynamicSecretValue: vi.fn().mockResolvedValue({ access_key_id: 'test_key' })
            });
            vi.mocked(core.setSecret).mockImplementation(() => { });
            vi.mocked(core.setOutput).mockImplementation(() => { });
            vi.mocked(core.exportVariable).mockImplementation(() => { });
            vi.mocked(core.info).mockImplementation(() => { });
            await exportDynamicSecrets('akeyless-token', { '/path/to/dynamic/producer': 'my_secret' }, 'https://api.akeyless.io', true, true, false, 30);
            expect(vi.mocked(core.setSecret)).toHaveBeenCalled();
            expect(vi.mocked(core.setOutput)).toHaveBeenCalled();
            expect(vi.mocked(core.exportVariable)).toHaveBeenCalled();
        });
        it('exports dynamic secrets with generateSeparateOutputs true', async () => {
            const { api } = await import('../src/akeyless_api');
            vi.mocked(api).mockReturnValue({
                getDynamicSecretValue: vi.fn().mockResolvedValue({ username: 'user', password: 'pass' })
            });
            vi.mocked(core.setSecret).mockImplementation(() => { });
            vi.mocked(core.setOutput).mockImplementation(() => { });
            vi.mocked(core.exportVariable).mockImplementation(() => { });
            vi.mocked(core.info).mockImplementation(() => { });
            await exportDynamicSecrets('akeyless-token', { '/path/to/dynamic/producer': 'my_secret' }, 'https://api.akeyless.io', true, true, true, 30);
            expect(vi.mocked(core.setSecret)).toHaveBeenCalled();
            expect(vi.mocked(core.info)).toHaveBeenCalledWith(expect.stringContaining('Successfully exported'));
        });
        it('exports to outputs only (generateSeparateOutputs false)', async () => {
            const { api } = await import('../src/akeyless_api');
            vi.mocked(api).mockReturnValue({
                getDynamicSecretValue: vi.fn().mockResolvedValue({ access_key_id: 'test' })
            });
            vi.mocked(core.setSecret).mockImplementation(() => { });
            vi.mocked(core.setOutput).mockImplementation(() => { });
            vi.mocked(core.exportVariable).mockImplementation(() => { });
            vi.mocked(core.info).mockImplementation(() => { });
            await exportDynamicSecrets('akeyless-token', { '/path/to/dynamic/producer': 'my_secret' }, 'https://api.akeyless.io', true, false, false, 30);
            expect(vi.mocked(core.setOutput)).toHaveBeenCalled();
            expect(vi.mocked(core.exportVariable)).not.toHaveBeenCalled();
        });
        it('exports to environment only (generateSeparateOutputs false)', async () => {
            const { api } = await import('../src/akeyless_api');
            vi.mocked(api).mockReturnValue({
                getDynamicSecretValue: vi.fn().mockResolvedValue({ access_key_id: 'test' })
            });
            vi.mocked(core.setSecret).mockImplementation(() => { });
            vi.mocked(core.setOutput).mockImplementation(() => { });
            vi.mocked(core.exportVariable).mockImplementation(() => { });
            vi.mocked(core.info).mockImplementation(() => { });
            await exportDynamicSecrets('akeyless-token', { '/path/to/dynamic/producer': 'my_secret' }, 'https://api.akeyless.io', false, true, false, 30);
            expect(vi.mocked(core.exportVariable)).toHaveBeenCalled();
            expect(vi.mocked(core.setOutput)).not.toHaveBeenCalled();
        });
        it('exports to outputs only (generateSeparateOutputs true)', async () => {
            const { api } = await import('../src/akeyless_api');
            vi.mocked(api).mockReturnValue({
                getDynamicSecretValue: vi.fn().mockResolvedValue({ username: 'user', password: 'pass' })
            });
            vi.mocked(core.setSecret).mockImplementation(() => { });
            vi.mocked(core.setOutput).mockImplementation(() => { });
            vi.mocked(core.exportVariable).mockImplementation(() => { });
            vi.mocked(core.info).mockImplementation(() => { });
            await exportDynamicSecrets('akeyless-token', { '/path/to/dynamic/producer': 'my_secret' }, 'https://api.akeyless.io', true, false, true, 30);
            expect(vi.mocked(core.setOutput)).toHaveBeenCalled();
            expect(vi.mocked(core.exportVariable)).not.toHaveBeenCalled();
        });
        it('exports to environment only (generateSeparateOutputs true)', async () => {
            const { api } = await import('../src/akeyless_api');
            vi.mocked(api).mockReturnValue({
                getDynamicSecretValue: vi.fn().mockResolvedValue({ username: 'user', password: 'pass' })
            });
            vi.mocked(core.setSecret).mockImplementation(() => { });
            vi.mocked(core.setOutput).mockImplementation(() => { });
            vi.mocked(core.exportVariable).mockImplementation(() => { });
            vi.mocked(core.info).mockImplementation(() => { });
            await exportDynamicSecrets('akeyless-token', { '/path/to/dynamic/producer': 'my_secret' }, 'https://api.akeyless.io', false, true, true, 30);
            expect(vi.mocked(core.exportVariable)).toHaveBeenCalled();
            expect(vi.mocked(core.setOutput)).not.toHaveBeenCalled();
        });
        it('handles empty dynamic secrets dictionary', async () => {
            const { api } = await import('../src/akeyless_api');
            vi.mocked(api).mockReturnValue({
                getDynamicSecretValue: vi.fn().mockResolvedValue({ access_key_id: 'test' })
            });
            vi.mocked(core.setSecret).mockImplementation(() => { });
            vi.mocked(core.info).mockImplementation(() => { });
            await expect(exportDynamicSecrets('akeyless-token', {}, 'https://api.akeyless.io', true, true, false, 30)).resolves.not.toThrow();
            expect(vi.mocked(core.setSecret)).not.toHaveBeenCalled();
        });
        it('handles multiple dynamic secrets', async () => {
            const { api } = await import('../src/akeyless_api');
            vi.mocked(api).mockReturnValue({
                getDynamicSecretValue: vi.fn().mockResolvedValue({ access_key_id: 'test' })
            });
            vi.mocked(core.setSecret).mockImplementation(() => { });
            vi.mocked(core.setOutput).mockImplementation(() => { });
            vi.mocked(core.exportVariable).mockImplementation(() => { });
            vi.mocked(core.info).mockImplementation(() => { });
            const secrets = {
                '/producer/one': 'secret_one',
                '/producer/two': 'secret_two'
            };
            await exportDynamicSecrets('akeyless-token', secrets, 'https://api.akeyless.io', true, true, false, 30);
            // setSecret should be called for each secret value (once per secret when generateSeparateOutputs=false)
            expect(vi.mocked(core.setSecret)).toHaveBeenCalled();
            expect(vi.mocked(core.setOutput)).toHaveBeenCalledTimes(2);
        });
        it('handles undefined API response for dynamic secrets', async () => {
            const { api } = await import('../src/akeyless_api');
            vi.mocked(api).mockReturnValue({
                getDynamicSecretValue: vi.fn().mockResolvedValue(undefined)
            });
            vi.mocked(core.info).mockImplementation(() => { });
            vi.mocked(core.notice).mockImplementation(() => { });
            await exportDynamicSecrets('akeyless-token', { '/path/to/dynamic/producer': 'my_secret' }, 'https://api.akeyless.io', true, true, false, 30);
            expect(vi.mocked(core.notice)).toHaveBeenCalled();
        });
        it('handles null API response for dynamic secrets', async () => {
            const { api } = await import('../src/akeyless_api');
            vi.mocked(api).mockReturnValue({
                getDynamicSecretValue: vi.fn().mockResolvedValue(null)
            });
            vi.mocked(core.info).mockImplementation(() => { });
            vi.mocked(core.notice).mockImplementation(() => { });
            await exportDynamicSecrets('akeyless-token', { '/path/to/dynamic/producer': 'my_secret' }, 'https://api.akeyless.io', true, true, false, 30);
            expect(vi.mocked(core.notice)).toHaveBeenCalled();
        });
        it('handles API error when fetching dynamic secrets', async () => {
            const { api } = await import('../src/akeyless_api');
            vi.mocked(api).mockReturnValue({
                getDynamicSecretValue: vi.fn().mockRejectedValue(new Error('API Error'))
            });
            vi.mocked(core.error).mockImplementation(() => { });
            vi.mocked(core.setFailed).mockImplementation(() => { });
            vi.mocked(core.info).mockImplementation(() => { });
            await exportDynamicSecrets('akeyless-token', { '/path/to/dynamic/producer': 'my_secret' }, 'https://api.akeyless.io', true, true, false, 30);
            expect(vi.mocked(core.setFailed)).toHaveBeenCalled();
        });
        it('handles nested object in dynamic secret with generateSeparateOutputs true', async () => {
            const { api } = await import('../src/akeyless_api');
            vi.mocked(api).mockReturnValue({
                getDynamicSecretValue: vi.fn().mockResolvedValue({
                    user: 'john',
                    pass: 'secret123',
                    host: 'db.example.com'
                })
            });
            vi.mocked(core.setSecret).mockImplementation(() => { });
            vi.mocked(core.setOutput).mockImplementation(() => { });
            vi.mocked(core.info).mockImplementation(() => { });
            await exportDynamicSecrets('akeyless-token', { '/db/producer': 'db_creds' }, 'https://api.akeyless.io', true, false, true, 30);
            expect(vi.mocked(core.setSecret)).toHaveBeenCalledTimes(3);
            expect(vi.mocked(core.setOutput)).toHaveBeenCalledTimes(3);
        });
        it('handles empty variableName with generateSeparateOutputs true', async () => {
            const { api } = await import('../src/akeyless_api');
            vi.mocked(api).mockReturnValue({
                getDynamicSecretValue: vi.fn().mockResolvedValue({
                    access_key: 'AKIA...',
                    secret_key: 'secret...'
                })
            });
            vi.mocked(core.setSecret).mockImplementation(() => { });
            vi.mocked(core.setOutput).mockImplementation(() => { });
            vi.mocked(core.info).mockImplementation(() => { });
            await exportDynamicSecrets('akeyless-token', { '/aws/producer': '' }, 'https://api.akeyless.io', true, true, true, 30);
            expect(vi.mocked(core.setOutput)).toHaveBeenCalledTimes(2);
            expect(vi.mocked(core.info)).toHaveBeenCalledWith(expect.stringContaining('Successfully exported'));
        });
        it('handles catch block when getDynamicSecretValue.catch returns undefined', async () => {
            const { api } = await import('../src/akeyless_api');
            vi.mocked(api).mockReturnValue({
                getDynamicSecretValue: vi.fn().mockReturnValue({
                    catch: vi.fn().mockResolvedValue(undefined)
                })
            });
            vi.mocked(core.info).mockImplementation(() => { });
            vi.mocked(core.notice).mockImplementation(() => { });
            vi.mocked(core.error).mockImplementation(() => { });
            await exportDynamicSecrets('akeyless-token', { '/path/to/dynamic/producer': 'my_secret' }, 'https://api.akeyless.io', true, true, false, 30);
            expect(vi.mocked(core.notice)).toHaveBeenCalled();
        });
        it('handles exception thrown during dynamic secret processing', async () => {
            const { api } = await import('../src/akeyless_api');
            vi.mocked(api).mockReturnValue({
                getDynamicSecretValue: vi.fn().mockImplementation(() => {
                    throw new Error('Unexpected error during processing');
                })
            });
            vi.mocked(core.error).mockImplementation(() => { });
            vi.mocked(core.setFailed).mockImplementation(() => { });
            vi.mocked(core.info).mockImplementation(() => { });
            await exportDynamicSecrets('akeyless-token', { '/path/to/dynamic/producer': 'my_secret' }, 'https://api.akeyless.io', true, true, false, 30);
            expect(vi.mocked(core.error)).toHaveBeenCalledWith(expect.stringContaining('Failed to export dynamic secrets'));
            expect(vi.mocked(core.setFailed)).toHaveBeenCalledWith(expect.stringContaining('Failed to export dynamic secrets'));
        });
    });
});
