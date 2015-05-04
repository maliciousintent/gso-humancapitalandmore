exports.Configuration = {

  apiEndpoint: 'https://human-capital-and-more.prismic.io/api',

  // -- Access token if the Master is not open
  // accessToken: 'xxxxxx',

  // OAuth
  // clientId: 'xxxxxx',
  // clientSecret: 'xxxxxx',

  // -- Links resolution rules
  linkResolver: function(doc) {
    if (doc.isBroken) return false;

    var _prepend = '';

    switch(doc.type) {
      case 'autore':
        _prepend = '/author';
        break;

      case 'post':
        _prepend = '/post';
        break;

      case 'categoria':
        _prepend = '/category';
        break;
    }

    return _prepend + '/' + doc.slug + '/' + doc.id;
  },

  // -- What to do in the event of an error from prismic.io
  onPrismicError: function(err, req, res) {
    res.send(500, "Error 500: " + err.message);
  }

};