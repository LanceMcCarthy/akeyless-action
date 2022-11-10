const core = require('@actions/core');
const akeylessApi = require('./akeyless_api');
const akeyless = require('akeyless');

async function exportDynamicSecrets(akeylessToken, dynamicSecrets, apiUrl, exportSecretsToOutputs, exportSecretsToEnvironment, separateValues) {
  const api = akeylessApi.api(apiUrl);

  for (const [akeylessPath, variableName] of Object.entries(dynamicSecrets)) {
    try {
      let param = akeyless.GetDynamicSecretValue.constructFromObject({
        token: akeylessToken,
        name: akeylessPath
      });

      let dynamicSecret = await api.getDynamicSecretValue(param).catch(error => {
        core.error(`getDynamicSecretValue Failed: ${error}`);
        core.setFailed(`getDynamicSecretValue Failed: ${error}`);
      });

      if (dynamicSecret === undefined) {
        return;
      }

      // Feature Request #11
      if (separateValues) {
        // CONDITON 1 - generate separate output/env vars for each value?

        // switch 1
        for (let key in dynamicSecret) {
          let value = dynamicSecret[key];

          console.log(`${variableName}_${key}`);

          core.setSecret(key, value);
          
          // Swicth 1
          if(exportSecretsToOutputs) {
            core.setOutput(`${variableName}_${key}`, value);
          }

          // Switch 2
          if (exportSecretsToEnvironment) {
            core.exportVariable(`${variableName}_${key}`, value);
          }


          if (dynamicSecret.hasOwnProperty(key)) {
            console.log(`Property ${key} is NOT from prototype chain`);
          } else {
            console.log(`Property ${key} is from prototype chain`);
          }
        }


      } else {
        // Condition 2 (default) Just export the entire value as one

        // switch 1
        if (exportSecretsToOutputs) {
          core.setSecret(variableName, dynamicSecret);
          core.setOutput(variableName, dynamicSecret);
        }
        // switch 2
        if (exportSecretsToEnvironment) {
          let toEnvironment = dynamicSecret;
          if (dynamicSecret.constructor === Array || dynamicSecret.constructor === Object) {
            toEnvironment = JSON.stringify(dynamicSecret);
          }
          core.setSecret(variableName, toEnvironment);
          core.exportVariable(variableName, toEnvironment);
        }
      }
    } catch (error) {
      core.error(`Failed to export dynamic secrets: ${error}`);
      core.setFailed(`Failed to export dynamic secrets: ${error}`);
    }
  }
}

async function exportStaticSecrets(akeylessToken, staticSecrets, apiUrl, exportSecretsToOutputs, exportSecretsToEnvironment) {
  const api = akeylessApi.api(apiUrl);

  for (const [akeylessPath, variableName] of Object.entries(staticSecrets)) {
    let name = akeylessPath;

    let param = akeyless.GetSecretValue.constructFromObject({
      token: akeylessToken,
      names: [name]
    });

    let staticSecret = await api.getSecretValue(param).catch(error => {
      core.error(`getSecretValue Failed: ${error}`);
      core.setFailed(`getSecretValue Failed: ${error}`);
    });

    if (staticSecret === undefined) {
      return;
    }

    const secretValue = staticSecret[name];

    core.setSecret(secretValue);

    // switch 1
    if (exportSecretsToOutputs) {
      core.setOutput(variableName, secretValue);
    }

    // switch 2
    if (exportSecretsToEnvironment) {
      core.exportVariable(variableName, secretValue);
    }
  }
}

exports.exportDynamicSecrets = exportDynamicSecrets;
exports.exportStaticSecrets = exportStaticSecrets;
