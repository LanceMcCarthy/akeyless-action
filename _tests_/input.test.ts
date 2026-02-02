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

  it('parses static-secrets JSON and validates as object', () => {
    vi.mocked(core.getInput).mockImplementation((name: string) => {
      switch (name) {
        case 'access-id':
          return 'p-asdf';
        case 'access-type':
          return 'JWT';
        case 'api-url':
          return 'https://api.akeyless.io';
        case 'static-secrets':
          return '{"path/to/secret": "SECRET_VAR", "another/path": "ANOTHER_VAR"}';
        default:
          return '';
      }
    });
    vi.mocked(core.getBooleanInput).mockReturnValue(false);

    const params = fetchAndValidateInput();
    expect(typeof params.staticSecrets).toBe('object');
    expect(params.staticSecrets).toEqual({
      'path/to/secret': 'SECRET_VAR',
      'another/path': 'ANOTHER_VAR'
    });
  });

  it('parses dynamic-secrets JSON and validates as object', () => {
    vi.mocked(core.getInput).mockImplementation((name: string) => {
      switch (name) {
        case 'access-id':
          return 'p-asdf';
        case 'access-type':
          return 'JWT';
        case 'api-url':
          return 'https://api.akeyless.io';
        case 'dynamic-secrets':
          return '{"producer/one": "DYNAMIC_VAR_ONE", "producer/two": "DYNAMIC_VAR_TWO"}';
        default:
          return '';
      }
    });
    vi.mocked(core.getBooleanInput).mockReturnValue(false);

    const params = fetchAndValidateInput();
    expect(typeof params.dynamicSecrets).toBe('object');
    expect(params.dynamicSecrets).toEqual({
      'producer/one': 'DYNAMIC_VAR_ONE',
      'producer/two': 'DYNAMIC_VAR_TWO'
    });
  });

  it('uses default timeout value of 15 when empty', () => {
    vi.mocked(core.getInput).mockImplementation((name: string) => {
      switch (name) {
        case 'access-id':
          return 'p-asdf';
        case 'access-type':
          return 'JWT';
        case 'api-url':
          return 'https://api.akeyless.io';
        case 'timeout':
          return '';
        default:
          return '';
      }
    });
    vi.mocked(core.getBooleanInput).mockReturnValue(false);

    const params = fetchAndValidateInput();
    expect(params.timeout).toBe(15);
  });

  it('accepts valid timeout at minimum boundary (15)', () => {
    vi.mocked(core.getInput).mockImplementation((name: string) => {
      switch (name) {
        case 'access-id':
          return 'p-asdf';
        case 'access-type':
          return 'JWT';
        case 'api-url':
          return 'https://api.akeyless.io';
        case 'timeout':
          return '15';
        default:
          return '';
      }
    });
    vi.mocked(core.getBooleanInput).mockReturnValue(false);

    const params = fetchAndValidateInput();
    expect(params.timeout).toBe(15);
  });

  it('accepts valid timeout at maximum boundary (120)', () => {
    vi.mocked(core.getInput).mockImplementation((name: string) => {
      switch (name) {
        case 'access-id':
          return 'p-asdf';
        case 'access-type':
          return 'JWT';
        case 'api-url':
          return 'https://api.akeyless.io';
        case 'timeout':
          return '120';
        default:
          return '';
      }
    });
    vi.mocked(core.getBooleanInput).mockReturnValue(false);

    const params = fetchAndValidateInput();
    expect(params.timeout).toBe(120);
  });

  it('accepts valid timeout in middle range (60)', () => {
    vi.mocked(core.getInput).mockImplementation((name: string) => {
      switch (name) {
        case 'access-id':
          return 'p-asdf';
        case 'access-type':
          return 'JWT';
        case 'api-url':
          return 'https://api.akeyless.io';
        case 'timeout':
          return '60';
        default:
          return '';
      }
    });
    vi.mocked(core.getBooleanInput).mockReturnValue(false);

    const params = fetchAndValidateInput();
    expect(params.timeout).toBe(60);
  });

  it('respects boolean input values from getBooleanInput', () => {
    vi.mocked(core.getInput).mockImplementation((name: string) => {
      switch (name) {
        case 'access-id':
          return 'p-asdf';
        case 'access-type':
          return 'JWT';
        case 'api-url':
          return 'https://api.akeyless.io';
        default:
          return '';
      }
    });
    vi.mocked(core.getBooleanInput).mockReturnValue(false);

    const params = fetchAndValidateInput();
    // When getBooleanInput returns false, that value is respected (no override)
    expect(params.exportSecretsToOutputs).toBe(false);
    expect(params.exportSecretsToEnvironment).toBe(false);
    expect(params.parseDynamicSecrets).toBe(false);
  });

  it('allows overriding boolean defaults', () => {
    vi.mocked(core.getInput).mockImplementation((name: string) => {
      switch (name) {
        case 'access-id':
          return 'p-asdf';
        case 'access-type':
          return 'JWT';
        case 'api-url':
          return 'https://api.akeyless.io';
        default:
          return '';
      }
    });
    vi.mocked(core.getBooleanInput).mockImplementation((name: string) => {
      switch (name) {
        case 'export-secrets-to-outputs':
          return false;
        case 'export-secrets-to-environment':
          return false;
        case 'parse-dynamic-secrets':
          return true;
        default:
          return false;
      }
    });

    const params = fetchAndValidateInput();
    expect(params.exportSecretsToOutputs).toBe(false);
    expect(params.exportSecretsToEnvironment).toBe(false);
    expect(params.parseDynamicSecrets).toBe(true);
  });

  it('converts access-type to lowercase for jwt', () => {
    vi.mocked(core.getInput).mockImplementation((name: string) => {
      switch (name) {
        case 'access-id':
          return 'p-asdf';
        case 'access-type':
          return 'JWT';
        case 'api-url':
          return 'https://api.akeyless.io';
        default:
          return '';
      }
    });
    vi.mocked(core.getBooleanInput).mockReturnValue(false);

    const params = fetchAndValidateInput();
    expect(params.accessType).toBe('jwt');
  });

  it('converts access-type to lowercase for aws_iam', () => {
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
});
