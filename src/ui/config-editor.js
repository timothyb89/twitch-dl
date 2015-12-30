'use strict';

var blessed = require('blessed');
var merge = require('merge');

var util = require('./util');
var StreamConfig = require('./config/stream-config');

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
            var sc = new StreamConfig({
                parent: this,
                top: 'center',
                left: 'center',
                border: 'line',
            });

            sc.on('submit', () => {
                // TODO save
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
