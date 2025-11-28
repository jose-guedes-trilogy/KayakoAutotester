import ApplicationAdapter from './application';

function normalizeConversationData(data, resources) {
  if (Array.isArray(data)) {
    return data
      .map(item => normalizeConversationData(item, resources))
      .reverse();
  } else if (data && typeof data === 'object') {
    // Check if the object is a resource reference
    if (data.id && data.resource_type && Object.keys(data).length === 2) {
      const resourceType = data.resource_type;
      const resourceId = data.id;
      const resourceData = resources[resourceType] && resources[resourceType][resourceId];
      if (resourceData) {
        return normalizeConversationData(resourceData, resources);
      }
    }
    // Recursively normalize each property
    const normalizedObject = {};
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        normalizedObject[key] = normalizeConversationData(data[key], resources);
      }
    }
    return normalizedObject;
  }
  // Return data if it's neither an array nor an object
  return data;
}

export default ApplicationAdapter.extend({
  pathForType() {
    return 'side-conversations';
  },

  createNewSideConversation(caseId, subject, contents, channelOptions, attachmentFileIds) {
    const url = `${this.namespace}/cases/${caseId}/${this.pathForType()}`;
    const data = {
      subject: subject,
      contents: contents,
      channel_options: channelOptions,
      attachment_file_ids: attachmentFileIds
    };

    return this.ajax(url, 'POST', {
      contentType: 'application/json',
      data
    }).then(response => {
      const normalizedData = normalizeConversationData(response.data, response.resources);
      return normalizedData;
    });
  },

  replyToSideConversation(conversationId, contents, channelOptions, attachmentFileIds) {
    const url = `${this.namespace}/side-conversations/${conversationId}/messages?include=case_message`;
    const data = {
      contents: contents,
      channel_options: channelOptions,
      attachment_file_ids: attachmentFileIds
    };

    return this.ajax(url, 'POST', {
      contentType: 'application/json',
      data
    }).then(response => {
      const normalizedData = normalizeConversationData(response.data, response.resources);
      return normalizedData;
    });
  },

  loadSideConversation(conversationId, query) {
    const url = `${this.namespace}/side-conversations/${conversationId}/messages?include=*`;
    return this.ajax(url, 'GET', { data: query }).then(response => {
      const normalizedData = normalizeConversationData(response.data, response.resources);
      return normalizedData;
    });
  },
  

  updateStatus(caseId, conversationId, status) {
    const url = `${this.namespace}/cases/${caseId}/side-conversations/${conversationId}/status`;
    return this.ajax(url, 'PUT', { data: { status } });
  },

  query(store, type, query) {
    // Construct the URL for the request
    let url = `${this.namespace}/cases/${query.caseId}/${this.pathForType()}`;
    // Make the AJAX request with the query parameters
    return this.ajax(url, 'GET', { data: query });
  }
});
