import ApplicationSerializer from './application';

export default ApplicationSerializer.extend({
  attrs: {
    domain: { serialize: false }
  }
});
