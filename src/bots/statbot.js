module.exports = () => async message => {
    const statsReacts = /^!stats +reacts/;
    const statsPopular = /^!stats +popular/;
    const statsActivity = /^!stats +activity/;
    const statsHelp = /^!stats +help/;
    const statsDefault = /^!stats/;

    // Check if the message matches '!stats reacts'
    if (statsReacts.test(message.content)) {
        const messages = (await message.channel.messages.fetch()).array();
        const popularity = modelReactPopularity(messages);

        message.channel.send([
            '**Top 10 Most Popular Reacts:**',
            `*Messages Ingested: ${messages.length}*`,
            '',
            ...popularity.slice(0, 10).map(react => `${react.reactId}: ${react.count}`)
        ].join('\n'));
    }

    // Check if the message matches '!stats popular'
    else if (statsPopular.test(message.content)) {
        const messages = (await message.channel.messages.fetch()).array();
        const popularity = await modelUserPopularity(messages);

        message.channel.send([
            '**Top 10 Most Popular Users:**',
            `*Messages Ingested: ${messages.length}*`,
            '',
            ...popularity.slice(0, 10).map(user => `${user.userId}: ${user.reactCount}`)
        ].join('\n'));
    }

    // Check if the message matches '!stats activity'
    else if (statsActivity.test(message.content)) {
        return;
    }

    // Check if the message matches '!stats help' or '!stats'
    else if (statsHelp.test(message.content) || statsDefault.test(message.content)) {
        message.channel.send([
            '**Usage Intstructions for Stat Bot:**',
            '• `!stats help`: View usage instructions for Stat Bot.',
            `• \`!stats reacts\`: View a list of the most popular reacts in <#${message.channel.id}>.`,
            `• \`!stats popular\`: View the most popular members (based on reacts) in <#${message.channel.id}>.`,
            // '• `!stats activity`: Check out how active #megachat has been recently.'
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
