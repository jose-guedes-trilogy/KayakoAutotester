function fromString(windowHash) {
  if (!windowHash || windowHash.length === 0) {
    return {};
  }

  const hashes = windowHash.substring(1).split('&');

  const getKV = (hash) => {
    const arr = hash.split('=');
    const key = arr[0];
    const val = arr.slice(1).join('=');
    return [key, (val === '') ? key : val];
  };

  let obj = {};
  for (let hash of hashes) {
    const [key, val] = getKV(hash);
    obj[key] = val;
  }

  return obj;
}

function toString(structure) {
  const arr = Object.entries(structure).map(([key, value]) => key === value ? key : `${key}=${value}`);
  return arr.length > 0 ? `#${arr.join('&')}` : '';
}

function removeKey(structure, keyToRemove) {
  let res = Object.assign({}, structure);
  delete res[keyToRemove];
  return res;
}

function getValue(structure, keyToSelect) {
  return structure[keyToSelect] || '';
}

export function getImpersonationHash(windowHash) {
  return getValue(fromString(windowHash), 'impersonationToken');
}

export function removeImpersonationHash(windowHash) {
  return toString(removeKey(fromString(windowHash), 'impersonationToken'));
}
