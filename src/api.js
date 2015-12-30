'use strict';

var unirest = require('unirest');

var twitch = function(endpoint) {
    var api = 'https://api.twitch.tv/kraken';

    return unirest
            .get(api + endpoint)
            .header('Accept', 'application/vnd.twitchtv.v3+json');
};

var api = {
    /**
     * Gets information on a video with a particular id.
     * @param  {string} id a twitch video id
     * @return {unirest}   a unirest object
     */
    video: function(id) {
        return twitch('/videos/' + id);
    },

    /**
     * Gets information on a user
     * @param  {string} user a twitch username
     * @return {unirest}     a unirest object
     */
    user: function(user) {
        return twitch('/users/' + user);
    },

    /**
     * Gets a list of videos for a particular user.
     * @param  {string} user a twitch username
     * @return {unirest}     a unirest object
     */
    videos: function(user) {
        return twitch('/channels/' + user + '/videos');
    }
};

module.exports = api;
