/*
 * grunt-autoshot
 * https://github.com//grunt-autoshot
 *
 * Copyright (c) 2013 Ferrari Lee
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {
    var phantom = require('node-phantom-simple');
    var st = require('st');
    var http = require('http');
    var async = require('async');

    grunt.registerMultiTask('autoshot', 'Create a quick screenshot for your site which could help for document or testing.', function() {
        var done = this.async();
        var options = this.options({
            path: __dirname + '/screenshot',
            timeout: 0,
            viewport: '1920x1080'
        });

        if(!options.domain) {
            grunt.fail.fatal('A domain is needed');
        }

        var filePaths = options.remote.files.split(',').map(function(url) {
            return {
                name: url,
                url: options.domain + url
            };
        });


        // Core screenshot function using phamtonJS
        var screenshot = function(opts, cb) {
            var viewport = opts.viewport;
            var type     = opts.type;
            var path     = opts.path;
            var url      = opts.url;
            var file     = opts.file;

            phantom.create(function(err, ph) {

                ph.createPage(function(err, page) {

                    if (viewport) {
                        var sets = viewport.match(/(\d+)x(\d+)/);
                        if (sets[1] && sets[2]) {
                            page.set('viewportSize', {
                                width: sets[1],
                                height: sets[2]
                            });
                        }
                    }

                    page.set('zoomFactor', 1);

                    page.open(url, function(err, status) {
                        if(err) {
                            console.log(err, status);
                        }

                        var target = (file.replace(/\/|\?|=|&/g, '_')) + '_'+ viewport + '.png';

                        // Background problem under self-host server
                        page.evaluate(function() {
                            var style = document.createElement('style');
                            var text = document.createTextNode('body { background: #fff }');
                            style.setAttribute('type', 'text/css');
                            style.appendChild(text);
                            document.head.insertBefore(style, document.head.firstChild);
                        });

                        setTimeout(function() {
                            page.render(path + '/' + target, function() {
                                grunt.log.writeln('Taking a screenshot of: ' + target);
                                ph.exit();
                                cb();
                            });
                        }, options.timeout);
                    });
                });
            });
        };

        // At least local or remote url should be assigned
        if (!options.remote && !options.local) {
            grunt.fail.fatal('At least need one either remote or local url');
        }

        async.each(filePaths, function(file, outerCb) {
            async.each(options.viewport.split(','), function(view, cb) {
                screenshot({
                    path: options.path,
                    type: 'remote',
                    viewport: view,
                    url: file.url,
                    file: file.name
                }, cb);
            }, outerCb);
        }, done);
    });
};
