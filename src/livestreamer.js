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

class Downloader extends EventEmitter {
    constructor(url, output) {
        super();

        livestreamer.then(path => {
            this.child = spawn(path, [url, 'source', '-o', output, '-f']);
            this.child.stderr.on('data', data => this._onDataErr(data));
            this.child.stderr.on('close', status => this._onClose(status));
        });
    }

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
