'use strict';

var blessed = require('blessed');
var contrib = require('blessed-contrib');
var merge = require('merge');
var moment = require('moment');

var api = require('../api');
var util = require('./util');

var DownloadDialog = require('./download-dialog');

class VideoList extends blessed.Box {
    constructor(options) {
        super(merge({
            keys: true,
            mouse: true
        }, options));

        this.limit = 10;
        this.page = 0;
        this.loading = false;

        this.list = blessed.listtable({
            parent: this,
            border: 'line',
            top: 0,
            bottom: 1,
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

        var buttonDefaults = {
            parent: this,
            mouse: true,
            width: 'shrink',
            height: 1,
            tags: true,
            padding: { left: 1, right: 1 },
            style: {
                bg: 'green',
                fg: 'black',
                focus: {
                    bg: 'cyan'
                }
            }
        };

        this.prevButton = blessed.button(merge({}, buttonDefaults, {
            left: 0,
            bottom: 0,
            content: '{red-fg}{underline}P{/}rev Page'
        }));

        this.nextButton = blessed.button(merge({}, buttonDefaults, {
            left: 12,
            bottom: 0,
            content: '{red-fg}{underline}N{/}ext Page'
        }));

        this.userButton = blessed.button(merge({}, buttonDefaults, {
            right: 10,
            bottom: 0,
            content: 'Change {red-fg}{underline}U{/}ser'
        }));

        this.refreshButton = blessed.button(merge({}, buttonDefaults, {
            right: 0,
            bottom: 0,
            content: '{red-fg}{underline}R{/}efresh'
        }));

        this.pageLabel = blessed.text({
            parent: this,
            width: 'shrink',
            height: 1,
            bottom: 0,
            left: 'center',
            content: ''
        });

        this.list.on('select', (el, index) => {
            var v = this.videos[index - 1];
            if (!v) {
                return;
            }

            var dialog = new DownloadDialog({
                parent: this,
                top: 'center',
                left: 'center'
            }, v);

            dialog.on('destroy', () => this.list.focus());

            dialog.focus();
        });

        this.prevButton.on('press', () => this.prev());
        this.list.key(['C-p', 'M-p', 'left', 'M-left', 'C-left'], () => this.prev());

        this.nextButton.on('press', () => this.next());
        this.list.key(['C-n', 'M-n', 'right', 'M-right', 'C-right'], () => this.next());

        this.userButton.on('press', () => this.setUser());
        this.list.key(['C-u', 'M-u'], () => this.setUser());

        this.refreshButton.on('press', () => this.refresh());
        this.list.key(['C-r', 'M-r'], () => this.refresh());

        util.refocus(this.list, [
            this,
            this.nextButton,
            this.prevButton,
            this.userButton,
            this.refreshButton
        ]);
    }

    /**
     * Set the displayed list of videos.
     * @param {video[]} videos the list of videos
     */
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

    prev() {
        if (!this.loading) {
            this.page = Math.max(0, this.page - 1);
            this._loadVideos();
        }
    }

    next() {
        if (!this.loading) {
            this.page = Math.min(this.maxPage, this.page + 1);
            this._loadVideos();
        }
    }

    refresh() {
        if (!this.loading) {
            this._loadVideos();
        }
    }

    /** @private */
    _loadVideos(user) {
        user = user || this.user;
        if (!user) {
            return;
        }

        this.loading = true;

        this.pageLabel.setContent('loading...');
        this.screen.render();

        api.videos(user.name).query({
            broadcasts: 'true',
            limit: this.limit,
            offset: this.limit * this.page
        }).end((response) => {
            if (response.code !== 200) {
                util.display('Could not load videos!', -1, function() {
                    this.screen.destroy();
                    process.exit(0);
                });
            }

            this.maxPage = Math.floor(response.body._total / this.limit) + 1;
            this.pageLabel.setContent(`Page: ${this.page + 1} / ${this.maxPage}`);

            this.setVideos(response.body.videos);
            this.list.focus();

            this.loading = false;
        });
    }

    setUser(user) {
        if (!user) {
            util.input('User?', '', (err, value) => {
                if (!value) {
                    this.screen.destroy();
                    console.log('Okay, quitting!');
                    process.exit(0);
                }

                this.setUser(value);
            });
            this.screen.render();
            return;
        }

        api.user(user).end((response) => {
            if (response.code !== 200) {
                util.display(
                        `Invalid user '${user}', try again.`,
                        err => this.setUser(null));
                return;
            }

            this.user = response.body;
            this.offset = 0;

            this._loadVideos(response.body);
        });
    }
}

module.exports = VideoList;
