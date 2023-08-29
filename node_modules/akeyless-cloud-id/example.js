const akeyless = require('akeyless')
var akeylessCloud = require('.')


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
    const optsAws = { 'access-id': "p-xxxxxxxxxxxx", 'access-type': accessType, 'cloud-id': cloudId }
    const secret = await getSecret("my-secret", optsAws)    
    console.log(secret)
}
    
getSecretWithCloudId()
