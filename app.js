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
var path = require('path');
var stylus = require('stylus');
var nib = require('nib');
var uglify = require('./custom_modules/express-uglify');
var cors = require('cors');


var app = express();


app.locals._ = require('lodash');
app.locals.readingTime = require('reading-time');
app.locals.moment = require('moment');
app.locals.moment.locale('it');

app
  .set('port', process.env.PORT || 3000)
  .set('host', process.env.HOST || '0.0.0.0')
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'jade');

app
  .use( stylus.middleware({ src: path.join(__dirname, 'public'), compile: function (str, path) { return stylus(str).set('filename', path).set('compress', true).use(nib()); } }) )
  .use(favicon())
  .use(logger('dev'))
  .use(bodyParser())
  .use(methodOverride())
  .use(cookieParser('V*0%*R&DSwTM`@jF'))
  .use(session({secret: 'V*0%*R&DSwTM`@jF', saveUninitialized: true, resave: true}))
  .use(uglify.middleware({ src: path.join(__dirname, 'public'), maxAge: 60 * 60 }))
  .use(express.static(path.join(__dirname, 'public')))
  .use(errorHandler());



app.route('/').get(routes.index);
app.route('/post/:slug/:id').get(routes.post);
app.route('/category/:slug/:id').get(routes.category);
app.route('/authors').get(routes.authors);
app.route('/author/:slug/:id').get(routes.author);
app.route('/search').get(routes.search);
//  -- for api calls --
app.route('/latestPosts').get(cors(), routes.latestsApi);
//  -- preview --
app.route('/preview').get(routes.preview);
//  -- 404 --
app.route('*').get(routes.notfound);


app.listen(app.get('port'), app.get('host'), function() {
  console.log('Express server at ' + app.get('host') + ' listening on port ' + app.get('port'));
});

