'use strict';

var os = require('os');
var fs = require('fs');
var path = require('path');

const HOME = os.homedir();
const CONFIG_FILE = path.join(HOME, '.twitch-dl');

var log = require('./ui/util').log;

var defaults = function() {
    return {
        stream: {
            quality: 'source',
            metadata: true,
            thumbnails: true
        }
    };
};

var config = new Promise(function(resolve, reject) {
    fs.readFile(CONFIG_FILE, function(err, data) {
        if (err) {
            log('Could not read config file, creating new...');
            resolve(defaults());
            return;
        }

        resolve(JSON.parse(data));
    });
});

var save = function(c) {
    if (!c) {
        config.then(function(cfg) {
            save(cfg);
        });
        return;
    }

    fs.writeFile(CONFIG_FILE, JSON.stringify(c), function(err) {
        if (err) {
            log('Could not write config file to ', CONFIG_FILE);
        }
    });
};

config.save = save;
config.defaults = defaults;

module.exports = config;
