/*jshint node:true, eqnull:true, laxcomma:true, undef:true, indent:2, camelcase:false */

'use strict';

var express = require('express');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var session = require('express-session');
var errorHandler = require('errorhandler');
var routes = require('./routes');
//var http = require('http');
var path = require('path');
//var prismic = require('./prismic-helpers');
var stylus = require('stylus');
var nib = require('nib');





var app = express();




app.locals._ = require('lodash');
app.locals.moment = require('moment');


app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(
  stylus.middleware({
    src: path.join(__dirname, 'public'),
    compile: function (str, path) {
      return stylus(str).set('filename', path).set('compress', true).use(nib());
    }
  })
);


app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser());
app.use(methodOverride());
app.use(cookieParser('V*0%*R&DSwTM`@jF'));
app.use(session({secret: 'V*0%*R&DSwTM`@jF', saveUninitialized: true, resave: true}));
app.use(express.static(path.join(__dirname, 'public')));

app.use(errorHandler());



app.route('/').get(routes.index);
app.route('/post/:slug/:id').get(routes.post);
app.route('/category/:slug/:id').get(routes.category);
app.route('/author/:slug/:id').get(routes.author);
app.route('/search').get(routes.search);
//  -- 404 --
app.route('*').get(routes.notfound);



var PORT = app.get('port') || 3000;
var HOST = app.get('host') || '0.0.0.0';


app.listen(PORT, HOST, function() {
  console.log('Express server at ' + HOST + ' listening on port ' + PORT);
});

