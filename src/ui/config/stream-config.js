'use strict';

var blessed = require('blessed');
var merge = require('merge');

var config = require('../../config');
var util = require('../util');

class StreamConfig extends blessed.Form {
    constructor(options) {
        super(merge({
            mouse: true,
            keys: true,
            width: 'shrink',
            height: 10
        }, options));

        this.qualityLabel = blessed.text({
            parent: this,
            top: 0,
            left: 1,
            width: 8,
            height: 1,
            content: 'Quality:'
        });

        this.quality = blessed.textbox({
            parent: this,
            keys: true,
            mouse: true,
            top: 0,
            left: 10,
            width: 20,
            height: 1,
            name: 'quality',
            style: {
                fg: 'black',
                bg: 'white',
                focus: {
                    bg: 'cyan'
                }
            }
        });

        this.thumbnails = blessed.checkbox({
            parent: this,
            keys: true,
            mouse: true,
            top: 2,
            left: 10,
            width: 'shrink',
            height: 1,
            content: 'Save Thumbnails',
            name: 'thumbnails'
        });

        this.metadata = blessed.checkbox({
            parent: this,
            keys: true,
            mouse: true,
            top: 4,
            left: 10,
            width: 'shrink',
            height: 1,
            content: 'Save Metadata',
            name: 'metadata'
        });

        this.quality.on('focus', () => this.quality.readInput());

        config.then((config) => {
            this.quality.setValue(config.stream.quality);

            if (config.stream.thumbnails === true) {
                this.thumbnails.check();
            }

            if (config.stream.metadata === true) {
                this.metadata.check();
            }

            this.screen.render();
        });

        // the text box seems to think that it has no left offset when
        // positioning the cursor, and will be on top of the quality label even
        // though it shouldn't overlap
        // (but only when spawned with 'center'?)
        // moving it up the render stack seems to work around the bug, but the
        // cursor is still moved too far to the left
        this.qualityLabel.setIndex(50); // ???
    }

    sanitize(data) {
        return data;
    }
}

class StreamConfigDialog extends StreamConfig {
    constructor(options) {
        super(merge({
            label: ' Stream Download Settings ',
            border: 'line',
            padding: { top: 1, left: 1, bottom: 1, right: 1 },
            height: 12
        }, options));

        this.submitButton = blessed.button({
            parent: this,
            keys: true,
            mouse: true,
            top: 6,
            left: 10,
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
            top: 6,
            left: 20,
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

        this.submitButton.on('press', () => this.submit());
        this.cancelButton.on('press', () => this.cancel());
    }

    sanitize(data) {
        var clone = merge(true, data);

        delete clone.cancel;
        delete clone.submit;

        return clone;
    }
};

module.exports = {
    StreamConfig: StreamConfig,
    StreamConfigDialog: StreamConfigDialog
};
