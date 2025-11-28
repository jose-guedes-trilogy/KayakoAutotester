import Component from '@ember/component';

export default Component.extend({
  tagName: '',

  titleField: 'fullName',

  isLoading: false,
  showAvatarImage: true,
  actorAvatar: null,
  selected: null,
  searchField: null,
  options: null,
  onChange: null,
  search: null,
  description: null
});
