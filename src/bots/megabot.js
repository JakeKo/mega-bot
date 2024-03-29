const axios = require('axios').default;
const config = require('../../config');
const { getDisplayName, getArgs } = require('../utilities');
const Logger = require('../logger');

module.exports = (bot) => async (message) => {
    const mega = /^!mega/;
    const megaContribute = /^!mega +contribute/;
    const megaLinks = /^!mega +links/;
    const megaRequest = /^!mega +request +(.*)/;
    const megaHelp = /^!mega +help/;
    const megaDebug = /^!mega +debug/;

    if (!mega.test(message.content)) {
        return;
    }

    Logger.log(`Handling '${message.content}' with MegaBot`);

    // Check if the message matches '!mega contribute'
    if (megaContribute.test(message.content)) {
        message.channel.send('Want to help make Mega Bot better? Check out the open source repsitory: https://github.com/JakeKo/mega-bot');
    }

    // Check if the message matches '!mega links'
    else if (megaLinks.test(message.content)) {
        message.channel.send([
            '**Helpful Links:**',
            '>>> JDEK Login: http://jdekipedia.com/index.php?title=Special:Userlogin&returnto=Main_Page.',
            'Raikes School Homepage: https://raikes.unl.edu/.',
            'Textbook Dropbox: https://bit.ly/raikesdropbox.',
            'Smol Robots: https://twitter.com/smolrobots.'
        ].join('\n'));
    }

    // Check if the message matches '!mega request'
    else if (megaRequest.test(message.content)) {
        const [, data] = message.content.match(megaRequest);
        const { args, body } = getArgs(data);
        const discordName = await getDisplayName(bot, message.author.id);

        const result = await createIssue(discordName, body, args['gh']);
        message.channel.send(result);
    }

    // Check if the message matches '!mega help'
    else if (megaHelp.test(message.content)) {
        message.channel.send([
            '**Usage Intstructions for Mega Bot:**',
            '>>> `!mega contribute`: Learn about how to contribute to Mega Bot.',
            '`!mega links`: View a list of helpful links.',
            '`!mega request`: Request a new Mega Bot feature.',
            '`!mega help`: View usage instructions for Mega Bot.',
            '`!pasta help`: View usage instructions for Pasta Bot.',
            '`!stats help`: View usage instructions for Stat Bot.',
        ].join('\n'));
    }

    else if (megaDebug.test(message.content)) {
        const displayName = await getDisplayName(bot, message.author.id);
        message.channel.send(displayName);
    }
};

async function createIssue(author, description, ghName) {
    try {
        const { data } = await axios({
            url: 'https://api.github.com/repos/JakeKo/mega-bot/issues',
            method: 'POST',
            headers: {
                Authorization: `token ${config.GITHUB_API_TOKEN}`
            },
            data: {
                title: description,
                body: `By: ${author}${ghName ? ` [ @${ghName} ]` : ''}\n${description}`
            }
        });

        return `Successfully created issue: \`[#${data.number}] ${data.title}\`.\nCheck it out here: ${data.html_url}`;
    } catch (exception) {
        console.error(exception);
        return 'Failed to create issue.';
    }
}
