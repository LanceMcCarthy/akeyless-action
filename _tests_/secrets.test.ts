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

  it('exportStaticSecrets exports to outputs only', async () => {
    vi.mocked(core.setSecret).mockImplementation(() => {});
    vi.mocked(core.setOutput).mockImplementation(() => {});
    vi.mocked(core.exportVariable).mockImplementation(() => {});
    vi.mocked(core.info).mockImplementation(() => {});

    await exportStaticSecrets('akeyless-token', {'/path/to/static/secret': 'my_secret'}, 'https://api.akeyless.io', true, false, 30);

    expect(vi.mocked(core.setOutput)).toHaveBeenCalled();
    expect(vi.mocked(core.exportVariable)).not.toHaveBeenCalled();
  });

  it('exportStaticSecrets exports to environment only', async () => {
    vi.mocked(core.setSecret).mockImplementation(() => {});
    vi.mocked(core.setOutput).mockImplementation(() => {});
    vi.mocked(core.exportVariable).mockImplementation(() => {});
    vi.mocked(core.info).mockImplementation(() => {});

    await exportStaticSecrets('akeyless-token', {'/path/to/static/secret': 'my_secret'}, 'https://api.akeyless.io', false, true, 30);

    expect(vi.mocked(core.exportVariable)).toHaveBeenCalled();
    expect(vi.mocked(core.setOutput)).not.toHaveBeenCalled();
  });

  it('exportStaticSecrets exports to both outputs and environment', async () => {
    vi.mocked(core.setSecret).mockImplementation(() => {});
    vi.mocked(core.setOutput).mockImplementation(() => {});
    vi.mocked(core.exportVariable).mockImplementation(() => {});
    vi.mocked(core.info).mockImplementation(() => {});

    await exportStaticSecrets('akeyless-token', {'/path/to/static/secret': 'my_secret'}, 'https://api.akeyless.io', true, true, 30);

    expect(vi.mocked(core.setOutput)).toHaveBeenCalled();
    expect(vi.mocked(core.exportVariable)).toHaveBeenCalled();
  });

  it('exportDynamicSecrets with generateSeparateOutputs true', async () => {
    vi.mocked(core.setSecret).mockImplementation(() => {});
    vi.mocked(core.setOutput).mockImplementation(() => {});
    vi.mocked(core.exportVariable).mockImplementation(() => {});
    vi.mocked(core.info).mockImplementation(() => {});

    await exportDynamicSecrets('akeyless-token', {'/path/to/dynamic/producer': 'my_secret'}, 'https://api.akeyless.io', true, true, true, 30);

    expect(vi.mocked(core.setSecret)).toHaveBeenCalled();
  });

  it('exportStaticSecrets handles empty secrets', async () => {
    vi.mocked(core.setSecret).mockImplementation(() => {});
    vi.mocked(core.setOutput).mockImplementation(() => {});
    vi.mocked(core.exportVariable).mockImplementation(() => {});
    vi.mocked(core.info).mockImplementation(() => {});

    await expect(exportStaticSecrets('akeyless-token', {}, 'https://api.akeyless.io', true, true, 30)).resolves.not.toThrow();
  });

  it('exportDynamicSecrets handles empty secrets', async () => {
    vi.mocked(core.setSecret).mockImplementation(() => {});
    vi.mocked(core.setOutput).mockImplementation(() => {});
    vi.mocked(core.exportVariable).mockImplementation(() => {});
    vi.mocked(core.info).mockImplementation(() => {});

    await expect(exportDynamicSecrets('akeyless-token', {}, 'https://api.akeyless.io', true, true, false, 30)).resolves.not.toThrow();
  });
});
