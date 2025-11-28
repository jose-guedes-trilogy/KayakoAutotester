import { stripDomain } from 'frontend-cp/helpers/ko-linkify';

export default function parseSummary(str) {
  const tokens = [];

  let lastPos = 0;
  str.replace(/<[^>]+>/g, (match, offset) => {
    if (lastPos !== offset) {
      tokens.push(parseToken(str.slice(lastPos, offset)));
    }
    tokens.push(parseToken(match));
    lastPos = offset + match.length;
  });
  if (lastPos !== str.length) {
    tokens.push(parseToken(str.slice(lastPos)));
  }

  return tokens.filter(token => token.content);
}

function parseToken(token) {
  return parseActor(token) || parseEntity(token) || parseText(token);
}

const ACTOR_REGEX = /^<@([^|]*)\|(.*)>$/;
function parseActor(str) {
  const matches = str.match(ACTOR_REGEX);
  if (!matches) {
    return null;
  }
  const [, url, content] = matches;

  return {
    type: 'actor',
    url: parseURL(url),
    content
  };
}

const ENTITY_REGEX = /^<([^@]?.*)\|(.*)>$/;
function parseEntity(str) {
  const matches = str.match(ENTITY_REGEX);
  if (!matches) {
    return null;
  }

  const [, url, content] = matches;

  return {
    type: 'entity',
    url: parseURL(url),
    content
  };
}

function parseText(str) {
  return {
    type: 'text',
    content: str.trim()
  };
}

const USER_URL_REGEX = /Base\/User\/(\d+)/;
const CASE_URL_REGEX = /Base\/Case\/(\d+)/;
const INTERNAL_URL_REGEX = /\/agent\//;

function parseURL(url) {
  let matches;

  matches = url.match(INTERNAL_URL_REGEX);
  if (matches) {
    return stripDomain(url);
  }

  matches = url.match(USER_URL_REGEX);
  if (matches) {
    return `/agent/users/${matches[1]}`;
  }

  matches = url.match(CASE_URL_REGEX);
  if (matches) {
    return `/agent/conversations/${matches[1]}`;
  }

  return null;
}
