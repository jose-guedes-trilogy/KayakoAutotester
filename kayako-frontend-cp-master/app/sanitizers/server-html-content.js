// Based on RELAXED config, allows pretty much anything barring scripts

export default {
  elements: [
    'a', 'b', 'blockquote', 'br', 'caption', 'cite', 'code', 'col',
    'colgroup', 'dd', 'dl', 'dt', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'i', 'img', 'li', 'ol', 'p', 'pre', 'q', 'small', 'strike', 'strong',
    'sub', 'sup', 'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'tr', 'u',
    'ul', 'span', 'div', 'font'
  ],

  attributes: {
    a: ['href', 'title', 'target', 'rel'],
    blockquote: ['cite'],
    col: ['span', 'width'],
    colgroup: ['span', 'width'],
    img: ['align', 'alt', 'height', 'src', 'title', 'width'],
    ol: ['start', 'type'],
    q: ['cite'],
    table: ['summary', 'width'],
    td: ['abbr', 'axis', 'colspan', 'rowspan', 'width'],
    th: ['abbr', 'axis', 'colspan', 'rowspan', 'scope', 'width'],
    ul: ['type'],
    font: ['face', 'color', 'size'],
    div: ['class'],
    span: ['id', 'class', 'contenteditable', 'data-atwho-at-query', 'data-mention-id', 'data-mention-type']
  },

  protocols: {
    a: {
      href: ['ftp', 'http', 'https', 'mailto', window.Sanitize.RELATIVE]
    },
    blockquote: {
      cite: ['http', 'https', window.Sanitize.RELATIVE]
    },
    img: {
      src: ['http', 'https', 'data', window.Sanitize.RELATIVE]
    },
    q: {
      cite: ['http', 'https', window.Sanitize.RELATIVE]
    }
  },

  transformers: [wrapAndJoineLineBreaks]
};

/*
 * Wraps BR tags with a wrapping DIV to make them easier to style
 * Multiple BR tags are collapsed down to one wrapping DIV with a class of br-wrapper--multiple
 * BR tags wrapped in <div> are given a wrapping class of br-wrapper--multiple
 * Single BR tags are given a wrapping class of br-wrapper--single
 */
function wrapAndJoineLineBreaks({ allowed_elements, config, dom, node, whitelist_nodes }) {
  if (node.nodeName.toLowerCase() === 'br') {
    if (node.parentNode.className.indexOf('br-wrapper') !== -1) {
      return null;
    }

    const prevSibling = previousSiblingIgnoringBlankText(node);
    const nextSibling = nextSiblingIgnoringBlankText(node);

    if (prevSibling && prevSibling.nodeName.toLowerCase() === 'br') {
      return {
        node: dom.createElement('INVALID') // will be removed
      };
    } else {
      const div = dom.createElement('div');

      if ((nextSibling && nextSibling.nodeName.toLowerCase() === 'br') || 
        (node.parentNode.nodeName.toLowerCase() === 'div' && node.parentNode.classList.length === 0)) {
        div.className = 'br-wrapper br-wrapper--multiple';
      } else {
        div.className = 'br-wrapper br-wrapper--single';
      }

      div.appendChild(dom.createElement('br'));

      return {
        node: div,
        attr_whitelist: ['class']
      };
    }
  }

  return null;
}

function previousSiblingIgnoringBlankText(node) {
  let sibling = node.previousSibling;
  while (isBlankTextNode(sibling)) {
    sibling = sibling.previousSibling;
  }
  return sibling;
}

function nextSiblingIgnoringBlankText(node) {
  let sibling = node.nextSibling;
  while (isBlankTextNode(sibling)) {
    sibling = sibling.nextSibling;
  }
  return sibling;
}

function isBlankTextNode(node) {
  return node && node.nodeType === 3 && node.textContent.trim().length === 0;
}
