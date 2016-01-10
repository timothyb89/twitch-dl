'use strict';

var os = require('os');
var fs = require('fs');
var path = require('path');
var exec = require('child_process').exec;

const HOME = os.homedir();
const CONFIG_FILE = path.join(HOME, '.twitch-dl');

var log = require('./ui/util').log;

var defaults = function() {
    return {
        paths: {
            livestreamer: '',
            ffmpeg: '',
            ffprobe: ''
        },
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

    fs.writeFile(CONFIG_FILE, JSON.stringify(c, null, 4), function(err) {
        if (err) {
            log('Could not write config file to ', CONFIG_FILE);
        }
    });
};

var resolve = function(cmd) {
    return config.then(function(c) {
        if (c.paths[cmd]) {
            return Promise.resolve(c.paths[cmd]);
        } else {
            return new Promise(function(resolve, reject) {
                exec(`which ${cmd}`, function(err, stdout, stderr) {
                    if (err) {
                        reject();
                    }

                    resolve(stdout.trim());
                });
            });
        }
    });
};

config.save = save;
config.defaults = defaults;
config.resolve = resolve;

module.exports = config;
