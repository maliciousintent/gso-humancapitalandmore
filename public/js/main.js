/*jshint browser:true, indent:2, laxcomma:true, loopfunc: true */
/*global $, Modernizr*/


$(function() {

  'use strict';
  
  var clicking = false;
  
  $(window).on('scroll', function () {
    var top = Math.max($('html').scrollTop(), $('body').scrollTop());
    if (top >= 50) {
      $('header').addClass('scrolled');
    } else if (top < 320) {
      $('header').removeClass('scrolled');
    }
  });
  
  $(window).on('resize', function () {
    window.mobileMenuSize = $(window).width() - 60;
    $('menu#mobile .mobile-menu').width(window.mobileMenuSize + 1);
  });
  $(window).trigger('resize');
  
  $('menu#mobile a.menu-toggle').on('click', function (e) {
    e.preventDefault();
    
    if ($('body').hasClass('menu-view')) {
      
      $('menu#mobile .mobile-mask').removeClass('open');
      setTimeout(function () {
        $('menu#mobile .mobile-mask').css('display', 'none');
      }, 510);
      
      $('menu#mobile .mobile-menu').css('right', '100%');
      $('body').removeClass('menu-view');
      
    } else {
      
      $('menu#mobile .mobile-mask').css('display', 'block');
      setTimeout(function () {
        $('menu#mobile .mobile-mask').addClass('open');
      }, 10);
      
      $('menu#mobile .mobile-menu').css('right', '60px');
      $('body').addClass('menu-view');
      
    }
    
    return false;
  });
  
  $('menu#mobile .mobile-menu a, menu#mobile .mobile-mask, menu#mobile a.search-toggle, menu#mobile button').on('click', function () {
    $('menu#mobile a.menu-toggle').trigger('click'); 
  });
  
  
  var cleanJS = function () {
    
    if (window.postScrollHandler) {
      $(window).off('scroll', window.postScrollHandler);
      delete window.postScrollHandler;
    }

    if (window.homeFeatSliderHandler) {
      console.log('killing slider');
      window.homeFeatSliderHandler.kill();
      delete window.homeFeatSliderHandler;
    }
    
    $('header').removeClass('inobtrusive');
    
  };



  
  /**
   * Pages setup
   */
  var setup = {

    'home': function() {
      cleanJS();

      window.homeFeatSliderHandler = new Swipe(document.getElementById('homeFeatSlider'), {
        auto: 5000,
        speed: 500,
        draggable: true,
        continuos: true,
        disableScroll: false
      });

    },

    'author': function() {
      cleanJS();
      
      $('header').addClass('inobtrusive');
      
      var isset = false;
      window.authorScrollHandler = function () {
        var top = Math.max($('html').scrollTop(), $('body').scrollTop());
        var headerHeight = $('.page-full-image').height() - $('header').height();
        if (top >= headerHeight && !isset) {
          $('header').removeClass('inobtrusive');
          isset = true;
        } else if (top < headerHeight && isset) {
          $('header').addClass('inobtrusive');
          isset = false;
        }
      };
      $(window).on('scroll', window.authorScrollHandler);
    },

    'category': function() {
      cleanJS();
    },

    'post': function() {
      cleanJS();
      
      /* Set fixed image on top when scrolling */
      var isset = false;
      window.postScrollHandler = function () {
        var top = Math.max($('html').scrollTop(), $('body').scrollTop());
        if (top >= 370 && !isset) {
          $('#post .page-full-image, #post .page-fixed-image, #post .page-full-image .post-title').addClass('fixed');
          isset = true;
        } else if (top < 370 && isset) {
          $('#post .page-full-image, #post .page-fixed-image, #post .page-full-image .post-title').removeClass('fixed');
          isset = false;
        }
      };
      $(window).on('scroll', window.postScrollHandler);
      
    },

    'search': function() {
      cleanJS();
    },

    'default': function() {
      cleanJS();
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
            selected: href
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
      return $('html, body').animate({scrollTop: 0}, Math.min(250, Math.max($('html').scrollTop(), $('body').scrollTop()))).promise();
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