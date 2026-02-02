// Lint fix: removed @ts-nocheck
import { api } from '../src/akeyless_api';
import * as akeyless from 'akeyless';
jest.mock('akeyless', () => {
    const actual = jest.requireActual('akeyless');
    return {
        ...actual,
        ApiClient: jest.fn(() => ({ basePath: '' })),
        V2Api: jest.fn(() => ({}))
    };
});
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
        akeyless.ApiClient.mockImplementation(() => mockApiClient);
        akeyless.V2Api.mockImplementation(() => mockV2Api);
        // ACT
        const result = api('https://api.akeyless.io');
        // ASSERT
        expect(akeyless.ApiClient).toHaveBeenCalledTimes(1);
        expect(akeyless.V2Api).toHaveBeenCalledWith(mockApiClient);
        expect(mockApiClient.basePath).toBe('https://api.akeyless.io');
        expect(result).toBe(mockV2Api);
    });
    test('creates API client with custom URL', () => {
        // ARRANGE
        const mockApiClient = {
            basePath: ''
        };
        const mockV2Api = {};
        akeyless.ApiClient.mockImplementation(() => mockApiClient);
        akeyless.V2Api.mockImplementation(() => mockV2Api);
        // ACT
        const result = api('https://custom.akeyless.io');
        // ASSERT
        expect(akeyless.ApiClient).toHaveBeenCalledTimes(1);
        expect(akeyless.V2Api).toHaveBeenCalledWith(mockApiClient);
        expect(mockApiClient.basePath).toBe('https://custom.akeyless.io');
        expect(result).toBe(mockV2Api);
    });
    test('creates API client with empty URL', () => {
        // ARRANGE
        const mockApiClient = {
            basePath: ''
        };
        const mockV2Api = {};
        akeyless.ApiClient.mockImplementation(() => mockApiClient);
        akeyless.V2Api.mockImplementation(() => mockV2Api);
        // ACT
        const result = api('');
        // ASSERT
        expect(akeyless.ApiClient).toHaveBeenCalledTimes(1);
        expect(akeyless.V2Api).toHaveBeenCalledWith(mockApiClient);
        expect(mockApiClient.basePath).toBe('');
        expect(result).toBe(mockV2Api);
    });
    test('multiple API clients can be created', () => {
        // ARRANGE
        const mockApiClient1 = { basePath: '' };
        const mockApiClient2 = { basePath: '' };
        const mockV2Api1 = { client: mockApiClient1 };
        const mockV2Api2 = { client: mockApiClient2 };
        akeyless.ApiClient.mockImplementationOnce(() => mockApiClient1).mockImplementationOnce(() => mockApiClient2);
        akeyless.V2Api.mockImplementationOnce(() => mockV2Api1).mockImplementationOnce(() => mockV2Api2);
        // ACT
        const result1 = api('https://api1.akeyless.io');
        const result2 = api('https://api2.akeyless.io');
        // ASSERT
        expect(akeyless.ApiClient).toHaveBeenCalledTimes(2);
        expect(akeyless.V2Api).toHaveBeenCalledTimes(2);
        expect(mockApiClient1.basePath).toBe('https://api1.akeyless.io');
        expect(mockApiClient2.basePath).toBe('https://api2.akeyless.io');
        expect(result1).toBe(mockV2Api1);
        expect(result2).toBe(mockV2Api2);
    });
});
