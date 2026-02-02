import {describe, it, expect, vi, beforeEach} from 'vitest';
import * as core from '@actions/core';
import {exportStaticSecrets, exportDynamicSecrets} from '../src/secrets';

vi.mock('@actions/core');
vi.mock('../src/akeyless_api', () => ({
  api: vi.fn(() => ({
    getSecretValue: vi.fn(() => Promise.resolve({'/path/to/static/secret': 'super secret value'})),
    getDynamicSecretValue: vi.fn(() => Promise.resolve({access_key_id: 'aws-access-key', secret_access_key: 'aws-secret-key', session_token: 'aws-session-token'}))
  }))
}));
vi.mock('akeyless', () => ({
  GetSecretValue: {constructFromObject: vi.fn(() => 'get_static_secret_body')},
  GetDynamicSecretValue: {constructFromObject: vi.fn(() => 'get_dynamic_secret_body')},
  ApiClient: vi.fn(() => ({basePath: ''})),
  V2Api: vi.fn(() => ({}))
}));

describe('Secrets module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls exportStaticSecrets without error', async () => {
    vi.mocked(core.setSecret).mockImplementation(() => {});
    vi.mocked(core.setOutput).mockImplementation(() => {});
    vi.mocked(core.exportVariable).mockImplementation(() => {});
    vi.mocked(core.info).mockImplementation(() => {});

    await expect(exportStaticSecrets('akeyless-token', {'/path/to/static/secret': 'my_secret'}, 'https://api.akeyless.io', true, true, 30)).resolves.not.toThrow();
  });

  it('calls exportDynamicSecrets without error', async () => {
    vi.mocked(core.setSecret).mockImplementation(() => {});
    vi.mocked(core.setOutput).mockImplementation(() => {});
    vi.mocked(core.exportVariable).mockImplementation(() => {});
    vi.mocked(core.info).mockImplementation(() => {});

    await expect(exportDynamicSecrets('akeyless-token', {'/path/to/dynamic/producer': 'my_secret'}, 'https://api.akeyless.io', true, true, false, 30)).resolves.not.toThrow();
  });
});
