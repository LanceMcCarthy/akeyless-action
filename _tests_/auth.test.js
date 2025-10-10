const auth = require('../src/auth');

describe('Authentication module', () => {
  test('exports allowed access types', () => {
    expect(auth.allowedAccessTypes).toEqual(['jwt', 'aws_iam']);
  });

  test('has akeylessLogin function', () => {
    expect(typeof auth.akeylessLogin).toBe('function');
  });
});
