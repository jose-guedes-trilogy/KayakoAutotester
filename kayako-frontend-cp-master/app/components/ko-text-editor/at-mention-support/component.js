import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { get } from '@ember/object';
import * as KeyCodes from 'frontend-cp/lib/keycodes';
import RSVP from 'rsvp';
import InboundActions from 'ember-component-inbound-actions/inbound-actions';
import { extractMentions } from 'frontend-cp/lib/at-mentions';

const MENTION_CLASS_NAME = 'ko-mention';

export default Component.extend(InboundActions, {
  tagName: '',

  i18n: service(),
  session: service(),
  uuid: service(),
  agentCache: service('cache/agent-cache'),

  atTrigger: '@',
  data: null,
  searchKey: 'name',
  _editor: null,

  didReceiveAttrs() {
    this._super(...arguments);

    let editor = this.get('_editor');

    if (!editor) {
      return;
    }

    this._fetchUsers()
      .then((users) => this._configure(editor, users))
      .then(() => this._subscribeToEvents(editor));
  },

  willDestroy() {
    this._super(...arguments);

    let editor = this.get('_editor');

    if (!editor) {
      return;
    }

    editor.$el.atwho('destroy');
  },

  handlePaste(html) {
    return this._handlePaste(html);
  },

  _fetchUsers() {
    let data = this.get('data');

    if (data) {
      return RSVP.resolve(data);
    }

    return this.get('agentCache').getAgentsForMentions()
      .then(users => this._parseUsers(users))
      .then(users => {
        this.set('data', users);
        return users;
      });
  },

  _headerTemplate() {
    return `
      <div class="mentions-header">
        <div class="mentions-header-contents">
          <div class="mentions-header-left"><span class="text--bold">&uarr;&darr;</span> ${this.get('i18n').t('generic.to_browse')}</div>
          <div class="mentions-header-right">
            <span class="text--bold text--capitalize">${this.get('i18n').t('generic.keyboard_shortcuts.enter')}</span> ${this.get('i18n').t('generic.to_select')}
          </div>
        </div>
      </div>`;
  },

  _itemTemplate() {
    return (map) => {
      return `
        <li class="mentions-list-item-wrapper">
          <div class="mentions-list-item">
            <div class="mentions-avatar-wrapper">
              <img src="\${avatar}" class="mentions-avatar">
            </div>
            <div class="mentions-user-data">
              <div class="mentions-name-wrapper">
                  <div class="mentions-full-name">\${name}</div>
                  ${map.isMe ? `
                  <div class="mentions-you-wrapper">
                    <span class="mentions-you-text">
                      ${this.get('i18n').t('generic.you')}
                    </span>
                  </div>` : ''}
              </div>
              <div class="mentions-primary-email">\${email}</div>
            </div>
          </div>
        </li>`;
    };
  },

  _configure(editor, users) {
    let config = Object.assign({}, this._config(), { data: users });

    editor.$el.atwho(config);
  },

  _subscribeToEvents(editor) {
    this._handleEnterPressWhenMentionsPopupOpen(editor);
    this._handleMentionsSelection(editor);
  },

  _handleEnterPressWhenMentionsPopupOpen(editor) {
    editor.events.on('keydown', (e) => {
      if (e.which === KeyCodes.enter && editor.$el.atwho('isSelecting')) {
        return false;
      }
    }, true);
  },

  _handleMentionsSelection(editor) {
    editor.$el.off('selectstart.ko-mentions');
    editor.$el.on('selectstart.ko-mentions', (e) => {
      editor.$el.one('mouseup keyup', (e) => {
        const selection = window.getSelection();

        if (selection.rangeCount !== 1) { return; }

        const range = selection.getRangeAt(0);
        const newRange = range.cloneRange();

        const isSelectionStartInAMention = this._isSelectionContainerInsideMention(range.startContainer);
        const isSelectionEndInAMention = this._isSelectionContainerInsideMention(range.endContainer);

        if (isSelectionStartInAMention) {
          newRange.setStartBefore(range.startContainer);
        }

        if (isSelectionEndInAMention) {
          newRange.setEndAfter(range.endContainer);
        }

        if (isSelectionStartInAMention || isSelectionEndInAMention) {
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
      });
    });
  },

  _isSelectionContainerInsideMention(container) {
    return container.parentElement && container.parentElement.classList.contains(MENTION_CLASS_NAME);
  },

  _config() {
    let currentUserId = this.get('session.user.id');
    let uuid = this.get('uuid');

    return {
      at: this.get('atTrigger'),
      displayTpl: this._itemTemplate(),
      headerTpl: this._headerTemplate(),
      searchKey: this.get('searchKey'),
      lookUpOnClick: false,
      limit: 25,
      callbacks: {
        beforeInsert(value, $li) {
          let data = $li.data('item-data');
          let id = data.id;
          let type = data.type;

          this.query.el
            .attr('id', uuid.uuid())
            .attr('data-mention-id', id)
            .attr('data-mention-type', type)
            .addClass('fr-deletable')
            .addClass(MENTION_CLASS_NAME);

          if (id === currentUserId) {
            this.query.el
              .addClass('ko-mention-me');
          }

          return value;
        },
        beforeReposition(offset) {
          offset.top = this.rect().top - this.$el.find('.atwho-view').height();
        }
      }
    };
  },

  _parseUsers(users) {
    return users.toArray().filterBy('isEnabled').map(user => {
      return {
        id: get(user, 'id'),
        type: 'user',
        name: get(user, 'fullName'),
        email: get(user, 'primaryEmail.email'),
        avatar: get(user, 'avatar'),
        isMe: (get(user, 'id') === this.get('session.user.id'))
      };
    }).sortBy('name');
  },

  _handlePaste(html) {
    let uuid = this.get('uuid');
    let mentions = extractMentions(html);

    return mentions.reduce((html, { id }) => {
      let $html = $('<div />', { html });

      let mention = $html.find(`#${id}`)[0];

      if (mention) {
        let $mention = $(mention);
        $mention.attr('id', uuid.uuid());

        html = $html.html();
      }

      return html;
    }, html);
  }
});
