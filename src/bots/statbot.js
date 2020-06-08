module.exports = () => async message => {
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
        const messages = (await message.channel.messages.fetch()).array();
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
        const messages = (await message.channel.messages.fetch()).array();
        const popularity = (await modelUserPopularity(messages)).slice(0, 10);

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

    messages.forEach(message => {
        const reacts = message.reactions.cache.array();
        reacts.forEach(react => {
            const reactId = react.emoji.toString();
            popularity[reactId] = popularity[reactId] === undefined ? react.count : popularity[reactId] + react.count;
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

async function modelUserPopularity(messages) {
    const popularity = {};

    // Traditional for-loop is implemented to avoid async/await problems with forEach
    for (let i = 0; i < messages.length; i++) {
        const message = messages[i];
        const userId = (await message.guild.members.fetch(message.author.id)).displayName;
        const reacts = message.reactions.cache.array();
        const reactCount = reacts.reduce((count, react) => count + react.count, 0);

        popularity[userId] = popularity[userId] === undefined ? reactCount : popularity[userId] + reactCount;
    }

    return Object.keys(popularity)
        .map(key => ({ userId: key, reactCount: popularity[key] }))
        .sort((a, b) => a.reactCount >= b.reactCount ? -1 : 1);
}

function plotUserPopularity(users) {
    const maxLabelLength = Math.max(...users.map(user => user.userId.length));
    const maxValue = Math.max(...users.map(user => user.reactCount));
    const maxWidth = 15;

    return users.map(({ userId, reactCount }) => `\`${userId.padStart(maxLabelLength, ' ')}\`: ${Array(Math.round(maxWidth * reactCount / maxValue) + 1).join('█')} ${reactCount}`);
}
