import akeyless from 'akeyless';

function api(url) {
  const client = new akeyless.ApiClient();
  client.basePath = url;
  return new akeyless.V2Api(client);
}

export {api};
