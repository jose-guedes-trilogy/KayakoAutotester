export function getMetaData(error, container) {

  // TODO - move into ember-cli-bugsnag addon so we can configure it in environment.js
  // increase maxDepth of payload before it strips it out as [RECURSIVE]
  window.Bugsnag.maxDepth = 10;

  let sessionService = container.lookup('service:session');
  let requestHistoryService = container.lookup('service:request-history');

  let fullStoryURL;
  if (window.FS && window.FS.getCurrentSessionURL) {
    fullStoryURL = window.FS.getCurrentSessionURL(true);
  }

  let metaData = {
    user: {
      fullName: sessionService.get('user.fullName'),
      email: sessionService.get('user.primaryEmail.email'),
      userId: sessionService.get('user.id'),
      grammarly: document.body.dataset && document.body.dataset.grCSLoaded === 'true'
    },
    api: {
      requests: requestHistoryService.recentSanitized()
    },
    session: {
      createdAt: sessionService.get('session.createdAt') && sessionService.get('session.createdAt').toISOString(),
      lastActivityAt: sessionService.get('session.lastActivityAt') && sessionService.get('session.lastActivityAt').toISOString(),
      csrfToken: sessionService.get('csrfToken'),
      ipAddress: sessionService.get('ipAddress'),
      sessionUserAgent: sessionService.get('session.userAgent'),
      sessionId: sessionService.get('sessionId'),
      rememberMeToken: sessionService.get('rememberMeToken'),
      userAgent: encodeURIComponent(navigator.userAgent),
      location: encodeURIComponent(window.location.href)
    },
    fullstory: {
      urlAtTime: fullStoryURL
    }
  };

  // get to the bottom of UnknownErrorClass errors
  if (!error || (!error.stack && typeof error !== 'string')) {
    metaData.unknown = {
      type: typeof error,
      json: serializeErrorObject(error),
      str:  (error && error.toString) ? error.toString() : null
    };
  }

  return metaData;
}

function serializeErrorObject(error) {
  try {
    return JSON.stringify(error);
  } catch(e) {
    return 'Cannot serialize to JSON';
  }
}

// Background context: bugsnag consolidates errors by the error name. It's _always_ `error` so
// we only see 1 error with lots of crazy events in the dashboard. Might be nice if we can even split
// this out into context as well. But I think this will be enough
export function getErrorName(error, container) {
  // temporarily disabled to see if enabling source-maps has improved the grouping
  // return error.name + ' | ' + error.message;
  return null;
}
