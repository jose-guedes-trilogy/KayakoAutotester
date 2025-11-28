import { computed } from '@ember/object';
import Component from '@ember/component';

export default Component.extend({
  tagName: '',

  notification: null,
  close: () => {},

  activityActions: computed.reads('notification.activity.actions'),
  teamAssigneeActions: computed.filterBy('activityActions', 'field', 'assigneeteamid'),
  user: computed.reads('notification.activity.objectActorUser'),
  teamName: computed('teamAssigneeActions', 'notification', function () {
    if (this.get('teamAssigneeActions.length') > 0) {
      let action = this.get('teamAssigneeActions.firstObject');
      return action.get('newObject.title');
    } else {
      return this.get('notification.activity.case.assignedTeam.title');
    }
  })
});
