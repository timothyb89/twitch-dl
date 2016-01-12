'use strict';

var blessed = require('blessed');
var merge = require('merge');

var config = require('../config');
var util = require('./util');

var CommandConfigDialog = require('./config/command-config').CommandConfigDialog;
var StreamConfigDialog = require('./config/stream-config').StreamConfigDialog;

class ConfigEditor extends blessed.Box {
    constructor(options) {
        super(merge({
            keys: true,
            mouse: true,
            padding: { top: 1, right: 1, bottom: 1, left: 1 }
        }, options));

        this.commands = blessed.button({
            parent: this,
            keys: true,
            mouse: true,
            top: 0,
            left: 0,
            width: 'shrink',
            height: 1,
            content: 'Command Paths',
            padding: { left: 1, right: 1 },
            style: {
                bg: 'green',
                fg: 'black',
                focus: {
                    bg: 'cyan'
                }
            }
        });

        this.stream = blessed.button({
            parent: this,
            keys: true,
            mouse: true,
            top: 2,
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

        this.commands.on('press', () => {
            var cc = new CommandConfigDialog({
                parent: this,
                top: 'center',
                left: 'center'
            });

            cc.focus();

            cc.on('submit', (data) => {
                config.then((c) => {
                    c.paths = merge(c.paths, cc.sanitize(data));
                    config.save();

                    util.log('Saved: command config');
                });

                cc.destroy();
                this.commands.focus();
                this.screen.render();
            });

            cc.on('cancel', () => {
                cc.destroy();
                this.commands.focus();
                this.screen.render();
            });
        });

        this.stream.on('press', () => {
            var sc = new StreamConfigDialog({
                parent: this,
                top: 'center',
                left: 'center'
            });

            sc.focus();

            sc.on('submit', (data) => {
                config.then((c) => {
                    c.stream = merge(c.stream, sc.sanitize(data));
                    config.save();

                    util.log('Saved: stream config');
                });

                sc.destroy();
                this.stream.focus();
                this.screen.render();
            });

            sc.on('cancel', () => {
                sc.destroy();
                this.stream.focus();
                this.screen.render();
            });
        });

        this.on('focus', () => this.commands.focus());

        util.focusOrder([ this.commands, this.stream ]);
    }
}

module.exports = ConfigEditor;
