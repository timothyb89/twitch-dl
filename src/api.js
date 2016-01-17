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
 * @property {string} type the thumbnail type, e.g. "generated"
 * @property {string} url  the thumbnail url
 */

/**
 * A channel object (simplified)
 * @typedef {object} channelSimple
 * @property {string} display_name the channel display name
 * @property {string} name         the channel name
 */

/**
 * A video as returned by the Twitch API.
 * @typedef {object} video
 * @property {string}  _id         the twitch API ID of this video
 * @property {string}  game        the name of the game, or null
 * @property {boolean} is_muted    true if all or part (?) of the video is muted
 * @property {number}  length      the length in seconds of this video
 * @property {string}  recorded_at the ISO date string of the recording date
 * @property {string}  title       the title of this stream
 * @property {string}  url         the URL of this stream (for livestreamer)
 * @property {channelSimple} channel    the channel that owns this video
 * @property {thumbnail[]}   thumbnails a list of thumbnails
 */

/**
 * A channel object.
 * @typedef {object} channel
 * @property {string} language the stream language code
 * @property {string} name         the channel username
 * @property {string} display_name the channel display name
 * @property {string} logo         a logo image URL
 * @property {string} url          the Twitch URL
 * @property {boolean} partner     true if the channel is partnered with twitch
 * @property {number} views        a view counter
 * @property {number} followers    the number of followers for this channel
 */

/**
 * A stream object.
 * @typedef {object} stream
 * @property {string}  game     the name of the current game, if any
 * @property {number}  viewers the current viewer concurrent
 * @property {channel} channel the channel object for this stream
 * @property {number}  average_fps  the average stream framerate
 * @property {number}  video_height the video height in px
 *
 */

/**
 * A stream response object
 * @typedef {object} streamResponse
 * @property {stream|null} stream current stream info, or null if not live.
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
    },

    /**
     * Gets the current stream status for a user.
     * @param  {string}  user a twitch user
     * @return {unirest}      a unirest object
     */
    streams: function(user) {
        return twitch('/streams/' + user);
    }
};

module.exports = api;
