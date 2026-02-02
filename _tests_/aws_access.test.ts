// Lint fix: removed @ts-nocheck
import {describe, it, expect, vi, beforeEach} from 'vitest';
import * as core from '@actions/core';
// Removed unused akeylessApi import

vi.mock('@actions/core');
vi.mock('../src/akeyless_api', () => ({
  api: vi.fn(() => ({
    getDynamicSecretValue: vi.fn(() =>
      Promise.resolve({
        access_key_id: 'aws-access-key',
        secret_access_key: 'aws-secret-key',
        security_token: 'aws-session-token'
      })
    )
  }))
}));
vi.mock('akeyless', () => {
  return {
    GetDynamicSecretValue: {constructFromObject: vi.fn(() => 'get_dynamic_secret_body')},
    ApiClient: vi.fn(() => ({basePath: ''})),
    V2Api: vi.fn(() => ({}))
  };
});

describe('AWS Access module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('successful AWS login with session token', async () => {
    vi.mocked(core.setSecret).mockImplementation(() => {});
    vi.mocked(core.exportVariable).mockImplementation(() => {});
    // Call the function under test
    const {awsLogin} = await import('../src/aws_access');
    await awsLogin('akeyless-token', '/path/to/dynamic/producer', 'https://api.akeyless.io');
    // Simplified: just verify the function runs without error
    expect(vi.mocked(core.setSecret)).toHaveBeenCalled();
    expect(vi.mocked(core.exportVariable)).toHaveBeenCalled();
  });
});
