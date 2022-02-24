const config = require('../config');
const Logger = require('../src/logger');

let archiver, interval, timestamp;

// Simplify the message model for archiving
function modelMessagesForStorage(rawMessages) {
    const messages = rawMessages.map(async m => {
        const rawReacts = m.reactions.cache.array();
        const reactUsers = await Promise.all(rawReacts.map(async r => ({
            react: r.emoji.toString(),
            users: await r.users.fetch()
        })));
        const flatReactUsers = reactUsers.reduce((all, r) => [
            ...all,
            ...r.users.array().map(u => ({ react: r.react, user: u.id }))
        ], []);

        return {
            id: m.id,
            timestamp: m.createdTimestamp,
            author: m.author.id,
            reacts: flatReactUsers
        };
    });

    return Promise.all(messages);
}

function initArchiver(bot, store) {
    archiver = async () => {
        const guild = bot.guilds.cache.first();
        const channel = guild.channels.resolve(config.STATBOT_CHANNEL_ID);
        const mostRecentMessageId = channel.lastMessageID;
        let lastIngestedMessage = await store.getLastMessage();
        
        Logger.log('Archiving messages');

        while (lastIngestedMessage.id !== mostRecentMessageId) {
            // Fetch messages (limit 100) after lastIngestedMessageId
            const fetchOptions = { limit: 100, after: lastIngestedMessage.id };
            const rawMessages = (await channel.messages.fetch(fetchOptions)).array();
            const messages = await modelMessagesForStorage(rawMessages);

            // Archive the modeled messages and update lastIngestedMessageId
            await store.archiveMessages(messages.sort((a, b) => a.timestamp < b.timestamp ? -1 : 1));
            lastIngestedMessage = await store.getLastMessage();

            Logger.log(`Archived ${messages.length} messages`);
        }

        timestamp = lastIngestedMessage.timestamp;
    };
}

function startArchiver() {
    if (interval) {
        clearInterval(interval);
    }

    if (archiver) {
        archiver();
        interval = setInterval(archiver, 1000 * 60 * 60 * 6);
    }
}

module.exports = {
    initArchiver,
    startArchiver,
    archiverTimestamp: () => timestamp
};
