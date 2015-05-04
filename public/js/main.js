/*jshint browser:true, indent:2, laxcomma:true, loopfunc: true */
/*global $, Modernizr*/


$(function() {

  'use strict';
  
  var clicking = false;

  /**
   * Pages setup
   */
  var setup = {

    'home': function() {
    },


    init: function() {
      (this[$('body > section.app').attr('id')] || (function() {}))();
    }

  };


  // Initial setup
  setup.init();

  /**
   * Pretty page transitions if the browser supports
   * HTML5 pushState
   */
  if(Modernizr.history) {

    var load = function(href) {
      return Helpers.scrollTop()
        .then(function() { 
          $('header menu li').removeClass('selected');
          return Helpers.fade();
        })
        .then(function() { 
          return $.get(href);
        })
        .then(function(html) {
          var $body = $($.parseHTML(html.match(/<body[^>]*>([\s\S.]*)<\/body>/i)[0]));
          var $fragment = $body.filter('section.app');

          return { 
            $el: $fragment, 
            page: $fragment.attr('id'), 
            selected: $('header menu li.selected a').attr('href') 
          };
        })
        .then(function(loaded) {
          return $('body > section.app').attr('data-to', loaded.page).delay(250).promise().then(
            function() {
              $('body > section.app').attr('id', loaded.page)
                .html(loaded.$el.html())
                .removeAttr('data-to');
              $('header menu li a[href="' + loaded.selected + '"]').closest('li').addClass('selected');
              return loaded;
            }
          );
        })
        .then(function(loaded) { 
          (
            setup[loaded.page] || (function() {})
          )();
          Helpers.fade();
          clicking = false;
          return loaded.page;
        });
    };

    var url = document.location.toString();

    // Intercept clicks on links
    $(document.body).on('click', '[href]', function(e) {

      if (clicking) {
        e.preventDefault();
        return;
      }

      clicking = true;
      
      var href = $(this).attr('href');

      if(!/https?:\/\//.test(href) || href.replace(/https?:\/\//, '').indexOf(document.location.host) !== 0) {

        history.pushState(null, null, href);
        
        if ($(this).attr('data-external')) {
          history.pushState(null, null, url);
          return;
        }

        url = document.location.toString();

        e.preventDefault();
        load(href);
      }
      
    });

    // Intercept form submits
    $(document.body).on('submit', 'form[method=GET]', function(e) {
      e.preventDefault();

      var action = $(this).attr('action');
      var data = $(this).serialize();
      var href = action + (action.indexOf('?') > -1 ? '&' : '?') + data;

      history.pushState(null, null, href);
      url = document.location.toString();

      load(href);
    });

    // Intercept back/forward
    $(window).on('popstate', function () {
      if(document.location.toString() != url) {
        load(document.location.href);
      }
      url = document.location.toString();
    });

  }

  /**
   * Useful functions & helpers
   */
  var Helpers = {

    scrollTop: function() {
      return $(document.body).animate({scrollTop: 0}, Math.min(250, $(document.body).scrollTop())).promise();
    },

    fade: function() {
      var $el = $('body > section.app');
      return Helpers.defer(function() {
        return $el[$el.is('.fade') ? 'removeClass' : 'addClass']('fade').delay(250).promise();
      });
    },

    defer: function(f) {
      var p = $.Deferred();
      setTimeout(function() {
        f().then(function(x) { p.resolve(x); });
      },0);
      return p;
    }

  };

});