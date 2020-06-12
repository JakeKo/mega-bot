const config = require('../../config');

module.exports = (bot, store) => async message => {
    const statsHelp = /^!stats +help/;
    const statsStatus = /^!stats +status/;
    const statsReacts = /^!stats +reacts/;
    const statsPopular = /^!stats +popular/;
    const statsSupportive = /^!stats +supportive(.*)/;

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

    // Check if the messages matches '!stats supportive [?user]'
    else if (statsSupportive.test(message.content)) {
        const [, userQuery] = message.content.match(statsSupportive);
        const messages = await store.getMessages();
        const displayNames = await getDisplayNames(bot);

        // Check if no user was provided
        if (userQuery.trim() === '') {
            const supportiveData = await modelGlobalSupportiveData(messages, displayNames);
            message.channel.send(plotGlobalSupportiveData(supportiveData));
        } else {
            const targetUsers = searchUsers(userQuery.trim(), displayNames);

            if (targetUsers.length === 1) {
                const supportiveData = await modelIndividualSupportiveData(messages, targetUsers[0], displayNames);
                message.channel.send(plotIndividualSupportiveData(supportiveData, displayNames[targetUsers[0]]));
            } else if (targetUsers.length === 0) {
                message.channel.send(`Cannot show supportive data. No user name matches query "${userQuery.trim()}".`);
            } else {
                message.channel.send(`Cannot show supportive data. More than one user matches query "${userQuery.trim()}" (${targetUsers.map(id => displayNames[id]).join(', ')}).`);
            }
        }
    }
};

async function getDisplayNames(bot) {
    const members = await bot.guilds.cache.first().members.fetch();
    return members.reduce((all, m) => ({ ...all, [m.id]: m.displayName }), {});
}

// Returns the IDs of users whose display name matches the query
function searchUsers(query, displayNames) {
    return Object.keys(displayNames).filter(id => displayNames[id].toLowerCase().includes(query.toLowerCase()));
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
    const displayNames = await getDisplayNames(bot);
    const popularity = {};

    messages.forEach(({ author, reacts }) => {
        popularity[author] = popularity[author] === undefined ? reacts.length : popularity[author] + reacts.length;
    });

    return Object.keys(popularity)
        .filter(key => !config.STATBOT_ID_BLACKLIST.includes(key))
        .map(key => ({
            userId: displayNames[key] || 'NO NAME',
            reactCount: popularity[key]
        }))
        .sort((a, b) => a.reactCount >= b.reactCount ? -1 : 1);
}

function plotUserPopularityData(users) {
    const maxLabelLength = Math.max(...users.map(user => user.userId.length));
    const maxValue = Math.max(...users.map(user => user.reactCount));
    const maxWidth = 15;

    return users.map(({ userId, reactCount }) => `\`${userId.padStart(maxLabelLength, ' ')}\`: ${Array(Math.round(maxWidth * reactCount / maxValue) + 1).join('█')} ${reactCount}`);
}

async function modelIndividualSupportiveData(messages, user, displayNames) {
    const support = {};
    
    messages
        .filter(m => m.author === user)
        .forEach(({ reacts }) => reacts.forEach(({ user }) => support[displayNames[user]] = 1 + support[displayNames[user]] || 0));

    return Object.keys(support).map(id => ({ userId: id, reactCount: support[id] }));
}

async function modelGlobalSupportiveData(messages, displayNames) {
    const support = {};

    messages
        .forEach(({ reacts }) => reacts.forEach(({ user }) => support[displayNames[user]] = 1 + support[displayNames[user]] || 0));

    return Object.keys(support).map(id => ({ userId: id, reactCount: support[id] }));
}

function plotIndividualSupportiveData(data, user) {
    const maxLabelLength = Math.max(...data.map(user => user.userId.length));
    const maxValue = Math.max(...data.map(user => user.reactCount));
    const maxWidth = 15;

    return [
        `**Most Supportive Users of ${user} (by React Count):**`,
        '',
        ...data.map(({ userId, reactCount }) => {
            const label = userId.padStart(maxLabelLength, ' ');
            const bar = Array(Math.round(maxWidth * reactCount / maxValue) + 1).join('█');
            return `\`${label}\`: ${bar} ${reactCount}`;
        })
    ].join('\n');
}

function plotGlobalSupportiveData(data) {
    const maxLabelLength = Math.max(...data.map(user => user.userId.length));
    const maxValue = Math.max(...data.map(user => user.reactCount));
    const maxWidth = 15;

    return [
        '**Most Supportive Users in Mega Chat (by React Count):**',
        '',
        ...data.map(({ userId, reactCount }) => {
            const label = userId.padStart(maxLabelLength, ' ');
            const bar = Array(Math.round(maxWidth * reactCount / maxValue) + 1).join('█');
            return `\`${label}\`: ${bar} ${reactCount}`;
        })
    ].join('\n');
}
