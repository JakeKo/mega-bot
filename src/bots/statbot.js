const config = require('../../config');

module.exports = (bot, store) => async message => {
    const statsHelp = /^!stats +help/;
    const statsReacts = /^!stats +reacts/;
    const statsPopular = /^!stats +popular/;

    // Check if the message matches '!stats help'
    if (statsHelp.test(message.content)) {
        message.channel.send([
            '**Usage Intstructions for Stat Bot:**',
            '• `!stats help`: View usage instructions for Stat Bot.',
            `• \`!stats reacts\`: View a list of the most popular reacts in <#${message.channel.id}>.`,
            `• \`!stats popular\`: View the most popular members (based on reacts) in <#${message.channel.id}>.`,
        ].join('\n'));
    }

    // Check if the message matches '!stats reacts'
    else if (statsReacts.test(message.content)) {
        const messages = await store.getMessages();
        const popularity = modelReactPopularity(messages).slice(0, 10);

        message.channel.send([
            `**Top ${popularity.length} Most Popular Reacts in <#${message.channel.id}>:**`,
            `*Messages Ingested: ${messages.length}*`,
            '',
            ...plotReactPopularity(popularity)
        ].join('\n'));
    }

    // Check if the message matches '!stats popular'
    else if (statsPopular.test(message.content)) {
        const messages = await store.getMessages();
        const popularity = (await modelUserPopularity(messages, bot)).slice(0, 10);

        message.channel.send([
            `**Top ${popularity.length} Most Popular Users in <#${message.channel.id}> (by React Count):**`,
            `*Messages Ingested: ${messages.length}*`,
            '',
            ...plotUserPopularity(popularity)
        ].join('\n'));
    }
};

function modelReactPopularity(messages) {
    const popularity = {};

    messages.forEach(({ reacts }) => {
        reacts.forEach(({ react }) => {
            popularity[react] = popularity[react] === undefined ? 1 : popularity[react] + 1;
        });
    });

    return Object.keys(popularity)
        .map(key => ({ reactId: key, count: popularity[key] }))
        .sort((a, b) => a.count >= b.count ? -1 : 1);
}

function plotReactPopularity(reacts) {
    const maxValue = Math.max(...reacts.map(react => react.count));
    const maxWidth = 20;

    return reacts.map(({ reactId, count }) => `${reactId} ${Array(Math.round(maxWidth * count / maxValue) + 1).join('█')} ${count}`);
}

async function modelUserPopularity(messages, bot) {
    const popularity = {};

    messages.forEach(({ author, reacts }) => {
        popularity[author] = popularity[author] === undefined ? reacts.length : popularity[author] + reacts.length;
    });

    // Map user ID to display name
    const members = bot.guilds.cache.first().members;
    return (await Promise.all(Object.keys(popularity)
        .filter(key => key !== config.GUILD_SYSTEM_USER_ID)
        .map(async key => ({
            userId: (await members.fetch(key)).displayName,
            reactCount: popularity[key]
        })))).sort((a, b) => a.reactCount >= b.reactCount ? -1 : 1);
}

function plotUserPopularity(users) {
    const maxLabelLength = Math.max(...users.map(user => user.userId.length));
    const maxValue = Math.max(...users.map(user => user.reactCount));
    const maxWidth = 15;

    return users.map(({ userId, reactCount }) => `\`${userId.padStart(maxLabelLength, ' ')}\`: ${Array(Math.round(maxWidth * reactCount / maxValue) + 1).join('█')} ${reactCount}`);
}
