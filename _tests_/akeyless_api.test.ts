// @ts-nocheck

import { api } from '../src/akeyless_api';
import * as akeyless from 'akeyless';

// Helper to mock property getter exports for CJS modules
function mockAkeylessProperty(name: string, value: any) {
  jest.spyOn(akeyless, name, 'get').mockReturnValue(value);
}

describe('AKeyless API module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('creates API client with correct configuration', () => {
    // ARRANGE
    const mockApiClient = {
      basePath: ''
    };
    const mockV2Api = {};


    mockAkeylessProperty('ApiClient', jest.fn(() => mockApiClient));
    mockAkeylessProperty('V2Api', jest.fn(() => mockV2Api));

    // ACT
    const result = api('https://api.akeyless.io');

    // ASSERT
    expect((akeyless as any).ApiClient).toHaveBeenCalledTimes(1);
    expect((akeyless as any).V2Api).toHaveBeenCalledWith(mockApiClient);
    expect(mockApiClient.basePath).toBe('https://api.akeyless.io');
    expect(result).toBe(mockV2Api);
  });

  test('creates API client with custom URL', () => {
    // ARRANGE
    const mockApiClient = {
      basePath: ''
    };
    const mockV2Api = {};


    mockAkeylessProperty('ApiClient', jest.fn(() => mockApiClient));
    mockAkeylessProperty('V2Api', jest.fn(() => mockV2Api));

    // ACT
    const result = api('https://custom.akeyless.io');

    // ASSERT
    expect((akeyless as any).ApiClient).toHaveBeenCalledTimes(1);
    expect((akeyless as any).V2Api).toHaveBeenCalledWith(mockApiClient);
    expect(mockApiClient.basePath).toBe('https://custom.akeyless.io');
    expect(result).toBe(mockV2Api);
  });

  test('creates API client with empty URL', () => {
    // ARRANGE
    const mockApiClient = {
      basePath: ''
    };
    const mockV2Api = {};


    mockAkeylessProperty('ApiClient', jest.fn(() => mockApiClient));
    mockAkeylessProperty('V2Api', jest.fn(() => mockV2Api));

    // ACT
    const result = api('');

    // ASSERT
    expect((akeyless as any).ApiClient).toHaveBeenCalledTimes(1);
    expect((akeyless as any).V2Api).toHaveBeenCalledWith(mockApiClient);
    expect(mockApiClient.basePath).toBe('');
    expect(result).toBe(mockV2Api);
  });

  test('multiple API clients can be created', () => {
    // ARRANGE
    const mockApiClient1 = {basePath: ''};
    const mockApiClient2 = {basePath: ''};
    const mockV2Api1 = {client: mockApiClient1};
    const mockV2Api2 = {client: mockApiClient2};


    mockAkeylessProperty('ApiClient', jest.fn().mockReturnValueOnce(mockApiClient1).mockReturnValueOnce(mockApiClient2));
    mockAkeylessProperty('V2Api', jest.fn().mockReturnValueOnce(mockV2Api1).mockReturnValueOnce(mockV2Api2));

    // ACT
    const result1 = api('https://api1.akeyless.io');
    const result2 = api('https://api2.akeyless.io');

    // ASSERT
    expect((akeyless as any).ApiClient).toHaveBeenCalledTimes(2);
    expect((akeyless as any).V2Api).toHaveBeenCalledTimes(2);
    expect(mockApiClient1.basePath).toBe('https://api1.akeyless.io');
    expect(mockApiClient2.basePath).toBe('https://api2.akeyless.io');
    expect(result1).toBe(mockV2Api1);
    expect(result2).toBe(mockV2Api2);
  });
});
