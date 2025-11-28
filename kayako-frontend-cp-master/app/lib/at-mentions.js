import $ from 'jquery';

function _getId(item) {
  return $(item).attr('id');
}

function _getSubjectId(item) {
  return $(item).attr('data-mention-id');
}

function _getType(item) {
  return $(item).attr('data-mention-type');
}

function extractMentions(html) {
  let $html = $('<div />', { html });

  return $html.find('.ko-mention').toArray()
    .map(item => {
      let id        = _getId(item);
      let subjectId = _getSubjectId(item);
      let type      = _getType(item);
      let text      = $(item).text().trim();

      if (id && subjectId && type) {
        return { id, subjectId, type, text };
      }
    })
    .filter(Boolean);
}

function replaceMentionsWithPlainText(html) {
  let mentions = extractMentions(html);

  return mentions.reduce((h, mention) => {
    return replaceMention(h, mention.id, mention.text);
  }, html);
}

function replaceMention(html, id, replacement) {
  let $html = $('<div />', { html });
  let mention = $html.find(`#${id}`)[0];

  if (mention) {
    let $mention = $(mention);
    $mention.replaceWith(replacement);
  }

  return $html.html();
}

export { extractMentions, replaceMentionsWithPlainText, replaceMention };
