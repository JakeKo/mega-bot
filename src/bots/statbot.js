const { getDisplayNames, getDisplayName, getAllDisplayNames } = require('../utilities');
const Logger = require('../logger');

module.exports = (bot, store) => async message => {
    const stats = /^!stats/;
    const statsHelp = /^!stats +help/;
    const statsStatus = /^!stats +status/;
    const statsReacts = /^!stats +reacts(.*)/;
    // const statsPopular = /^!stats +popular(.*)/;
    // const statsSupportive = /^!stats +supportive(.*)/;

    if (!stats.test(message.content)) {
        return;
    }

    Logger.log(`Handling '${message.content}' with StatBot`);

    // Check if the message matches '!stats help'
    if (statsHelp.test(message.content)) {
        message.channel.send([
            '**Usage Intstructions for Stat Bot:**',
            '>>> `!stats help`: View usage instructions for Stat Bot.',
            '`!stats reacts [?user]`: View the most popular reacts (of the optional user). Use plain text to search users. Do not mention directly.',
            '`!stats popular [?user]`: View the most popular users (of the optional user). Use plain text to search users. Do not mention directly.',
            '`!stats supportive [?user]`: View the most supportive users (of the optional user). Use plain text to search users. Do not mention directly.',
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
    // else if (statsPopular.test(message.content)) {
    //     const [, userQuery] = message.content.match(statsPopular);
    //     const messages = await store.getMessages();

    //     // Check if no user was provided
    //     if (userQuery.trim() === '') {
    //         const data = modelGlobalUserPopularityData(messages).slice(0, 10);
    //         data.length === 0
    //             ? message.channel.send('No data available for the provided command.')
    //             : message.channel.send(plotGlobalUserPopularityData(data));
    //     } else {
    //         const result = await evaluateUserQuery(bot, userQuery);

    //         if (result.success) {
    //             const data = await modelIndividualUserPopularityData(messages, result.user).slice(0, 10);
    //             const displayName = await getDisplayName(bot, result.user);
    //             data.length === 0
    //                 ? message.channel.send('No data available for the provided command.')
    //                 : message.channel.send(plotIndividualUserPopularityData(data, displayName));
    //         } else {
    //             message.channel.send(result.message);
    //         }
    //     }
    // }

    // Check if the messages matches '!stats supportive [?user]'
    // else if (statsSupportive.test(message.content)) {
    //     const [, userQuery] = message.content.match(statsSupportive);
    //     const messages = await store.getMessages();

    //     // Check if no user was provided
    //     if (userQuery.trim() === '') {
    //         const data = modelGlobalSupportiveData(messages).slice(0, 10);
    //         data.length === 0
    //             ? message.channel.send('No data available for the provided command.')
    //             : message.channel.send(plotGlobalSupportiveData(data));
    //     } else {
    //         const result = await evaluateUserQuery(bot, userQuery);

    //         if (result.success) {
    //             const data = modelIndividualSupportiveData(messages, result.user).slice(0, 10);
    //             const displayName = await getDisplayName(bot, result.user);
    //             data.length === 0
    //                 ? message.channel.send('No data available for the provided command.')
    //                 : message.channel.send(plotIndividualSupportiveData(data, displayName));
    //         } else {
    //             message.channel.send(result.message);
    //         }
    //     }
    // }
};

// Returns the IDs of users whose display name matches the query
async function searchUsers(bot, query) {
    const allNames = await getAllDisplayNames(bot);
    return Object.keys(allNames).filter(id => allNames[id].toLowerCase().includes(query.toLowerCase()));
}

async function evaluateUserQuery(bot, userQuery) {
    const query = userQuery.trim();
    const targetUsers = await searchUsers(bot, query);

    // Check how many users matched the provided user query
    if (targetUsers.length === 1) {
        return { success: true, user: targetUsers[0], message: 'Query Successful' };
    } else if (targetUsers.length === 0) {
        return { success: false, user: '', message: `Query Error: No user matches query "${query}".` };
    } else {
        const displayNames = await getDisplayNames(bot, ...targetUsers);
        const displayNamesString = Object.values(displayNames).join('\n');
        return { success: false, user: '', message: `Query Error: More than one user matches query "${query}": ${displayNamesString}` };
    }
}

// INDIVIDUAL REACT POPULARITY DATA
function modelIndividualReactPopularityData(messages, user) {
    const popularity = {};

    messages.filter(m => m.author === user).forEach(({ reacts }) => {
        reacts.forEach(({ react }) => {
            popularity[react] = 1 + (popularity[react] || 0);
        });
    });

    return Object.keys(popularity)
        .map(id => ({ reactId: id, count: popularity[id] }))
        .sort((a, b) => a.count >= b.count ? -1 : 1);
}

function plotIndividualReactPopularityData(data, user) {
    const maxValue = Math.max(...data.map(react => react.count));
    const maxWidth = 20;

    return [
        `**Most Popular Reacts by ${user}:**`,
        ...data.map(({ reactId, count }) => {
            const bar = Array(Math.round(maxWidth * count / maxValue) + 1).join('█');
            return `${reactId}\t${bar} ${count}`;
        })
    ].join('\n');
}

// GLOBAL REACT POPULARITY DATA
function modelGlobalReactPopularityData(messages) {
    const popularity = {};
    messages.forEach(({ reacts }) => {
        reacts.forEach(({ react }) => {
            popularity[react] = 1 + (popularity[react] || 0);
        });
    });

    return Object.keys(popularity)
        .map(id => ({ reactId: id, count: popularity[id] }))
        .sort((a, b) => a.count >= b.count ? -1 : 1);
}

function plotGlobalReactPopularityData(data) {
    const maxValue = Math.max(...data.map(react => react.count));
    const maxWidth = 20;

    return [
        '**Most Popular Reacts:**',
        ...data.map(({ reactId, count }) => {
            const bar = Array(Math.round(maxWidth * count / maxValue) + 1).join('█');
            return `${reactId}\t${bar} ${count}`;
        })
    ].join('\n');
}

// INDIVIDUAL USER POPULARITY DATA
// async function modelIndividualUserPopularityData(bot, messages, user) {
//     const popularityMap = await Promise.all(messages.map(async m => {
//         const { author, reacts } = m;
//         const displayName = await getDisplayName(bot, author);
//         const reactCount = reacts.filter(r => r.user === user).length;
//         return [displayName, reactCount];
//     }));

//     const popularityObject = {};
//     popularityMap.forEach(([name, count]) => {
//         popularityObject[name] = count + (popularityMap[name] || 0);
//     });

//     return Object.keys(popularityObject)
//         .map(id => ({ userId: id, reactCount: popularityObject[id] }))
//         .sort((a, b) => a.reactCount >= b.reactCount ? -1 : 1);
// }

// function plotIndividualUserPopularityData(data, user) {
//     const maxLabelLength = Math.max(...data.map(user => user.userId.length));
//     const maxValue = Math.max(...data.map(user => user.reactCount));
//     const maxWidth = 15;

//     return [
//         `**Most Popular Users According to ${user}:**`,
//         ...data.map(({ userId, reactCount }) => {
//             const label = userId.padStart(maxLabelLength, ' ');
//             const bar = Array(Math.round(maxWidth * reactCount / maxValue) + 1).join('█');
//             return `\`${label}\`: ${bar} ${reactCount}`;
//         })
//     ].join('\n');
// }

// GLOBAL USER POPULARITY DATA
// function modelGlobalUserPopularityData(messages) {
//     const popularity = {};
//     messages.forEach(({ author, reacts }) => {
//         const displayName = getDisplayNames()[author] || 'NO NAME';
//         popularity[displayName] = reacts.length + (popularity[displayName] || 0);
//     });

//     return Object.keys(popularity)
//         .map(id => ({ userId: id, reactCount: popularity[id] }))
//         .sort((a, b) => a.reactCount >= b.reactCount ? -1 : 1);
// }

// function plotGlobalUserPopularityData(data) {
//     const maxLabelLength = Math.max(...data.map(user => user.userId.length));
//     const maxValue = Math.max(...data.map(user => user.reactCount));
//     const maxWidth = 15;

//     return [
//         '**Most Popular Users:**',
//         ...data.map(({ userId, reactCount }) => {
//             const label = userId.padStart(maxLabelLength, ' ');
//             const bar = Array(Math.round(maxWidth * reactCount / maxValue) + 1).join('█');
//             return `\`${label}\`: ${bar} ${reactCount}`;
//         })
//     ].join('\n');
// }

// INDIVIDUAL SUPPORTIVE DATA
// function modelIndividualSupportiveData(messages, user) {
//     const support = {};
//     messages.filter(m => m.author === user).forEach(({ reacts }) => {
//         reacts.forEach(({ user }) => {
//             const displayName = getDisplayNames()[user] || 'NO NAME';
//             support[displayName] = 1 + (support[displayName] || 0);
//         });
//     });

//     return Object.keys(support)
//         .map(id => ({ userId: id, reactCount: support[id] }))
//         .sort((a, b) => a.reactCount >= b.reactCount ? -1 : 1);
// }

// function plotIndividualSupportiveData(data, user) {
//     const maxLabelLength = Math.max(...data.map(user => user.userId.length));
//     const maxValue = Math.max(...data.map(user => user.reactCount));
//     const maxWidth = 15;

//     return [
//         `**Most Supportive Users of ${user}:**`,
//         ...data.map(({ userId, reactCount }) => {
//             const label = userId.padStart(maxLabelLength, ' ');
//             const bar = Array(Math.round(maxWidth * reactCount / maxValue) + 1).join('█');
//             return `\`${label}\`: ${bar} ${reactCount}`;
//         })
//     ].join('\n');
// }

// GLOBAL SUPPORTIVE DATA
// function modelGlobalSupportiveData(messages) {
//     const support = {};
//     messages.forEach(({ reacts }) => {
//         reacts.forEach(({ user }) => {
//             const displayName = getDisplayNames()[user] || 'NO NAME';
//             support[displayName] = 1 + (support[displayName] || 0);
//         });
//     });

//     return Object.keys(support)
//         .map(id => ({ userId: id, reactCount: support[id] }))
//         .sort((a, b) => a.reactCount >= b.reactCount ? -1 : 1);
// }

// function plotGlobalSupportiveData(data) {
//     const maxLabelLength = Math.max(...data.map(user => user.userId.length));
//     const maxValue = Math.max(...data.map(user => user.reactCount));
//     const maxWidth = 15;

//     return [
//         '**Most Supportive Users:**',
//         ...data.map(({ userId, reactCount }) => {
//             const label = userId.padStart(maxLabelLength, ' ');
//             const bar = Array(Math.round(maxWidth * reactCount / maxValue) + 1).join('█');
//             return `\`${label}\`: ${bar} ${reactCount}`;
//         })
//     ].join('\n');
// }
