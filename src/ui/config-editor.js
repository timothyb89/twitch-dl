'use strict';

var blessed = require('blessed');
var merge = require('merge');

var config = require('../config');
var util = require('./util');

var StreamConfigDialog = require('./config/stream-config').StreamConfigDialog;

class ConfigEditor extends blessed.Box {
    constructor(options) {
        super(merge({
            keys: true,
            mouse: true,
            padding: { top: 1, right: 1, bottom: 1, left: 1 }
        }, options));

        this.stream = blessed.button({
            parent: this,
            keys: true,
            mouse: true,
            top: 0,
            left: 0,
            width: 'shrink',
            height: 1,
            content: 'Stream Download Settings',
            padding: { left: 1, right: 1 },
            style: {
                bg: 'green',
                fg: 'black',
                focus: {
                    bg: 'cyan'
                }
            }
        });

        this.stream.on('press', () => {
            var sc = new StreamConfigDialog({
                parent: this,
                top: 'center',
                left: 'center'
            });

            sc.on('submit', (data) => {
                config.then((c) => {
                    c.stream = merge(c.stream, sc.sanitize(data));
                    config.save();

                    util.log('Saved: stream config');
                });

                sc.destroy();
                this.screen.render();
            });

            sc.on('cancel', () => {
                sc.destroy();
                this.screen.render();
            });
        });
    }
}

module.exports = ConfigEditor;
