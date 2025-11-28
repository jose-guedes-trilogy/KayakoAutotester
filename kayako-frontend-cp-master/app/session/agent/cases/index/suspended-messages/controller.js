/* eslint-disable no-alert */
import { filterBy } from '@ember/object/computed';

import { computed } from '@ember/object';

import Controller from '@ember/controller';
import config from 'frontend-cp/config/environment';
import { inject as service } from '@ember/service';
import { getOwner } from '@ember/application';
import $ from 'jquery';
import computeSelected from 'frontend-cp/utils/compute-selected';

const CASE_PAGE_LIMIT = config.casesPageSize;

export default Controller.extend({
  queryParams: ['page', 'view'],
  page: 1,
  columns: ['from', 'subject', 'createdAt', 'suspensionCode'],
  selectedMailIds: [],
  i18n: service(),
  confirmation: service(),

  // CPs
  suspendedMails: filterBy('model', 'isSuspended', true),

  totalPages: computed('model.meta.total', function() {
    const totalCases = this.get('model.meta.total');
    return Math.ceil(totalCases / CASE_PAGE_LIMIT);
  }),

  isEverythingChecked: computed('selectedMailIds.length', 'suspendedMails.length', function() {
    let selected = this.get('selectedMailIds.length');
    let total = this.get('suspendedMails.length');

    return selected === total;
  }),

  actions: {
    selectAll() {
      this.set('selectedMailIds', this.get('suspendedMails').mapBy('id'));
    },

    toggleCheck(rowMail, checked, shiftKey) {
      const selectedMailIds = [...this.get('selectedMailIds')];

      if (shiftKey && selectedMailIds.length) {
        const allMailIds = this.get('suspendedMails').mapBy('id');
        const selectedRows = computeSelected(rowMail.id, checked, selectedMailIds, allMailIds);
        this.set('selectedMailIds', selectedRows);
        return;
      }

      if (checked) {
        selectedMailIds.push(rowMail.id);
      } else {
        selectedMailIds.removeObject(rowMail.id);
      }

      this.set('selectedMailIds', selectedMailIds);
    },

    deselectAll() {
      this.set('selectedMailIds', []);
    },

    showMail(mail) {
      this.target.send('showMail', mail);
    },

    permanentlyDeleteSelectedMails() {
      let selectedMailIds = this.get('selectedMailIds');
      let selectedMails = this.get('suspendedMails').filter((mail) => {
        return selectedMailIds.includes(mail.id);
      });

      return this.get('confirmation').confirm({
        intlConfirmationBody: 'cases.suspendedMessages.confirmDeleteAll'
      }).then(() => {
        let ids = selectedMailIds;
        let adapter = getOwner(this).lookup('adapter:application');
        let url = `${adapter.namespace}/mails?${$.param({ ids })}`;
        return adapter.ajax(url, 'DELETE');
      }).then(() => {
        this.send('refreshPage');
        this.set('selectedMailIds', []);
        selectedMails.forEach(m => m.unloadRecord());
      });
    },

    tableSorted(column, order) {
      this.setProperties({ orderBy: order, orderByColumn: column });
    }
  }
});
