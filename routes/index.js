/*jshint node:true, eqnull:true, laxcomma:true, undef:true, indent:2, camelcase:false */

'use strict';

var prismic = require('../prismic-helpers');
var _ = require('lodash');
var async = require('async');


//  -- Display index (featured posts and last posts)
exports.index = prismic.route(function(req, res, ctx) {

  async.parallel(

    {


      getCategories: function (callback) {
        prismic.getCategories(ctx, function (errCats, categories, rawCategories) {

          if (errCats) {
            prismic.onPrismicError(errCats, req, res);
            callback(errCats);
            return;
          }

          callback(null, [categories, rawCategories]);

        });
      },


      getAuthors: function (callback) {

        prismic.getAuthors(ctx, function (errAuths, authors) {

          if (errAuths) {
            prismic.onPrismicError(errAuths, req, res);
            callback(errAuths);
            return;
          }

          callback(null, authors);

        });
      },


      getPosts: function (callback) {

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
                  callback(errFeats);
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
                        callback(errLasts);
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

                      //  -- feat, lasts --
                      callback(null, [_.sample(featuredPosts.results, 4), _.slice(_diffPosts, 0, 8)]);


                });   //  - end query posts
              });   //  - end query featured

      }


    },  //-  end 'object' fs

    function (err, results) {
      if (err) {
        prismic.onPrismicError(err, req, res); return;
      }

      res.render('index', {
        categories: results.getCategories[0],
        rawCategories: results.getCategories[1],
        authors: results.getAuthors,
        featuredPosts_: results.getPosts[0],
        lastPosts_: results.getPosts[1]
      });

    }
  );


});





//  -- Display category page (its posts and paginating)
exports.category = prismic.route(function(req, res, ctx) {  

  var id = req.params.id;
  var slug = req.params.slug;


  async.parallel(

    {


      getCategories: function (callback) {
        prismic.getCategories(ctx, function (errCats, categories, rawCategories) {

          if (errCats) {
            prismic.onPrismicError(errCats, req, res);
            callback(errCats);
            return;
          }

          callback(null, [categories, rawCategories]);

        });
      },


      getAuthors: function (callback) {

        prismic.getAuthors(ctx, function (errAuths, authors) {

          if (errAuths) {
            prismic.onPrismicError(errAuths, req, res);
            callback(errAuths);
            return;
          }

          callback(null, authors);

        });
      },


      getPosts: function (callback) {

        

        ctx.api
          .form('posts')
          .set('page', req.query.page || '1')
          .query('[[:d = at(my.post.categories.Categoria, "' + id + '")]]')
          .ref(ctx.ref)
          .pageSize(24)
          .submit(function (errPosts, posts) {

            if (errPosts) { 
              prismic.onPrismicError(errPosts, req, res);
              callback(errPosts);
              return;
            }

            callback(null, posts);
          });


      }


    },  //-  end 'object' fs

    function (err, results) {
      if (err) {
        prismic.onPrismicError(err, req, res); return;
      }

      res.render('category', {
        categories: results.getCategories[0],
        rawCategories: results.getCategories[1],
        authors: results.getAuthors,
        docs: results.getPosts,
        categorySlug: slug,
        categoryId: id
      });

    }
  );


});




// -- Display author page (with its last three posts)
exports.author = prismic.route(function(req, res, ctx) {

  var id = req.params.id;
  var slug = req.params.slug;


  async.parallel(

    {


      getCategories: function (callback) {
        prismic.getCategories(ctx, function (errCats, categories, rawCategories) {

          if (errCats) {
            prismic.onPrismicError(errCats, req, res);
            callback(errCats);
            return;
          }

          callback(null, [categories, rawCategories]);

        });
      },


      getAuthors: function (callback) {

        prismic.getAuthors(ctx, function (errAuths, authors) {

          if (errAuths) {
            prismic.onPrismicError(errAuths, req, res);
            callback(errAuths);
            return;
          }

          callback(null, authors);

        });
      },


      getAuthor: function (callback) {

        prismic.getDocument(ctx, id, slug, 'autori', 

          function (errAuth, auth) {
            if (errAuth) {
              prismic.onPrismicError(errAuth, req, res);
              callback(errAuth);
              return;
            }

            callback(null, auth);
          }
        );

      },


      getPosts: function (callback) {

        ctx.api
          .form('posts')
          .query('[[:d = at(my.post.authors.Autore, "' + id + '")]]')
          .orderings('[my.post.postDate desc]')
          .ref(ctx.ref)
          .pageSize(8)
          .submit(function (errPosts, posts) {

            if (errPosts) {
              prismic.onPrismicError(errPosts, req, res);
              callback(errPosts);
              return;
            }

            callback(null, posts.results);
          });        


      }


    },  //-  end 'object' fs

    function (err, results) {
      if (err) {
        prismic.onPrismicError(err, req, res); return;
      }




      res.render('author', {
        categories: results.getCategories[0],
        rawCategories: results.getCategories[1],
        authors: results.getAuthors,
        author: results.getAuthor,
        posts: results.getPosts
      });

    }
  );

});





// -- Display a post detail 
exports.post = prismic.route(function(req, res, ctx) {

  var id = req.params.id;
  var slug = req.params.slug;


  async.parallel(

    {


      getCategories: function (callback) {
        prismic.getCategories(ctx, function (errCats, categories, rawCategories) {

          if (errCats) {
            prismic.onPrismicError(errCats, req, res);
            callback(errCats);
            return;
          }

          callback(null, [categories, rawCategories]);

        });
      },


      getAuthors: function (callback) {

        prismic.getAuthors(ctx, function (errAuths, authors) {

          if (errAuths) {
            prismic.onPrismicError(errAuths, req, res);
            callback(errAuths);
            return;
          }

          callback(null, authors);

        });
      },


      getPost: function (callback) {

        prismic.getDocument(ctx, id, slug, 'posts',
          function(errPost, doc) {
            
            if (errPost) { 
              prismic.onPrismicError(errPost, req, res);
              callback(errPost);
              return;
            }
            
            callback(null, doc);
          }
        );

      },


      getSimilars: function (callback) {

        ctx
          .api
          .forms('posts')
          .ref(ctx.ref)
          .query('[[:d = similar("' + id + '", 3)]]')
          .submit(function(errSimilars, similars) {

            if (errSimilars) {
              prismic.onPrismicError(errSimilars, req, res);
              callback(errSimilars);
              return;
            }

            callback(null, similars.results);
          });
        
      }


    },  //-  end 'object' fs

    function (err, results) {
      if (err) {
        prismic.onPrismicError(err, req, res); return;
      }




      res.render('post', {
        categories: results.getCategories[0],
        rawCategories: results.getCategories[1],
        authors: results.getAuthors,
        doc: results.getPost,
        similars: results.getSimilars
      });

    }
  );


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
            categories: categories
          });

      });   //  - end query
    
    } else {
      
      res.render('search', {
        q: q,
        docs: null,
        url: req.url,
        categories: categories
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
      categories: categories
    });

  });   //  - end getCategories
});