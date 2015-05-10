'use strict';

// Production specific configuration
// =================================
module.exports = {
  // Server IP
  ip: process.env.OPENSHIFT_NODEJS_IP || process.env.IP || undefined,

  // Server port
  port: process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 8080,
  firebase: {
    url: process.env.FIREBASE_URL || ''
  },
  redis: {
    url: process.env.REDISTOGO_URL || ''
  },
  session: {
    secret: process.env.SESSION_SECRET || 'V7P2NhhM5yj7TF6NjEKyOLpkus5Hs6gfmpsSRyJM9oaFYspzzcArAgOo1aCkshIzUGuxzMIMtnpjZu5yACVPpr0YBk0AWoHTz3m'
  },
  lastfm: {
    apiKey: process.env.LASTFM_APIKEY || '',
    secret: process.env.LASTFM_SECRET || '',
    useragent: process.env.LASTFM_USERAGENT || 'Surround.FM/v0.1'
  }
};