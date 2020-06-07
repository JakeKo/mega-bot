// const Discord = require('discord.js');
// const Canvas = require('canvas');

module.exports = () => async message => {
    const statsReacts = /^!stats +reacts/;
    const statsPopular = /^!stats +popular/;
    const statsHelp = /^!stats +help/;
    const statsDefault = /^!stats/;

    // Check if the message matches '!stats reacts'
    if (statsReacts.test(message.content)) {
        const messages = (await message.channel.messages.fetch()).array();
        const popularity = modelReactPopularity(messages).slice(0, 10);
        // const plot = await plotReactPopularity(popularity);

        // message.channel.send([
        //     `**Top ${popularity.length} Most Popular Reacts in <#${message.channel.id}>:**`,
        //     `*Messages Ingested: ${messages.length}*`
        // ].join('\n'), new Discord.MessageAttachment(plot.toBuffer(), 'react-popularity.png'));

        const maxPopularity = Math.max(...popularity.map(({ count }) => count));
        message.channel.send([
            `**Top ${popularity.length} Most Popular Reacts in <#${message.channel.id}>:**`,
            `*Messages Ingested: ${messages.length}*`,
            ...popularity.map(react => `${react.reactId} ${Array(Math.round(15 * react.count / maxPopularity) + 1).join('█')} ${react.count}`)
        ].join('\n'));
    }

    // Check if the message matches '!stats popular'
    else if (statsPopular.test(message.content)) {
        const messages = (await message.channel.messages.fetch()).array();
        const popularity = await modelUserPopularity(messages);

        message.channel.send([
            `**Top 10 Most Popular Users in <#${message.channel.id}>:**`,
            `*Messages Ingested: ${messages.length}*`,
            '',
            ...popularity.slice(0, 10).map((user, i) => `${i + 1}. ${user.userId}: ${user.reactCount}`)
        ].join('\n'));
    }

    // Check if the message matches '!stats help' or '!stats'
    else if (statsHelp.test(message.content) || statsDefault.test(message.content)) {
        message.channel.send([
            '**Usage Intstructions for Stat Bot:**',
            '• `!stats help`: View usage instructions for Stat Bot.',
            `• \`!stats reacts\`: View a list of the most popular reacts in <#${message.channel.id}>.`,
            `• \`!stats popular\`: View the most popular members (based on reacts) in <#${message.channel.id}>.`,
            '',
            '*Note: HTML Canvas supporting coming soon.*'
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

// async function plotReactPopularity(reactPopularity) {
//     const width = 300;
//     const height = 300;
//     const plotMargin = { top: 5, right: 5, bottom: 5, left: 35 };
//     const barMargin = { top: 2, right: 0, bottom: 2, left: 0 };
//     const tagMargin = { top: 0, right: 5, bottom: 0, left: 0 };
//     const maxPopularity = Math.max(...reactPopularity.map(({ count }) => count));
//     const regionHeight = (height - plotMargin.top - plotMargin.bottom) / reactPopularity.length;
//     const regionWidth = width - plotMargin.left - plotMargin.right;
//     const emojiWidth = 15;
//     const emojiHeight = 15;
    
//     const canvas = Canvas.createCanvas(width, height);
//     const ctx = canvas.getContext('2d');

//     // Render canvas background
//     ctx.fillStyle = '#FFFFFF';
//     ctx.fillRect(0, 0, width, height);

//     for (let i = 0; i < reactPopularity.length; i++) {
//         const react = reactPopularity[i];
//         const regionMidpoint = (0.5 + i) * regionHeight + plotMargin.top;
//         const barHeight = regionHeight - barMargin.top - barMargin.bottom;
//         const barWidth = regionWidth * react.count / maxPopularity;

//         // Render bar label
//         if (/^https/.test(react.reactId)) {
//             const image = await Canvas.loadImage(react.reactId);
//             ctx.drawImage(image, plotMargin.left - tagMargin.right - emojiWidth, regionMidpoint - emojiHeight / 2, emojiWidth, emojiHeight);
//         } else {
//             ctx.fillStyle = '#23272A';
//             ctx.font = `${emojiHeight}px Arial`;
//             ctx.textAlign = 'right';
//             ctx.fillText(react.reactId, plotMargin.left - tagMargin.right, regionMidpoint + 4);
//         }

//         // Render bar
//         ctx.fillStyle = '#23272A';
//         ctx.fillRect(plotMargin.left, regionMidpoint - barHeight / 2, barWidth, barHeight);

//         // Render bar value
//         ctx.fillStyle = '#FFFFFF';
//         ctx.font = 'bold 14px Arial';
//         ctx.fillText(react.count, plotMargin.left + barWidth - 8, regionMidpoint + 4);
//     }

//     return canvas;
// }

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
