// Lint fix: removed @ts-nocheck
import {describe, it, expect, vi, beforeEach} from 'vitest';
import {api} from '../src/akeyless_api';
import * as akeyless from 'akeyless';

vi.mock('akeyless', () => {
  const mockApiClient = {basePath: ''};
  const mockV2Api = {};
  return {
    ApiClient: vi.fn(function () {
      return mockApiClient;
    }),
    V2Api: vi.fn(function () {
      return mockV2Api;
    })
  };
});

describe('AKeyless API module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates API client with correct configuration', () => {
    const result = api('https://api.akeyless.io');
    expect(vi.mocked(akeyless.ApiClient)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(akeyless.V2Api)).toHaveBeenCalled();
    expect(result).toBeDefined();
  });

  it('creates API client with custom URL', () => {
    const result = api('https://custom.akeyless.io');
    expect(result).toBeDefined();
  });

  it('creates API client with empty URL', () => {
    const result = api('');
    expect(result).toBeDefined();
  });

  it('multiple API clients can be created', () => {
    const result1 = api('https://api1.akeyless.io');
    const result2 = api('https://api2.akeyless.io');
    expect(result1).toBeDefined();
    expect(result2).toBeDefined();
  });
});
