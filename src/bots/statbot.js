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
            '`!stats reacts`: View the most popular reacts.',
            '`!stats popular`: View the most popular users.',
            '`!stats supportive [?user]`: View the most supportive users (of the optional user). Use plain text to search users. Do not mention directly.',
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

        message.channel.send(plotReactPopularityData(popularity));
    }

    // Check if the message matches '!stats popular'
    else if (statsPopular.test(message.content)) {
        const messages = await store.getMessages();
        const displayNames = await getDisplayNames(bot);
        const popularity = modelUserPopularityData(messages, displayNames).slice(0, 10);

        message.channel.send(plotUserPopularityData(popularity));
    }

    // Check if the messages matches '!stats supportive [?user]'
    else if (statsSupportive.test(message.content)) {
        const [, userQuery] = message.content.match(statsSupportive);
        const messages = await store.getMessages();
        const displayNames = await getDisplayNames(bot);

        // Check if no user was provided
        if (userQuery.trim() === '') {
            const supportiveData = modelGlobalSupportiveData(messages, displayNames).slice(0, 10);
            message.channel.send(plotGlobalSupportiveData(supportiveData));
        } else {
            const targetUsers = searchUsers(userQuery.trim(), displayNames);

            // Check how many users matched the provided user query
            if (targetUsers.length === 1) {
                const supportiveData = modelIndividualSupportiveData(messages, targetUsers[0], displayNames).slice(0, 10);
                message.channel.send(plotIndividualSupportiveData(supportiveData, displayNames[targetUsers[0]]));
            } else if (targetUsers.length === 0) {
                message.channel.send(`Cannot show supportive data. No user name matches query "${userQuery.trim()}".`);
            } else {
                message.channel.send(`Cannot show supportive data. More than one user matches query "${userQuery.trim()}" (${targetUsers.map(id => displayNames[id]).join(', ')}).`);
            }
        }
    }
};

// Create a map of user IDs to user display names
async function getDisplayNames(bot) {
    const members = await bot.guilds.cache.first().members.fetch();
    return members.reduce((all, m) => ({ ...all, [m.id]: m.displayName }), {});
}

// Returns the IDs of users whose display name matches the query
function searchUsers(query, displayNames) {
    return Object.keys(displayNames).filter(id => displayNames[id].toLowerCase().includes(query.toLowerCase()));
}

// REACT POPULARITY DATA
function modelReactPopularityData(messages) {
    const popularity = {};

    messages.forEach(({ reacts }) => {
        reacts.forEach(({ react }) => {
            popularity[react] = 1 + popularity[react] || 0;
        });
    });

    return Object.keys(popularity)
        .map(id => ({ reactId: id, count: popularity[id] }))
        .sort((a, b) => a.count >= b.count ? -1 : 1);
}

function plotReactPopularityData(data) {
    const maxValue = Math.max(...data.map(react => react.count));
    const maxWidth = 20;

    return [
        '**Most Popular Reacts:**',
        ...data.map(({ reactId, count }) => {
            const bar = Array(Math.round(maxWidth * count / maxValue) + 1).join('█');
            return `${reactId} ${bar} ${count}`;
        })
    ].join('\n');
}

// USER POPULARITY DATA
function modelUserPopularityData(messages, displayNames) {
    const popularity = {};
    messages.forEach(({ author, reacts }) => {
        const displayName = displayNames[author] || 'NO NAME';
        popularity[displayName] = reacts.length + popularity[displayName] || 0;
    });

    return Object.keys(popularity)
        .map(id => ({ userId: id, reactCount: popularity[id] }))
        .sort((a, b) => a.reactCount >= b.reactCount ? -1 : 1);
}

function plotUserPopularityData(data) {
    const maxLabelLength = Math.max(...data.map(user => user.userId.length));
    const maxValue = Math.max(...data.map(user => user.reactCount));
    const maxWidth = 15;

    return [
        '**Most Popular Users (by React Count):**',
        ...data.map(({ userId, reactCount }) => {
            const label = userId.padStart(maxLabelLength, ' ');
            const bar = Array(Math.round(maxWidth * reactCount / maxValue) + 1).join('█');
            return `\`${label}\`: ${bar} ${reactCount}`;
        })
    ].join('\n');
}

// INDIVIDUAL SUPPORTIVE DATA
function modelIndividualSupportiveData(messages, user, displayNames) {
    const support = {};
    messages.filter(m => m.author === user).forEach(({ reacts }) => {
        reacts.forEach(({ user }) => {
            const displayName = displayNames[user] || 'NO NAME';
            support[displayName] = 1 + support[displayName] || 0;
        });
    });

    return Object.keys(support)
        .map(id => ({ userId: id, reactCount: support[id] }))
        .sort((a, b) => a.reactCount >= b.reactCount ? -1 : 1);
}

function plotIndividualSupportiveData(data, user) {
    const maxLabelLength = Math.max(...data.map(user => user.userId.length));
    const maxValue = Math.max(...data.map(user => user.reactCount));
    const maxWidth = 15;

    return [
        `**Most Supportive Users of ${user} (by React Count):**`,
        ...data.map(({ userId, reactCount }) => {
            const label = userId.padStart(maxLabelLength, ' ');
            const bar = Array(Math.round(maxWidth * reactCount / maxValue) + 1).join('█');
            return `\`${label}\`: ${bar} ${reactCount}`;
        })
    ].join('\n');
}

// GLOBAL SUPPORTIVE DATA
function modelGlobalSupportiveData(messages, displayNames) {
    const support = {};
    messages.forEach(({ reacts }) => {
        reacts.forEach(({ user }) => {
            const displayName = displayNames[user] || 'NO NAME';
            support[displayName] = 1 + support[displayName] || 0;
        });
    });

    return Object.keys(support)
        .map(id => ({ userId: id, reactCount: support[id] }))
        .sort((a, b) => a.reactCount >= b.reactCount ? -1 : 1);
}

function plotGlobalSupportiveData(data) {
    const maxLabelLength = Math.max(...data.map(user => user.userId.length));
    const maxValue = Math.max(...data.map(user => user.reactCount));
    const maxWidth = 15;

    return [
        '**Most Supportive Users (by React Count):**',
        ...data.map(({ userId, reactCount }) => {
            const label = userId.padStart(maxLabelLength, ' ');
            const bar = Array(Math.round(maxWidth * reactCount / maxValue) + 1).join('█');
            return `\`${label}\`: ${bar} ${reactCount}`;
        })
    ].join('\n');
}
