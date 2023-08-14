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

  return outputArray;
}

exports.traverse = traverse;
