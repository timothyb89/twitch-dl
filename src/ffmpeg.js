'use strict';

const EventEmitter = require('events');
const path = require('path');

const ffmpeg = require('fluent-ffmpeg');
const merge = require('merge');

const config = require('./config');
const plugin = require('./plugin');

/**
 * Encode options
 * @typedef {object} encodeOptions
 * @property {string} plugin the name of the plugin to use
 */

class EncodeTask extends EventEmitter {

    /**
     * Creates and immediately starts a new encoding task.
     * @param {video}         video   the video to encode
     * @param {encodeOptions} options options for this task to override
     *                                configured defaults
     */
    constructor(video, options) {
        super();

        this.video = video;

        let ffmpegPromise = config.resolve('ffmpeg');
        let ffprobePromise = config.resolve('ffprobe');
        Promise.all([config, ffmpegPromise, ffprobePromise])
                .then(values => this._start(values[0], values[1], values[2]))
                .catch(err => this.emit('error', 'Could not init encode', err));
    }

    /** @private */
    _start(cfg, ffmpegPath, ffprobePath) {
        let options = merge(cfg.encode, options);
        let plug = plugin.get(options.plugin);

        let dir = path.dirname(this.video.dl.path);
        let name = this.video.dl.name + '.' + plug.extension();
        let outputPath = path.join(dir, name);

        ffmpeg.setFfmpegPath(ffmpegPath);
        ffmpeg.setFfprobePath(ffprobePath);

        ffmpeg.ffprobe(this.video.dl.path, (err, data) => {
            if (err) {
                this.emit('error', 'Could not read metadata', err);
                return;
            }

            let ff = ffmpeg(this.video.dl.path);
            ff = plug.apply(ff, data, this.video);
            ff.save(outputPath);

            ff.on('error', err => this.emit('error', 'ffmpeg error', err));
            ff.on('progress', this.emit('progress', progress));
            ff.on('end', () => this._onEnd(options, name));
        });
    }

    /** @private */
    _onEnd(options, name) {
        if (!this.video.dl.encodes) {
            this.video.dl.encodes = [];
        }

        this.video.dl.encodes.push({
            name: name,
            plugin: options.plugin
        });

        this.emit('finish');
    }

}

class EncodeManager extends EventManager {

    constructor() {
        super();

        this.active = null;
        this.queue = [];
    }

    start(video, options) {
        if (this.active) {
            let enc = { video: video, options: options };
            this.queue.push(enc);
            this.emit('queue add', enc);
        } else {
            this._start(video, options);
        }
    }

    /** @private */
    _start(video, options) {
        let task = new EncodeTask(video, options);
        task.on('progress', progress => this.emit('progress', progress));

        task.on('finish', () => {
            this.active = null;
            this.emit('finish', task);

            this._next();
        });

        task.on('error', code => {
            this.active = null;
            this.emit('error', task, code);

            this._next();
        });

        this.active = task;
        this.emit('start', task);
    }

    /** @private */
    _next() {
        if (this.queue.length === 0) {
            return;
        }

        let enc = this.queue.shift();
        this.emit('queue remove', enc);
        this._start(enc.video, enc.options);
    }

}

var manager = new EncodeManager();

module.exports = manager;
