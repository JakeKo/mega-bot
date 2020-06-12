const config = require('../../config');

module.exports = (bot, store) => async message => {
    const statsHelp = /^!stats +help/;
    const statsStatus = /^!stats +status/;
    const statsReacts = /^!stats +reacts/;
    const statsPopular = /^!stats +popular/;
    const statsSupportive = /^!stats +supportive/;

    // Check if the message matches '!stats help'
    if (statsHelp.test(message.content)) {
        message.channel.send([
            '**Usage Intstructions for Stat Bot:**',
            '>>> `!stats help`: View usage instructions for Stat Bot.',
            '`!stats reacts`: View a list of the most popular reacts in Mega Chat. Filter by the optional user.',
            '`!stats popular`: View the most popular members (based on reacts) in Mega Chat.',
            '`!stats status`: View clerical information about Stat Bot.'
        ].join('\n'));
    }

    // Check if the message matches '!stats status'
    else if (statsStatus.test(message.content)) {
        const messages = await store.getMessages();
        const lastMessage = await store.getLastMessage();

        // TODO: Include timestamp of last archive run and next archive run
        message.channel.send([
            '**STAT BOT STATUS**',
            `>>> Messages Ingested: **${messages.length}**`,
            `Last Ingested Message: **${new Date(lastMessage.timestamp).toUTCString()}**`
        ].join('\n'));
    }

    // Check if the message matches '!stats reacts'
    else if (statsReacts.test(message.content)) {
        const messages = await store.getMessages();
        const popularity = modelReactPopularityData(messages).slice(0, 10);

        message.channel.send([
            `**Top ${popularity.length} Most Popular Reacts in Mega Chat:**`,
            '',
            ...plotReactPopularityData(popularity)
        ].join('\n'));
    }

    // Check if the message matches '!stats popular'
    else if (statsPopular.test(message.content)) {
        const messages = await store.getMessages();
        const popularity = (await modelUserPopularityData(messages, bot)).slice(0, 10);

        message.channel.send([
            `**Top ${popularity.length} Most Popular Users in Mega Chat (by React Count):**`,
            '',
            ...plotUserPopularityData(popularity)
        ].join('\n'));
    }

    // Check if the messages matches '!stats supportive'
    else if (statsSupportive.test(message.content)) {
        const messages = await store.getMessages();
        const supportiveData = modelSupportiveData(messages);
        console.log(supportiveData);
    }
};

async function getDisplayName(key, bot) {
    let displayName = '';

    try {
        displayName = (await bot.guilds.cache.first().members.fetch(key)).displayName;
    } catch {
        console.log(`Bad User ID: ${key}`);
    }

    return displayName;
}

function modelReactPopularityData(messages) {
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

function plotReactPopularityData(reacts) {
    const maxValue = Math.max(...reacts.map(react => react.count));
    const maxWidth = 20;

    return reacts.map(({ reactId, count }) => `${reactId} ${Array(Math.round(maxWidth * count / maxValue) + 1).join('█')} ${count}`);
}

async function modelUserPopularityData(messages, bot) {
    const popularity = {};

    messages.forEach(({ author, reacts }) => {
        popularity[author] = popularity[author] === undefined ? reacts.length : popularity[author] + reacts.length;
    });

    return (await Promise.all(Object.keys(popularity)
        .filter(key => !config.STATBOT_ID_BLACKLIST.includes(key))
        .map(async key => ({
            userId: await getDisplayName(key, bot),
            reactCount: popularity[key]
        })))).sort((a, b) => a.reactCount >= b.reactCount ? -1 : 1);
}

function plotUserPopularityData(users) {
    const maxLabelLength = Math.max(...users.map(user => user.userId.length));
    const maxValue = Math.max(...users.map(user => user.reactCount));
    const maxWidth = 15;

    return users.map(({ userId, reactCount }) => `\`${userId.padStart(maxLabelLength, ' ')}\`: ${Array(Math.round(maxWidth * reactCount / maxValue) + 1).join('█')} ${reactCount}`);
}

function modelSupportiveData(messages) {
    const supports = {};
    
    messages.forEach(({ author, reacts }) => {
        const support = supports[author] === undefined ? {} : { ...supports[author] };
        
        reacts.forEach(({ user }) => {
            support[user] = support[user] === undefined ? 1 : support[user] + 1;
        });

        supports[author] = support;
    });

    return supports;
}
