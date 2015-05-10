/**
 * Express configuration
 */

'use strict';

var express = require('express');
var favicon = require('serve-favicon');
var morgan = require('morgan');
var session = require('express-session');
var RedisStore = require('connect-redis')(session);
var compression = require('compression');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var cookieParser = require('cookie-parser');
var errorHandler = require('errorhandler');
var path = require('path');
var config = require('./environment');
var rtg = require('url').parse(config.redis.url);

module.exports = function(app) {
  var env = app.get('env');

  app.set('views', config.root + '/server/views');
  app.engine('html', require('ejs').renderFile);
  app.set('view engine', 'html');
  app.use(compression());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  app.use(methodOverride());
  app.use(cookieParser(config.session.secret));

  if ('production' === env) {
    app.set('trust proxy', 1);
    app.use(session({
      store: new RedisStore({
        host: rtg.hostname,
        port: rtg.port
      }),
      key: 'user-session',
      proxy: true,
      cookie: {
        path: '/',
        secure: true,
        maxAge: 3600000 * 24 * 7,
        httpOnly: true
      }
    }));
    app.use(favicon(path.join(config.root, 'public', 'favicon.ico')));
    app.use(express.static(path.join(config.root, 'public')));
    app.set('appPath', config.root + '/public');
    app.use(morgan('dev'));
  }

  if ('development' === env || 'test' === env) {
    app.use(session({
      store: new RedisStore({
        host: rtg.hostname,
        port: rtg.port
      }),
      key: 'user-session',
      cookie: {
        path: '/',
        secure: false,
        maxAge: 3600000 * 24 * 7,
        httpOnly: true
      }
    }));
    app.use(require('connect-livereload')());
    app.use(express.static(path.join(config.root, '.tmp')));
    app.use(express.static(path.join(config.root, 'client')));
    app.set('appPath', 'client');
    app.use(morgan('dev'));
    app.use(errorHandler()); // Error handler - has to be last
  }
};