const axios = require('axios').default;
const config = require('../../config');
const { getDisplayNames, cacheDisplayNames } = require('../utilities');

module.exports = bot => async message => {
    const megaContribute = /^!mega +contribute/;
    const megaLinks = /^!mega +links/;
    const megaRequest = /^!mega +request +(.*)/;
    const megaHelp = /^!mega +help/;

    await cacheDisplayNames(bot);

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
        const [, description] = message.content.match(megaRequest);
        const result = await createIssue(getDisplayNames()[message.author.id], description);
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
};

async function createIssue(author, description) {
    try {
        const { data } = await axios({
            url: 'https://api.github.com/repos/JakeKo/mega-bot/issues',
            method: 'POST',
            headers: {
                Authorization: `token ${config.GITHUB_API_TOKEN}`
            },
            data: {
                title: description,
                body: `By: ${author}\n${description}`
            }
        });

        return `Successfully created issue: \`[#${data.number}] ${data.title}\`.\nCheck it out here: ${data.html_url}`;
    } catch(exception) {
        console.error(exception);
        return 'Failed to create issue.';
    }
}
