'use strict';

const bulk = require('bulk-require');
const RecursiveIterator = require('recursive-iterator');

const Plugin = require('./plugin');

var plugins = [];

let files = bulk(__dirname, ['./*/**/!(*index|*.spec).js']);
let iter = new RecursiveIterator(files);

for (let item of iter) {
    if (item.node.prototype instanceof Plugin) {
        let instance = new item.node();
        instance.load();

        plugins.push(instance);
    }
}

let all = function(type) {
    if (typeof type === 'undefined') {
        return plugins.slice();
    } else {
        if (typeof type === 'string') {
            let ret = [];

            for (let p of plugins) {
                if (p.type === type) {
                    ret.push(p);
                }
            }

            return ret;
        } else if (type.prototype instanceof Plugin) {
            let ret = [];

            for (let p of plugins) {
                if (p instanceof type) {
                    ret.push(p);
                }
            }

            return ret;
        } else {
            throw 'unknown type ' + type;
        }
    }
};

let first = function(type) {
    let pool = all(type);
    pool.sort((a, b) => b.priority - b.priority);

    return pool.pop();
};

module.exports = {
    all: all,
    first: first
};
