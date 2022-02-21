const config = require('../config');
const Logger = require('./logger');

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

let archiveCounter = 0;
module.exports = function archive(bot, store) {
    return async () => {
        Logger.log(`BEGIN ARCHIVE RUN ${++archiveCounter}`);

        const guild = bot.guilds.cache.first();
        const channel = guild.channels.resolve(config.STATBOT_CHANNEL_ID);
        const mostRecentMessageId = channel.lastMessageID;
        let lastIngestedMessageId = (await store.getLastMessage()).id;

        while (lastIngestedMessageId !== mostRecentMessageId) {
            // Fetch messages (limit 100) after lastIngestedMessageId
            const fetchOptions = { limit: 100, after: lastIngestedMessageId };
            const rawMessages = (await channel.messages.fetch(fetchOptions)).array();
            const messages = await modelMessagesForStorage(rawMessages);

            // Archive the modeled messages and update lastIngestedMessageId
            await store.archiveMessages(messages.sort((a, b) => a.timestamp < b.timestamp ? -1 : 1));
            lastIngestedMessageId = (await store.getLastMessage()).id;

            Logger.log(`Archived ${messages.length} messages`);
        }

        Logger.log(`END ARCHIVE RUN ${archiveCounter}`);
        setTimeout(archive(bot, store), 1000 * 60 * 60);
    };
};
