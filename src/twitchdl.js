'use strict';

var blessed = require('blessed');
var unirest = require('unirest');
var spawn = require('child_process').spawn;

var argv = require('yargs').alias('u', 'user').argv;

var twitch = function(endpoint) {
    var api = 'https://api.twitch.tv/kraken';

    log('[GET] ' + api + endpoint);

    return unirest
            .get(api + endpoint)
            .header('Accept', 'application/vnd.twitchtv.v3+json');
};

var api = {
    video: function(id) {
        return twitch('/videos/' + id);
    },

    user: function(user) {
        return twitch('/users/' + user);
    },

    videos: function(user) {
        return twitch('/channels/' + user + '/videos');
    }
};

var screen = blessed.screen({
    smartCSR: true,
    autoPadding: true,
    debug: true
});

screen.key(['escape', 'q', 'C-c'], function(ch, key) {
    return screen.destroy();
});

var prompt = blessed.prompt({
    parent: screen,
    border: 'line',
    top: 'center',
    left: 'center',
    width: '50%',
    height: 'shrink',
    label: ' {blue-fg}Prompt{/blue-fg} ',
    tags: true,
    keys: true,
    hidden: true,
});

var msg = blessed.message({
    parent: screen,
    border: 'line',
    top: 'center',
    left: 'center',
    width: '50%',
    height: 'shrink',
    label: ' {blue-fg}Alert{/blue-fg} ',
    tags: true,
    keys: true,
    hidden: true,
});

var videoData = [];
var videos = blessed.listtable({
    parent: screen,
    border: 'line',
    top: 0,
    bottom: 10,
    width: '100%',
    label: 'Videos',
    align: 'left',
    keys: true,
    tags: true,
    style: {
        header: { bg: 'white', fg: 'black' },
        cell: {
            selected: {
                bg: 'blue'
            }
        }
    }
});

videos.on('select', function(el, index) {
    var v = videoData[index - 1];
    log(v);
});

var logger = blessed.log({
    parent: screen,
    label: ' Debug Log ',
    mouse: true,
    scrollbar: true,
    border: 'line',
    width: '100%',
    height: 10,
    bottom: 0,
    style: {
        scrollbar: { bg: 'blue' }
    }
});

prompt.setIndex(99);
msg.setIndex(99);

var log = function(text) {
    logger.log(text);
    screen.render();
};

var loadVideos = function(user) {
    api.videos(user.name).query({broadcasts: 'true'}).end(function(response) {
        if (response.code !== 200) {
            msg.display('Could not load videos!', -1, function() {
                screen.destroy();
                process.exit(0);
            });
        }

        videoData = response.body.videos;

        var data = [['Title', 'Game', 'Date']];
        for (let video of videoData) {
            data.push([
                video.title,
                video.game || '',
                video.recorded_at
            ]);
        }

        videos.setData(data);
        videos.focus();
    });
};

var getUserData = function(user) {
    if (!user) {
        prompt.input('User?', '', function(err, value) {
            if (!value) {
                screen.destroy();
                console.log('Okay, quitting!');
                process.exit(0);
            }

            getUserData(value);
        });
        screen.render();
        return;
    }

    api.user(user).end(function(response) {
        if (response.code !== 200) {

            msg.display(
                    `Invalid user '${user}', try again.`,
                    err => getUserData(null));
            return;
        }

        loadVideos(response.body);
    });
};

var main = function() {
    getUserData(argv.user);

    screen.render();
};

main();
