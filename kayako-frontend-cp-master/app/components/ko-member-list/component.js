import { scheduleOnce } from '@ember/runloop';
import { A } from '@ember/array';
import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import { readOnly } from '@ember/object/computed';
import KeyboardShortcuts from 'ember-keyboard-shortcuts/mixins/component';
import styles from './styles';

const CUSTOMER_ROLE_ID = 4;

export default Component.extend(KeyboardShortcuts, {
  store: service(),
  session: service(),
  i18n: service(),
  notification: service(),
  router: service('-routing'),

  keyboardShortcuts: {
    esc: {
      action: 'hideDropdown',
      global: true,
      preventDefault: true
    }
  },

  showMemberDropdown: false,
  showMemberExpanded: false,
  addMemberMode: false,
  /**
   * @property searchState
   * @type {'empty'|'creating'}
   */
  searchState: 'empty',
  /**
   * @property userSet
   * @type {'adding member'|'missing'|'members'}
   */
  userSet: 'adding member',
  searchText: '',
  isDisabled: false,
  searchRequest: null,
  userResults: A(),
  addingUserInProgress: false,

  maximumMembersOnTwoRows: 8,

  // Computed Properties
  memberCountText: computed('memberCount', function () {
    let count = this.get('memberCount');
    let max = this.get('maximumMembersOnTwoRows');

    if (count <= max) {
      return this.get('i18n').formatHtmlMessage('organization.member_count', {
        memberCount: count
      });
    }
    else {
      return this.get('i18n').formatHtmlMessage('organization.member_count_extra', {
        currentlyShown: max,
        memberCount: count
      });
    }
  }),
  searchPlaceholder: computed(function () {
    return this.get('i18n').formatHtmlMessage('organization.add_member');
  }),
  memberCreate: computed('searchText', function () {
    let email = this.get('searchText').trim();
    email = email.length ? ' ' + email : '';
    return this.get('i18n').formatHtmlMessage('organization.member_create', {
      email: email
    });
  }),
  memberMissing: computed('searchText', function () {
    if (this.get('searchText').trim().length) {
      return this.get('i18n').formatHtmlMessage('organization.member_missing', {
        term: this.get('searchText')
      });
    }
    else {
      return this.get('i18n').formatHtmlMessage('organization.member_missing_empty', {
        term: this.get('searchText')
      });
    }
  }),
  memberCount: readOnly('members.length'),

  // Methods

  /**
   * @method searchMembers
   * @param {string} term - Term to search for
   * @param {User[]} members - Members to search through
   * @returns {User[]} Members whose name or email match the given term
   */
  searchMembers(term, members) {
    let regex = new RegExp(term, 'ig');

    return members.filter((member) => {
      return regex.test(member.full_name) || regex.test(member.email); // can use to find users by email too
    });
  },

  /**
   * @method isEmail
   * @param {string} term - A string that *might* be an email address
   * @returns {boolean}
   */
  isEmail(term) {
    return /\S+@\S+\.\S+/.test(term);
  },

  /**
   * Adds a user to the set of members to save to the organization.
   *
   * @method handleNewMember
   * @param {User} member - Member to add
   */
  handleNewMember(member) {
    this.set('addingUserInProgress', false);
    this.set('userSet', 'members');
    this.set('searchState', 'empty');
    this.set('addMemberMode', false);
    this.set('showMemberDropdown', false);
    this.get('members').addObject(member);
  },

  focusOnAddMemberField() {
    $(`.${styles['add-member-email']}`).focus();
  },

  actions: {
    goToUser(member) {
      this.get('router').transitionTo('session.agent.users.user', [member.id]);
    },

    toggleMemberDropdown(userSet, isTriggered) {
      let isDown = this.get('addMemberMode');

      if (this.get('userSet') === 'adding member') {
        this.set('userSet', 'missing');
      }

      this.set('addMemberMode', !isDown);

      scheduleOnce('afterRender', this, 'focusOnAddMemberField');
    },

    toggleMemberExpanded(isToggled) {
      let isDown = this.get('showMemberExpanded');
      this.set('showMemberExpanded', !isDown);
    },

    handleInput(e) {
      let value = e.trim();

      if (value.length && this.get('userSet') === 'missing') {
        let isEmail = this.isEmail(value);
        if (isEmail) {
          this.set('searchState', 'creating');
        }
      } else if (this.get('addMemberMode')) {
        return;
      } else {
        this.set('searchState', 'empty');
      }
    },

    toggleAddMemberForm(doShow) {
      let email = this.get('searchText');
      let members = this.searchMembers(email, this.get('members'));

      members = members.filterBy('email', email);

      if (members.length) {
        let member = members[0];
        let msg = this.get('i18n').t('organization.member_already_present', {
          fullName: member.full_name,
          email: member.email,
          orgName: this.get('organization.name')
        });
        this.get('notification').error(msg);
      } else {
        this.set('userSet', 'adding member');
      }
    },

    addUser(email, name) {
      let organization = this.get('organization');
      let store = this.get('store');

      return store.findRecord('role', CUSTOMER_ROLE_ID)
        .then(role => {
          let emailIdentity = store.createRecord('identity-email', {
            isPrimary: true,
            email
          });
          let user = store.createRecord('user', {
            role,
            fullName: name,
            emails: [emailIdentity],
            organization
          });

          this.set('addingUserInProgress', true);

          return user.save()
            .then((mem) => this.handleNewMember(mem))
            .finally(() => this.set('addingUserInProgress', false));
        });
    },

    cancelAddingUser(e) {
      this.set('addMemberMode', false);
      this.set('searchState', 'empty');
      this.set('userSet', 'members');
    },

    hideDropdown(e) {
      this.set('showMemberDropdown', false);
      this.send('cancelAddingUser', e);
    }
  }
});
