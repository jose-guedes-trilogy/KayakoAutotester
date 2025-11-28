/* eslint-env node  */

// Adds UID placholder to SVG IDs so that they don't collide with other SVGs
// We then replace this per-render in inline-svg so each SVG is unique

const UID_PLACEHOLDER = '%UID%';

module.exports = {
  type: 'full',
  fn: function(data, params) {
    return parse(data);
  }
};

function parse(items) {
  let i, item;

  for (i = 0; i < items.content.length; i++) {
    item = items.content[i];

    if (item.isElem()) {
      item.eachAttr(parseAttr);
    }

    if (item.content) {
      parse(item);
    }
  }
  return items;
}

function parseAttr(attr) {
  if (attr.name === 'id') {
    attr.value = attr.value + '-' + UID_PLACEHOLDER;
  }

  if (attr.name === 'xlink:href') {
    attr.value = attr.value + '-' + UID_PLACEHOLDER;
  }

  if (attr.name === 'mask') {
    attr.value = attr.value.replace(/url\((#[^)]+)\)/, 'url($1-' + UID_PLACEHOLDER + ')');
  }
}
