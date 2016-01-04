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
     * @return {Promise|null} a promise yielding the suggested filename, or null
     */
    suggestFilename(video) {
        return null;
    }

}

module.exports = ContextPlugin;
