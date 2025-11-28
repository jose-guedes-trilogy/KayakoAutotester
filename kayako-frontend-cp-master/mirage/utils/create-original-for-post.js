import rel from './rel';

export default function createOriginalForPost(server, attrs) {
  let channel = server.db.channels.firstOrCreate({ type: attrs.channel });

  switch (attrs.channel) {
  case 'MAIL':
    return server.create('case-message', {
      body_text: attrs.contents,
      body_html: attrs.contents,
      source_channel: rel(channel)
    });
  case 'TWITTER':
    return server.create('twitter-tweet', {
      contents: attrs.contents,
      source_channel: rel(channel)
    });
  case 'FACEBOOK':
    return server.create('facebook-message', {
      contents: attrs.contents,
      source_channel: rel(channel)
    });
  case 'NOTE':
    return server.create('note', {
      body_text: attrs.contents,
      body_html: attrs.contents,
      source_channel: rel(channel)
    });
  }
}
