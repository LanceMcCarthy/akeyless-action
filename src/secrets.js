const core = require('@actions/core');
const akeylessApi = require('./akeyless_api');
const akeyless = require('akeyless');

async function exportDynamicSecrets(akeylessToken, dynamicSecrets, apiUrl, exportSecretsToOutputs, exportSecretsToEnvironment, generateSeparateOutputs) {
  const api = akeylessApi.api(apiUrl);

  for (const [akeylessPath, variableName] of Object.entries(dynamicSecrets)) {
    try {
      const param = akeyless.GetDynamicSecretValue.constructFromObject({
        token: akeylessToken,
        name: akeylessPath
      });

      const dynamicSecret = await api.getDynamicSecretValue(param).catch(error => {
        core.error(`getDynamicSecretValue Failed: ${error}`);
        core.setFailed(`getDynamicSecretValue Failed: ${error}`);
      });

      if (dynamicSecret === null || dynamicSecret === undefined) {
        return;
      }

      // toggled by parse-dynamic-secrets
      if (generateSeparateOutputs === false) {
        // **** Option 1 (DEFAULT BEHAVIOR) ***** //
        // Exports the entire dynamic secret value as one object

        // Switch 1 -
        // set outputs
        if (exportSecretsToOutputs) {
          // obscure values in visible output and logs
          core.setSecret(dynamicSecret);

          // KEY TAKAWAY: Set the output using the entire dynamic secret object
          core.setOutput(variableName, dynamicSecret);
        }

        // Switch 2 -
        // export env variables
        if (exportSecretsToEnvironment) {
          const toEnvironment = dynamicSecret;
          // if (dynamicSecret.constructor === Array || dynamicSecret.constructor === Object) {
          //   toEnvironment = JSON.stringify(dynamicSecret);
          // }
          // obscure values in visible output and logs
          core.setSecret(toEnvironment);

          // KEY TAKAWAY: Set the output using the entire dynamic secret object
          // export to environment
          core.exportVariable(variableName, toEnvironment);
        }
      } else {
        // **** Option 2 (parse-secrets =true) ***** //
        // Generate separate output/env vars for each value in the dynamic secret

        for (const key in dynamicSecret) {
          // get the value for the key
          const value = dynamicSecret[key];

          // obscure value in visible output and logs
          core.setSecret(value);

          // if the user set an output variable name, use it to prefix the output/env var's name
          let finalVarName = variableName;
          if (variableName === null || variableName.trim() === '') {
            finalVarName = `${key}`;
          } else {
            finalVarName = `${variableName}_${key}`;
          }

          // Switch 1 - set outputs
          if (exportSecretsToOutputs) {
            core.setOutput(finalVarName, value);
          }

          // Switch 2 - export env variables
          if (exportSecretsToEnvironment) {
            core.exportVariable(finalVarName, value);
          }

          // Debugging
          // if (dynamicSecret.hasOwnProperty(key)) {
          //   core.info(`Property ${key} is NOT from prototype chain`);
          // } else {
          //   core.info(`Property ${key} is from prototype chain. contact developer to shate special dynamic secret situation.`);
          // }
        }
      }
    } catch (error) {
      //core.error(`Failed to export dynamic secrets: ${error}`);
      core.setFailed(`Failed to export dynamic secrets: ${error}`);
    }
  }
}

async function exportStaticSecrets(akeylessToken, staticSecrets, apiUrl, exportSecretsToOutputs, exportSecretsToEnvironment) {
  const api = akeylessApi.api(apiUrl);

  for (const [akeylessPath, variableName] of Object.entries(staticSecrets)) {
    const name = akeylessPath;

    const param = akeyless.GetSecretValue.constructFromObject({
      token: akeylessToken,
      names: [name]
    });

    const staticSecret = await api.getSecretValue(param).catch(error => {
      core.error(`getSecretValue Failed: ${error}`);
      core.setFailed(`getSecretValue Failed: ${error}`);
    });

    if (staticSecret === undefined) {
      return;
    }

    const secretValue = staticSecret[name];

    core.setSecret(secretValue);

    // Switch 1 - set outputs
    if (exportSecretsToOutputs) {
      core.setOutput(variableName, secretValue);
    }

    // Switch 2 - export env variables
    if (exportSecretsToEnvironment) {
      core.exportVariable(variableName, secretValue);
    }
  }
}

exports.exportDynamicSecrets = exportDynamicSecrets;
exports.exportStaticSecrets = exportStaticSecrets;
