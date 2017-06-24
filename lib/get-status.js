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
                    resolve({
                        body: JSON.parse(body),
                        uniqPathId,
                        randomId,
                        fileName
                    });
                } else {
                    reject({
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

module.exports = getStatus;
