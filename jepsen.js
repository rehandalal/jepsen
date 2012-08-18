var _ = require('underscore');
var irc = require('irc');
var path = require('path');

// Default configuration
var defaults = {
  "nick": "jepsen"
}

var config = {};

// Check for a local configuration file
if (path.existsSync('./config.json')) {
  config = require('./config.json');
}

config = _.extend({}, defaults, config);

// Create the IRC client
var client = new irc.Client(config.host, config.nick, {
  channels: config.channels
});

// Check messaages
client.on('message', function(nick, channel, message) {
  if (message.search(/\bcrazy\b/i) !== -1) {
    client.say(channel, 'Hey ' + nick + ' I just met you...');
    client.say(channel, 'And this is crazy...');
    client.say(channel, "But here's my handle...");
    client.say(channel, 'So ping me, maybe?');
  }
});

// Check if invited
client.on('invite', function(channel) {
  client.join(channel, config.nick);
});

// Check if kicked
client.on('kick', function(channel, nick) {
  if (nick === config.nick) {
    client.say(channel, 'Bye!');
    client.part(channel);
  }
});

// Handle errors
client.on('error', function(message) {
  console.log(message);
});