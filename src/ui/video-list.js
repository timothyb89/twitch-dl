'use strict';

var blessed = require('blessed');
var contrib = require('blessed-contrib');
var merge = require('merge');
var moment = require('moment');

var util = require('./util');

class VideoList extends blessed.Box {
    constructor(options) {
        super(merge({
            keys: true,
            mouse: true
        }, options));

        this.list = blessed.listtable({
            parent: this,
            border: 'line',
            top: 0,
            bottom: 10,
            left: 0,
            right: 0,
            label: 'Videos',
            align: 'left',
            mouse: true,
            keys: true,
            tags: true,
            scrollbar: true,
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

        this.list.on('select', (el, index) => {
            var v = this.videos[index - 1];
            if (!v) {
                return;
            }
            
            util.log(`Selected: ${v.title}`);
        });

        this.list.on('select item', (el, index, x) => {
            var v = this.videos[index - 1];
            if (!v) {
                return;
            }

            util.log(`Highlighed: ${v.title}`);
        });

        this.spark = contrib.sparkline({
            parent: this,
            label: ' Download Progress ',
            border: 'line',
            width: '50%',
            height: 10,
            bottom: 0,
            right: 0,
            style: {
                scrollbar: { bg: 'blue' }
            }
        });
    }

    setVideos(videos) {
        this.videos = videos;

        var data = [['Title', 'Game', 'Date', 'Duration']];
        for (let video of videos) {
            data.push([
                video.title,
                video.game || '',
                video.recorded_at,
                moment.duration(video.length, 'seconds').humanize()
            ]);
        }

        this.list.setData(data);
    }
}

module.exports = VideoList;
