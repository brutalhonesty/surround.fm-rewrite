'use strict';

var Firebase = require('firebase');
var validator = require('validator');
var settings = require('../../../config/environment');
var ref = new Firebase(settings.firebase.url);

// Update the user's location into Firebase.
exports.index = function(req, res) {
  if(!req.body.token) {
    return res.status(401).jsonp({message: 'Sign in please.'});
  }
  var authToken = req.body.token;
  var latitude = req.body.lat;
  var longitude = req.body.lng;
  if(validator.isNull(latitude)) {
    return res.status(400).jsonp({message: 'Missing latitude.'});
  }
  if(validator.isNull(longitude)) {
    return res.status(400).jsonp({message: 'Missing longitude.'});
  }
  ref.child('users').child(authToken).once('value', function (snapshot) {
    if(!snapshot.val()) {
      delete req.session.username;
      return res.status(400).jsonp({message: 'User does not exist.'});
    }
    var user = snapshot.val();
    user.coordinates.lat = latitude;
    user.coordinates.lng = longitude;
    ref.child('users').child(authToken).update(user, function (error) {
      if(error) {
        console.log(error);
        return res.status(500).jsonp({message: 'Could not update user location.'});
      }
      return res.jsonp({message: 'Location updated.'});
    });
  });
};