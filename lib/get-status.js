'use strict';

const request = require('request');

function getStatus(command, { uniqPathId, randomId, fileName }) {
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
                    let parsedBody = body;
                    try {
                        parsedBody = JSON.parse(body);
                    } catch (err) {}

                    resolve({
                        body: parsedBody,
                        uniqPathId,
                        randomId,
                        fileName
                    });
                } else {
                    let parsedBody = body;
                    try {
                        parsedBody = JSON.parse(body);
                    } catch (err) {}

                    reject({
                        body: parsedBody,
                        uniqPathId,
                        randomId,
                        fileName
                    });
                }
            }
        );
    });
}

module.exports = getStatus;
