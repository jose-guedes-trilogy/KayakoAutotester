import ApplicationAdapter from './application';

export default ApplicationAdapter.extend({
  markAs(id, status) {
    let url = `${this.namespace}/notifications/${id}`;
    return this.ajax(url, 'PUT', {
      data: {
        read_state: status
      }
    });
  },

  markAllAs(id, status) {
    let url = `${this.namespace}/notifications?notification_id=${id}`;
    return this.ajax(url, 'PUT', {
      data: {
        read_state: status
      }
    });
  }
});
