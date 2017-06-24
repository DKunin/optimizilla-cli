'use strict';

const logUpdate = require('log-update');
const Table = require('easy-table');
let globalData = [];

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
        const alreadyInTable = globalData.find(
            ({ uniqPathId }) => uniqPathId === result.uniqPathId
        );
        if (!alreadyInTable) {
            globalData = globalData.concat([result]);
        }
    }
    logUpdate(Table.print(globalData));
}

module.exports = printResult;
