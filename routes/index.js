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

        ctx.api.form('posts').ref(ctx.ref).orderings('[my.post.postDate desc]').pageSize(12)/*.fetchLinks(['Categoria'])*/.submit(function(err__, lastPosts) {

          var _feats = _.sample(featuredPosts.results, 4);

          if (err__) { prismic.onPrismicError(err__, req, res); return; }

          var _diff = _.difference(_.pluck(lastPosts.results, 'id'), _.pluck(_feats, 'id'));
          var _diffPosts = _.filter(lastPosts.results, function(obj) { return _diff.indexOf(obj.id) >= 0; });

          res.render('index', {
            /*
            featuredPosts: _.map(_feats, function (f) {
                            return {
                              id: f.id,
                              slug: f.slug,
                              title: f.fragments['post.title'].value[0].text,
                              author: f.fragments['post.authors'] ? _.map(f.fragments['post.authors'].value, function (a) { return _.find(authors, {'id': a.Autore.value.document.id }).name; }) : ['GSO Company'],
                              categories: f.fragments['post.categories'] ? _.map(f.fragments['post.categories'].value, function (c) { return _.find(rawCategories, {'id': c.Categoria.value.document.id }).titolo; }) : ['Varie'],
                              date: f.fragments['post.postDate'] ? f.fragments['post.postDate'].value : '',
                              thumbUrl: f.fragments['post.featureImage'].value.views.fullscreen.url
                            };
                          }),
            lastPosts: _.map(_.slice(_diffPosts, 0, 8), function (l) {
                            return {
                              id: l.id,
                              slug: l.slug,
                              title: l.fragments['post.title'].value[0].text,
                              author: l.fragments['post.authors'] ? _.map(l.fragments['post.authors'].value, function (a) { return _.find(authors, {'id': a.Autore.value.document.id }).name; }) : ['GSO Company'],
                              categories: l.fragments['post.categories'] ? _.map(l.fragments['post.categories'].value, function (c) { return _.find(rawCategories, {'id': c.Categoria.value.document.id }).titolo; }) : ['Varie'],
                              date: l.fragments['post.postDate'] ? l.fragments['post.postDate'].value : '',
                              thumbUrl: l.fragments['post.featureImage'].value.views.social.url
                            };
                          }),
            */
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
