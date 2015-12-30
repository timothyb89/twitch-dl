'use strict';

var EventEmitter = require('events');
var child_process = require('child_process');
var exec = child_process.exec;
var spawn = child_process.spawn;

var STATUS_REGEX = /Written ([\d\.]+ [A-Z]B) \((\d+\w) @ ([\d\.]+ [A-Z]B\/s)\)/;

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
     * @param  {string} url    the URL of the VOD to download
     * @param  {string} output the output file path
     */
    constructor(url, output) {
        super();

        livestreamer.then(path => {
            this.child = spawn(path, [url, 'source', '-o', output, '-f']);
            this.child.stderr.on('data', data => this._onDataErr(data));
            this.child.stderr.on('close', status => this._onClose(status));
        });
    }

    /**
     * Called when the child process prints a line to stderr. If this matches
     * the `STATUS_REGEX`, parse it and emit a progress event.
     * @private
     * @param  {Buffer} data the
     */
    _onDataErr(data) {
        var matches = STATUS_REGEX.exec(data.toString());
        if (matches) {
            this.emit('progress', {
                progress: matches[1],
                elapsed: matches[2],
                speed: matches[3]
            });
        }
    }

    /**
     * Called when the child process emits a `close` event.
     * @private
     * @param  {number} code the return code of the child livestreamer process
     */
    _onClose(code) {
        if (code === 0) {
            this.emit('finish');
        } else {
            this.emit('error', code);
        }
    }
}

module.exports = {
    livestreamer: livestreamer,
    Downloader: Downloader
};
