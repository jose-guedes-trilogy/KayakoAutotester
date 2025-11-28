import Component from '@ember/component';

export default Component.extend({
  tagName: '',

  // Attrs
  parent: null,
  post: null,
  publicReplyChannels: null,
  posts: null,
  caseFields: null,
  timelineContext: null,
  lastReadPost: null,
  canResend: true,
  'scroll-into-view': () => {},
  onReplyToPost: () => {},
  onReplyWithQuote: () => {},
  onAddCC: () => {},
  onCopyLink: () => {},
  onResend: () => {},
  onItemMenuOpen: () => {}
});
