'use strict';

const Plugin = require('./plugin');

class ContextPlugin extends Plugin {

    constructor() {
        super();

        this.type = 'context';
    }

    /**
     * Suggest a filename for a particular video
     * @param  {video} video the video to generate a filename for
     * @return {Promise} a promise yielding the suggested filename
     */
    suggestFilename(video) {
        return Promise.resolve(null);
    }

}

module.exports = ContextPlugin;
