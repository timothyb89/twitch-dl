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

class VP8Plugin extends EncodePlugin {

    constructor() {
        super();

        this.name = 'webm-vp8';
    }

    extension() {
        return 'webm';
    }

    apply(ffmpeg, ffprobe, video) {
        return ffmpeg
                .videoCodec('libvpx')
                .size(getSize(ffprobe))
                .fps(30)
                .outputOptions('-crf 23')
                .audioCodec('copy');
    }

}

module.exports = VP8Plugin;
