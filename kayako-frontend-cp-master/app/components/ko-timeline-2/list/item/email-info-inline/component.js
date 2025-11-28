import { debounce, scheduleOnce } from '@ember/runloop';
import Component from '@ember/component';
import { computed } from '@ember/object';
import { filterBy, or } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import ResizeAware from 'ember-resize/mixins/resize-aware';
import styles from './styles';
import he from 'npm:he';

const RESIZE_DEBOUNCE_INTERVAL = 100;

export default Component.extend(ResizeAware, {
  tagName: 'span',

  // Services
  i18n: service(),
  store: service(),

  // Attributes
  post: null,
  isChevronActive: false,
  resizeWidthSensitive: true,
  othersCount: 0,

  didInsertElement() {
    scheduleOnce('afterRender', this, 'handleCCListOverflow', 50);
    this._super(...arguments);
  },

  // Event Handlers
  didResize() {
    debounce(this, 'handleCCListOverflow', RESIZE_DEBOUNCE_INTERVAL);
  },

  // Methods
  handleCCListOverflow(extraOffset = 0) {
    if (this.get('isDestroyed') || this.get('isDestroying')) {
      return;
    }

    let element = $(this.element);
    element.find('.' + styles['email-item-cc'] + '.' + styles['no-comma']).removeClass(styles['no-comma']);
    let parentRightEdge = element.parent().position().left + element.parent().width();
    let offsetForTrigger = 100 + extraOffset;

    let childrenVisible = element.find('.' + styles['email-item-cc'] + ':visible');
    let childrenHidden = element.find('.' + styles['email-item-cc'] + ':hidden');

    let chevron = element.find('.' + styles['details-chevron']);
    let chevronRightEdge = chevron.position().left + chevron.width() + offsetForTrigger;

    let difference = Math.ceil(chevronRightEdge - parentRightEdge);

    this.set('othersCount', childrenHidden.length + 1);
    let visibilityToggledCount = -1;
    if (difference > 0 && childrenVisible.length > 1) {
      let childrenOverflowWidth = 0;
      childrenVisible.toArray().reverse().some((child) => {
        let width = Math.ceil($(child).width());
        let nextChildIsInView = (childrenOverflowWidth + width - offsetForTrigger > difference);
        if (nextChildIsInView) {
          return true;
        }
        $(child).addClass(styles.hide);
        childrenOverflowWidth += width;
        visibilityToggledCount++;
      });
    }
    else if (difference <= 0 && childrenHidden.length >= 1) {
      let inverseDiff = (difference * -1);
      let childrenOverflowWidth = 0;
      childrenHidden.toArray().some((child) => {
        let width = Math.ceil($(child).width());
        let nextChildIsOverflowing = (childrenOverflowWidth + width > inverseDiff);
        if (nextChildIsOverflowing) {
          return true;
        }
        $(child).removeClass(styles.hide);
        childrenOverflowWidth += width;
        visibilityToggledCount--;
      });
    }
    element.find('.' + styles['email-item-cc'] + ':visible:last').addClass(styles['no-comma']);
    this.set('othersCount', this.get('othersCount') + visibilityToggledCount);
  },

  isLastCC(length, others, index) {
    return (others === 0 && index === length - 1 && index !== 0);
  },

  isOnlyRecipient(length, others, index) {
    return (others === length - 1 && index === 0);
  },

  // CPs
  ccRecipients: filterBy('post.recipients', 'isCC'),
  toRecipients: filterBy('post.recipients', 'isTo'),
  recipients: computed('ccRecipients', 'toRecipients', function () {
    let cc = this.get('ccRecipients');
    let to = this.get('toRecipients');

    let recipients = to.concat(cc);
    return recipients.uniqBy('identity.email');
  }),
  othersText: computed('othersCount', function () {
    if (this.get('othersCount') > 1) {
      return this.get('i18n').t('cases.more_info.others');
    }
    return this.get('i18n').t('cases.more_info.other');
  }),

  caseSubject: computed('case.subject', function () {
    if (this.get('postType') === 'side_conversation') {
      return he.unescape(this.get('post.subject'));
    }
    return he.unescape(this.get('case.subject'));
  }),

  show: or('post.email', 'ccRecipients.length', 'toRecipients.length'),

  onAddCC: () => {}
});
