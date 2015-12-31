'use strict';

var unirest = require('unirest');

var twitch = function(endpoint) {
    var api = 'https://api.twitch.tv/kraken';

    return unirest
            .get(api + endpoint)
            .header('Accept', 'application/vnd.twitchtv.v3+json');
};

/**
 * A thumbnail object
 * @typedef {object} thumbnail
 * @property {string}
 */

/**
 * A channel object
 * @typedef {object} channel
 * @property {string} display_name the channel display name
 * @property {string} name         the channel name
 */

/**
 * A video as returned by the Twitch API.
 * @typedef {object} video
 * @property {string}  _id         the twitch API ID of this video
 * @property {channel} channel     the channel that owns this video
 * @property {string}  game        the name of the game, or null
 * @property {boolean} is_muted    true if all or part (?) of the video is muted
 * @property {number}  length      the length in seconds of this video
 * @property {string}  recorded_at the ISO date string of the recording date
 * @property {string}  title       the title of this stream
 * @property {string}  url         the URL of this stream (for livestreamer)
 * @property {thumbnail[]} thumbnails a list of thumbnails
 */

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
