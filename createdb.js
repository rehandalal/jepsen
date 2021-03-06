var fs = require('fs');

var settings = {
  "pg": {
    "enabled": false
  }
}

// Check for a local settings file
if (fs.existsSync('./settings-dev.json')) {
  settings = require('./settings-dev.json');
} else if (fs.existsSync('./settings.json')) {
  settings = require('./settings.json');
}

// Check if PG is enabled and if so connect
if (settings.pg.enabled) {
  var pg = require('pg');

  // If no connection string is provided in settings then check for an ENV
  // variable with one.
  if (!settings.pg.connectionString) {
    console.log("No connection string found. Checking for DATABASE_URL.");

    settings.pg.connectionString = process.env.DATABASE_URL;
  }

  if (settings.pg.connectionString) {
    console.log("Connecting to: " + settings.pg.connectionString);

    var pg_client = new pg.Client(settings.pg.connectionString);
    pg_client.connect();
  }

  if (pg_client) {
    console.log("Creating table `channels`");

    var query = pg_client.query("CREATE TABLE channels (id character varying(64) NOT NULL, invited_by character varying(128), invited_at timestamp without time zone DEFAULT now());");
    query.on('end', function() {
      var query = pg_client.query("ALTER TABLE ONLY channels ADD CONSTRAINT channels_pkey PRIMARY KEY (id);");
      query.on('end', function() {
        pg_client.end();
      });
    });
  }
}