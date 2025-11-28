/*eslint-disable camelcase */
import ApplicationSerializer from './application';

export default ApplicationSerializer.extend({
  extractAttributes(modelClass, resourceHash) {
    if (resourceHash.type) {
      resourceHash.field_type = resourceHash.endpoint_type;
      Reflect.deleteProperty(resourceHash, 'endpoint_type');
    }

    // This helps for change aware model to function properly
    resourceHash.attributes.forEach((attribute) => {
      let value = attribute.value;

      switch (attribute.name) {
        case 'address':
          resourceHash.email_destination = value;
          break;
        case 'subject':
          resourceHash.email_subject = value;
          break;
        case 'channel':
          resourceHash.slack_channel = value;
          break;
        case 'webhook_url':
          resourceHash.slack_url = value;
          break;
        case 'url':
          resourceHash.webhook_url = value;
          break;
        case 'method':
          resourceHash.request_method = value;
          break;
        case 'content_type':
          resourceHash.request_content_type = value;
          break;
        case 'use_auth':
          resourceHash.webhook_use_http_auth = value;
          break;
        case 'auth_username':
          resourceHash.webhook_username = value;
          break;
        case 'auth_password':
          resourceHash.webhook_password = value;
          break;
        case 'auth_method':
          resourceHash.webhook_auth_method = value;
          break;
        case 'auth_bearer_token':
          resourceHash.webhook_bearer_token = value;
          break;
        case 'auth_api_key':
          resourceHash.webhook_api_key = value;
          break;
        case 'auth_api_value':
          resourceHash.webhook_api_value = value;
          break;
        case 'custom_headers':
          resourceHash.webhook_custom_headers = value;
          break;
      }
    });

    return this._super(...arguments);
  },

  serialize(snapshot, options) {
    let payload = this._super(...arguments);

    payload.type = payload.field_type;
    Reflect.deleteProperty(payload, 'field_type');

    if (snapshot.attr('fieldType') === 'EMAIL') {
      payload.attributes = {
        address: snapshot.attr('emailDestination'),
        subject: snapshot.attr('emailSubject')
      };
    } else if (snapshot.attr('fieldType') === 'SLACK') {
      payload.attributes = {
        webhook_url: snapshot.attr('slackUrl')
      };
    } else if (snapshot.attr('fieldType') === 'HTTP') {
      payload.attributes = {
        url: snapshot.attr('webhookUrl'),
        method: snapshot.attr('requestMethod'),
        content_type: snapshot.attr('requestContentType'),
        use_auth: snapshot.attr('webhookUseHttpAuth'),
        auth_username: snapshot.attr('webhookUsername'),
        auth_password: snapshot.attr('webhookPassword'),
        custom_headers: snapshot.attr('webhookCustomHeaders')
      };

      // Add the auth method and corresponding fields to attributes
      const authMethod = snapshot.attr('webhookAuthMethod');
      if (authMethod) {
        payload.attributes.auth_method = authMethod;
        if (authMethod === 'bearer') {
          payload.attributes.auth_bearer_token = snapshot.attr('webhookBearerToken');
        } else if (authMethod === 'apikey') {
          payload.attributes.auth_api_key = snapshot.attr('webhookApiKey');
          payload.attributes.auth_api_value = snapshot.attr('webhookApiValue');
        }
      }

    }

    return payload;
  }
});
