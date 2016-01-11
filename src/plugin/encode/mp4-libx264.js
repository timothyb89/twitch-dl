'use strict';

const EncodePlugin = require('../encode-plugin');

const DEFAULT_SIZE = '1280x720';

const getSize = function(ffprobe) {
    for (let stream of ffprobe.streams) {
        if (stream.codec_type === 'video') {
            return `${stream.width}x${stream.height}`;
        }
    }

    return DEFAULT_SIZE;
};

class MP4Plugin extends EncodePlugin {

    constructor() {
        super();

        this.name = 'mp4-libx264';
    }

    extension() {
        return 'mp4';
    }

    apply(ffmpeg, ffprobe, video) {
        return ffmpeg
                .videoCodec('libx264')
                .size(getSize(ffprobe))
                .fps(30)
                .outputOptions('-crf 23')
                .audioCodec('copy')
                .outputOptions('-bsf:a aac_adtstoasc');
    }

}

module.exports = MP4Plugin;
