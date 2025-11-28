export function serializeCustomFields(customFields, form) {
  let fieldValues = {};
  let formFields = form ? form.hasMany('fields').map((field) => field.attr('key')) : [];

  if (!customFields) {
    return fieldValues;
  }

  customFields.forEach((customField) => {
    const key = customField.record.get('field.key');
    if (!form || formFields.indexOf(key) > -1) {
      // For some reason its possible for the API to get to a state where
      // the resources of the /api/v1/users contains user_fields that aren't
      // present in /api/v1/users/fields, in that case field.key is undefined
      if (key) {
        fieldValues[key] = customField.attr('value');
      } else {
        /*eslint-disable no-console */
        if (console && console.warn) {
          console.warn('Missing custom field key');
        }
        /*eslint-enable no-console */
      }
    }
  });

  return fieldValues;
}

export function serializeChannelOptions(json, channelOptions) {
  switch (json.channel) {
    case 'MAILBOX':
    case 'MAIL':
      Reflect.deleteProperty(json.channel_options, 'type');

      json.channel_options.html = true;

      let cc = channelOptions.attr('cc');
      if (cc.length) {
        json.channel_options.cc = cc.toString();
      }
      break;
    case 'TWITTER':
      ['cc', 'html'].forEach((key) => {
        Reflect.deleteProperty(json.channel_options, key);
      });
      break;
    case 'FACEBOOK':
      Reflect.deleteProperty(json, 'channel_options');
      break;
    case 'NOTE':
      json.channel_options = { html: true };

      let mentions = channelOptions.attr('mentions');
      if (mentions && mentions.length) {
        json.channel_options.mentions = mentions;
      }
      break;
  }

  return json;
}
