
const AWS = require('aws-sdk')
const aws4 = require('aws4')
const axios = require('axios')
const { GoogleAuth } = require('google-auth-library');

async function getCloudId(acc_type, param) {
    if (acc_type === "aws_iam") {
        return getAWsCloudId()
    } else if (acc_type === "azure_ad") {
        return getAzureCloudID(param)
    } else if (acc_type === "gcp") {
        return getGcpCloudID(param)
    } else if (acc_type === "access_key") {
        return ""
    } else {
        throw new Error("Invalid access type")
    }
}

async function getAzureCloudID(object_id) {
    const headers = { 'user-agent': 'AKEYLESS', 'Metadata': 'true' }
    const params = { 'api-version': '2018-02-01', 'resource': 'https://management.azure.com/', 'object_id': object_id }

    const res = await axios.get('http://169.254.169.254/metadata/identity/oauth2/token', { params, headers })
    
    return Buffer.from(res.data.access_token).toString('base64')
}


async function getGcpCloudID(audience) {
    if (!audience) {
        audience = "akeyless.io"
    }

    const googleAuth = new GoogleAuth();
    const client = await googleAuth.getClient();
  
    const token = await client.fetchIdToken(audience);
    const res = Buffer.from(token).toString('base64')

    return res
}

function getAWsCloudId() {
    return new Promise((resolve, reject) => {
        AWS.config.getCredentials(function (err) {
            if (err) {
                reject(err)
            } else {
                const result = stsGetCallerIdentity(AWS.config.credentials)
                resolve(result)
            }
        })    
    })
}

function stsGetCallerIdentity(creds) {

    const opts3 = { method: 'POST', service: 'sts', body: 'Action=GetCallerIdentity&Version=2011-06-15', region: 'us-east-1' }
    opts3.headers = {
        "Content-Length": opts3.body.length,
        "Content-Type": 'application/x-www-form-urlencoded; charset=utf-8',
    }
    aws4.sign(opts3, creds)

    const h = {
        'Authorization': [opts3.headers['Authorization']],
        'Content-Length': [opts3.body.length.toString()],
        'Host': [opts3.headers['Host']],
        'Content-Type': [opts3.headers['Content-Type']],
        'X-Amz-Date': [opts3.headers['X-Amz-Date']],
    }
    if (creds.sessionToken) {
        h['X-Amz-Security-Token'] = [creds.sessionToken];
    }
    const myheaders = JSON.stringify(h);

    const obj = {
        'sts_request_method': 'POST',
        'sts_request_url': Buffer.from('https://sts.amazonaws.com/').toString('base64'),
        'sts_request_body': Buffer.from('Action=GetCallerIdentity&Version=2011-06-15').toString('base64'),
        'sts_request_headers': Buffer.from(myheaders).toString('base64')
    };
    const awsData = JSON.stringify(obj)
    return Buffer.from(awsData).toString('base64')
}


module.exports = {
    getAWsCloudId: getAWsCloudId,
    getAzureCloudID: getAzureCloudID,
    getGcpCloudID: getGcpCloudID,
    getCloudId: getCloudId,
}
