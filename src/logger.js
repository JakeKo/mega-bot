const fs = require('fs');
const path = require('path');
const logPath = 'logs/';



function getLogFileName() {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth().toString().padStart(2, '0');
    const date = now.getUTCDate().toString().padStart(2, '0');

    return path.resolve(`${logPath}${year}${month}${date}.txt`);
}

function formatMessage(message) {
    return `${(new Date()).toISOString()} | ${message}\n`;
}

function log(message) {
    const fileName = getLogFileName();
    const formattedMessage = formatMessage(message);

    if (!fs.existsSync(logPath)){
        fs.mkdirSync(logPath);
    }

    fs.writeFile(fileName, formattedMessage, { flag: 'a+' }, console.error);
}

module.exports = {
    log
};
