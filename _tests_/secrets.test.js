jest.mock('@actions/core');
jest.mock('../src/akeyless_api');
jest.mock('akeyless');

core = require('@actions/core');
akeylessApi = require('../src/akeyless_api');
akeyless = require('akeyless');
secrets = require('../src/secrets');

test('export dynamic secrets', async () => {
  const dynamicSecret = {
    access_key_id: 'aws-access-key',
    secret_access_key: 'aws-secret-key',
    session_token: 'aws-session-token'
  };
  core.setSecret = jest.fn(() => {});
  core.setOutput = jest.fn(() => {});
  core.exportVariable = jest.fn(() => {});

  api = jest.fn(() => {});
  api.getDynamicSecretValue = jest.fn(() => Promise.resolve(dynamicSecret));
  akeylessApi.api = jest.fn(() => api);
  akeyless.GetDynamicSecretValue.constructFromObject = jest.fn(() => 'get_dynamic_secret_body');

  await secrets.exportDynamicSecrets('akeyless-token', {'/path/to/dynamic/producer': 'sup'}, 'https://api.akeyless.io', true, true);

  expect(api.getDynamicSecretValue).toHaveBeenCalledWith('get_dynamic_secret_body');

  expect(akeyless.GetDynamicSecretValue.constructFromObject).toHaveBeenCalledWith({
    token: 'akeyless-token',
    name: '/path/to/dynamic/producer'
  });

  //expect(core.setSecret).toHaveBeenCalledWith('sup', dynamicSecret);
  //expect(core.setOutput).toHaveBeenCalledWith('sup', dynamicSecret);
  //expect(core.exportVariable).toHaveBeenCalledWith('sup', JSON.stringify(dynamicSecret));
});

test('export static secrets', async () => {
  const staticSecret = {
    '/path/to/static/secret': 'super secret'
  };
  core.setSecret = jest.fn(() => {});
  core.setOutput = jest.fn(() => {});
  core.exportVariable = jest.fn(() => {});

  api = jest.fn(() => {});
  api.getSecretValue = jest.fn(() => Promise.resolve(staticSecret));
  akeylessApi.api = jest.fn(() => api);
  akeyless.GetSecretValue.constructFromObject = jest.fn(() => 'get_static_secret_body');

  await secrets.exportStaticSecrets('akeyless-token', {'/path/to/static/secret': 'sup'}, 'https://api.akeyless.io', true, true);

  expect(api.getSecretValue).toHaveBeenCalledWith('get_static_secret_body');
  
  expect(akeyless.GetSecretValue.constructFromObject).toHaveBeenCalledWith({
    token: 'akeyless-token',
    names: ['/path/to/static/secret']
  });

  //expect(core.setSecret).toHaveBeenCalledWith('super secret');
  //expect(core.setOutput).toHaveBeenCalledWith('sup', 'super secret');
  //expect(core.exportVariable).toHaveBeenCalledWith('sup', 'super secret');
});
