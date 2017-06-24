#!/usr/bin/env node

const fs = require('fs');
const meow = require('meow');
const hasha = require('hasha');
const path = require('path');
const async = require('./lib/async');
const printResult = require('./lib/print-result');
const getStatus = require('./lib/get-status');
const request = require('request');

const cli = meow({
    help: [
        `
        optimizilla ./someimage.png
    `
    ]
});

if (!cli.input.length) {
    throw new Error('Please add file or files');
}

/**
 * startProcessingFile
 * @param {String}
 * @return {Promise}
 */
function startProcessingFile(fileName) {
    return new Promise((resolve, reject) => {
        hasha.fromFile(fileName, { algorithm: 'md5' }).then(hash => {
            const uniqPathId = hash.split('').slice(0, 16).join('');
            const randomId = hash.split('').reverse().slice(0, 26).join('');
            const formData = {
                file: fs.createReadStream(
                    path.resolve(process.cwd() + '/' + fileName)
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
function downloadFinalFile(body, options) {
    request
        .get(`http://optimizilla.com/${body.image.compressed_url}`)
        .pipe(
            fs.createWriteStream(
                path.resolve(process.cwd() + '/' + body.image.result)
            )
        );
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
function processGenerator(options) {
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
        downloadFinalFile(content.body, options);
        return content;
    };
}

cli.input.forEach(singleFileName => {
    startProcessingFile(singleFileName)
        .then(options => async(processGenerator(options)))
        .catch(options => {
            printResult(
                Object.assign(options, {
                    status: 'error'
                })
            );
        });
});
