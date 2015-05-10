'use strict';

var Firebase = require('firebase');
var validator = require('validator');
var crypto = require('crypto');
var request = require('request');
var spawn = require('child_process').spawn;
var uuid = require('node-uuid');
var LastFmNode = require('lastfm').LastFmNode;
var settings = require('../../../config/environment');
var ref = new Firebase(settings.firebase.url);
var lastfm = new LastFmNode({
  api_key: settings.lastfm.apiKey,
  secret: settings.lastfm.secret,
  useragent: settings.lastfm.useragent
});

function getMobileSession(username, password, callback) {
  var hashPass = crypto.createHash('md5').update(password).digest('hex');
  var authToken = crypto.createHash('md5').update(username + hashPass).digest('hex');
  var apiSignature = crypto.createHash('md5').update('api_key' + settings.lastfm.apiKey + 'methodauth.GetMobileSessionpassword' + password + 'username' + username + settings.lastfm.secret).digest('hex');
  request.post('https://ws.audioscrobbler.com/2.0/', {
    json: true,
    form: {
      method: 'auth.GetMobileSession',
      format: 'json',
      api_key: settings.lastfm.apiKey,
      username: username,
      password: password,
      api_sig: apiSignature
    }
  }, function (error, response, body) {
    if(error) {
      return callback(error);
    }
    if(response.statusCode !== 200) {
      return callback(body);
    }
    return callback(null, body);
  });
}

function kickOffListener(userId) {
  var listener = spawn('node', [__dirname + '/../../../components/listener/index.js', '-u', userId]);
  console.log('Running new Last.FM Listener Instance with PID ' + listener.pid);
  listener.stdout.on('data', function (data) {
    console.log('stdout: ' + data);
  });
  listener.stderr.on('data', function (data) {
    console.log('stderr: ' + data);
  });
  listener.on('exit', function (code, signal) {
    console.log('Closing Process with PID ' + listener.pid);
  });
}
// Register a new user.
exports.index = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  if(validator.isNull(username)) {
    return res.status(400).jsonp({message: 'Email missing.'});
  }
  if(validator.isNull(password)) {
    return res.status(400).jsonp({message: 'Password missing.'});
  }
  var user = require('../../../components/schemas/user')();
  user._id = uuid.v4();
  ref.child('index').child(username).once('value', function (snapshot) {
    if(snapshot.val()) {
      return res.status(400).jsonp({message: 'Username already exists.'});
    }
    getMobileSession(username, password, function (error, session) {
      if(error) {
        console.log(error);
        return res.status(500).jsonp({message: 'There was a problem register your account, please try again.'});
      }
      if(!session.session) {
        return res.status(404).jsonp({message: session.message});
      }
      user.username = session.session.name;
      lastfm.request('user.getInfo', {
        user: session.session.name,
        handlers: {
          success: function(data) {
            var avatar = '';
            for (var i = 0; i < data.user.image.length; i++) {
              var image = data.user.image[i];
              if(image.size === 'large') {
                avatar = image['#text'];
              }
            };
            user.key = session.session.key;
            user.lastfm.image = avatar;
            user.lastfm.url = data.user.url;
            user.lastfm.id = data.user.id;
            user.lastfm.country = data.user.country;
            user.lastfm.playcount = data.user.playcount;
            ref.child('users').child(user._id).set(user, function (error) {
              if(error) {
                console.log(error);
                return res.status(500).jsonp({message: 'There was a problem register your account, please try again.'});
              }
              ref.child('index').child(user.username).set(user._id, function (error) {
                if(error) {
                  console.log(error);
                  return res.status(500).jsonp({message: 'There was a problem register your account, please try again.'});
                }
                kickOffListener(user._id);
                return res.jsonp({message: 'User registered.', token: user._id});
              });
            });
          },
          error: function (error) {
            console.log(error);
            return res.status(500).jsonp({message: 'There was a problem register your account, please try again.'});
          }
        }
      });
    });
  });
};