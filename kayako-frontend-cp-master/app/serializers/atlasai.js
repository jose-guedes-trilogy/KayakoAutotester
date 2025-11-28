import ApplicationSerializer from './application';

export default ApplicationSerializer.extend({
normalizeResponse(store, primaryModelClass, payload, id, requestType) {
    // The /atlasai endpoint returns resource type=setting. Overriding it to "atlasai" so that it uses the correct models and serializers.
    payload.data.forEach(item => {
        item.resource_type = 'atlasai';
    });
    payload.resource = 'atlasai';
    return this._super(...arguments);
}
});
