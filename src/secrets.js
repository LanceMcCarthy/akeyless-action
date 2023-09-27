const core = require('@actions/core');
const akeylessApi = require('./akeyless_api');
const akeyless = require('akeyless');

let parentKey = '';
let grandparentKey = '';
let outputArray = [];

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

function exportValue(actualKey, actualValue, keyPrefix, exportSecretsToOutputs, exportSecretsToEnvironment) {
  let finalVarName = keyPrefix;

  if (keyPrefix === null || keyPrefix.trim() === '') {
    finalVarName = `${actualKey}`;
  } else {
    finalVarName = `${keyPrefix}_${actualKey}`;
  }

  // !!!!!!!!!!!! IMPORTANT !!!!!!!!!!!!!!! //
  
  // REMOVE THIS COMMENT BEFORE PUBLISHING
  //core.setSecret(actualValue);

  // Switch 1 - set outputs
  if (exportSecretsToOutputs) {
    core.setOutput(finalVarName, actualValue);
  }

  // Switch 2 - export env variables
  if (exportSecretsToEnvironment) {
    core.exportVariable(finalVarName, actualValue);
  }
}

async function exportDynamicSecrets(akeylessToken, dynamicSecrets, apiUrl, exportSecretsToOutputs, exportSecretsToEnvironment, generateSeparateOutputs, stringifyOutput) {
  const api = akeylessApi.api(apiUrl);

  core.info('\u001b[38;2;147;232;70mFetching Dynamic Secret...');

  for (const [akeylessPath, variableName] of Object.entries(dynamicSecrets)) {
    try {
      const param = akeyless.GetDynamicSecretValue.constructFromObject({
        token: akeylessToken,
        name: akeylessPath
      });

      const dynamicSecret = await api.getDynamicSecretValue(param).catch(error => {
        core.error(`getDynamicSecretValue Failed: ${JSON.stringify(error)}`);
        core.setFailed(`getDynamicSecretValue Failed: ${JSON.stringify(error)}`);
      });

      // START - AKEYLESS SDK TROUBLESHOOTING

      // This provides [object, Object] which is expected
      core.info(`\u001b[38;2;225;173;1mPRE-PROCESSING CHECK 1: Akeyless SDK output (raw value):`);
      core.info(`\u001b[38;2;255;255;0m(dynamicSecret) = ${dynamicSecret}`);
      core.info(`\u001b[38;2;255;255;0m(dynamicSecret.secret) = ${dynamicSecret.secret}`);
      core.info(`\u001b[38;2;255;255;0m(JSON.stringify(dynamicSecret.secret)) = ${JSON.stringify(dynamicSecret.secret)}`);
      core.info(`\u001b[38;2;225;173;1m-------------------------------------------------------------------------------------------------`);
      
      // // Problem demonstration 1. 'secret' is a string with a value of "[object, Object]", not a json object
      // core.info(`\u001b[38;2;225;173;1mPRE-PROCESSING CHECK 2: Akeyless SDK output (JSON.stringify):`);
      // core.info(`\u001b[38;2;255;255;0mapi.getDynamicSecretValue =  ${JSON.stringify(dynamicSecret)}`);
      // core.info(`\u001b[38;2;225;173;1m-------------------------------------------------------------------------------------------------`);

      // // Problem demonstration 2. Same as #1, but explicitly uses a replacer to ensure nested objects are parsed
      // core.info(`\u001b[38;2;225;173;1mPRE-PROCESSING CHECK 3: Akeyless SDK output (JSON.stringify with replacer):`);
      // core.info(`\u001b[38;2;255;255;0mapi.getDynamicSecretValue =  ${JSON.stringify(dynamicSecret, function replacer(key, value) { return value})}`);
      // core.info(`\u001b[38;2;225;173;1m-------------------------------------------------------------------------------------------------`);

      // // Problem demonstration 3. Same as #1, but explicitly stringifies all known keys
      // core.info(`\u001b[38;2;225;173;1mPRE-PROCESSING CHECK 3: Akeyless SDK output (JSON.stringify with keys):`);
      // core.info(`\u001b[38;2;255;255;0mapi.getDynamicSecretValue =  ${JSON.stringify(dynamicSecret, ['id', 'secret_name', 'secret_key_id', 'msg', 'secret', 'appId', 'displayName', 'keyId', 'secretText', 'tenantId', 'ttl_in_minutes'])}`);
      // core.info(`\u001b[38;2;225;173;1m-------------------------------------------------------------------------------------------------`);

      // END - AKEYLESS SDK TROUBLESHOOTING

      
      // ******************************************** //
      // ******* Option 1 (DEFAULT BEHAVIOR) ******** //
      // ******************************************** //
      // toggled by "parse-dynamic-secrets: false
      // Exports the entire dynamic secret value as one object
      if (generateSeparateOutputs === false) {
        core.info('\u001b[38;2;0;255;255mAutomatic Parsing Disabled - Exporting entire secret...');

        let toOutput = dynamicSecret;

        if (stringifyOutput) {
          core.info('\u001b[38;2;255;255;0mStringifying Output');

          if (dynamicSecret.constructor === Array || dynamicSecret.constructor === Object) {
            toOutput = JSON.stringify(dynamicSecret);
          }
        }

        exportValue(variableName, toOutput, variableName, exportSecretsToOutputs, exportSecretsToEnvironment);
      } else {
        // ******************************************** //
        // **** Option 2 - automatic object parser **** //
        // ******************************************** //
        // toggled by "parse-dynamic-secrets: true
        // Generate separate output/env vars for each value in the dynamic secret
        core.info('\u001b[38;2;0;255;255mAutomatic Parsing Enabled - Iterating over dynamic secret...');

        // NEW APPROACH - Flattens out all subproperties, including arrays.

        // Step 1 - Deep traversal to find all key/value pairs and create an array with unique keys for each value.
        // To avoid key conflicts in deep traverals, the parent's key is used to prefix the subkey. (e.g. "grandparent_parent_key: 1234")
        traverse(dynamicSecret);

        // Step 2 - Iterate over the unique pairs and send to GitHub Actions environment variables and outputs
        for (const item of outputArray) {
          const actualKey = Object.keys(item)[0];
          const actualValue = Object.values(item)[0];

          core.info(`\u001b[38;2;133;238;144mKEY: ${actualKey}, VALUE: ${actualValue}`);

          exportValue(actualKey, actualValue, variableName, exportSecretsToOutputs, exportSecretsToEnvironment);

          // AKEYLESS TROUBLESHOOTING - 1
          // if (actualValue.constructor === Array || actualValue.constructor === Object) {
          //   let stringifiedValue = JSON.stringify(actualValue);
          //   exportValue(actualKey, stringifiedValue, variableName, exportSecretsToOutputs, exportSecretsToEnvironment);
          // }
          // else{
          //   exportValue(actualKey, actualValue, variableName, exportSecretsToOutputs, exportSecretsToEnvironment);
          // }

          // AKEYLESS TROUBLESHOOTING - 2
          // Will output the value of every subkey in 'secret'
          // if (actualKey === 'secret') {
          //   // At this point, actualValue for 'secret' equals the string "[Object, object]"
          //   core.info(`\u001b[38;2;232;191;70mChecking the keys of ${actualKey}:`); // #E8BF46

          //   for (const subkey in actualValue) {
          //     const subkeyValue = actualValue[subkey];

          //     core.info(`\u001b[38;2;219;212;77mSUBKEY: ${subkey}, SUBKEYVALUE: ${subkeyValue}`); // #DBD44D

          //     exportValue(subkey, subkeyValue, variableName, exportSecretsToOutputs, exportSecretsToEnvironment);
          //   }
          // } else {
          //   // all other keys work as expected
          //   exportValue(actualKey, actualValue, variableName, exportSecretsToOutputs, exportSecretsToEnvironment);
          // }
        }

        outputArray = [];

        // ORIGINAL APPROACH - Does not do recursive flattening
        // for (const key in dynamicSecret) {
        //   const value = dynamicSecret[key];

        //   core.info(`\u001b[38;2;133;238;144mKEY: ${key}, VALUE: ${value}`);

        //   // DEBUG Doing additional test logic for 'secret' key's value
        //   if (key === 'secret') {
        //     core.info(`\u001b[38;2;255;80;200mIterating over 'secret' object's keys:`);

        //     for (const subkey in value) {
        //       const subkeyValue = value[subkey];
        //       core.info(`\u001b[38;2;255;255;0mSUBKEY: ${subkey}, SUBKEYVALUE: ${subkeyValue}`);

        //       exportValue(subkey, subkeyValue, variableName, exportSecretsToOutputs, exportSecretsToEnvironment);
        //     }
        //   } else {
        //     exportValue(key, value, variableName, exportSecretsToOutputs, exportSecretsToEnvironment);
        //   }
        // }

        core.info('\u001b[38;2;147;232;70mExport Complete!'); // ##93E846

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

  core.info('\u001b[38;2;147;232;70mFetching Static Secret...');

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

    // Hides value in GH Actions logs
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

    core.info('\u001b[38;2;147;232;70mExport Complete!');
  }
}

exports.exportDynamicSecrets = exportDynamicSecrets;
exports.exportStaticSecrets = exportStaticSecrets;
