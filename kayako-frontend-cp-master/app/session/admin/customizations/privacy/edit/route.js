import Route from '@ember/routing/route';

export default Route.extend({
    model(params) {
        return this.store.findRecord('privacy-policy', params.privacy_id);
    },

    setupController(controller, privacy) {
        controller.setProperties({ privacy });
        controller.initEdits();
    }
});
