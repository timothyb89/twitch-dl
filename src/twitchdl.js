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

var main = function() {
    videos.setUser(argv.user);

    screen.render();
};

main();
