#!/usr/bin/env node
'use strict';

const request = require('request');
const fs = require('fs');
const meow = require('meow');
const hasha = require('hasha');
const path = require('path');
const logUpdate = require('log-update');
const Table = require('easy-table');
let globalData = [];

const cli = meow({
    help: ['']
});

if (!cli.input.length) {
    throw new Error('Please add file or files');
}

function printResult(result) {
    if (!globalData.length) {
        globalData = [result];
    } else {
        globalData = globalData.reduce((newArray, singleItem) => {
            if (singleItem.uniqPathId === result.uniqPathId) {
                return newArray.concat(result);
            }
            return newArray.concat(singleItem);
        }, []);
        const alreadyInTable = globalData.find(({ uniqPathId }) => uniqPathId === result.uniqPathId);
        if (!alreadyInTable) {
            globalData = globalData.concat([ result ]);
        }
    }
    logUpdate(Table.print(globalData));
}

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

function pollResult({ uniqPathId, randomId, fileName }) {
    getStatus('status', uniqPathId, randomId, fileName).then(({
        body,
        fileName,
        uniqPathId,
        randomId
    }) => {
        printResult({
            fileName,
            uniqPathId,
            randomId,
            status: 'processing',
            percent: body.auto_progress
        });
        if (body.auto_progress < 100) {
            setTimeout(() => {
                pollResult({ uniqPathId, randomId, fileName });
            }, 1000);
        } else {
            getStatus('panel', uniqPathId, randomId, fileName).then(({
                body,
                fileName,
                uniqPathId,
                randomId
            }) => {
                request
                    .get(`http://optimizilla.com/${body.image.compressed_url}`)
                    .pipe(
                        fs.createWriteStream(
                            path.resolve(
                                process.cwd() + '/' + body.image.result
                            )
                        )
                    );

                printResult({
                    fileName,
                    uniqPathId,
                    randomId,
                    status: 'success',
                    savings: body.image.savings
                });
            });
        }
    });
}

function getStatus(command, uniqPathId, randomId, fileName) {
    return new Promise((resolve, reject) => {
        request.get(
            `http://optimizilla.com/${command}/${uniqPathId}/${randomId}?rnd=${Math.random()}`,
            function(error, response, body) {
                if (error) {
                    reject({
                        error,
                        uniqPathId,
                        randomId,
                        fileName
                    });
                }

                if (response && response.statusCode === 200) {
                    resolve({
                        body: JSON.parse(body),
                        uniqPathId,
                        randomId,
                        fileName
                    });
                }
            }
        );
    });
}
cli.input.forEach(singleFileName => {
    startProcessingFile(singleFileName)
        .then(({ fileName, uniqPathId, randomId }) => {
            return getStatus('auto', uniqPathId, randomId, fileName);
        })
        .then(({ body, fileName, uniqPathId, randomId }) => {
            printResult({ fileName, uniqPathId, randomId, status: 'uploaded' });
            if (body.status === 'success') {
                pollResult({ uniqPathId, randomId, fileName });
            } else {
                printResult({
                    fileName,
                    uniqPathId,
                    randomId,
                    status: 'error',
                    details: body
                });
            }
        })
        .catch(({ fileName, uniqPathId, randomId, error }) => {
            printResult({
                fileName,
                uniqPathId,
                randomId,
                status: 'error',
                details: error
            });
        });
});
