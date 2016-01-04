'use strict';

var blessed = require('blessed');
var merge = require('merge');

var config = require('../config');
var util = require('./util');

var StreamConfig = require('./config/stream-config').StreamConfig;

var downloads = require('../livestreamer');

class DownloadDialog extends blessed.Box {

    /**
     * Creates a new DownloadDialog.
     * @param  {object} options ui config options
     * @param  {video} video    the video object
     */
    constructor(options, video) {
        super(merge({
            mouse: true,
            keys: true,
            scrollable: true,
            label: ' Start Download ',
            border: 'line',
            padding: { top: 1, left: 1, bottom: 1, right: 1 },
            width: 'shrink',
            height: 18
        }, options));

        this.video = video;

        this.steamConfig = new StreamConfig({
            parent: this,
            top: 0,
            left: 0,
            right: 0,
            height: 10,
            border: 'line',
            label: ' Options ',
            padding: { top: 1, left: 1, bottom: 1, right: 1 }
        });

        this.submitButton = blessed.button({
            parent: this,
            keys: true,
            mouse: true,
            top: 12,
            left: 0,
            width: 8,
            height: 1,
            content: 'Accept',
            name: 'submit',
            padding: { left: 1, right: 1 },
            style: {
                bg: 'green',
                fg: 'black',
                focus: {
                    bg: 'cyan'
                }
            }
        });

        this.cancelButton = blessed.button({
            parent: this,
            keys: true,
            mouse: true,
            top: 12,
            left: 10,
            width: 8,
            height: 1,
            content: 'Cancel',
            name: 'cancel',
            padding: { left: 1, right: 1 },
            style: {
                bg: 'white',
                fg: 'black',
                focus: {
                    bg: 'cyan'
                }
            }
        });

        this.on('focus', () => this.submitButton.focus());

        this.submitButton.on('press', () => {
            util.log('starting download for ' + video.url);
            downloads.start(video, 'test.flv'); // TODO
            this.destroy();
        });

        this.cancelButton.on('press', () => {
            this.destroy();
        });
    }
}

module.exports = DownloadDialog;
