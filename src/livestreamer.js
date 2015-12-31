'use strict';

var EventEmitter = require('events');
var child_process = require('child_process');
var exec = child_process.exec;
var spawn = child_process.spawn;

const STATUS_REGEX = /Written ([\d\.]+ [A-Z]B) \((\d+\w) @ ([\d\.]+ [A-Z]B\/s)\)/;
const MAX_PROGRESS_HISTORY = 30;
const MAX_CONCURRENT = 3;

var livestreamer = new Promise(function(resolve, reject) {
    exec('which livestreamer', function(err, stdout, stderr) {
        if (err) {
            reject();
        }

        resolve(stdout.trim());
    });
});

/**
 * A Downloader that uses livestreamer to locally store twitch VODs.
 */
class Downloader extends EventEmitter {

    /**
     * Creates a Downloader. This immediately launches livestreamer (once it has
     * been resolved on from the system path) and will begin emitting progress
     * events.
     * @param  {video}  video  the video to download
     * @param  {string} output the output file path
     */
    constructor(video, output) {
        super();

        this.video = video;
        this.output = output;

        this.finished = false;
        this.history = [];

        livestreamer.then(path => {
            this.child = spawn(path, [video.url, 'source', '-o', output, '-f']);
            this.child.stderr.on('data', data => this._onDataErr(data));
            this.child.on('close', status => this._onClose(status));
        });
    }

    /**
     * Called when the child process prints a line to stderr. If this matches
     * the `STATUS_REGEX`, parse it and emit a progress event.
     * @private
     * @param  {Buffer} data the line of output from livestreamer
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
     * @param  {video}  video  the video to download via livestreamer
     * @param  {string} output the path to the desired output file
     */
    start(video, output) {
        if (this.active.length > MAX_CONCURRENT) {
            var dl = { video: video, output: output };
            this.queue.push(dl);
            this.emit('queue add', dl);
        } else {
            this._start(video, output);
        }
    }

    /**
     * Actually starts a download.
     * @private
     */
    _start(video, output) {
        var dl = new Downloader(video, output);
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
        this._start(dl.video, dl.output);
    }

};

// shitty singleton
var manager = new DownloadManager();

module.exports = manager;
