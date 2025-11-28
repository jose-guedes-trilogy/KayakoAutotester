import ApplicationSerializer from './application';

export default ApplicationSerializer.extend({
  attrs: {
    accountId: { serialize: false },
    title: { serialize: false },
    createdAt: { serialize: false },
    updatedAt: { serialize: false }
  }
});
