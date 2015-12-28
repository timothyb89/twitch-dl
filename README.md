twitchdl
========

A command-line download manager for archiving Twitch VODs. Finds videos,
downloads them with [livestreamer](http://docs.livestreamer.io/), and optionally
converts them into something usable for archival with
[ffmpeg](http://ffmpeg.org/). Also caches metadata, thumbnails, and other info.

Requirements
------------
 * nodejs 5.3.0
 * [livestreamer](http://docs.livestreamer.io/) - needs to be in $PATH
 * [ffmpeg](http://ffmpeg.org/) - needs to be in $PATH

Installation
------------
1. Install [node](https://nodejs.org/). I recommend
   [nvm](https://github.com/creationix/nvm) if you need to juggle multiple
   versions, otherwise the official binaries or distribution packages work fine.
2. Run `npm install -g https://github.com/timothyb89/twitch-dl`

Usage
-----
Run `twitch-dl` to start the UI, you'll be prompted for a user to view. Or,
run `twitch-dl -u <user>` to immediately view a user.

Other Info
----------

### Why?

Twitch only keeps VODs for a very short period (30-90 days, depending on the
channel). I have a habit of missing streams when they're live, and the VODs are
often deleted before I get a chance to view them. This tool is intended to help
create a personal archive of a channel for later viewing.

### Why is ffmpeg needed?

The videos outputted by livestreamer are just concatenations of Twitch's
'chunked' video, i.e. they are actually several video files ~30m each glued
together. Playback of these videos is tricky at best, and skipping is almost
always broken. Re-encoding videos with ffmpeg fixes this.

Additionally, to help with archival, some other options are desirable. Dropping
from 60fps to 30fps, downscaling the resolution, and lowering the bitrate can
all help bring storage requirements back into the realm of sanity.

For reference, a 3 hour 60fps 720p stream will need ~5gb of disk space without
any additional processing, so a fairly small number of archived streams (e.g.
200) is enough to fill a 1TB hard drive. Just dropping to 30fps can double the
number of videos you can archive, with an acceptable loss in quality.

### What about live streams?

There could potentially be some support for this, but I haven't looked into it.

### Why is the audio muted?

If Twitch determines that a 'chunk' of the video is using copyrighted audio, it
removes (rather than silences) the entire audio track from that chunk. This can
confuse livestreamer and ffmpeg, and in some cases results in ffmpeg dropping
the entire audio track  for the converted video. I don't know of a good solution
to this, unfortunately.

(The 'real' solution is to cache the stream while it's live, but of course this
isn't always an option.)

### Windows

Windows support is ¯\\\_(ツ)\_/¯

In theory it could be made to work, but I haven't thoroughly investigated this.
