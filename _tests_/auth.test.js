import {describe, test, expect} from 'vitest';
import * as auth from '../src/auth.js';

describe('Authentication module', () => {
  test('exports allowed access types', () => {
    expect(auth.allowedAccessTypes).toEqual(['jwt', 'aws_iam']);
  });

  test('has akeylessLogin function', () => {
    expect(typeof auth.akeylessLogin).toBe('function');
  });
});
