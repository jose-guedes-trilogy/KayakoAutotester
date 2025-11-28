import htmlToText from 'npm:html-to-text';
import he from 'npm:he';

/*
 * This function is called when changing from a rich-text channel to a plain text channel
 * The result is still HTML and is rendered inside Froala. Special characters like < and > are
 * rendered as &lt; and &gt; , and new lines are rendered as <br>s. Multiple spaces are encoded as &nbsp;
 */
export function stripFormattingFromHTML(html) {
  let sanitized = htmlToText.fromString(preProcessHTML(html), { tables: true, preserveNewlines: true, wordwrap: false, hideLinkHrefIfSameAsText: true });
  sanitized = he.escape(sanitized);

  return sanitized
    .replace(/\n/g, '<br>')
    .replace(/ {2}/g, ' &nbsp;');
}

/*
 * Called before switching from a rich-text channel to a plain text channel.
 * If there is html which cannot be represented in plain text, we return true
 */
export function HTMLContainsFormatting(html) {
  // closing tags are generally more simple to test for - we just see if there's a closing tag
  // for anything that passes the purify service and would also change formatting
  const validFormattingTags = ['strong', 'a', 'blockquote', 'ol', 'ul', 'em', 'h1', 'h2', 'h3', 'h4', 'pre'];
  const regex = new RegExp(`</(${validFormattingTags.join('|')})>`);
  return regex.test(html);
}

/*
 * Returns HTML for the API
 */
export function formatHTMLForSendingAsHTML(html) {
  return preProcessHTML(html.trim());
}

/*
 * Returns HTML converted into plain text.
 * Replaces <br> with \n and
 * Replaces &lt; with <
 * Replaces <a href="http://lol.com">http://lol.com</a> with http://lol.com
 * Replaces <a href="http://lol.com">lol</a> with lol [http://lol.com]
 * Removes. \u200B (invisible caret markers)
 */
export function formatHTMLForSendingAsText(html) {
  return htmlToText.fromString(html.trim(), {
    preserveNewlines: true,
    wordwrap: false,
    hideLinkHrefIfSameAsText: true
  }).replace(/\u200B/g, '');
}


/*
 * Pre-clean HTML: The API/html-to-text has some intricacies that need to be cleaned
 * up. Valid HTML doesn't get converted properly, so we need to do it manually
 */
function preProcessHTML(html) {
  // <span>nbsp;</span> is a favourite of Froala and confuses both htmlToText and the API - just make it a space
  let preProcessedHTML = html ? html.replace(/<span>&nbsp;<\/span>/g, ' ') : '';

  // \u200B is what Froala uses to mark caret selection
  preProcessedHTML = preProcessedHTML.replace(/\u200B/g, '');

  return preProcessedHTML;
}
