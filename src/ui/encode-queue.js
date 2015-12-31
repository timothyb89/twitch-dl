'use strict';

var blessed = require('blessed');
var contrib = require('blessed-contrib');
var merge = require('merge');
var moment = require('moment');

var util = require('./util');

class EncodeQueue extends blessed.Box {
    constructor(options) {
        super(merge({
            keys: true,
            mouse: true
        }, options));

        this.list = blessed.listtable({
            parent: this,
            label: ' Encoding Queue ',
            border: 'line',
            top: 0,
            left: 0,
            bottom: 0,
            right: 40,
            mouse: true,
            keys: true
        });

        this.spark = contrib.sparkline({
            parent: this,
            label: ' Encoding FPS ',
            border: 'line',
            top: 0,
            right: 0,
            width: 40,
            height: 10,
            bottom: 0,
            style: {
                scrollbar: { bg: 'blue' }
            }
        });
    }
}

module.exports = EncodeQueue;
