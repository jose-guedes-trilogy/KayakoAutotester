export class Location {
  constructor(url = '/') {
    let linkElement = document.createElement('a');
    linkElement.href = url;

    this.hash = linkElement.hash;
    this.host = linkElement.host;
    this.hostname = linkElement.hostname;
    this.href = linkElement.href;
    this.origin = linkElement.origin;
    this.pathname = linkElement.pathname;
    this.port = linkElement.port;
    this.protocol = linkElement.protocol;
    this.search = linkElement.search;
  }
}

export class History {
  constructor({
    location = null,
    state = null,
    title = null
  } = {}) {
    this._location = location || new Location();
    this._entries = [];
    this._currentIndex = -1;

    let path = this._location.href;
    this.pushState(state, title, path);
  }

  get length() {
    return this._entries.length;
  }

  get state() {
    if (this._currentIndex === -1) { return null; }
    return this._entries[this._currentIndex].state;
  }

  back() {
    if (this._currentIndex > 0) {
      this._currentIndex--;
    }
  }

  forward() {
    if (this._currentIndex < this._entries.length - 1) {
      this._currentIndex++;
    }
  }

  go(delta) {
    let targetIndex = this._currentIndex + delta;
    if ((targetIndex >= 0) && (targetIndex < this._entries.length)) {
      this._currentIndex = targetIndex;
    }
  }

  pushState(state, title, path) {
    this._entries.length = this._currentIndex + 1;
    this._entries.push({
      state,
      title,
      path
    });
    this._currentIndex = this._entries.length - 1;
    let newLocation = new Location(path);
    Object.assign(this._location, newLocation);
  }

  replaceState(state, title, path) {
    if (arguments.length < 3) {
      let currentItem = this._entries[this._currentIndex] || {
        state: null,
        title: null,
        path: null
      };
      if (arguments.length < 2) { title = currentItem.title; }
      if (arguments.length < 3) { path = currentItem.path; }
    }
    this._currentIndex = Math.max(0, this._currentIndex);
    this._entries[this._currentIndex] = {
      state,
      title,
      path
    };
    let newLocation = this._entries[this._currentIndex];
    Object.assign(this._location, newLocation);
  }
}
