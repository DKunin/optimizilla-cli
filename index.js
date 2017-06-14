'use strict';

const request = require('request');
const fs = require('fs');
const meow = require('meow');
const hasha = require('hasha');
const chalk = require('chalk');
const logUpdate = require('log-update');

const cli = meow({
    help: [ '' ]
});

if (!cli.input.length) {
    return false;
}
const fileName = cli.input[0];

hasha.fromFile(fileName, { algorithm: 'md5' }).then(hash => {
    const uniqPathId = hash.split('').slice(0, 16).join('');
    const randomId = hash.split('').reverse().slice(0, 26).join('');
    const formData = {
        file: fs.createReadStream(__dirname + '/' + fileName),
        id: randomId,
        name: fileName
    };

    request.post({ url: 'http://optimizilla.com/upload/' + uniqPathId, formData }, function(
        err
    ) {
        if (err) {
            logUpdate(chalk.red('Error!'));
        } else {
            logUpdate(chalk.green('Uploaded!'));
            logUpdate.done();
            getStatus('auto', uniqPathId, randomId).then((result) => {
                if (result.status === 'success') {
                    pollResult(uniqPathId, randomId);
                }
            });
        }
    });
});

function pollResult(uniqPathId, randomId) {
    getStatus('status', uniqPathId, randomId).then(result => {
        logUpdate(chalk.blue(`${result.auto_progress} %`));
        logUpdate.done();
        if (result.auto_progress < 100) {
            setTimeout(() => {
                pollResult(uniqPathId, randomId);
            }, 1000);
        } else {
            getStatus('panel', uniqPathId, randomId).then((result) => {
                request.get(`http://optimizilla.com/${result.image.compressed_url}`)
                    .pipe(fs.createWriteStream(__dirname + '/' + result.image.result));
                logUpdate(chalk.green(`Saved: ${result.image.savings}`));
            });
        }
    });
}


function getStatus(command, uniqPathId, randomId) {
    return new Promise((resolve, reject) => {
        request.get(
            `http://optimizilla.com/${command}/${uniqPathId}/${randomId}?rnd=${Math.random()}`,
            function(error, response, body) {
                if (error) {
                    reject(error);
                }

                if (response && response.statusCode === 200) {
                    resolve(JSON.parse(body));
                }
            }
        );
    });
}


