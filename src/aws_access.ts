import * as core from '@actions/core';
import { api as akeylessApi } from './akeyless_api';
import akeyless from 'akeyless';

export async function awsLogin(
  akeylessToken: string,
  producerForAwsAccess: string,
  apiUrl: string
): Promise<void> {
  const api = akeylessApi(apiUrl);
  return new Promise((resolve, reject) => {
    api
      .getDynamicSecretValue(
        akeyless.GetDynamicSecretValue.constructFromObject({
          token: akeylessToken,
          name: producerForAwsAccess
        })
      )
      .then((awsCredentials: Record<string, string>) => {
        const accessKeyId = awsCredentials['access_key_id'];
        const secretAccessKey = awsCredentials['secret_access_key'];
        const sessionToken = awsCredentials['security_token'];

        core.setSecret(accessKeyId);
        core.exportVariable('AWS_ACCESS_KEY_ID', accessKeyId);
        core.setSecret(secretAccessKey);
        core.exportVariable('AWS_SECRET_ACCESS_KEY', secretAccessKey);
        if (sessionToken) {
          core.setSecret(sessionToken);
          core.exportVariable('AWS_SESSION_TOKEN', sessionToken);
        }
        resolve();
      })
      .catch((error: unknown) => {
        reject(error);
      });
  });
}
