export default class MockLocalStore {
  constructor() {
    this.stored = {};
  }

  getItem(namespace, key) {
    this.stored[namespace] = this.stored[namespace] || {};
    return this.stored[namespace][key];
  }

  setItem(namespace, key, value) {
    this.stored[namespace] = this.stored[namespace] || {};
    this.stored[namespace][key] = value;
  }
}
