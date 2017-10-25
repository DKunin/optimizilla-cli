#!/usr/bin/env node

const fs = require('fs');
const meow = require('meow');
const url = require('url');
const path = require('path');
const async = require('./lib/async');
const printResult = require('./lib/print-result');
const getStatus = require('./lib/get-status');
const request = require('request');
const MAIN_HOST = 'http://optimizilla.com';

const cli = meow(
    `
    Usage
      $ optimizilla <input>

    Options
      --output, -o  Destination of the optimized file
      --replace, -r  Replace the original file
      --dry, -d  Dry run, upload, optimize and print out links

    Examples
      $ optimizilla xpto.jpg --output ./ --replace
`,
    {
        alias: {
            o: 'output',
            r: 'replace',
            d: 'dry'
        }
    }
);

if (!cli.input.length) {
    cli.showHelp(-1);
}

/**
 * Guid function to generate uid
 * @return {Function}
 */
var guid = (function() {
    var counter = 0;

    return function(prefix) {
        var guid = new Date().getTime().toString(32),
            i;

        for (i = 0; i < 5; i++) {
            guid += Math.floor(Math.random() * 65535).toString(32);
        }

        return (prefix || 'o_') + guid + (counter++).toString(32);
    };
})();

/**
 * Random string generator
 * @return {String}
 */
function randomString() {
    for (
        var t = '0123456789abcdefghiklmnopqrstuvwxyz', e = 16, i = '', n = 0;
        e > n;
        n++
    ) {
        var a = Math.floor(Math.random() * t.length);
        i += t.substring(a, a + 1);
    }
    return i;
}

/**
 * startProcessingFile
 * @param {String}
 * @return {Promise}
 */
function startProcessingFile(fileName) {
    return new Promise((resolve, reject) => {
        let uniqPathId = randomString();
        let randomId = guid();
        const formData = {
            file: fs.createReadStream(
                fileName[0] == path.sep
                    ? fileName
                    : path.resolve(process.cwd() + path.sep + fileName)
            ),
            id: randomId,
            name: fileName
        };

        request.post(
            {
                url: `${MAIN_HOST}/upload/${uniqPathId}`,
                formData
            },
            error => {
                if (error) {
                    reject({ fileName, uniqPathId, randomId, error });
                } else {
                    resolve({ fileName, uniqPathId, randomId });
                }
            }
        );
    });
}

/**
 * downloadFinalFile
 * @param {Object} body
 * @param {Object} options
 */
function downloadFinalFile(body, options, flags) {
    let outputFile = flags.output ? flags.output : process.cwd();
    if (flags.replace) {
        outputFile = options.fileName;
    } else {
        outputFile = path.resolve(outputFile + path.sep + body.image.result);
    }

    if (cli.flags.dry) {
        printResult(
            Object.assign(options, {
                status: 'success',
                savings: body.image.savings,
                compressedUrl: url.resolve(MAIN_HOST, body.image.compressed_url)
            })
        );
    } else {
        request
            .get(url.resolve(MAIN_HOST, body.image.compressed_url))
            .pipe(fs.createWriteStream(outputFile));
        printResult(
            Object.assign(options, {
                status: 'success',
                savings: body.image.savings
            })
        );
    }
}

/**
 * Main process generator
 * @param {Object} options
 * @return {Function}
 */
function processGenerator(options, flags) {
    return function*() {
        let content = {};
        content = yield getStatus('auto', options);

        while (true) {
            content = yield getStatus('status', options);
            printResult(
                Object.assign(options, {
                    status: 'processing',
                    percent: content.body.auto_progress
                })
            );
            if (content.body.auto_progress >= 100) {
                break;
            }
        }

        content = yield getStatus('panel', options);
        downloadFinalFile(content.body, options, flags);
        return content;
    };
}

cli.input
    .reduce((newArray, singleFileName) => {
        if (singleFileName.toLowerCase().match(/png|jpg|jpeg/)) {
            return newArray.concat(singleFileName);
        }
        console.log(
            `${singleFileName} format is invalid, only png/jpeg/jpg can be used`
        );
        return newArray;
    }, [])
    .forEach(singleFileName => {
        startProcessingFile(singleFileName, cli.flags)
            .then(options => async(processGenerator(options, cli.flags)))
            .catch(options => {
                printResult(
                    Object.assign(options, {
                        status: 'error'
                    })
                );
            });
    });
