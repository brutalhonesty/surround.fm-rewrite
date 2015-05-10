'use strict';

var Firebase = require('firebase');
var settings = require('../../config/environment');
var ref = new Firebase(settings.firebase.url);

// Get list of users from Firebase.
exports.index = function(req, res) {
  ref.child('users').once('value', function (snapshot) {
    if(!snapshot.val()) {
      return res.status(400).jsonp({message: 'No users exist.'});
    }
    var users = snapshot.val();
    users = Object.keys(users).map(function (username) {
      return {username: users[username].username, lastfm: users[username].lastfm};
    });
    return res.jsonp(users);
  });
};