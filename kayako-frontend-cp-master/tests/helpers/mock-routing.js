export default class MockRouting {
  constructor(url) {
    this.url = url;
  }

  generateURL() {
    return this.url;
  }
}
