/*jshint node:true, eqnull:true, laxcomma:true, undef:true, indent:2, camelcase:false */

'use strict';

var prismic = require('../prismic-helpers');
var url = require('url');
var _ = require('lodash');



//  -- Display index (featured posts and last posts)
exports.index = prismic.route(function(req, res, ctx) {

  prismic.getCategories(ctx, function (err, categories, rawCategories) {

    prismic.getAuthors(ctx, function (err____, authors) {

      ctx.api.form('posts').ref(ctx.ref).query('[[:d=fulltext(my.post.postFeatured, "Sì")]]').orderings('[my.post.postDate desc]').pageSize(10).submit(function(err_, featuredPosts) {

        ctx.api.form('posts').ref(ctx.ref).orderings('[my.post.postDate desc]').pageSize(12).submit(function(err__, lastPosts) {

          var _feats = _.sample(featuredPosts.results, 4);

          if (err__) { prismic.onPrismicError(err__, req, res); return; }

          var _diff = _.difference(_.pluck(lastPosts.results, 'id'), _.pluck(_feats, 'id'));
          var _diffPosts = _.filter(lastPosts.results, function(obj) { return _diff.indexOf(obj.id) >= 0; });

          res.render('index', {
            categories: categories || [],
            rawCategories: rawCategories,
            authors: authors,
            featuredPosts_: _.sample(featuredPosts.results, 4),
            lastPosts_: _.slice(_diffPosts, 0, 8)
          });

        });

      });

    });

  });

});



//  -- Display category page
exports.category = prismic.route(function(req, res, ctx) {
  prismic.getCategories(ctx, function (err, categories, unusedVar, RAAAAW) {

    var id = req.params.id;
    var slug = req.params.slug;


    ctx.api.form('posts').set('page', url.parse(req.url, true).query.page || '1').query('[[:d = at(my.post.categories.Categoria, "' + id + '")]]').ref(ctx.ref).pageSize(24).submit(function(err_, docs) {
      if (err_) { prismic.onPrismicError(err_, req, res); return; }

      res.render('category', {
        docs: docs,
        categories: categories || []
      });
    });

  });
});



// -- Display a given document
exports.post = prismic.route(function(req, res, ctx) {

  prismic.getCategories(ctx, function (err, categories) {

    var id = req.params.id;
    var slug = req.params.slug;

    prismic.getDocument(ctx, id, slug, 'posts',
      function(err, doc) {
        if (err) { prismic.onPrismicError(err, req, res); return; }
        res.render('post', {
          doc: doc,
          categories: categories || []
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
});



// -- Display a given document
exports.author = prismic.route(function(req, res, ctx) {

  prismic.getCategories(ctx, function (err, categories) {

    var id = req.params.id;
    var slug = req.params.slug;

    prismic.getDocument(ctx, id, slug, 'autori',
      function(err, doc) {
        if (err) { prismic.onPrismicError(err, req, res); return; }
        res.render('author', {
          doc: doc,
          categories: categories || []
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
});



// -- Search in documents
exports.search = prismic.route(function(req, res, ctx) {
  
  prismic.getCategories(ctx, function (err, categories) {

    var q = req.query.q;

    if (q) {
      ctx.api.form('search').set('page', req.params.page || '1').ref(ctx.ref)
             .query('[[:d = fulltext(document, "' + q + '")]]').submit(function(err, docs) {
        if (err) { prismic.onPrismicError(err, req, res); return; }
        res.render('search', {
          q: q,
          docs: docs,
          url: req.url,
          categories: categories || []
        });
      });
    } else {
      res.render('search', {
        q: q,
        docs: null,
        url: req.url,
        categories: categories || []
      });
    }

  });

});



//  -- 404 Not Found
exports.notfound = prismic.route(function(req, res, ctx) {
  prismic.getCategories(ctx, function (err, categories) {

    res.render('404', {
      categories: categories || []
    });

  });
});
