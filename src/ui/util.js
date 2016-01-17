'use strict';

var blessed = require('blessed');

var prompt = null;
var msg = null;
var logger = null;

/**
 * Initialize the utility elements for the given screen.
 * @param  {blessed.Screen} screen the screen element to use.
 */
var init = function(screen) {
    prompt = blessed.prompt({
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

    msg = blessed.message({
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

    logger = blessed.log({
        parent: screen,
        label: ' Debug Log ',
        mouse: true,
        border: 'line',
        width: '100%',
        height: 10,
        bottom: 0,
        scrollbar: true,
        style: {
            scrollbar: { bg: 'blue' }
        }
    });
};

var postinit = function() {
    prompt.setIndex(99);
    msg.setIndex(99);
};

module.exports = {
    init: init,
    postinit: postinit,

    /**
     * Add the given text to the log and refresh the screen.
     * @param  {string} text the text to log
     */
    log: function(text) {
        if (logger) {
            logger.log(text);
            logger.screen.render();
        }
    },

    display: function() {
        if (msg) {
            msg.display.apply(msg, arguments);
        }
    },

    input: function() {
        if (prompt) {
            prompt.input.apply(prompt, arguments);
        }
    },

    refocus: function(target, elements) {
        for (let el of elements) {
            el.on('focus', () => target.focus());
        }
    },

    focusOrder: function(order) {
        for (let el of order) {
            let i = order.indexOf(el);
            el.key('up', () => {
                order[Math.max(0, i - 1)].focus();
            });

            el.key('down', () => {
                order[Math.min(order.length - 1, i + 1)].focus();
            });
        }
    }
};
