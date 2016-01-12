'use strict';

const blessed = require('blessed');
const merge = require('merge');

const config = require('../config');
const util = require('./util');

const StreamConfigDialog = require('./config/stream-config').StreamConfigDialog;

const downloads = require('../livestreamer');
const plugin = require('../plugin');

let findFilenamePlugin = function(video) {
    // yo dawg, I heard you like promises (and didn't support await ...)
    let plugins = plugin.all('context');

    // kick off promises for all matching plugins to resolve a filename
    // but, return an object so we can get the plugin name + priority later
    let promises = [];
    for (let plug of plugins) {
        promises.push(plug.suggestFilename(video).then(result => {
            return {
                plugin: plug,
                result: result
            };
        }));
    }

    // promise to return the non-null result with the highest priority
    // (or nothing if no match)
    return Promise.all(promises).then(values => {
        return values
                .filter(v => v.result != null)
                .sort((a, b) =>  a.plugin.priority - b.plugin.priority)
                .pop();
    });
};

class DownloadDialog extends blessed.Box {

    /**
     * Creates a new DownloadDialog.
     * @param  {object} options ui config options
     * @param  {video}  video   the video object
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
            height: 24
        }, options));

        this.video = video;
        this.livestreamerOptions = {};

        let defaults = {
            parent: this,
            keys: true,
            mouse: true,
            left: 0,
            width: 'shrink',
            height: 1
        };

        blessed.text(merge({}, defaults, {
            top: 0,
            content: 'Title:'
        }));

        blessed.text(merge({}, defaults, {
            top: 0,
            left: 7,
            content: video.title
        }));

        blessed.text(merge({}, defaults, {
            top: 1,
            content: 'User:'
        }));

        blessed.text(merge({}, defaults, {
            top: 1,
            left: 7,
            content: video.channel.display_name,
        }));

        blessed.text(merge({}, defaults, {
            top: 2,
            content: 'Game:'
        }));

        blessed.text(merge({}, defaults, {
            top: 2,
            left: 7,
            content: video.game || 'n/a'
        }));

        blessed.text(merge({}, defaults, {
            top: 4,
            content: 'Filename:'
        }));

        this.filename = blessed.textbox(merge({}, defaults, {
            top: 5,
            width: 40,
            style: {
                fg: 'black',
                bg: 'white',
                focus: {
                    bg: 'cyan'
                }
            }
        }));

        this.pluginLabel = blessed.text(merge({}, defaults, {
            top: 6,
            width: 40,
            content: ''
        }));

        this.livestreamerButton = blessed.button(merge({}, defaults, {
            top: 9,
            content: 'Download Options',
            padding: { left: 1, right: 1 },
            style: {
                bg: 'green',
                fg: 'black',
                focus: {
                    bg: 'cyan'
                }
            }
        }));

        this.submitButton = blessed.button(merge({}, defaults, {
            top: 11,
            left: 0,
            width: 8,
            content: 'Accept',
            padding: { left: 1, right: 1 },
            style: {
                bg: 'green',
                fg: 'black',
                focus: {
                    bg: 'cyan'
                }
            }
        }));

        this.cancelButton = blessed.button(merge({}, defaults, {
            top: 11,
            left: 10,
            width: 8,
            content: 'Cancel',
            padding: { left: 1, right: 1 },
            style: {
                bg: 'white',
                fg: 'black',
                focus: {
                    bg: 'cyan'
                }
            }
        }));

        this.livestreamerButton.on('press', () => {
            let sc = new StreamConfigDialog({
                parent: this,
                top: 'center',
                left: 'center'
            });

            sc.focus();

            let clean = () => {
                sc.destroy();
                this.livestreamerButton.focus();
                this.screen.render();
            };

            sc.on('submit', (data) => {
                this.livestreamerOptions = sc.sanitize(data);

                clean();
            });

            sc.on('cancel', () => clean());
        });

        this.submitButton.on('press', () => {
            util.log('Starting download: ' + video.url);
            downloads.start(video, this.filename.value, this.livestreamerOptions);
            this.destroy();
        });

        this.cancelButton.on('press', () => {
            this.destroy();
        });

        this.filename.on('focus', () => this.filename.readInput());

        this.on('focus', () => this.submitButton.focus());
        util.focusOrder([
            this.filename,
            this.livestreamerButton,
            this.submitButton,
            this.cancelButton
        ]);

        findFilenamePlugin(video).then(value => {
            if (value) {
                this.filename.setValue(value.result);
                this.pluginLabel.setContent(`via plugin: ${value.plugin.name}`);
                this.screen.render();
            }
        });
    }
}

module.exports = DownloadDialog;
