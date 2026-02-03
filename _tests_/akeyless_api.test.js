jest.mock('akeyless');

const akeyless = require('akeyless');
const akeylessApi = require('../src/akeyless_api');

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

    akeyless.ApiClient = jest.fn(() => mockApiClient);
    akeyless.V2Api = jest.fn(() => mockV2Api);

    // ACT
    const api = akeylessApi.api('https://api.akeyless.io');

    // ASSERT
    expect(akeyless.ApiClient).toHaveBeenCalledTimes(1);
    expect(akeyless.V2Api).toHaveBeenCalledWith(mockApiClient);
    expect(mockApiClient.basePath).toBe('https://api.akeyless.io');
    expect(api).toBe(mockV2Api);
  });

  test('creates API client with custom URL', () => {
    // ARRANGE
    const mockApiClient = {
      basePath: ''
    };
    const mockV2Api = {};

    akeyless.ApiClient = jest.fn(() => mockApiClient);
    akeyless.V2Api = jest.fn(() => mockV2Api);

    // ACT
    const api = akeylessApi.api('https://custom.akeyless.io');

    // ASSERT
    expect(akeyless.ApiClient).toHaveBeenCalledTimes(1);
    expect(akeyless.V2Api).toHaveBeenCalledWith(mockApiClient);
    expect(mockApiClient.basePath).toBe('https://custom.akeyless.io');
    expect(api).toBe(mockV2Api);
  });

  test('creates API client with empty URL', () => {
    // ARRANGE
    const mockApiClient = {
      basePath: ''
    };
    const mockV2Api = {};

    akeyless.ApiClient = jest.fn(() => mockApiClient);
    akeyless.V2Api = jest.fn(() => mockV2Api);

    // ACT
    const api = akeylessApi.api('');

    // ASSERT
    expect(akeyless.ApiClient).toHaveBeenCalledTimes(1);
    expect(akeyless.V2Api).toHaveBeenCalledWith(mockApiClient);
    expect(mockApiClient.basePath).toBe('');
    expect(api).toBe(mockV2Api);
  });

  test('multiple API clients can be created', () => {
    // ARRANGE
    const mockApiClient1 = {basePath: ''};
    const mockApiClient2 = {basePath: ''};
    const mockV2Api1 = {client: mockApiClient1};
    const mockV2Api2 = {client: mockApiClient2};

    akeyless.ApiClient = jest.fn().mockReturnValueOnce(mockApiClient1).mockReturnValueOnce(mockApiClient2);
    akeyless.V2Api = jest.fn().mockReturnValueOnce(mockV2Api1).mockReturnValueOnce(mockV2Api2);

    // ACT
    const api1 = akeylessApi.api('https://api1.akeyless.io');
    const api2 = akeylessApi.api('https://api2.akeyless.io');

    // ASSERT
    expect(akeyless.ApiClient).toHaveBeenCalledTimes(2);
    expect(akeyless.V2Api).toHaveBeenCalledTimes(2);
    expect(mockApiClient1.basePath).toBe('https://api1.akeyless.io');
    expect(mockApiClient2.basePath).toBe('https://api2.akeyless.io');
    expect(api1).toBe(mockV2Api1);
    expect(api2).toBe(mockV2Api2);
  });
});
