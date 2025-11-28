import ApplicationSerializer from './application';

export default ApplicationSerializer.extend({
  attrs: {
    twitterId: { serialize: false },
    screenName: { serialize: false },
    createdAt: { serialize: false },
    updatedAt: { serialize: false }
  }
});
