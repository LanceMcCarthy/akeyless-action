import {describe, it, expect, vi, beforeEach} from 'vitest';
import * as core from '@actions/core';
import {fetchAndValidateInput} from '../src/input';

vi.mock('@actions/core');
vi.mock('../src/auth', () => ({
  allowedAccessTypes: ['jwt', 'aws_iam']
}));

describe('Input validation module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('valid input with all parameters', () => {
    vi.mocked(core.getInput).mockImplementation((name: string) => {
      switch (name) {
        case 'access-id':
          return 'p-asdf';
        case 'access-type':
          return 'JWT';
        case 'api-url':
          return 'https://api.akeyless.io';
        case 'producer-for-aws-access':
          return '/path/to/aws/producer';
        case 'static-secrets':
          return '{"/some/static/secret":"secret_key"}';
        case 'dynamic-secrets':
          return '{"/some/dynamic/secret":"other_key"}';
        case 'timeout':
          return '30';
        default:
          return '';
      }
    });
    vi.mocked(core.getBooleanInput).mockImplementation((name: string) => {
      switch (name) {
        case 'export-secrets-to-outputs':
          return true;
        case 'export-secrets-to-environment':
          return true;
        case 'parse-dynamic-secrets':
          return false;
        default:
          return false;
      }
    });

    const params = fetchAndValidateInput();
    expect(params).toBeDefined();
    expect(params.accessId).toBe('p-asdf');
    expect(params.accessType).toBe('jwt');
  });

  it('throws error when access-id is missing', () => {
    vi.mocked(core.getInput).mockImplementation((name: string) => {
      if (name === 'access-id') return '';
      return '';
    });
    vi.mocked(core.getBooleanInput).mockReturnValue(false);

    expect(() => fetchAndValidateInput()).toThrow('You must provide the access id');
  });

  it('throws error for invalid access-type', () => {
    vi.mocked(core.getInput).mockImplementation((name: string) => {
      switch (name) {
        case 'access-id':
          return 'p-asdf';
        case 'access-type':
          return 'invalid-type';
        case 'api-url':
          return 'https://api.akeyless.io';
        default:
          return '';
      }
    });
    vi.mocked(core.getBooleanInput).mockReturnValue(false);

    expect(() => fetchAndValidateInput()).toThrow('access-type must be one of');
  });

  it('throws error for invalid timeout (below minimum)', () => {
    vi.mocked(core.getInput).mockImplementation((name: string) => {
      switch (name) {
        case 'access-id':
          return 'p-asdf';
        case 'access-type':
          return 'JWT';
        case 'api-url':
          return 'https://api.akeyless.io';
        case 'timeout':
          return '10';
        default:
          return '';
      }
    });
    vi.mocked(core.getBooleanInput).mockReturnValue(false);

    expect(() => fetchAndValidateInput()).toThrow('between 15 and 120');
  });

  it('throws error for invalid timeout (above maximum)', () => {
    vi.mocked(core.getInput).mockImplementation((name: string) => {
      switch (name) {
        case 'access-id':
          return 'p-asdf';
        case 'access-type':
          return 'JWT';
        case 'api-url':
          return 'https://api.akeyless.io';
        case 'timeout':
          return '150';
        default:
          return '';
      }
    });
    vi.mocked(core.getBooleanInput).mockReturnValue(false);

    expect(() => fetchAndValidateInput()).toThrow('between 15 and 120');
  });

  it('throws error for non-numeric timeout', () => {
    vi.mocked(core.getInput).mockImplementation((name: string) => {
      switch (name) {
        case 'access-id':
          return 'p-asdf';
        case 'access-type':
          return 'JWT';
        case 'api-url':
          return 'https://api.akeyless.io';
        case 'timeout':
          return 'not-a-number';
        default:
          return '';
      }
    });
    vi.mocked(core.getBooleanInput).mockReturnValue(false);

    expect(() => fetchAndValidateInput()).toThrow('should be a number');
  });

  it('throws error for invalid JSON in static-secrets', () => {
    vi.mocked(core.getInput).mockImplementation((name: string) => {
      switch (name) {
        case 'access-id':
          return 'p-asdf';
        case 'access-type':
          return 'JWT';
        case 'api-url':
          return 'https://api.akeyless.io';
        case 'static-secrets':
          return '{invalid json}';
        default:
          return '';
      }
    });
    vi.mocked(core.getBooleanInput).mockReturnValue(false);

    expect(() => fetchAndValidateInput()).toThrow('valid JSON');
  });

  it('throws error for invalid JSON in dynamic-secrets', () => {
    vi.mocked(core.getInput).mockImplementation((name: string) => {
      switch (name) {
        case 'access-id':
          return 'p-asdf';
        case 'access-type':
          return 'JWT';
        case 'api-url':
          return 'https://api.akeyless.io';
        case 'dynamic-secrets':
          return 'not valid json';
        default:
          return '';
      }
    });
    vi.mocked(core.getBooleanInput).mockReturnValue(false);

    expect(() => fetchAndValidateInput()).toThrow('valid JSON');
  });

  it('accepts aws_iam access type (lowercase)', () => {
    vi.mocked(core.getInput).mockImplementation((name: string) => {
      switch (name) {
        case 'access-id':
          return 'p-asdf';
        case 'access-type':
          return 'AWS_IAM';
        case 'api-url':
          return 'https://api.akeyless.io';
        default:
          return '';
      }
    });
    vi.mocked(core.getBooleanInput).mockReturnValue(false);

    const params = fetchAndValidateInput();
    expect(params.accessType).toBe('aws_iam');
  });

  it('handles empty secrets dictionaries', () => {
    vi.mocked(core.getInput).mockImplementation((name: string) => {
      switch (name) {
        case 'access-id':
          return 'p-asdf';
        case 'access-type':
          return 'JWT';
        case 'api-url':
          return 'https://api.akeyless.io';
        case 'static-secrets':
          return '';
        case 'dynamic-secrets':
          return '';
        default:
          return '';
      }
    });
    vi.mocked(core.getBooleanInput).mockReturnValue(false);

    const params = fetchAndValidateInput();
    // Empty strings remain empty strings until they fail the validation check and get converted
    expect(params.staticSecrets).toBeDefined();
    expect(params.dynamicSecrets).toBeDefined();
  });
});
