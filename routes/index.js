/*jshint node:true, eqnull:true, laxcomma:true, undef:true, indent:2, camelcase:false */

'use strict';

var prismic = require('../prismic-helpers');
var _ = require('lodash');





//  -- Display index (featured posts and last posts)
exports.index = prismic.route(function(req, res, ctx) {
  prismic.getCategories(ctx, function (errCats, categories, rawCategories) {

    if (errCats) {
      prismic.onPrismicError(errCats, req, res);
      return;
    }

    prismic.getAuthors(ctx, function (errAuths, authors) {

      if (errAuths) {
        prismic.onPrismicError(errAuths, req, res);
        return;
      }

      ctx
        .api
          .form('posts')
            .ref(ctx.ref)
            .query('[[:d=fulltext(my.post.postFeatured, "Sì")]]')
            .orderings('[my.post.postDate desc]')
            .pageSize(10)
            .submit(function (errFeats, featuredPosts) {

              if (errFeats) {
                prismic.onPrismicError(errFeats, req, res);
                return;
              }
        
              ctx.api
                .form('posts')
                  .ref(ctx.ref)
                  .orderings('[my.post.postDate desc]')
                  .pageSize(12)
                  .submit(function (errLasts, lastPosts) {

                    if (errLasts) { 
                      prismic.onPrismicError(errLasts, req, res);
                      return;
                    }


                    var _feats = _.sample(featuredPosts.results, 4);
                    var _diff = _.difference(_.pluck(lastPosts.results, 'id'), _.pluck(_feats, 'id'));
                    var _diffPosts = _.filter(
                                        lastPosts.results, 
                                        function(obj) { 
                                          return _diff.indexOf(obj.id) >= 0; 
                                        }
                                      );


                    res.render('index', {
                      categories: categories || [],
                      rawCategories: rawCategories,
                      authors: authors || [],
                      featuredPosts_: _.sample(featuredPosts.results, 4),
                      lastPosts_: _.slice(_diffPosts, 0, 8)
                    });


        });   //  - end query posts
      });   //  - end query featured
    });   //  - end getAuthors
  });   //  - end getCategories
});





//  -- Display category page (its posts and paginating)
exports.category = prismic.route(function(req, res, ctx) {  
  prismic.getCategories(ctx, function (errCats, categories, rawCategories) {
    
    if (errCats) {
      prismic.onPrismicError(errCats, req, res);
      return;
    }

    prismic.getAuthors(ctx, function (errAuths, authors) {
      
      if (errAuths) {
        prismic.onPrismicError(errAuths, req, res);
        return;
      }

      var id = req.params.id;
      //var slug = req.params.slug;

      ctx.api
        .form('posts')
        .set('page', req.query.page || '1')
        .query('[[:d = at(my.post.categories.Categoria, "' + id + '")]]')
        .ref(ctx.ref)
        .pageSize(24)
        .submit(function (errPosts, posts) {

          if (errPosts) { 
            prismic.onPrismicError(errPosts, req, res);
            return;
          }


          res.render('category', {
            docs: posts,
            categories: categories || [],
            rawCategories: rawCategories,
            authors: authors || []
          });

      });   //  - end query
    });   //  - end getAuthors
  });   //  - end getCategories
});




// -- Display author page (with its last three posts)
exports.author = prismic.route(function(req, res, ctx) {

  prismic.getCategories(ctx, function (errCats, categories, rawCategories) {

    if (errCats) {
      prismic.onPrismicError(errCats, req, res);
      return;
    }

    prismic.getAuthors(ctx, function (errAuths, authors) {
      
      if (errAuths) {
        prismic.onPrismicError(errAuths, req, res);
        return;
      }

      var id = req.params.id;
      var slug = req.params.slug;

      prismic.getDocument(ctx, id, slug, 'autori', 

        function (errAuth, auth) {
          if (errAuth) {
            prismic.onPrismicError(errAuth, req, res);
            return;
          }

          ctx.api
            .form('posts')
            .query('[[:d = at(my.post.authors.Autore, "' + id + '")]]')
            .orderings('[my.post.postDate desc]')
            .ref(ctx.ref)
            .pageSize(3)
            .submit(function (errPosts, posts) {

              if (errPosts) {
                prismic.onPrismicError(errPosts, req, res);
                return;
              }


              res.render('author', {
                authors: authors || [],
                author: auth,
                categories: categories || [],
                rawCategories: rawCategories,
                posts: posts.results

              });

            });   //  - end query
          


        },

        function(auth) {
          res.redirect(301, ctx.linkResolver(auth));
        },
        
        function(/*NOT_FOUND*/) {
          res.status(404).send('Sorry, we cannot find that!');
        }

      );    //  - getDocument
    });   //  - get Authors
  });   //  - getCategories
});





// -- Display a post detail 
exports.post = prismic.route(function(req, res, ctx) {

  prismic.getCategories(ctx, function (errCats, categories, rawCategories) {

    if (errCats) {
      prismic.onPrismicError(errCats, req, res);
      return;
    }

    prismic.getAuthors(ctx, function (errAuths, authors) {

      if (errAuths) {
        prismic.onPrismicError(errAuths, req, res);
        return;
      }

      var id = req.params.id;
      var slug = req.params.slug;

      prismic.getDocument(ctx, id, slug, 'posts',
        function(err, doc) {
          if (err) { prismic.onPrismicError(err, req, res); return; }
          res.render('post', {
            doc: doc,
            categories: categories || [],
            authors: authors || [],
          });
        },
        function(doc) {
          res.redirect(301, ctx.linkResolver(doc));
        },
        function(/*NOT_FOUND*/) {
          res.status(404).send('Sorry, we cannot find that!');
        }
      );

    });   //  - getAuthors

  });   //  - getCategories
});





// -- Search in documents
exports.search = prismic.route(function(req, res, ctx) {
  
  prismic.getCategories(ctx, function (err, categories) {

    var q = req.query.q;

    if (q) {
      ctx.api
        .form('search')
        .set('page', req.query.page || '1')
        .ref(ctx.ref)
        .query('[[:d = fulltext(document, "' + q + '")]]')
        .submit(function (errSearch, docs) {

          if (errSearch) {
            prismic.onPrismicError(errSearch, req, res);
            return;
          }
          
          res.render('search', {
            q: q,
            docs: docs,
            url: req.url,
            categories: categories || []
          });

      });   //  - end query
    
    } else {
      
      res.render('search', {
        q: q,
        docs: null,
        url: req.url,
        categories: categories || []
      });

    }

  });   //  - getCategories

});





//  -- 404 Not Found
exports.notfound = prismic.route(function(req, res, ctx) {
  prismic.getCategories(ctx, function (errCats, categories) {

    if (errCats) {
      prismic.onPrismicError(errCats, req, res);
      return;
    }


    res.render('404', {
      categories: categories || []
    });

  });   //  - end getCategories
});