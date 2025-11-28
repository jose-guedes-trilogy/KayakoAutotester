function replaceActionUrl(urlString, actionPath) {
  let url = new URL(urlString);

  if (url.searchParams.has('returnto')) {
    let subUrl = new URL(url.searchParams.get('returnto'));

    if (subUrl.searchParams.has('action')) {
      subUrl.searchParams.set('action', actionPath);

      url.searchParams.set('returnto', subUrl.toString());
    }
  }

  return url.toString();
}

export { replaceActionUrl };
