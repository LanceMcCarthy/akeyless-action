# akeyless-js-cloud-id

Akeyless CloudId Provider

The purpose of this package is to exteact the required "cloudid" to authenticate to akeyless using cloud authorization providers.

For more information, please visit [https://akeyless.io](https://akeyless.io)


## Requirements
Using the cloudid provider requires:

Nodejs version 14.0.0 or higher.

## Installation
```
npm install akeyless
npm install akeyless-cloud-id
```

## Getting Started
Please follow the installation instruction and execute the following Javascript code:

```js
const akeyless = require('akeyless')
var akeylessCloud = require('akeyless-cloud-id')


const AkeylessClient = new akeyless.ApiClient();
AkeylessClient.basePath = 'https://api.akeyless.io';
const api = new akeyless.V2Api(AkeylessClient)


async function getSecret(key, opts) {
    try {
        const authResult = await api.auth(akeyless.Auth.constructFromObject(opts))
        const token = authResult.token

        const someObject = akeyless.GetSecretValue.constructFromObject({
            names: [key],
            token: token
        })
        const data = await api.getSecretValue(someObject)
        console.log('API called successfully. Returned data: ' + JSON.stringify(data))
        return JSON.stringify(data)
    } catch (e) {
        console.log(JSON.stringify(e, null, 2))
    }
}

async function getSecretWithCloudId() {
    const accessType = "azure_ad"
    const cloudId = await akeylessCloud.getCloudId(accessType)
    const opts = { 'access-id': "p-xxxxxxxxxxxx", 'access-type': accessType, 'cloud-id': cloudId }
    const secret = await getSecret("my-secret", opts)    
    console.log(secret)
}
    
getSecretWithCloudId()

```

Author
support@akeyless.io