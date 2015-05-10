var settings = require('../../config/environment');
var pkg = require('../../../package');
var moment = require('moment');
var Firebase = require('firebase');
var ref = new Firebase(settings.firebase.url);
var ArgumentParser = require('argparse').ArgumentParser;
var parser = new ArgumentParser({
  version: pkg.version,
  addHelp: true,
  description: 'Last.FM Stream Listener Worker'
});
parser.addArgument([ '-u', '--userId' ], {
  help: 'Surround.FM User ID.'
});
var args = parser.parseArgs();
if(!args.userId) {
  return parser.printHelp();
}
var LastFmNode = require('lastfm').LastFmNode;
var lastfm = new LastFmNode({
  api_key: settings.lastfm.apiKey,
  secret: settings.lastfm.secret,
  useragent: settings.lastfm.useragent
});

ref.child('users').child(args.userId).once('value', function (snapshot) {
  if(!snapshot.val()) {
    return console.log('User ID ' + args.userId + ' does not exist.')
  }
  var user = snapshot.val();
  var trackStream = lastfm.stream(user.username);
  trackStream.on('nowPlaying', function (track) {
    console.log('Now Playing');
    console.log(track);
    user.lastfm.playcount++;
    user.lastfm.currentSong = {
      artist: track.artist['#text'] || 'Unknown Artist',
      song: track.name || 'Unknown track',
      url: track.url || 'http://last.fm/404',
      lastUpdated: moment.utc().valueOf()
    };
    ref.child('users').child(args.userId).update(user);
  });
  trackStream.on('stoppedPlaying', function (track) {
    console.log('Stopped Playing');
    console.log(track);
    user.lastfm.currentSong = {
      artist: '',
      song: '',
      url: '',
      lastUpdated: moment.utc().valueOf()
    };
    ref.child('users').child(args.userId).update(user);
  });
  trackStream.on('error', function (error) {
    return console.log(error);
  });
  trackStream.start();
});