jepsen
======

A really annoying (see: awesome) IRC bot.


Installation
------------

- Install node.js and npm

- Clone the repo:

    $ git clone https://github.com/rehandalal/jepsen.git

- Use npm to get dependencies:

    $ cd jepsen
    $ npm install .


Configuration
-------------

Next you need to configure jepsen:

    $ cp settings-sample.json settings.json

You may now edit settings.json.

*N.B.: If you have a settings-dev.json file, this will be used instead of
settings.json*


Running The Bot
---------------

After you've configured jepsen, you can run it like this:

    $ node jepsen.js
