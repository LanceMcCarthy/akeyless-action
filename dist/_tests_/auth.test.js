import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as core from '@actions/core';
import * as auth from '../src/auth';
vi.mock('@actions/core');
vi.mock('../src/akeyless_api');
vi.mock('akeyless', () => ({
    Auth: {
        constructFromObject: vi.fn(obj => obj)
    }
}));
describe('Authentication module', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    it('exports allowed access types', () => {
        expect(auth.allowedAccessTypes).toEqual(['jwt', 'aws_iam']);
    });
    it('has akeylessLogin function', () => {
        expect(typeof auth.akeylessLogin).toBe('function');
    });
    describe('akeylessLogin', () => {
        it('calls jwtLogin for jwt access type', async () => {
            const { api } = await import('../src/akeyless_api');
            const mockAuth = vi.fn().mockResolvedValue({ token: 'jwt-token-123' });
            vi.mocked(api).mockReturnValue({
                auth: mockAuth
            });
            vi.mocked(core.getIDToken).mockResolvedValue('github-jwt-token');
            vi.mocked(core.debug).mockImplementation(() => { });
            const result = await auth.akeylessLogin('p-12345', 'jwt', 'https://api.akeyless.io');
            expect(result).toEqual({ token: 'jwt-token-123' });
            expect(vi.mocked(core.getIDToken)).toHaveBeenCalled();
            expect(mockAuth).toHaveBeenCalledWith({
                'access-type': 'jwt',
                'access-id': 'p-12345',
                jwt: 'github-jwt-token'
            });
        });
        it('handles jwt login when getIDToken fails', async () => {
            vi.mocked(core.getIDToken).mockRejectedValue(new Error('Failed to get OIDC token'));
            vi.mocked(core.debug).mockImplementation(() => { });
            vi.mocked(core.setFailed).mockImplementation(() => { });
            await expect(auth.akeylessLogin('p-12345', 'jwt', 'https://api.akeyless.io')).rejects.toThrow('Failed to fetch Github JWT');
            expect(vi.mocked(core.setFailed)).toHaveBeenCalledWith(expect.stringContaining('Failed to fetch Github JWT'));
        });
        it('handles jwt login when akeyless auth fails', async () => {
            const { api } = await import('../src/akeyless_api');
            const mockAuth = vi.fn().mockRejectedValue(new Error('Invalid credentials'));
            vi.mocked(api).mockReturnValue({
                auth: mockAuth
            });
            vi.mocked(core.getIDToken).mockResolvedValue('github-jwt-token');
            vi.mocked(core.debug).mockImplementation(() => { });
            vi.mocked(core.setFailed).mockImplementation(() => { });
            await expect(auth.akeylessLogin('p-12345', 'jwt', 'https://api.akeyless.io')).rejects.toThrow('Failed to login to AKeyless: Invalid credentials');
            expect(mockAuth).toHaveBeenCalled();
            expect(vi.mocked(core.setFailed)).toHaveBeenCalledWith('Failed to login to AKeyless: Invalid credentials');
        });
        it('handles non-Error objects thrown during jwt login', async () => {
            vi.mocked(core.getIDToken).mockRejectedValue('String error');
            vi.mocked(core.debug).mockImplementation(() => { });
            vi.mocked(core.setFailed).mockImplementation(() => { });
            await expect(auth.akeylessLogin('p-12345', 'jwt', 'https://api.akeyless.io')).rejects.toThrow('Failed to fetch Github JWT');
        });
        it('handles top-level errors in akeylessLogin with Error object', async () => {
            const { api } = await import('../src/akeyless_api');
            vi.mocked(api).mockImplementation(() => {
                throw new Error('API initialization failed');
            });
            vi.mocked(core.debug).mockImplementation(() => { });
            vi.mocked(core.setFailed).mockImplementation(() => { });
            await expect(auth.akeylessLogin('p-12345', 'jwt', 'https://api.akeyless.io')).rejects.toThrow('API initialization failed');
        });
        it('handles top-level errors in akeylessLogin with non-Error object', async () => {
            const { api } = await import('../src/akeyless_api');
            vi.mocked(api).mockImplementation(() => {
                throw 'Non-error object';
            });
            vi.mocked(core.debug).mockImplementation(() => { });
            vi.mocked(core.setFailed).mockImplementation(() => { });
            await expect(auth.akeylessLogin('p-12345', 'jwt', 'https://api.akeyless.io')).rejects.toThrow('Non-error object');
        });
        it('logs debug messages during jwt login', async () => {
            const { api } = await import('../src/akeyless_api');
            const mockAuth = vi.fn().mockResolvedValue({ token: 'jwt-token-123' });
            vi.mocked(api).mockReturnValue({
                auth: mockAuth
            });
            vi.mocked(core.getIDToken).mockResolvedValue('github-jwt-token');
            vi.mocked(core.debug).mockImplementation(() => { });
            await auth.akeylessLogin('p-12345', 'jwt', 'https://api.akeyless.io');
            expect(vi.mocked(core.debug)).toHaveBeenCalledWith('fetch token');
            expect(vi.mocked(core.debug)).toHaveBeenCalledWith('https://api.akeyless.io');
            expect(vi.mocked(core.debug)).toHaveBeenCalledWith('Fetching JWT from Github');
            expect(vi.mocked(core.debug)).toHaveBeenCalledWith('Fetching token from AKeyless');
        });
        it('handles auth API failure with non-Error object', async () => {
            const { api } = await import('../src/akeyless_api');
            const mockAuth = vi.fn().mockRejectedValue('API is down');
            vi.mocked(api).mockReturnValue({
                auth: mockAuth
            });
            vi.mocked(core.getIDToken).mockResolvedValue('github-jwt-token');
            vi.mocked(core.debug).mockImplementation(() => { });
            vi.mocked(core.setFailed).mockImplementation(() => { });
            await expect(auth.akeylessLogin('p-12345', 'jwt', 'https://api.akeyless.io')).rejects.toThrow('Failed to login to AKeyless: API is down');
            expect(mockAuth).toHaveBeenCalled();
            expect(vi.mocked(core.setFailed)).toHaveBeenCalledWith('Failed to login to AKeyless: API is down');
        });
    });
});
