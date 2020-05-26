module.exports = (_, store) => async message => {
    const keys = (await store.getPastas()).map(pasta => pasta.key);
    const pastaAdd = /^!pasta +add +(\S+)(.*)/;
    const pastaHelp = /^!pasta +help/;
    const pastaRemove = /^!pasta +remove +(\S+)/;
    const pastaList = /^!pasta +list/;
    const pastaSearch = /^!pasta +(\S+)(.*)/;
    const keywords = ['add', 'help', 'remove', 'list'];

    // Check if the message matches '!pasta add [key] [value]'
    if (pastaAdd.test(message.content)) {
        const [_, key, value] = message.content.match(pastaAdd);

        // Check if the key is a reserved keyword
        if (keywords.includes(key)) {
            message.channel.send(`Cannot add pasta. The provided key is a reserved keyword: **${key}**.`);
        }

        // Check if the key is already in use
        else if (keys.includes(key)) {
            message.channel.send(`Cannot add pasta. The provided key is already in use: **${key}**.`);
        }

        // Check if the value is poised to cause a recursive nightmare by starting with '!pasta'
        else if (/^!pasta/.test(value.trim())) {
            message.channel.send('You think you\'re so slick just because you know what recursion is? Cute. Consider this pasta 🅱️ancelled.');
        }

        // Check if neither a message is provided nor any attachments are included in the pasta
        else if (value.trim() === '' && message.attachments.size === 0) {
            message.channel.send('Cannot add pasta. You must provide a string message, photo attachment(s), or both to create a valid pasta.');
        }

        else {
            const attachments = message.attachments.array().map(a => a.attachment);
            await store.addPasta(key, value.trim(), attachments);
            message.channel.send(`Added new pasta: **${key}**. Type \`!pasta ${key}\` to share it with the channel.`);
        }
    }

    // Check if the message matches '!pasta help'
    else if (pastaHelp.test(message.content)) {
        message.channel.send([
            '**Usage Intstructions for Pasta Bot:**',
            '• `!pasta help`: View usage instructions for Pasta Bot.',
            '• `!pasta list`: View list of currently available pastas.',
            '• `!pasta [key]`: View pasta corresponding to the provided key.',
            '• `!pasta add [key] [value]`: Create pasta with the provided key and value.',
            '• `!pasta remove [key]`: Remove pasta with the provided key.',
        ].join('\n'));
    }

    // Check if the message matches '!pasta remove [key]'
    else if (pastaRemove.test(message.content)) {
        const [_, key] = message.content.match(pastaRemove);

        // Display the pasta corresponding to the provided key if one exists
        if (keys.includes(key)) {
            await store.removePasta(key);
            message.channel.send(`Removed pasta: **${key}**`);
        } else {
            message.channel.send(`Could not find a pasta matching the key: **${key}**. Try typing \`!pasta list\` to see the available keys.`);
        }
    }

    // Check if the message matches '!pasta list'
    else if (pastaList.test(message.content)) {
        const list = keys.sort().map(key => `• \`${key}\``).join('\n');
        message.channel.send(`Available pastas:\n${list}`);
    }

    // Check if the message matches '!pasta [key]'
    else if (pastaSearch.test(message.content)) {
        const [_, key, argsString] = message.content.match(pastaSearch);

        // Display the pasta corresponding to the provided key if one exists
        if (keys.includes(key)) {
            // Regular expressions are very confusing and take a lot of explanation
            // I do not have faith in my ability to describe what's going on here, so I hope a few examples do the trick
            // The provided examples are 'ideal' situations but assume that whitespace is not a problem
            const pasta = await store.getPasta(key);

            // Given a pasta value of 'Hello |user1| and |  user2  |!'
            // 1. 'Hello {{user1}} and {{user2}}!' => [['{{user1}}', 'user1'], ['{{user2}}'. 'user2']]
            // 2. [['{{user1}}', 'user1'], ['{{user2}}'. 'user2']] => [ 'user1', 'user2' ]
            const expectedArgMatches = [...pasta.value.matchAll(/{{ *(\S+) *}}/g)];
            const expectedArgs = expectedArgMatches.map(match => match[1]);

            // Given a pasta call of '!pasta arg-test |user1 Thing 1 |user2 Thing 2'
            // 1. '!pasta arg-test &user1 Thing 1 &user2 Thing 2' => [['&user1 Thing 1 ', 'user1', ' Thing 1 '], ['&user2 Thing 2', 'user2', ' Thing 2']]
            // 2. [['&user1 Thing 1 ', 'user1', ' Thing 1 '], ['&user2 Thing 2', 'user2', ' Thing 2']] => { user1: 'Thing 1', user2: 'Thing 2' }
            const providedArgMatches = [...argsString.matchAll(/& *(\S+)([^&]+)/g)];
            const providedArgs = providedArgMatches.reduce((params, match) => ({ ...params, [match[1]]: match[2].trim() }), {});

            // For each expected arg, replace all instances of '{{arg}}' with the provided arg value
            const value = expectedArgs.reduce((output, arg) => {
                const regex = new RegExp(`{{ *${arg} *}}`, 'g');
                return output.replace(regex, providedArgs[arg]);
            }, pasta.value);

            // Send the fully interpolated message
            message.channel.send(value, { files: pasta.attachments || [] });
        } else {
            message.channel.send(`Could not find a pasta matching the key: **${key}**. Try typing \`!pasta list\` to see the available keys or \`!pasta add\` to add a new pasta.`);
        }
    }
};
