'use strict';

var blessed = require('blessed');
var contrib = require('blessed-contrib');
var moment = require('moment');
var spawn = require('child_process').spawn;

var api = require('./api');
var util = require('./ui/util');

var VideoList = require('./ui/video-list');
var DownloadQueue = require('./ui/download-queue');
var EncodeQueue = require('./ui/encode-queue');
var UploadQueue = require('./ui/upload-queue');
var ConfigEditor = require('./ui/config-editor');

var argv = require('yargs').alias('u', 'user').argv;

var screen = blessed.screen({
    smartCSR: true,
    autoPadding: true,
    debug: true
});

util.init(screen);

screen.key(['escape', 'q', 'C-c'], function(ch, key) {
    screen.destroy();
    process.exit(0);
});

var bar = blessed.listbar({
    parent: screen,
    border: 'line',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    mouse: true,
    keys: true,
    autoCommandKeys: true,
    style: {
        prefix: { fg: 'white' },
        selected: { bg: 'blue' }
    }
});

var defaults = {
    parent: screen,
    border: 'line',
    top: 3,
    bottom: 10,
    left: 0,
    right: 0,
};

var videos = new VideoList(defaults);
var downloads = new DownloadQueue(defaults);
var encodes = new EncodeQueue(defaults);
var uploads = new UploadQueue(defaults);
var config = new ConfigEditor(defaults);

var screens = [
    { title: 'Videos', element: videos },
    { title: 'Downloads', element: downloads },
    { title: 'Encodes', element: encodes },
    { title: 'Uploads', element: uploads },
    { title: 'Configuration', element: config }
];

var hideAll = function() {
    for (let s of screens) {
        s.element.hide();
    }
};

screens.forEach(function(s, index) {
    s.index = index;
    s.show = function() {
        hideAll();
        s.element.show();
        s.element.focus();
    };

    bar.add({ text: s.title, callback: s.show });
});

screens[0].show();
util.postinit();

var loadVideos = function(user) {
    api.videos(user.name).query({broadcasts: 'true'}).end(function(response) {
        if (response.code !== 200) {
            util.display('Could not load videos!', -1, function() {
                screen.destroy();
                process.exit(0);
            });
        }

        videos.setVideos(response.body.videos);

        videos.list.focus();
    });
};

var getUserData = function(user) {
    if (!user) {
        util.input('User?', '', function(err, value) {
            if (!value) {
                screen.destroy();
                console.log('Okay, quitting!');
                process.exit(0);
            }

            getUserData(value);
        });
        screen.render();
        return;
    }

    api.user(user).end(function(response) {
        if (response.code !== 200) {

            util.display(
                    `Invalid user '${user}', try again.`,
                    err => getUserData(null));
            return;
        }

        loadVideos(response.body);
    });
};

var main = function() {
    getUserData(argv.user);

    screen.render();
};

main();
