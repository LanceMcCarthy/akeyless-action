const auth = require('../src/auth');jest.mock('@actions/core');jest.mock('@actions/core');jest.mock('@actions/core');



describe('Authentication module', () => {jest.mock('../src/akeyless_api');

  test('exports allowed access types', () => {

    expect(auth.allowedAccessTypes).toEqual(['jwt', 'aws_iam']);jest.mock('akeyless');jest.mock('../src/akeyless_api');jest.mock('../src/akeyless_api');

  });

jest.mock('akeyless-cloud-id');

  test('has akeylessLogin function', () => {

    expect(typeof auth.akeylessLogin).toBe('function');jest.mock('akeyless');jest.mock('akeyless');

  });

});const core = require('@actions/core');

const akeylessApi = require('../src/akeyless_api');jest.mock('akeyless-cloud-id');jest.mock('akeyless-cloud-id');

const akeyless = require('akeyless');

const akeylessCloudId = require('akeyless-cloud-id');

const auth = require('../src/auth');

const core = require('@actions/core');const core = require('@actions/core');

describe('Authentication module', () => {

  beforeEach(() => {const akeylessApi = require('../src/akeyless_api');const akeylessApi = require('../src/akeyless_api');

    jest.clearAllMocks();

  });const akeyless = require('akeyless');const akeyless = require('akeyless');



  test('successful JWT login', async () => {const akeylessCloudId = require('akeyless-cloud-id');const akeylessCloudId = require('akeyless-cloud-id');

    core.getIDToken = jest.fn(() => Promise.resolve('github-jwt'));

    core.debug = jest.fn();const auth = require('../src/auth');const auth = require('../src/auth');

    const api = jest.fn(() => {});

    api.auth = jest.fn(() => Promise.resolve({token: 'akeyless-token'}));

    akeylessApi.api = jest.fn(() => api);

    akeyless.Auth.constructFromObject = jest.fn(() => 'auth_body');describe('Authentication module', () => {describe('Authentication module', () => {

    

    const result = await auth.akeylessLogin('p-12345', 'jwt', 'https://api.akeyless.io');  beforeEach(() => {  beforeEach(() => {

    

    expect(result).toEqual({token: 'akeyless-token'});    jest.clearAllMocks();    jest.clearAllMocks();

    expect(api.auth).toHaveBeenCalledWith('auth_body');

    expect(akeyless.Auth.constructFromObject).toHaveBeenCalledWith({  });  });

      'access-type': 'jwt',

      'access-id': 'p-12345',

      jwt: 'github-jwt'

    });  test('successful JWT login', async () => {  test('successful JWT login', async () => {

  });

    core.getIDToken = jest.fn(() => Promise.resolve('github-jwt'));    core.getIDToken = jest.fn(() => Promise.resolve('github-jwt'));

  test('successful AWS IAM login', async () => {

    core.debug = jest.fn();    core.debug = jest.fn();    core.debug = jest.fn();

    const api = jest.fn(() => {});

    api.auth = jest.fn(() => Promise.resolve({token: 'akeyless-token'}));    const api = jest.fn(() => {});    const api = jest.fn(() => {});

    akeylessApi.api = jest.fn(() => api);

    akeylessCloudId.getCloudId = jest.fn(() => Promise.resolve('cloud-id-123'));    api.auth = jest.fn(() => Promise.resolve({token: 'akeyless-token'}));    api.auth = jest.fn(() => Promise.resolve({token: 'akeyless-token'}));

    akeyless.Auth.constructFromObject = jest.fn(() => 'auth_body');

        akeylessApi.api = jest.fn(() => api);    akeylessApi.api = jest.fn(() => api);

    const result = await auth.akeylessLogin('p-12345', 'aws_iam', 'https://api.akeyless.io');

        akeyless.Auth.constructFromObject = jest.fn(() => 'auth_body');    akeyless.Auth.constructFromObject = jest.fn(() => 'auth_body');

    expect(result).toEqual({token: 'akeyless-token'});

    expect(api.auth).toHaveBeenCalledWith('auth_body');        

    expect(akeyless.Auth.constructFromObject).toHaveBeenCalledWith({

      'access-type': 'aws_iam',    const result = await auth.akeylessLogin('p-12345', 'jwt', 'https://api.akeyless.io');    const result = await auth.akeylessLogin('p-12345', 'jwt', 'https://api.akeyless.io');

      'access-id': 'p-12345',

      'cloud-id': 'cloud-id-123'        

    });

  });    expect(result).toEqual({token: 'akeyless-token'});    expect(result).toEqual({token: 'akeyless-token'});



  test('exports allowed access types', () => {    expect(api.auth).toHaveBeenCalledWith('auth_body');    expect(api.auth).toHaveBeenCalledWith('auth_body');

    expect(auth.allowedAccessTypes).toEqual(['jwt', 'aws_iam']);

  });    expect(akeyless.Auth.constructFromObject).toHaveBeenCalledWith({    expect(akeyless.Auth.constructFromObject).toHaveBeenCalledWith({



  test('auth login with invalid type throws error', async () => {      'access-type': 'jwt',      'access-type': 'jwt',

    core.debug = jest.fn();

    core.setFailed = jest.fn();      'access-id': 'p-12345',      'access-id': 'p-12345',

    

    // This will throw an error because 'invalid_type' is not in the login object      jwt: 'github-jwt'      jwt: 'github-jwt'

    await expect(auth.akeylessLogin('p-12345', 'invalid_type', 'https://api.akeyless.io'))

      .rejects.toThrow();    });    });

    

    expect(core.setFailed).toHaveBeenCalled();  });  });

  });

});

  test('successful AWS IAM login', async () => {  test('successful AWS IAM login', async () => {

    core.debug = jest.fn();    core.debug = jest.fn();

    const api = jest.fn(() => {});    const api = jest.fn(() => {});

    api.auth = jest.fn(() => Promise.resolve({token: 'akeyless-token'}));    api.auth = jest.fn(() => Promise.resolve({token: 'akeyless-token'}));

    akeylessApi.api = jest.fn(() => api);    akeylessApi.api = jest.fn(() => api);

    akeylessCloudId.getCloudId = jest.fn(() => Promise.resolve('cloud-id-123'));    akeylessCloudId.getCloudId = jest.fn(() => Promise.resolve('cloud-id-123'));

    akeyless.Auth.constructFromObject = jest.fn(() => 'auth_body');    akeyless.Auth.constructFromObject = jest.fn(() => 'auth_body');

        

    const result = await auth.akeylessLogin('p-12345', 'aws_iam', 'https://api.akeyless.io');    const result = await auth.akeylessLogin('p-12345', 'aws_iam', 'https://api.akeyless.io');

        

    expect(result).toEqual({token: 'akeyless-token'});    expect(result).toEqual({token: 'akeyless-token'});

    expect(api.auth).toHaveBeenCalledWith('auth_body');    expect(api.auth).toHaveBeenCalledWith('auth_body');

    expect(akeyless.Auth.constructFromObject).toHaveBeenCalledWith({    expect(akeyless.Auth.constructFromObject).toHaveBeenCalledWith({

      'access-type': 'aws_iam',      'access-type': 'aws_iam',

      'access-id': 'p-12345',      'access-id': 'p-12345',

      'cloud-id': 'cloud-id-123'      'cloud-id': 'cloud-id-123'

    });    });

  });  });



  test('JWT login fails when GitHub JWT fetch fails', async () => {  test('JWT login fails when GitHub JWT fetch fails', async () => {

    core.getIDToken = jest.fn(() => Promise.reject(new Error('JWT fetch failed')));    core.getIDToken = jest.fn(() => Promise.reject(new Error('JWT fetch failed')));

    core.debug = jest.fn();    core.debug = jest.fn();

    core.setFailed = jest.fn();    core.setFailed = jest.fn();

    const api = jest.fn(() => {});    const api = jest.fn(() => {});

    akeylessApi.api = jest.fn(() => api);    akeylessApi.api = jest.fn(() => api);

        

    await expect(auth.akeylessLogin('p-12345', 'jwt', 'https://api.akeyless.io'))    await expect(auth.akeylessLogin('p-12345', 'jwt', 'https://api.akeyless.io'))

      .rejects.toThrow('Failed to fetch Github JWT: JWT fetch failed');      .rejects.toThrow('Failed to fetch Github JWT: JWT fetch failed');

        

    expect(core.setFailed).toHaveBeenCalledWith('Failed to fetch Github JWT: JWT fetch failed');    expect(core.setFailed).toHaveBeenCalledWith('Failed to fetch Github JWT: JWT fetch failed');

  });  });



  test('JWT login fails when AKeyless auth fails', async () => {  test('JWT login fails when AKeyless auth fails', async () => {

    core.getIDToken = jest.fn(() => Promise.resolve('github-jwt'));    core.getIDToken = jest.fn(() => Promise.resolve('github-jwt'));

    core.debug = jest.fn();    core.debug = jest.fn();

    core.setFailed = jest.fn();    core.setFailed = jest.fn();

    const api = jest.fn(() => {});    const api = jest.fn(() => {});

    api.auth = jest.fn(() => Promise.reject(new Error('AKeyless auth failed')));    api.auth = jest.fn(() => Promise.reject(new Error('AKeyless auth failed')));

    akeylessApi.api = jest.fn(() => api);    akeylessApi.api = jest.fn(() => api);

    akeyless.Auth.constructFromObject = jest.fn(() => 'auth_body');    akeyless.Auth.constructFromObject = jest.fn(() => 'auth_body');

        

    await expect(auth.akeylessLogin('p-12345', 'jwt', 'https://api.akeyless.io'))    await expect(auth.akeylessLogin('p-12345', 'jwt', 'https://api.akeyless.io'))

      .rejects.toThrow('Failed to login to AKeyless: AKeyless auth failed');      .rejects.toThrow('Failed to login to AKeyless: AKeyless auth failed');

        

    expect(core.setFailed).toHaveBeenCalledWith('Failed to login to AKeyless: AKeyless auth failed');    expect(core.setFailed).toHaveBeenCalledWith('Failed to login to AKeyless: AKeyless auth failed');

  });  });



  test('AWS IAM login fails when cloud ID fetch fails', async () => {  test('AWS IAM login fails when cloud ID fetch fails', async () => {

    core.debug = jest.fn();    core.debug = jest.fn();

    core.setFailed = jest.fn();    core.setFailed = jest.fn();

    const api = jest.fn(() => {});    const api = jest.fn(() => {});

    akeylessApi.api = jest.fn(() => api);    akeylessApi.api = jest.fn(() => api);

    akeylessCloudId.getCloudId = jest.fn(() => Promise.reject(new Error('Cloud ID fetch failed')));    akeylessCloudId.getCloudId = jest.fn(() => Promise.reject(new Error('Cloud ID fetch failed')));

        

    await expect(auth.akeylessLogin('p-12345', 'aws_iam', 'https://api.akeyless.io'))    await expect(auth.akeylessLogin('p-12345', 'aws_iam', 'https://api.akeyless.io'))

      .rejects.toThrow('Failed to fetch cloud id: Cloud ID fetch failed');      .rejects.toThrow('Failed to fetch cloud id: Cloud ID fetch failed');

        

    expect(core.setFailed).toHaveBeenCalledWith('Failed to fetch cloud id: Cloud ID fetch failed');    expect(core.setFailed).toHaveBeenCalledWith('Failed to fetch cloud id: Cloud ID fetch failed');

  });  });



  test('AWS IAM login fails when cloud ID is undefined', async () => {  test('AWS IAM login fails when cloud ID is undefined', async () => {

    core.debug = jest.fn();    core.debug = jest.fn();

    core.setFailed = jest.fn();    core.setFailed = jest.fn();

    const api = jest.fn(() => {});    const api = jest.fn(() => {});

    akeylessApi.api = jest.fn(() => api);    akeylessApi.api = jest.fn(() => api);

    akeylessCloudId.getCloudId = jest.fn(() => Promise.resolve(undefined));    akeylessCloudId.getCloudId = jest.fn(() => Promise.resolve(undefined));

        

    await expect(auth.akeylessLogin('p-12345', 'aws_iam', 'https://api.akeyless.io'))    await expect(auth.akeylessLogin('p-12345', 'aws_iam', 'https://api.akeyless.io'))

      .rejects.toThrow('CloudId is undefined.');      .rejects.toThrow('CloudId is undefined.');

        

    expect(core.setFailed).toHaveBeenCalledWith('CloudId is undefined.');    expect(core.setFailed).toHaveBeenCalledWith('CloudId is undefined.');

  });  });



  test('AWS IAM login fails when AKeyless auth fails', async () => {  test('AWS IAM login fails when AKeyless auth fails', async () => {

    core.debug = jest.fn();    core.debug = jest.fn();

    core.setFailed = jest.fn();    core.setFailed = jest.fn();

    const api = jest.fn(() => {});    const api = jest.fn(() => {});

    api.auth = jest.fn(() => Promise.reject(new Error('AKeyless auth failed')));    api.auth = jest.fn(() => Promise.reject(new Error('AKeyless auth failed')));

    akeylessApi.api = jest.fn(() => api);    akeylessApi.api = jest.fn(() => api);

    akeylessCloudId.getCloudId = jest.fn(() => Promise.resolve('cloud-id-123'));    akeylessCloudId.getCloudId = jest.fn(() => Promise.resolve('cloud-id-123'));

    akeyless.Auth.constructFromObject = jest.fn(() => 'auth_body');    akeyless.Auth.constructFromObject = jest.fn(() => 'auth_body');

        

    await expect(auth.akeylessLogin('p-12345', 'aws_iam', 'https://api.akeyless.io'))    await expect(auth.akeylessLogin('p-12345', 'aws_iam', 'https://api.akeyless.io'))

      .rejects.toThrow('Failed to login to AKeyless: AKeyless auth failed');      .rejects.toThrow('Failed to login to AKeyless: AKeyless auth failed');

        

    expect(core.setFailed).toHaveBeenCalledWith('Failed to login to AKeyless: AKeyless auth failed');    expect(core.setFailed).toHaveBeenCalledWith('Failed to login to AKeyless: AKeyless auth failed');

  });  });



  test('exports allowed access types', () => {  test('exports allowed access types', () => {

    expect(auth.allowedAccessTypes).toEqual(['jwt', 'aws_iam']);    expect(auth.allowedAccessTypes).toEqual(['jwt', 'aws_iam']);

  });  });



  test('generic error handling in akeylessLogin', async () => {  test('generic error handling in akeylessLogin', async () => {

    core.debug = jest.fn();    core.debug = jest.fn();

    core.setFailed = jest.fn();    core.setFailed = jest.fn();

        

    // Mock a scenario where an unexpected error occurs    // Mock a scenario where an unexpected error occurs

    await expect(auth.akeylessLogin('p-12345', 'invalid_type', 'https://api.akeyless.io'))    await expect(auth.akeylessLogin('p-12345', 'invalid_type', 'https://api.akeyless.io'))

      .rejects.toThrow();      .rejects.toThrow();

  });  });

});});