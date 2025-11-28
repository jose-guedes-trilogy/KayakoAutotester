import { getOwner } from '@ember/application';
import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import $ from 'jquery';
import { nativeMouseDown } from 'frontend-cp/tests/helpers/ember-power-select';
import { run } from '@ember/runloop';
import RSVP from 'rsvp';
import { triggerEvent } from 'ember-native-dom-helpers';
import Service from '@ember/service';
import { EDITOR_SELECTOR } from 'frontend-cp/components/ko-text-editor/component';

moduleForComponent('ko-text-editor', 'Integration | Component | ko text editor', {
  integration: true,

  beforeEach() {
    let intl = getOwner(this).lookup('service:intl');
    intl.setLocale('en-us');
    intl.addTranslations('en-us', {
      generic: {
        to_browse: 'to browse',
        to_select: 'to select',
        keyboard_shortcuts: {
          enter: 'Enter'
        }
      }
    });
  }
});

function awaitNext() {
  return new RSVP.Promise(resolve => run.next(resolve));
}

test('it renders @mentions popup', async function(assert) {
  assert.expect(6);

  this.register('service:uuid', Service.extend({
    uuid() {
      return '9999';
    }
  }));

  this.register('service:store', Service.extend({
    query(type, options) {
      assert.equal(type, 'user', 'Request for user resource');
      assert.equal(options.role, 'collaborator', 'Collaborators and above requested');
      assert.equal(options.fields, 'resource_type,is_enabled,full_name,avatar,emails', 'Resource fields requested');
      assert.equal(options.include[0], 'identity_email', 'Nested resources requested');

      return RSVP.resolve([
        { id: '1', fullName: 'Albert Einstein', primaryEmail: { email: 'albert@science.com' }, isEnabled: true },
        { id: '3', fullName: 'Micheal Faraday', primaryEmail: { email: 'fazza@science.com' }, isEnabled: true },
        { id: '2', fullName: 'Nikola Tesla', primaryEmail: { email: 'tesla@science.com' }, isEnabled: true },
        { id: '4', fullName: 'Marie Curie', primaryEmail: { email: 'curie@radium.eu' }, isEnabled: false }
      ]);
    }
  }));

  this.render(hbs`
    {{#ko-text-editor as |editor|}}
      {{editor.at-mention-support}}
    {{/ko-text-editor}}
  `);

  await awaitNext();

  let editor = this.$(EDITOR_SELECTOR);
  editor.froalaEditor('html.set', '@');

  moveCaretToEnd();

  await triggerEvent(`${EDITOR_SELECTOR} [contenteditable]`, 'keyup');

  await awaitNext();

  assert.deepEqual(mentionSuggestions(), [
    { name: 'Albert Einstein', email: 'albert@science.com' },
    { name: 'Micheal Faraday', email: 'fazza@science.com' },
    { name: 'Nikola Tesla', email: 'tesla@science.com' }
  ], 'All enabled users were rendered while disabled ones were not.');

  click('li.mentions-list-item-wrapper:eq(1)');

  assert.equal(editor.froalaEditor('html.get').replace(/&nbsp;/g, ''), '<div><span class="fr-deletable ko-mention atwho-inserted" contenteditable="false" data-atwho-at-query="@" data-mention-id="3" data-mention-type="user" id="9999">@Micheal Faraday</span></div>', 'Mention html inserted in to DOM');
});

test('@mentions popup has you badge for current user', async function (assert) {
  this.register('service:uuid', Service.extend({
    uuid() {
      return '9999';
    }
  }));

  this.register('service:session', Service.extend({
    user: {
      id: '1'
    }
  }));

  this.register('service:i18n', Service.extend({
    t(key) {
      return 'YOU';
    }
  }));

  this.register('service:store', Service.extend({
    query(type, options) {
      return RSVP.resolve([
        { id: '1', fullName: 'Albert Einstein', primaryEmail: { email: 'albert@science.com' }, isEnabled: true },
        { id: '3', fullName: 'Micheal Faraday', primaryEmail: { email: 'fazza@science.com' }, isEnabled: true },
        { id: '2', fullName: 'Nikola Tesla', primaryEmail: { email: 'tesla@science.com' }, isEnabled: true }
      ]);
    }
  }));

  this.render(hbs`
    {{#ko-text-editor as |editor|}}
      {{editor.at-mention-support}}
    {{/ko-text-editor}}
  `);

  await awaitNext();

  let editor = this.$(EDITOR_SELECTOR);
  editor.froalaEditor('html.set', '@');

  moveCaretToEnd();

  await triggerEvent(`${EDITOR_SELECTOR} [contenteditable]`, 'keyup');

  await awaitNext();

  assert.equal($('.mentions-you-wrapper').length, 1, 'There should be one user with YOU badge');
});

test('inserting a link', function (assert) {
  let receivedText;

  this.set('onTextChanged', text => receivedText = text);

  this.render(hbs`
    {{ko-text-editor
      value="Example:"
      onTextChanged=(action onTextChanged)}}
  `);

  moveCaretToEnd();
  click('.qa__ko-text-editor__link-trigger');
  fillIn('.qa__ko-text-editor__link-url', 'https://example.com');
  fillIn('.qa__ko-text-editor__link-label', 'Link');
  click('.qa__ko-text-editor__link-submit');

  assert.equal(
    sanitizeString(receivedText),
    '<div>&nbsp;</div><div>Example:<a href="https://example.com">Link</a></div>',
    'received the expected text'
  );
});

test('inserting a link with text selected', function(assert) {
  let receivedText;

  this.set('onTextChanged', text => receivedText = text);

  this.render(hbs`
    {{ko-text-editor
      value="This is a link."
      onTextChanged=(action onTextChanged)}}
  `);

  selectEditorContents();
  click('.qa__ko-text-editor__link-trigger');
  fillIn('.qa__ko-text-editor__link-url', 'https://example.com');
  click('.qa__ko-text-editor__link-submit');

  assert.equal(
    receivedText,
    '<div>&nbsp;</div><div><a href="https://example.com">This is a link.</a></div>',
    'received the expected text'
  );
});

function click(selector) {
  let $element = $(selector);

  nativeMouseDown($element[0]);
  $element.click();
}

function fillIn(selector, text) {
  let element = $(selector)[0];
  let event = document.createEvent('Events');

  event.initEvent('input', true, true);

  element.value = text;
  element.dispatchEvent(event);
}

function sanitizeString(string) {
  return string.replace(/[^\x00-\x7F]/g, '');
}

function selectEditorContents() {
  let { textNode, selection, range } = getEditorInfo();

  range.selectNodeContents(textNode);
  selection.removeAllRanges();
  selection.addRange(range);
}

function moveCaretToEnd() {
  let { textNode, selection, range } = getEditorInfo();
  range.selectNodeContents(textNode);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
}

function getEditorInfo() {
  let selector = `${EDITOR_SELECTOR} [contenteditable]`;
  let editor = document.querySelector(selector);
  let textNode = editor.childNodes[0];  
  let range = document.createRange();
  let selection = window.getSelection();

  return { editor, textNode, range, selection };
}

function mentionSuggestions() {
  return $('.atwho-view-ul .mentions-list-item').toArray()
    .map(item => {
      let $item = $(item);

      return {
        name: $item.find('.mentions-full-name').text(),
        email: $item.find('.mentions-primary-email').text()
      };
    });
}
