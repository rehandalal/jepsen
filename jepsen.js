var _ = require('underscore');
var irc = require('irc');
var path = require('path');

// Default settingsuration
var defaults = {
  "nick": "jepsen"
}

var settings = {};

// Check for a local settingsuration file
if (path.existsSync('./settings.json')) {
  settings = require('./settings.json');
}

settings = _.extend({}, defaults, settings);

// Create the IRC client
var client = new irc.Client(settings.host, settings.nick, {
  channels: settings.channels
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
  client.join(channel, settings.nick);
});

// Check if kicked
client.on('kick', function(channel, nick) {
  if (nick === settings.nick) {
    client.say(channel, 'Bye!');
    client.part(channel);
  }
});

// Handle errors
client.on('error', function(message) {
  console.log(message);
});