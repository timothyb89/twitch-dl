'use strict';

var blessed = require('blessed');
var merge = require('merge');

var config = require('../../config');
var util = require('../util');

class CommandConfig extends blessed.Form {
    constructor(options) {
        super(merge({
            mouse: true,
            keys: true,
            width: 'shrink',
            height: 10
        }, options));

        this.livestreamerLabel = blessed.text({
            parent: this,
            top: 0,
            left: 1,
            width: 13,
            height: 1,
            content: 'livestreamer:'
        });

        this.livestreamer = blessed.textbox({
            parent: this,
            keys: true,
            mouse: true,
            top: 0,
            left: 15,
            width: 40,
            height: 1,
            name: 'livestreamer',
            style: {
                fg: 'black',
                bg: 'white',
                focus: {
                    bg: 'cyan'
                }
            }
        });

        this.ffmpegLabel = blessed.text({
            parent: this,
            top: 2,
            left: 1,
            width: 8,
            height: 1,
            content: 'ffmpeg:'
        });

        this.ffmpeg = blessed.textbox({
            parent: this,
            keys: true,
            mouse: true,
            top: 2,
            left: 15,
            width: 40,
            height: 1,
            name: 'ffmpeg',
            style: {
                fg: 'black',
                bg: 'white',
                focus: {
                    bg: 'cyan'
                }
            }
        });

        this.ffprobeLabel = blessed.text({
            parent: this,
            top: 4,
            left: 1,
            width: 8,
            height: 1,
            content: 'ffprobe:'
        });

        this.ffprobe = blessed.textbox({
            parent: this,
            keys: true,
            mouse: true,
            top: 4,
            left: 15,
            width: 40,
            height: 1,
            name: 'ffprobe',
            style: {
                fg: 'black',
                bg: 'white',
                focus: {
                    bg: 'cyan'
                }
            }
        });

        this.text = blessed.text({
            parent: this,
            top: 6,
            left: 15,
            height: 1,
            width: 'shrink',
            content: 'Leave empty to autodetect from PATH.'
        });

        this.livestreamer.on('focus', () => this.livestreamer.readInput());
        this.ffmpeg.on('focus', () => this.ffmpeg.readInput());
        this.ffprobe.on('focus', () => this.ffprobe.readInput());

        config.then((config) => {
            this.livestreamer.setValue(config.paths.livestreamer || '');
            this.ffmpeg.setValue(config.paths.ffmpeg || '');
            this.ffprobe.setValue(config.paths.ffprobe || '');

            this.screen.render();
        });

        // the text box seems to think that it has no left offset when
        // positioning the cursor, and will be on top of the quality label even
        // though it shouldn't overlap
        // (but only when spawned with 'center'?)
        // moving it up the render stack seems to work around the bug, but the
        // cursor is still moved too far to the left
        this.livestreamerLabel.setIndex(50); // ???
        this.livestreamerLabel.setIndex(50); // ???
    }

    sanitize(data) {
        return data;
    }
}

class CommandConfigDialog extends CommandConfig {
    constructor(options) {
        super(merge({
            label: ' Command Paths ',
            border: 'line',
            padding: { top: 1, left: 1, bottom: 1, right: 1 },
            height: 14
        }, options));

        this.submitButton = blessed.button({
            parent: this,
            keys: true,
            mouse: true,
            top: 8,
            left: 15,
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
            top: 8,
            left: 25,
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

        this.on('focus', () => this.livestreamer.focus());

        this.submitButton.on('press', () => this.submit());
        this.cancelButton.on('press', () => this.cancel());

        this.focus();
    }

    sanitize(data) {
        var clone = merge(true, data);

        delete clone.cancel;
        delete clone.submit;

        return clone;
    }
};

module.exports = {
    CommandConfig: CommandConfig,
    CommandConfigDialog: CommandConfigDialog
};
