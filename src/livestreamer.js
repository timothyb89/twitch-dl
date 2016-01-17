'use strict';

const EventEmitter = require('events');
const spawn = require('child_process').spawn;
const merge = require('merge');
const fs = require('fs');
const https = require('https');

const config = require('./config');
const util = require('./ui/util');

const STATUS_REGEX = /Written ([\d\.]+ [A-Z]B) \((\d+\w) @ ([\d\.]+ [A-Z]B\/s)\)/;
const MAX_PROGRESS_HISTORY = 30;
const MAX_CONCURRENT = 3;

/**
 * A Downloader that uses livestreamer to locally store twitch VODs.
 */
class Downloader extends EventEmitter {

    /**
     * Creates a Downloader. This immediately launches livestreamer (once it has
     * been resolved on from the system path) and will begin emitting progress
     * events.
     * @param {video}  video   the video to download
     * @param {string} output  the output file name (without extension)
     * @param {object} options livestreamer config options
     */
    constructor(video, output, options) {
        super();

        this.video = video;
        this.output = output;

        this.finished = false;
        this.history = [];

        let cfgPromise = config;
        let cmdPromise = config.resolve('livestreamer');

        Promise.all([cfgPromise, cmdPromise]).then(values => {
            let cfg = merge({}, values[0].stream, options);
            let cmd = values[1];

            if (cfg.metadata) {
                this._saveMetadata();
            }

            if (cfg.thumbnails) {
                this._saveThumbnails();
            }

            this.child = spawn(cmd, [
                video.url,
                cfg.quality,
                '-o', output + '.flv',
                '-f'
            ]);

            this.child.stderr.on('data', data => this._onDataErr(data));
            this.child.on('close', status => this._onClose(status));
        }).catch(err => {
            util.log(err);
        });
    }

    /** @private */
    _saveMetadata() {
        let path = this.output + '.json';
        fs.writeFile(path, JSON.stringify(this.video, null, 4), function(err) {
            if (err) {
                util.log('Could not write video metadata to ' + path);
            }
        });
    }

    /** @private */
    _saveThumbnail(url, index) {
        let dest = fs.createWriteStream(`${this.output}-${index}.jpg`);
        let req = https.get(url, response => {
            response.pipe(dest);
        }).on('error', err => {
            fs.unlink(dest);

            console.log(err);
            util.log('Error saving thumbnail #' + index);
        });
    }

    /** @private */
    _saveThumbnails() {
        if (this.video.thumbnails.length === 0) {
            return;
        }

        // videos tend to get 4 thumbnails (if long enough)
        // given intro/outro screens, prefer first and third thumbnails
        // (but only save up to 2 regardless)
        this._saveThumbnail(this.video.thumbnails[0].url, 1);
        if (this.video.thumbnails.length >= 3) {
            this._saveThumbnail(this.video.thumbnails[2].url, 2);
        } else if (this.video.thumbnails.length >= 2) {
            this._saveThumbnail(this.video.thumbnails[1].url, 2);
        }
    }

    /**
     * Called when the child process prints a line to stderr. If this matches
     * the `STATUS_REGEX`, parse it and emit a progress event.
     * @private
     * @param {Buffer} data the line of output from livestreamer
     */
    _onDataErr(data) {
        var matches = STATUS_REGEX.exec(data.toString());
        if (matches) {
            var progress = {
                downloader: this,
                video: this.video,
                progress: matches[1],
                elapsed: matches[2],
                speed: matches[3]
            };

            this.history.push(progress);
            if (this.history.length > MAX_PROGRESS_HISTORY) {
                this.history.shift();
            }

            this.emit('progress', progress);
        }
    }

    /**
     * Called when the child process emits a `close` event.
     * @private
     * @param  {number} code the return code of the child livestreamer process
     */
    _onClose(code) {
        this.finished = true;

        if (code === 0) {
            this.emit('finish');
        } else {
            this.emit('error', code);
        }
    }

    /**
     * Sends a SIGTERM to the livestreamer subprocess. An 'error' signal will be
     * emitted.
     */
    kill() {
        // should trigger _onClose
        this.child.kill();
    }
}

/**
 * A global manager for download instances
 */
class DownloadManager extends EventEmitter {

    constructor() {
        super();

        /**
         * The list of active video downloads
         * @type {Downloader[]}
         */
        this.active = [];
        this.queue = [];
    }

    /**
     * Starts a new download. If too many concurrent downloads are in progress,
     * the download will be added to a queue. A 'start' event will be fired when
     * the download actually starts; 'queue add' and 'queue remove' events will
     * be fired if the download is forced to wait.
     * @param {video}  video   the video to download via livestreamer
     * @param {string} output  the path to the desired output file
     * @param {object} options the path to the desired output file
     */
    start(video, output, options) {
        if (this.active.length > MAX_CONCURRENT) {
            var dl = { video: video, output: output, options: options };
            this.queue.push(dl);
            this.emit('queue add', dl);
        } else {
            this._start(video, output, options);
        }
    }

    /**
     * Actually starts a download.
     * @private
     */
    _start(video, output, options) {
        var dl = new Downloader(video, output, options);
        dl.on('progress', (progress) => this.emit('progress', progress));

        dl.on('finish', () => {
            this.active.splice(this.active.indexOf(dl), 1);
            this.emit('finish', dl);

            this._next();
        });

        dl.on('error', (code) => {
            this.active.splice(this.active.indexOf(dl), 1);
            this.emit('error', dl, code);

            this._next();
        });

        this.active.push(dl);
        this.emit('start', dl);
    }

    /**
     * Starts the next download in the queue, if any exists.
     * @private
     */
    _next() {
        if (this.queue.length === 0) {
            return;
        }

        var dl = this.queue.shift();
        this.emit('queue remove', dl);
        this._start(dl.video, dl.output, dl.options);
    }

};

// shitty singleton
var manager = new DownloadManager();

module.exports = manager;
