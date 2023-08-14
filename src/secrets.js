const core = require('@actions/core');
const akeylessApi = require('./akeyless_api');
const akeyless = require('akeyless');

let parentKey = '';
let grandparentKey = '';
const outputArray = [];

function traverse(jsonObject) {
  for (const [key, loopValue] of Object.entries(jsonObject)) {
    let loopKey = key;

    if (Object.hasOwn(jsonObject, key)) {
      if (loopValue.constructor === Object) {
        parentKey = loopKey;
        traverse(jsonObject[loopKey]);
      } else if (loopValue.constructor === Array) {
        grandparentKey = loopKey;
        traverse(jsonObject[loopKey]);
      } else {
        if (parentKey) {
          loopKey = `${parentKey}_${loopKey}`;
        }
        if (grandparentKey) {
          loopKey = `${grandparentKey}_${loopKey}`;
        }

        const item = {};
        item[loopKey] = loopValue;

        outputArray.push(item);
      }
    }
  }
}

async function exportDynamicSecrets(akeylessToken, dynamicSecrets, apiUrl, exportSecretsToOutputs, exportSecretsToEnvironment, generateSeparateOutputs, stringifyOutput) {
  const api = akeylessApi.api(apiUrl);

  for (const [akeylessPath, variableName] of Object.entries(dynamicSecrets)) {
    core.info(`\u001b[38;2;255;0;0mTEMPDEBUG - akeylessPath: ${akeylessPath}, variableName: ${variableName} `);
    try {
      const param = akeyless.GetDynamicSecretValue.constructFromObject({
        token: akeylessToken,
        name: akeylessPath
      });

      core.info(`\u001b[38;2;255;0;0mTEMPDEBUG - akeyless param: ${param}`);

      const dynamicSecret = await api.getDynamicSecretValue(param).catch(error => {
        core.error(`getDynamicSecretValue Failed: ${JSON.stringify(error)}`);
        core.setFailed(`getDynamicSecretValue Failed: ${JSON.stringify(error)}`);
      });

      core.info(`\u001b[38;2;255;0;0mTEMPDEBUG - dynamicSecret: ${dynamicSecret}`);

      if (dynamicSecret === null || dynamicSecret === undefined) {
        return;
      }

      // toggled by "parse-dynamic-secrets: false
      // **** Option 1 (DEFAULT BEHAVIOR) ***** //
      // Exports the entire dynamic secret value as one object
      if (generateSeparateOutputs === false) {
        core.info('\u001b[38;2;0;255;255mAutomatic Parsing Disabled - Exporting Entire Secret');

        let toOutput = dynamicSecret;

        if (stringifyOutput) {
          core.info('\u001b[38;2;255;255;0mStringifying Output');

          if (dynamicSecret.constructor === Array || dynamicSecret.constructor === Object) {
            toOutput = JSON.stringify(dynamicSecret);
          }
        }

        // - Switch 1 -
        // set job outputs
        if (exportSecretsToOutputs) {
          // obscure values in visible output and logs
          //core.setSecret(toOutput);   // !!! TEMPORARY COMMENT !!!

          // KEY TAKAWAY: Set the output using the entire dynamic secret object
          core.info('\u001b[38;2;0;255;0mSetting output with with entire secret');
          core.setOutput(variableName, toOutput);
        }

        // - Switch 2 -
        // export env variables
        if (exportSecretsToEnvironment) {
          // obscure values in visible output and logs
          //core.setSecret(toOutput);   // !!! TEMPORARY COMMENT !!!

          // KEY TAKAWAY: Set the output using the entire dynamic secret object
          core.info('\u001b[38;2;255;255;0mSetting an environment variable with entire secret');
          core.exportVariable(variableName, toOutput);
        }
      } else {
        // toggled by "parse-dynamic-secrets: true
        // **** Option 2 - automatic object parser **** //
        // Generate separate output/env vars for each value in the dynamic secret

        core.info('\u001b[38;2;0;255;255mAutomatic Parsing Enabled - Traversing Object Tree To Find Secrets');

        // Deep traversal to find all key/valir pairs and create an array with unique keys for each value.
        traverse(dynamicSecret);

        // Iterate over the unique pairs and send to GitHub Actions environment variables and outputs
        for (const item of outputArray) {
          const actualKey = Object.keys(item)[0];
          let actualValue = Object.values(item)[0];

          if (actualKey === 'secret' && stringifyOutput) {
            actualValue = JSON.stringify(actualValue);
          }

          core.info(`\u001b[38;2;133;238;144mTEMPDEBUG - actualKey: ${actualKey}, actualValue: ${actualValue} `);

          let finalVarName = variableName;

          if (variableName === null || variableName.trim() === '') {
            finalVarName = `${actualKey}`;
          } else {
            finalVarName = `${variableName}_${actualKey}`;
          }

          // obscure value in visible output and logs
          //core.setSecret(actualValue);  // !!! TEMPORARY COMMENT !!!

          // Switch 1 - set outputs
          if (exportSecretsToOutputs) {
            core.setOutput(finalVarName, actualValue);
          }

          // Switch 2 - export env variables
          if (exportSecretsToEnvironment) {
            core.exportVariable(finalVarName, actualValue);
          }
        }

        core.info('\u001b[38;2;0;255;0mExport Complete');

        // for (const key in dynamicSecret) {
        //   const toOutput = dynamicSecret;

        //   // get the value for the key
        //   const value = toOutput[key];

        //   // obscure value in visible output and logs
        //   core.setSecret(value);

        //   // if the user set an output variable name, use it to prefix the output/env var's name
        //   let finalVarName = variableName;
        //   if (variableName === null || variableName.trim() === '') {
        //     finalVarName = `${key}`;
        //   } else {
        //     finalVarName = `${variableName}_${key}`;
        //   }

        //   // Switch 1 - set outputs
        //   if (exportSecretsToOutputs) {
        //     core.setOutput(finalVarName, value);
        //   }

        //   // Switch 2 - export env variables
        //   if (exportSecretsToEnvironment) {
        //     core.exportVariable(finalVarName, value);
        //   }

        //   // Debugging
        //   // if (toOutput.hasOwnProperty(key)) {
        //   //   core.info(`Property ${key} is NOT from prototype chain`);
        //   // } else {
        //   //   core.info(`Property ${key} is from prototype chain. contact developer to share special dynamic secret situation.`);
        //   // }
        // }
      }
    } catch (error) {
      core.error(`Failed to export dynamic secrets: ${JSON.stringify(error)}`);
      core.setFailed(`Failed to export dynamic secrets: ${JSON.stringify(error)}`);
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
      core.error(`getSecretValue Failed: ${JSON.stringify(error)}`);
      core.setFailed(`getSecretValue Failed: ${JSON.stringify(error)}`);
    });

    if (staticSecret === undefined) {
      return;
    }

    const secretValue = staticSecret[name];

    core.setSecret(secretValue);

    // - Switch 1 -
    // set outputs
    if (exportSecretsToOutputs) {
      core.setOutput(variableName, secretValue);
    }

    // - Switch 2 -
    // export env variables
    if (exportSecretsToEnvironment) {
      core.exportVariable(variableName, secretValue);
    }
  }
}

exports.exportDynamicSecrets = exportDynamicSecrets;
exports.exportStaticSecrets = exportStaticSecrets;
