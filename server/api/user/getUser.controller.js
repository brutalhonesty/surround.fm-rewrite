'use strict';

var Firebase = require('firebase');
var settings = require('../../config/environment');
var ref = new Firebase(settings.firebase.url);

// Get a single user from Firebase.
exports.index = function(req, res) {
  var username = req.params.username;
  ref.child('users').child(username).once('value', function (snapshot) {
    if(!snapshot.val()) {
      return res.status(400).jsonp({message: 'User does not exist.'});
    }
    var user = snapshot.val();
    delete user.key;
    delete user.coordinates;
    return res.jsonp(user);
  });
};