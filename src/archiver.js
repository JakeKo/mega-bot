const config = require('../config');

let archiveCounter = 0;
module.exports = function archive(bot, store) {
    return async () => {
        console.log(`BEGIN ARCHIVE RUN ${++archiveCounter}`);

        // TODO: Consider performance/rate-limit impact of changing this dynamically
        // Get the id of the most recent message in the channel
        const guild = bot.guilds.cache.first();
        const channel = guild.channels.resolve(config.STATBOT_CHANNEL_ID);
        const mostRecentMessageId = channel.lastMessageID;

        // Get the id of the last ingested message
        let lastIngestedMessageId = (await store.getLastMessage()).id;

        while (lastIngestedMessageId !== mostRecentMessageId) {
            // Fetch messages (limit 100) after lastIngestedMessageId
            const rawMessages = (await channel.messages.fetch({ limit: 100, after: lastIngestedMessageId })).array();

            // Simplify the message model for archiving
            const messages = await Promise.all(rawMessages.map(async m => {
                const rawReacts = m.reactions.cache.array();
                const reactUsers = await Promise.all(rawReacts.map(async r => ({ react: r.emoji.toString(), users: await r.users.fetch() })));
                const flatReactUsers = reactUsers.reduce((all, r) => [...all, ...r.users.array().map(u => ({ react: r.react, user: u.id }))], []);

                return {
                    id: m.id,
                    timestamp: m.createdTimestamp,
                    author: m.author.id,
                    reacts: flatReactUsers
                };
            }));

            // Archive the modeled messages and update lastIngestedMessageId
            await store.archiveMessages(messages.sort((a, b) => a.timestamp < b.timestamp ? -1 : 1));
            lastIngestedMessageId = (await store.getLastMessage()).id;

            console.log(`Archived ${messages.length} messages`);
        }

        console.log(`END ARCHIVE RUN ${archiveCounter}`);
        setTimeout(archive(bot, store), 1000 * 60 * 60);
    };
};
