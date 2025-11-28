/**
 * Makes complete case url
 *
 * @method makeCaseUrl
 *
 * @param  {Object}    event
 *
 * @return {String}
 */
function makeCaseUrl (event) {
  return event.currentTarget.origin + '/agent/conversations/' + event.notification.data.id;
}

/**
 * Returns an array of actions for a given resource type
 *
 * @method getActionsForNotification
 *
 * @param  {Object}                  notification
 *
 * @return {Array}
 */
function getActionsForNotification (notification) {
  /**
   * For now we only support actions for cases
   */
  if (notification.resource_type === 'case' && notification.resource_id) {
    return [{
      action: 'open-case',
      title: 'Open conversation'
    }];
  }

  return [];
}

self.addEventListener('notificationclick', function (event) {
  if (event.action === '' || event.notification.type === 'case') {
    var caseUrl = makeCaseUrl(event);
    clients.openWindow(caseUrl);
  }
});

self.addEventListener('install', function (event) {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('push', function (event) {
  if (!event.data) {
    return;
  }

  var pushPayload = event.data.json();

  /**
   * Cannot show notification when there is no title
   */
  if (!pushPayload.title) {
    return;
  }

  var promiseChain = self.registration.showNotification(pushPayload.title, {
    body: pushPayload.summary,
    icon: pushPayload.avatar_url,
    data: {
      id: pushPayload.resource_id
    },
    type: pushPayload.resource_type
  });

  event.waitUntil(promiseChain);
});
