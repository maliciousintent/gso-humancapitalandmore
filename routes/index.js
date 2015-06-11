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




//  -- Display authors list page
exports.authors = prismic.route(function(req, res, ctx) { 

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

        ctx.api
          .form('autori')
          .set('page', /*req.query.page ||*/ '1')
          .ref(ctx.ref)
          .pageSize(100)
          .submit(function (errAuthors, authors) {

            if (errAuthors) { 
              prismic.onPrismicError(errAuthors, req, res);
              callback(errAuthors);
              return;
            }

            callback(null, authors.results);
          });

      }


    },  //-  end 'object' fs

    function (err, results) {
      if (err) {
        prismic.onPrismicError(err, req, res); return;
      }

      res.render('authors', {
        categories: results.getCategories[0],
        rawCategories: results.getCategories[1],
        authors: results.getAuthors
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


      var _customHTML = function (element) {
        if (element.type === 'image') {
          if (element.url.indexOf('https://r.size.li/2/') === -1) {
            if (element.dimensions.width > 1280 && element.dimensions.height > 768) {
              element.url = 'https://r.size.li/2/s/90/png/1280x768/' + element.url;
            } else if (element.dimensions.width > 768 && element.dimensions.height > 1280) {
              element.url = 'https://r.size.li/2/s/90/png/768x1280/' + element.url;
            }
          }
          return '<p class="block-img"><img src="' + element.url + '" alt="' + element.alt + '" /><span class="caption">' + element.alt + '</span></p>';
        }
      };


      res.render('post', {
        categories: results.getCategories[0],
        rawCategories: results.getCategories[1],
        authors: results.getAuthors,
        doc: results.getPost,
        customDoc: results.getPost.getStructuredText('post.content').asHtml(ctx.linkResolver, _customHTML),
        similars: results.getSimilars,
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




exports.latestsApi = prismic.route(function(req, res, ctx) {

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
              .orderings('[my.post.postDate desc]')
              .pageSize(10)
              .submit(function (errLatests, latestPosts) {

                if (errLatests) {
                  prismic.onPrismicError(errLatests, req, res);
                  callback(errLatests);
                  return;
                }
          
                
                callback(null, latestPosts.results);


              });   //  - end query posts

      }


    },  //-  end 'object' fs

    function (err, results) {
      if (err) {
        prismic.onPrismicError(err, req, res); return;
      }

      var _posts = results.getPosts;

      var _fullInfo = _.chain(_posts)
                        .map(function (p) {
                          return {
                            pic: p.get('post.featureImage').views.fullscreen.url || '',
                            title: p.getText('post.title') || 'Untitled',
                            preview: p.getText('post.excerpt') || '',
                            link: ctx.linkResolver(p),
                            authors: p.getAll('post.authors')[0] ? 
                                      _.chain(p.getAll('post.authors')[0].value)
                                        .map(function (a) {
                                          return _.find(results.getAuthors, {'id': a.getLink('Autore').document.id}).name;
                                        })
                                        .value()
                                        :
                                        'GSO Company',
                            categories: p.getAll('post.categories')[0] ?
                                          _.chain(p.getAll('post.categories')[0].value)
                                            .map(function (c) {
                                              return c.getLink('Categoria').document;
                                              //return _.find(results.getCategories[1], {'id': c.getLink('Categoria').document.id}).slug;
                                            })
                                            .value()
                                          :
                                          'Varie'
                          };
                        })
                        .value()


      res.end(
        JSON.stringify({
          //rawCategories: results.getCategories[1],
          //authors: results.getAuthors,
          lastPosts: _fullInfo
        }, null, 2)
      );
      return;

    }
  );

});




// -- Preview documents from the Writing Room
exports.preview = prismic.route(function(req, res, ctx) {
  var token = req.query.token;

  if (token) {
    ctx.api.previewSession(token, ctx.linkResolver, '/', function(err, url) {
      res.cookie(prismic.previewCookie, token, { maxAge: 30 * 60 * 1000, path: '/', httpOnly: false });
      res.redirect(301, url);
    });
  } else {
    res.status(400).send('Missing token from querystring');
  }
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