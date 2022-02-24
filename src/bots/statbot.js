const { getDisplayName, flattenEntries, barPlot, evaluateUserQuery } = require('../utilities');
const Logger = require('../logger');
const config = require('../../config');
const { archiverTimestamp, startArchiver } = require('../archiver');

module.exports = (bot, store) => async message => {
    const stats = /^!stats/;
    const statsHelp = /^!stats +help/;
    const statsStatus = /^!stats +status/;
    const statsReacts = /^!stats +reacts(.*)/;
    const statsPopular = /^!stats +popular(.*)/;
    const statsSupportive = /^!stats +supportive(.*)/;
    const statsMessage = /^!stats +message(.*)/;

    if (!stats.test(message.content)) {
        return;
    }

    // Restart archiver if someone asked for stats and the archiver hasn't run in a minute
    if (Date.now() - archiverTimestamp() > 60 * 1000) {
        startArchiver();
    }

    Logger.log(`Handling '${message.content}' with StatBot`);

    // Check if the message matches '!stats help'
    if (statsHelp.test(message.content)) {
        message.channel.send([
            '**Usage Intstructions for Stat Bot:**',
            '__Use plain text to search users. Do not mention directly.__',
            '>>> `!stats help`: View usage instructions for Stat Bot.',
            '`!stats reacts [?user]`: View the most popular reacts (of the optional user). ',
            '`!stats popular [?user]`: View the most popular users (of the optional user).',
            '`!stats supportive [?user]`: View the most supportive users (of the optional user).',
            '`!stats message [?user]`: View the most popular message (according to the optional user).',
            '`!stats status`: View clerical information about Stat Bot.'
        ].join('\n'));
    }

    // Check if the message matches '!stats status'
    else if (statsStatus.test(message.content)) {
        const messages = await store.getMessages();
        const lastMessage = await store.getLastMessage();

        message.channel.send([
            '**STAT BOT STATUS**',
            `>>> Messages Ingested: **${messages.length}**`,
            `Last Ingested Message: **${new Date(lastMessage.timestamp).toUTCString()}**`
        ].join('\n'));
    }

    // Check if the message matches '!stats reacts [?user]'
    else if (statsReacts.test(message.content)) {
        const [, userQuery] = message.content.match(statsReacts);
        const messages = await store.getMessages();

        if (userQuery.trim() === '') {
            const data = modelGlobalReactPopularityData(messages).slice(0, 10);
            data.length === 0
                ? message.channel.send('No data available for the provided command.')
                : message.channel.send(plotGlobalReactPopularityData(data));
        } else {
            const result = await evaluateUserQuery(bot, userQuery);

            if (result.success) {
                const data = modelIndividualReactPopularityData(messages, result.user).slice(0, 10);
                const displayName = await getDisplayName(bot, result.user);
                data.length === 0
                    ? message.channel.send('No data available for the provided command.')
                    : message.channel.send(plotIndividualReactPopularityData(data, displayName));
            } else {
                message.channel.send(result.message);
            }
        }
    }

    // Check if the message matches '!stats popular [?user]'
    else if (statsPopular.test(message.content)) {
        const [, userQuery] = message.content.match(statsPopular);
        const messages = await store.getMessages();

        // Check if no user was provided
        if (userQuery.trim() === '') {
            const data = modelGlobalUserPopularityData(bot, messages).slice(0, 10);
            const response = data.length === 0
                ? 'No data available for the provided command.'
                : await plotGlobalUserPopularityData(bot, data);
            
            message.channel.send(response);
        } else {
            const result = await evaluateUserQuery(bot, userQuery);

            if (result.success) {
                const data = modelIndividualUserPopularityData(messages, result.user).slice(0, 10);
                const displayName = await getDisplayName(bot, result.user);
                const response = data.length === 0
                    ? 'No data available for the provided command.'
                    : await plotIndividualUserPopularityData(bot, data, displayName);
                
                message.channel.send(response);
            } else {
                message.channel.send(result.message);
            }
        }
    }

    // Check if the messages matches '!stats supportive [?user]'
    else if (statsSupportive.test(message.content)) {
        const [, userQuery] = message.content.match(statsSupportive);
        const messages = await store.getMessages();

        // Check if no user was provided
        if (userQuery.trim() === '') {
            const data = modelGlobalSupportiveData(messages).slice(0, 10);
            const response = data.length === 0
                ? 'No data available for the provided command.'
                : await plotGlobalSupportiveData(bot, data);
            
            message.channel.send(response);
        } else {
            const result = await evaluateUserQuery(bot, userQuery);

            if (result.success) {
                const data = modelIndividualSupportiveData(messages, result.user).slice(0, 10);
                const displayName = await getDisplayName(bot, result.user);
                const response = data.length === 0
                    ? 'No data available for the provided command.'
                    : await plotIndividualSupportiveData(bot, data, displayName);
                
                message.channel.send(response);
            } else {
                message.channel.send(result.message);
            }
        }
    }

    // Check if the messages matches '!stats message [?user]'
    else if (statsMessage.test(message.content)) {
        const [, userQuery] = message.content.match(statsMessage);
        const messages = await store.getMessages();

        // Check if no user was provided
        if (userQuery.trim() === '') {
            const data = modelGlobalMessageData(messages).slice(0, 10);
            const response = data.length === 0
                ? 'No data available for the provided command.'
                : await plotGlobalMessageData(data);
            
            message.channel.send(response);
        } else {
            const result = await evaluateUserQuery(bot, userQuery);

            if (result.success) {
                const data = modelIndividualMessageData(messages, result.user).slice(0, 10);
                const displayName = await getDisplayName(bot, result.user);
                const response = data.length === 0
                    ? 'No data available for the provided command.'
                    : await plotIndividualMessageData(data, displayName);
                
                message.channel.send(response);
            } else {
                message.channel.send(result.message);
            }
        }
    }
};

// INDIVIDUAL REACT POPULARITY DATA
function modelIndividualReactPopularityData(messages, user) {
    const popularity = {};
    messages.filter(m => m.author === user).forEach(({ reacts }) => {
        reacts.forEach(({ react }) => {
            popularity[react] = 1 + (popularity[react] || 0);
        });
    });

    return Object.entries(popularity).sort((a, b) => a[1] >= b[1] ? -1 : 1);
}

// GLOBAL REACT POPULARITY DATA
function modelGlobalReactPopularityData(messages) {
    const popularity = {};
    messages.forEach(({ reacts }) => {
        reacts.forEach(({ react }) => {
            popularity[react] = 1 + (popularity[react] || 0);
        });
    });

    return Object.entries(popularity).sort((a, b) => a[1] >= b[1] ? -1 : 1);
}

// INDIVIDUAL USER POPULARITY DATA
function modelIndividualUserPopularityData(bot, messages, user) {
    const entries = messages.map(({ author, reacts }) => {
        const reactCount = reacts.filter(r => r.user === user).length;
        return [author, reactCount];
    });

    const flatEntries = Object.entries(flattenEntries(entries));
    return flatEntries.sort((a, b) => a[1] >= b[1] ? -1 : 1);
}

// GLOBAL USER POPULARITY DATA
function modelGlobalUserPopularityData(bot, messages) {
    const entries = messages
        .filter(m => !config.STATBOT_ID_BLACKLIST.includes(m.author))
        .map(({ author, reacts }) => [author, reacts.length]);

    const flatEntries = Object.entries(flattenEntries(entries));
    return flatEntries.sort((a, b) => a[1] >= b[1] ? -1 : 1);
}

// INDIVIDUAL SUPPORTIVE DATA
function modelIndividualSupportiveData(messages, user) {
    const support = {};
    messages.filter(m => m.author === user).forEach(({ reacts }) => {
        reacts.forEach(({ user }) => {
            support[user] = 1 + (support[user] || 0);
        });
    });

    return Object.entries(support).sort((a, b) => a[1] >= b[1] ? -1 : 1);
}

// GLOBAL SUPPORTIVE DATA
function modelGlobalSupportiveData(messages) {
    const support = {};
    messages.forEach(({ reacts }) => {
        reacts.forEach(({ user }) => {
            support[user] = 1 + (support[user] || 0);
        });
    });

    return Object.entries(support).sort((a, b) => a[1] >= b[1] ? -1 : 1);
}

// INDIVIDUAL MESSAGE DATA
function modelIndividualMessageData(messages, user) {
    const entries = messages.map(m => [m.id, m.reacts.filter(r => r.user === user).length]);
    return entries.sort((a, b) => a[1] >= b[1] ? -1 : 1);
}

// GLOBAL MESSAGE DATA
function modelGlobalMessageData(messages) {
    const entries = messages.map(m => [m.id, m.reacts.length]);
    return entries.sort((a, b) => a[1] >= b[1] ? -1 : 1);
}

function plotIndividualReactPopularityData(entries, user) {
    return barPlot(`**Most Popular Reacts by ${user}:**`, entries);
}

function plotGlobalReactPopularityData(entries) {
    return barPlot('**Most Popular Reacts:**', entries);
}

async function plotIndividualUserPopularityData(bot, data, user) {
    const label = `**Most Popular Users According to ${user}:**`;
    let maxKeyLength = 0;
    let entries = await Promise.all(data.map(async ([key, value]) => {
        const displayName = await getDisplayName(bot, key);

        if (displayName.length > maxKeyLength) {
            maxKeyLength = displayName.length;
        }

        return [displayName, value];
    }));
    entries = entries.map(([key, value]) => [`\`${key.padStart(maxKeyLength, ' ')}\``, value]);

    return barPlot(label, entries);
}

async function plotGlobalUserPopularityData(bot, data) {
    const label = '**Most Popular Users:**';
    let maxKeyLength = 0;
    let entries = await Promise.all(data.map(async ([key, value]) => {
        const displayName = await getDisplayName(bot, key);

        if (displayName.length > maxKeyLength) {
            maxKeyLength = displayName.length;
        }

        return [displayName, value];
    }));
    entries = entries.map(([key, value]) => [`\`${key.padStart(maxKeyLength, ' ')}\``, value]);

    return barPlot(label, entries);
}

async function plotIndividualSupportiveData(bot, data, user) {
    const label = `**Most Supportive Users of ${user}:**`;
    let maxKeyLength = 0;
    let entries = await Promise.all(data.map(async ([key, value]) => {
        const displayName = await getDisplayName(bot, key);

        if (displayName.length > maxKeyLength) {
            maxKeyLength = displayName.length;
        }

        return [displayName, value];
    }));
    entries = entries.map(([key, value]) => [`\`${key.padStart(maxKeyLength, ' ')}\``, value]);

    return barPlot(label, entries);
}

async function plotGlobalSupportiveData(bot, data) {
    const label = '**Most Supportive Users:**';
    let maxKeyLength = 0;
    let entries = await Promise.all(data.map(async ([key, value]) => {
        const displayName = await getDisplayName(bot, key);

        if (displayName.length > maxKeyLength) {
            maxKeyLength = displayName.length;
        }

        return [displayName, value];
    }));
    entries = entries.map(([key, value]) => [`\`${key.padStart(maxKeyLength, ' ')}\``, value]);

    return barPlot(label, entries);
}

function plotIndividualMessageData(entries, user) {
    const label = [
        `**Most Popular Messages According to ${user}:**`,
        '**Jump to message with `https://discord.com/channels/{guildId}/{channelId}/{messageId}`. I can\'t embed links :(**',
        ''
    ].join('\n');

    const newEntries = entries.map(([key, value]) => [`\`${key}\``, value]);
    return barPlot(label, newEntries);
}

function plotGlobalMessageData(entries) {
    const label = [
        '**Most Popular Messages:**',
        '**Jump to message with `https://discord.com/channels/{guildId}/{channelId}/{messageId}`. I can\'t embed links :(**',
        ''
    ].join('\n');

    const newEntries = entries.map(([key, value]) => [`\`${key}\``, value]);
    return barPlot(label, newEntries);
}
