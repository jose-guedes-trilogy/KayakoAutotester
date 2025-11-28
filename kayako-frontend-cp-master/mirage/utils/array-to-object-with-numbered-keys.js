export default function arrayToObjectWithNumberedKeys(source, indexKey = 'id') {
  let object = {};

  if (source) {
    if (indexKey) {
      source.forEach(item => object[item[indexKey]] = item);
    } else {
      let pos = 1;
      source.forEach(item => {
        object[pos] = item;
        pos++;
      });
    }
  }

  return object;
}
