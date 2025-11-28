import { typeOf } from '@ember/utils';
import { helper } from '@ember/component/helper';
import { htmlSafe } from '@ember/string';
import Ember from 'ember';

const ALLOWED_ATTRIBUTE_NAMES = ['rel', 'class'];

const urlRegex = function() {
  return /(["'])?(?:(?:(?:(?:https?|ftp\w):)?\/\/)|(?:www.))(?:\S+(?::\S*)?@)?(?:(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:1\d\d|2[0-4]\d|25[0-4]|[1-9]\d?))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/[^\s\]]*)?\1(?=$|\s|])/ig;
};

export function linkify(params, options) {
  let textToLinkify = Ember.Handlebars.Utils.escapeExpression(params[0]);
  const sharedAttributes = opts2attrs(options);

  textToLinkify = textToLinkify.replace(urlRegex(), function (s) {
    let url;
    let displayText = s.trim();
    let matchedNewLines = s.match(/\n/g) || [];

    if (s.trim().match(/^www\./ig)) {
      url = 'http://' + s.trim();
    } else {
      url = s.trim();
    }

    const href = isInternalURL(url) ? stripDomain(url) : url;
    const internalAttributes = isInternalURL(url) ? [] : ['target="_blank"', 'rel="noreferrer noopener"'];
    const attributes = [...internalAttributes, ...sharedAttributes].join(' ');
    const link = `<a href="${href}" ${attributes}>${displayText}</a>`;
    return link + (matchedNewLines.length ? matchedNewLines[0] : '');
  });

  return htmlSafe(textToLinkify);
}

export default helper(linkify);

export function stripDomainFromLinkHrefs(content) {
  const domainRegex = new RegExp(`href=['"]https?://${window.location.host}/(agent|admin)([^'"]*)['"]`, 'gi');
  return content.replace(domainRegex, 'href="/$1$2"');
}

export function isInternalURL(url) {
  const agentPanel = window.location.origin + '/agent';
  const adminPanel = window.location.origin + '/admin';
  return url.indexOf(agentPanel) === 0 || url.indexOf(adminPanel) === 0;
}

export function stripDomain(url) {
  return url.replace(/^.*\/\/[^/]+/, '');
}

function opts2attrs(options) {
  const stringOfAttributes = [''];

  if (typeOf(options) === 'object') {
    for (let i = 0; i < ALLOWED_ATTRIBUTE_NAMES.length; i++) {
      const attributeName = ALLOWED_ATTRIBUTE_NAMES[i];
      if (attributeName in options) {
        stringOfAttributes.push(`${attributeName}="${options[attributeName]}"`);
      }
    }
  }

  return stringOfAttributes.join(' ');
}
