import * as akeyless from 'akeyless';
export function api(url) {
    const client = new akeyless.ApiClient();
    client.basePath = url;
    return new akeyless.V2Api(client);
}
