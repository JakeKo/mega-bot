module.exports = () => message => {
    const megaContribute = /^!mega +contribute/;
    const megaLinks = /^!mega +links/;
    const megaHelp = /^!mega +help/;

    // Check if the message matches '!mega contribute'
    if (megaContribute.test(message.content)) {
        message.channel.send('Want to help make Mega Bot better? Check out the open source repsitory: https://github.com/JakeKo/mega-bot');
    }
    
    // TODO: Add links to UNL homepage, CAPS, Ivory Tower, etc.
    // Check if the message matches '!mega links'
    else if (megaLinks.test(message.content)) {
        message.channel.send([
            '**Helpful Links:**',
            'JDEK Login: http://jdekipedia.com/index.php?title=Special:Userlogin&returnto=Main_Page.',
            'Raikes School Homepage: https://raikes.unl.edu/.',
            'Textbook Dropbox: https://bit.ly/raikesdropbox.',
            'Smol Robots: https://twitter.com/smolrobots.'
        ].join('\n'));
    }

    // Check if the message matches '!mega help'
    else if (megaHelp.test(message.content)) {
        message.channel.send([
            '**Usage Intstructions for Mega Bot:**',
            '• `!mega contribute`: Learn about how to contribute to Mega Bot.',
            '• `!mega links`: View a list of helpful links.',
            '• `!mega help`: View usage instructions for Mega Bot.',
            '• `!pasta help`: View usage instructions for Pasta Bot.',
            '• `!stats help`: View usage instructions for Stat Bot.',
        ].join('\n'));
    }
};
