module.exports = () => message => {
    const megaContribute = /^!mega +contribute/;
    const megaHelp = /^!mega +help/;
    const megaLinks = /^!mega +links/;

    // Check if the message matches '!mega contribute'
    if (megaContribute.test(message.content)) {
        message.channel.send('Want to help make Mega Bot better? Check out the open source repsitory: https://github.com/JakeKo/mega-bot');
    }

    // TODO: Capture '!mega'
    // Check if the message matches '!mega help'
    else if (megaHelp.test(message.content)) {
        message.channel.send([
            '**Usage Intstructions for Mega Bot:**',
            '• `!mega contribute`: Learn about how to contribute to Mega Bot.',
            '• `!mega help`: View usage instructions for Mega Bot.',
            '• `!mega links`: View a list of helpful links.'
        ].join('\n'));
    }
    
    // TODO: Add links to UNL homepage, CAPS, Ivory Tower, etc.
    // Check if the message matches '!mega links'
    else if (megaLinks.test(message.content)) {
        message.channel.send([
            '**Helpful Links:**',
            'JDEK Login: http://jdekipedia.com/index.php?title=Special:Userlogin&returnto=Main_Page.',
            'Raikes School Homepage: https://raikes.unl.edu/.',
            'Smol Robots: https://twitter.com/smolrobots.'
        ].join('\n'));
    }
};
