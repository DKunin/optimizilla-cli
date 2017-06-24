'use strict';

function asynchronously(generator) {
    var g = generator();
    (function go(err, result) {
        var step;
        if (err) {
            step = g.throw(err);
        } else {
            step = g.next(result);
        }

        if (!step.done) {
            var promise = step.value;
            promise
                .then(function(resolvedValue) {
                    go(null, resolvedValue);
                })
                .catch(function(e) {
                    go(e);
                });
        }
    })();
}

module.exports = asynchronously;
