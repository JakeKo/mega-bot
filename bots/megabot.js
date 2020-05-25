module.exports = () => message => {
    const megaContribute = /^!mega\s+contribute/;
    const megaHelp = /^!mega\s+help/;

    // Check if the message matches '!mega contribute'
    if (megaContribute.test(message.content)) {
        message.channel.send('Want to help make Mega Bot better? Check out the open source repsitory: https://github.com/JakeKo/mega-bot');
    }

    // Check if the message matches '!mega help'
    else if (megaHelp.test(message.content)) {
        message.channel.send([
            '**Usage Intstructions for Mega Bot:**',
            '• `!mega contribute`: Learn about how to contribute to Mega Bot.',
            '• `!mega help`: View usage instructions for Mega Bot.',
            '• `!pasta help`: View usage instructions for Pasta Bot.'
        ].join('\n'));
    }
};
