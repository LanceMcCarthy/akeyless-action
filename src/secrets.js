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
      if (separateValues == false) {
        // **** Condition 1 (DEFAULT BEHAVIOR) ***** //
        // Just export the entire dynamic secret value as one object
        // the user can parsw the object in the next step in their workflow

        // switch 1
        if (exportSecretsToOutputs) {
          //core.setSecret(dynamicSecret);
          core.setOutput(variableName, dynamicSecret);
        }
        // switch 2
        if (exportSecretsToEnvironment) {
          let toEnvironment = dynamicSecret;
          if (dynamicSecret.constructor === Array || dynamicSecret.constructor === Object) {
            toEnvironment = JSON.stringify(dynamicSecret);
          }
          //core.setSecret(toEnvironment);
          core.exportVariable(variableName, toEnvironment);
        }
      } else {
        // **** Condition 2 (FEATURE REQUEST 11) ***** //
        // Generate separate output/env vars for each value
        // Must be placed behind feature flag because is a breaking change

        // switch 1
        for (let key in dynamicSecret) {
          let value = dynamicSecret[key];

          // TODO 
          // uncomment for production
          //core.setSecret(value);

          // The default output/envar name will be the key name
          let finalVarName = `${key}`;

          // if the user set an output variable name, use it to prefix the output/env var's name
          if(variableName !== undefined || variableName !== "") {
            finalVarName = `${variableName}_${key}`;
          }

          // Switch 1
          if(exportSecretsToOutputs) {
            core.setOutput(finalVarName, value);
          }

          // Switch 2
          if (exportSecretsToEnvironment) {
            core.exportVariable(finalVarName, value);
          }

          if (dynamicSecret.hasOwnProperty(key)) {
            console.log(`Property ${key} is NOT from prototype chain`);
          } else {
            console.log(`Property ${key} is from prototype chain`);
          }
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
