import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';

export default Component.extend({
    tagName: '',
    suspendedMailsCount: null,
    permissions: service(),

    caseListTab: service('case-list-tab'),
    session: service(),

    filteredViews: computed('customViews', function () {
        return this.get('customViews').filter((view) => {
            return view.get('viewType') !== 'TRASH';
        });
    }),

    trashView: computed('customViews', function () {
        return this.get('customViews').findBy('viewType', 'TRASH');
    }),

    suspendedView: function () {
        return this.get('permissions').has('cases.view_suspended', this.get('session').get('user'));
    }.property(),

    viewSeparator: computed('trashView', 'suspendedView', function () {
        return this.get('suspendedView') || this.get('trashView');
    })
});
