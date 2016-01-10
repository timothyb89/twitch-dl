'use strict';

const Plugin = require('./plugin');

class EncodePlugin extends Plugin {

    constructor() {
        super();

        this.type = 'encode';
    }

    /**
     * Return the desired extension for output files using this encode plugin.
     * @return {string} the file extension for files saved using this plugin.
     */
    extension() {
        throw 'not implemented';
    }

    /**
     * Apply encoding settings for the given video to the ffmpeg object. The
     * ffmpeg object will alrady have its input file configured, and the
     * returned object should be the ffmpeg chain BEFORE any terminal method is
     * called to actually start the encode, like `save()`. The caller will
     * handle the actual output file info.
     * @param  {object} ffmpeg  the ffmpeg object
     * @param  {object} ffprobe the ffprobe output for the original video
     * @param  {video}  video   the video to generate a filename for
     * @return {object} the ffmpeg object
     */
    apply(ffmpeg, ffprobe, video) {
        throw 'not implemented';
    }

}

module.exports = EncodePlugin;
