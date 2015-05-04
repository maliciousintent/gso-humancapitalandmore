/*jshint node:true, eqnull:true, laxcomma:true, undef:true, indent:2, camelcase:false */

'use strict';

var prismic = require('../prismic-helpers');


var url = require('url');
var _ = require('lodash');






// -- Display index
exports.index = prismic.route(function(req, res, ctx) {

  prismic.getCategories(ctx, function (err, categories) {

    ctx.api.form('posts').set('page', url.parse(req.url, true).query.page || '1').ref(ctx.ref).orderings('[my.post.postDate desc]').pageSize(1).submit(function(err_, docs) {
      if (err_) { prismic.onPrismicError(err_, req, res); return; }

      res.render('index', {
        docs: docs,
        categories: categories || []
      });
    });

  });

});



exports.category = prismic.route(function(req, res, ctx) {
  prismic.getCategories(ctx, function (err, categories) {

    ctx.api.form('posts').set('page', url.parse(req.url, true).query.page || '1').ref(ctx.ref).submit(function(err_, docs) {
      if (err_) { prismic.onPrismicError(err_, req, res); return; }

      res.render('category', {
        docs: docs,
        categories: categories || []
      });
    });

  });
});



// -- Display a given document

exports.detail = prismic.route(function(req, res, ctx) {
  var id = req.params.id;
  var slug = req.params.slug;

  prismic.getDocument(ctx, id, slug, 
    function(err, doc) {
      if (err) { prismic.onPrismicError(err, req, res); return; }
      res.render('detail', {
        doc: doc
      });
    },
    function(doc) {
      res.redirect(301, ctx.linkResolver(doc));
    },
    function(/*NOT_FOUND*/) {
      res.send(404, 'Sorry, we cannot find that!');
    }
  );
});

// -- Search in documents

exports.search = prismic.route(function(req, res, ctx) {
  var q = req.query.q;

  if(q) {
    ctx.api.form('everything').set('page', req.params.page || '1').ref(ctx.ref)
           .query('[[:d = fulltext(document, "' + q + '")]]').submit(function(err, docs) {
      if (err) { prismic.onPrismicError(err, req, res); return; }
      res.render('search', {
        q: q,
        docs: docs,
        url: req.url
      });
    });
  } else {
    res.render('search', {
      q: q,
      docs: null,
      url: req.url
    });
  }

});
