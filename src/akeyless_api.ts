import akeyless from 'akeyless';

export function api(url: string) {
  const client = new akeyless.ApiClient();
  client.basePath = url;
  return new akeyless.V2Api(client);
}
