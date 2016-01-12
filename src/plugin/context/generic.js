'use strict';

const slug = require('slug');
const moment = require('moment');

const ContextPlugin = require('../context-plugin');

class GenericPlugin extends ContextPlugin {

    constructor() {
        super();

        this.name = 'generic';
        this.priority = -10;
    }

    /**
     * @param  {video} video
     * @return {Promise}
     */
    suggestFilename(video) {
        let user = slug(video.channel.name);
        let date = moment(video.recorded_at).format('YYYYMMDDHHmm');
        let game = slug(video.game, { lower: true });

        let base = `${user}-${date}`;
        if (game) {
            base = `${base}-${game}`;
        }

        return Promise.resolve(base);
    }

}

module.exports = GenericPlugin;
