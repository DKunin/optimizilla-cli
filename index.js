#!/usr/bin/env node

const fs = require('fs');
const meow = require('meow');
const hasha = require('hasha');
const url = require('url');
const path = require('path');
const async = require('./lib/async');
const printResult = require('./lib/print-result');
const getStatus = require('./lib/get-status');
const request = require('request');

const cli = meow(
    `
    Usage
      $ optimizilla <input>

    Options
      --output, -o  Destination of the optimized file
      --replace, -r  Replace the original file

    Examples
      $ optimizilla xpto.jpg --output ./ --replace
`,
    {
        alias: {
            o: 'output',
            r: 'replace'
        }
    }
);

if (!cli.input.length) {
    cli.showHelp(-1);
}

/**
 * startProcessingFile
 * @param {String}
 * @return {Promise}
 */
function startProcessingFile(fileName, flags) {
    return new Promise((resolve, reject) => {
        hasha.fromFile(fileName, { algorithm: 'md5' }).then(hash => {
            const uniqPathId = hash.split('').slice(0, 16).join('');
            const randomId = hash.split('').reverse().slice(0, 26).join('');
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
                    url: 'http://optimizilla.com/upload/' + uniqPathId,
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

    request
        .get(url.resolve('http://optimizilla.com/', body.image.compressed_url))
        .pipe(fs.createWriteStream(outputFile));
    printResult(
        Object.assign(options, {
            status: 'success',
            savings: body.image.savings
        })
    );
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
        console.log(`${singleFileName} format is invalid, only png/jpeg/jpg can be used`);
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
