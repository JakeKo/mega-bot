const Client = require('ssh2-sftp-client');
const config = require('./config');

const localConfigPath = './config.js';
const remoteConfigPath = '/root/mega-bot/config.js';

(async () => {
    const client = new Client();
    await client.connect(config.SSH_CONFIG);
    await client.put(localConfigPath, remoteConfigPath);
    await client.end();
})();
