var _ = require('underscore');
var irc = require('irc');
var path = require('path');
var utils = require('./utils');

// Default settings
var defaults = {
  "nick": "jepsen"
}

var settings = {};

// Check for a local settings file
if (path.existsSync('./settings.json')) {
  settings = require('./settings.json');
}

settings = _.extend({}, defaults, settings);

// Create the IRC client
var client = new irc.Client(settings.host, settings.nick, {
  channels: settings.channels
});

// Commands
var commands = {
  'botsnack': function(channel, nick) {
    client.say(channel, nick + ': Mmm... Delicious!');
  },
  'bye': function(channel) {
    client.say(channel, 'Bye!');
    client.part(channel);
  },
  'help': function(channel) {
    client.say(channel, 'Available commands:');
    client.say(channel, 'botsnack - om nom nom');
    client.say(channel, 'bye - kick me out');
  },
  'ping': function(channel, nick) {
    client.say(channel, nick + ': pong!');
  }
}

// Check messaages
client.on('message', function(nick, channel, message) {
  if (nick !== settings.nick) {
    if (message.search(/\bcrazy\b/i) !== -1) {
      client.say(channel, 'Hey ' + nick + ' I just met you...');
      client.say(channel, 'And this is crazy...');
      client.say(channel, "But here's my handle...");
      client.say(channel, 'So ping me, maybe?');
    }

    // Check if spoken to and run a command if available
    var re = new RegExp('^(?:' + utils.escapeRegExp(settings.nick) + '):?\\s*(.+?)$');
    var match = re.exec(message);

    if (match) {
      var command = commands[match[1]];
      if (typeof command === 'function') {
        command(channel, nick);
      }
    }
  }
});

// Check if invited
client.on('invite', function(channel) {
  client.join(channel, settings.nick);
});

// Check if kicked
client.on('kick', function(channel, nick) {
  if (nick === settings.nick) {
    commands.bye(channel);
  }
});

// Handle errors
client.on('error', function(message) {
  console.log(message);
});