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
  });
});
