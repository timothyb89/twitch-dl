'use strict';

var blessed = require('blessed');
var contrib = require('blessed-contrib');
var merge = require('merge');
var moment = require('moment');
var qty = require('js-quantities');

var downloads = require('../livestreamer');

var util = require('./util');

const HEADER = ['Channel', 'Title', 'Duration'];

class DownloadQueue extends blessed.Box {
    constructor(options) {
        super(merge({
            keys: true,
            mouse: true
        }, options));

        this.active = blessed.listtable({
            parent: this,
            label: ' Active Downloads ',
            border: 'line',
            top: 0,
            left: 0,
            right: 40,
            height: 10,
            mouse: true,
            keys: true,
            style: {
                scrollbar: { bg: 'blue' },
                header: { bg: 'white', fg: 'black' },
                cell: {
                    selected: {
                        bg: 'blue'
                    }
                }
            }
        });

        this.activeHighlight = null;

        this.queue = blessed.listtable({
            parent: this,
            label: ' Download Queue ',
            border: 'line',
            top: 10,
            left: 0,
            right: 40,
            bottom: 0,
            mouse: true,
            keys: true,
            style: {
                scrollbar: { bg: 'blue' },
                header: { bg: 'white', fg: 'black' },
                cell: {
                    selected: {
                        bg: 'blue'
                    }
                }
            }
        });

        this.spark = contrib.sparkline({
            parent: this,
            label: ' Rate ',
            border: 'line',
            top: 0,
            right: 0,
            width: 40,
            height: 10,
            bottom: 0,
            tags: true,
            style: {
                scrollbar: { bg: 'blue' }
            }
        });

        downloads.on('start', (dl) => this._updateActive());
        downloads.on('finish', (dl) => {
            this.activeHighlight = null;
            this._updateActive();
            this._updateSpark();
        });

        downloads.on('error', (dl, code) => {
            util.log(`Error downloading ${dl.video.url} -> code ${code}`);
        });

        downloads.on('queue add', (dl) => this._updateQueue());
        downloads.on('queue remove', (dl) => this._updateQueue());

        downloads.on('progress', (progress) => this._updateSpark());

        this.active.on('select item', (el, index, x) => {
            var dl = downloads.active[index - 1];
            if (!dl) {
                this.activeHighlight = null;
                return;
            }

            this.activeHighlight = dl;
            this._updateSpark();
        });

        this.on('focus', () => this.active.focus());
    }

    /**
     * Updates the list of active downloads
     * @private
     */
    _updateActive() {
        let data = [HEADER];
        for (let dl of downloads.active) {
            data.push([
                dl.video.channel.display_name,
                dl.video.title,
                moment.duration(dl.video.length, 'seconds').humanize()
            ]);
        }

        this.active.setData(data);
    }

    /**
     * Updates the list of queued downloads.
     * @private
     */
    _updateQueue() {
        let data = [HEADER];
        for (let dl of downloads.queue) {
            data.push([
                dl.video.channel.display_name,
                dl.video.title,
                moment.duration(dl.video.length, 'seconds').humanize()
            ]);
        }

        this.queue.setData(data);
    }

    /**
     * Updates the sparkline chart.
     * @private
     */
    _updateSpark() {
        let dl = this.activeHighlight;
        if (!dl || dl.history.length === 0) {
            this.spark.setData([''], [[0, 0]]);
        } else {
            let data = [];
            for (let progress of dl.history) {
                let speed = progress.speed.replace('K', 'k');
                try {
                    data.push(qty(speed).baseScalar);
                } catch (e) {
                    util.log(`quantities.js couldn't parse: ${progress.speed}`);
                }
            }

            let last = dl.history[dl.history.length - 1];
            this.spark.setData([`${last.progress} @ ${last.speed}`], [data]);
        }

        this.screen.render();
    }
}

module.exports = DownloadQueue;
