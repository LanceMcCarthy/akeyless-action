import {describe, test, expect, beforeEach, vi} from 'vitest';
import * as akeylessApi from '../src/akeyless_api.js';

// Mock akeyless module
vi.mock('akeyless', () => {
  const mockApiClientConstructor = vi.fn(function () {
    this.basePath = '';
  });
  const mockV2ApiConstructor = vi.fn();

  return {
    default: {
      ApiClient: mockApiClientConstructor,
      V2Api: mockV2ApiConstructor
    }
  };
});

let mockApiClientConstructor;
let mockV2ApiConstructor;

describe('AKeyless API module', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const akeyless = (await import('akeyless')).default;
    mockApiClientConstructor = akeyless.ApiClient;
    mockV2ApiConstructor = akeyless.V2Api;
  });

  test('creates API client with correct configuration', () => {
    // ARRANGE
    const mockApiClient = {
      basePath: ''
    };
    const mockV2Api = {};

    mockApiClientConstructor.mockImplementationOnce(function () {
      return mockApiClient;
    });
    mockV2ApiConstructor.mockImplementationOnce(function () {
      return mockV2Api;
    });

    // ACT
    const api = akeylessApi.api('https://api.akeyless.io');

    // ASSERT
    expect(mockApiClientConstructor).toHaveBeenCalledTimes(1);
    expect(mockV2ApiConstructor).toHaveBeenCalledWith(mockApiClient);
    expect(mockApiClient.basePath).toBe('https://api.akeyless.io');
    expect(api).toBe(mockV2Api);
  });

  test('creates API client with custom URL', () => {
    // ARRANGE
    const mockApiClient = {
      basePath: ''
    };
    const mockV2Api = {};

    mockApiClientConstructor.mockImplementationOnce(function () {
      return mockApiClient;
    });
    mockV2ApiConstructor.mockImplementationOnce(function () {
      return mockV2Api;
    });

    // ACT
    const api = akeylessApi.api('https://custom.akeyless.io');

    // ASSERT
    expect(mockApiClientConstructor).toHaveBeenCalledTimes(1);
    expect(mockV2ApiConstructor).toHaveBeenCalledWith(mockApiClient);
    expect(mockApiClient.basePath).toBe('https://custom.akeyless.io');
    expect(api).toBe(mockV2Api);
  });

  test('creates API client with empty URL', () => {
    // ARRANGE
    const mockApiClient = {
      basePath: ''
    };
    const mockV2Api = {};

    mockApiClientConstructor.mockImplementationOnce(function () {
      return mockApiClient;
    });
    mockV2ApiConstructor.mockImplementationOnce(function () {
      return mockV2Api;
    });

    // ACT
    const api = akeylessApi.api('');

    // ASSERT
    expect(mockApiClientConstructor).toHaveBeenCalledTimes(1);
    expect(mockV2ApiConstructor).toHaveBeenCalledWith(mockApiClient);
    expect(mockApiClient.basePath).toBe('');
    expect(api).toBe(mockV2Api);
  });

  test('multiple API clients can be created', () => {
    // ARRANGE
    const mockApiClient1 = {basePath: ''};
    const mockApiClient2 = {basePath: ''};
    const mockV2Api1 = {client: mockApiClient1};
    const mockV2Api2 = {client: mockApiClient2};

    mockApiClientConstructor
      .mockImplementationOnce(function () {
        return mockApiClient1;
      })
      .mockImplementationOnce(function () {
        return mockApiClient2;
      });
    mockV2ApiConstructor
      .mockImplementationOnce(function () {
        return mockV2Api1;
      })
      .mockImplementationOnce(function () {
        return mockV2Api2;
      });

    // ACT
    const api1 = akeylessApi.api('https://api1.akeyless.io');
    const api2 = akeylessApi.api('https://api2.akeyless.io');

    // ASSERT
    expect(mockApiClientConstructor).toHaveBeenCalledTimes(2);
    expect(mockV2ApiConstructor).toHaveBeenCalledTimes(2);
    expect(mockApiClient1.basePath).toBe('https://api1.akeyless.io');
    expect(mockApiClient2.basePath).toBe('https://api2.akeyless.io');
    expect(api1).toBe(mockV2Api1);
    expect(api2).toBe(mockV2Api2);
  });
});
