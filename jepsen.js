var _ = require('underscore');
var fs = require('fs');
var irc = require('irc');
var utils = require('./utils');

// Default settings
var defaults = {
  "debug": false,
  "nick": "jepsen",
  "pg": {
    "enabled": false
  }
}

var settings = {};

// Check for a local settings file
if (fs.existsSync('./settings-dev.json')) {
  settings = require('./settings-dev.json');
} else if (fs.existsSync('./settings.json')) {
  settings = require('./settings.json');
}

settings = _.extend({}, defaults, settings);

// Check if PG is enabled and if so connect
if (settings.pg.enabled) {
  var pg = require('pg');

  // If no connection string is provided in settings then check for an ENV
  // variable with one.
  if (!settings.pg.connectionString) {
    settings.pg.connectionString = process.env.DATABASE_URL;
  }

  if (settings.pg.connectionString) {
    var pg_client = new pg.Client(settings.pg.connectionString);
    pg_client.connect();
  }
}

// Create the IRC client
var irc_client = new irc.Client(settings.host, settings.nick, {
  channels: settings.channels
});

// Commands
var commands = {
  'botsnack': function(channel, nick) {
    var responses = [
      'Mmm... Delicious!',
      'Om Nom Nom!',
      'Thanks!',
      'Could I get some more?',
      'Yummy!'
    ];
    var response = _.shuffle(responses)[0];
    irc_client.say(channel, nick + ': ' + response);
  },
  'bye': function(channel) {
    var responses = [
      'Bye!',
      'See ya!',
      'Ciao!',
      'Later!',
      settings.real_nick + ' out!'
    ]
    var response = _.shuffle(responses)[0];
    irc_client.say(channel, response);
    irc_client.part(channel);

    // Remove the channel from the list
    settings.channels = _(settings.channels).without(channel);

    // Remove the channel from the db
    if (pg_client) {
      pg_client.query("DELETE FROM channels WHERE id=$1", [channel]);
    }
  },
  'help': function(channel) {
    irc_client.say(channel, 'Available commands:');
    irc_client.say(channel, 'botsnack - om nom nom');
    irc_client.say(channel, 'bye - kick me out');
  },
  'ping': function(channel, nick) {
    irc_client.say(channel, nick + ': pong!');
  }
}

// Check messaages
irc_client.on('message', function(nick, channel, message) {
  if (nick !== settings.nick) {
    if (message.search(/\bcrazy\b/i) !== -1) {
      irc_client.say(channel, 'Hey ' + nick + ' I just met you...');
      irc_client.say(channel, 'And this is crazy...');
      irc_client.say(channel, "But here's my handle...");
      irc_client.say(channel, 'So ping me, maybe?');
    }

    // Check if spoken to and run a command if available
    var me = utils.escapeRegExp(settings.real_nick);
    var re = new RegExp('^(?:' + me + '):?\\s*(.+?)$');
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
irc_client.on('invite', function(channel, from) {
  irc_client.join(channel, settings.nick);

  // Add the channel to the list
  settings.channels.push(channel);

  // Add channel to the db
  if (pg_client) {
    pg_client.query({
      text: 'INSERT INTO channels(id, invited_by) values($1, $2)',
      values: [channel, from]
    });
  }
});

// Check if kicked
irc_client.on('kick', function(channel, nick) {
  if (nick === settings.real_nick) {
    commands.bye(channel);
  }
});

// Handle errors
irc_client.on('error', function(message) {
  console.log(message);
});

// Client connects
irc_client.on('registered', function(message) {
  if (settings.debug === true) {
    console.log(message);
  }

  // Save the nickname assigned by the server
  settings.real_nick = message.args[0];

  // Check for additional channels and join
  if (pg_client) {
    var query = pg_client.query("SELECT id FROM channels");

    query.on('row', function(row) {
      irc_client.join(row.id, settings.nick);
    });
  }
});