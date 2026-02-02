import {describe, it, expect} from 'vitest';
import * as auth from '../src/auth';

describe('Authentication module', () => {
  it('exports allowed access types', () => {
    expect(auth.allowedAccessTypes).toEqual(['jwt', 'aws_iam']);
  });

  it('has akeylessLogin function', () => {
    expect(typeof auth.akeylessLogin).toBe('function');
  });
});
