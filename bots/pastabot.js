module.exports = (_, store) => async message => {
    const keys = (await store.getPastas()).map(pasta => pasta.key);
    const pastaAdd = /^!pasta\s+add\s+([0-9a-zA-Z\-_]+)\s*(.*)/;
    const pastaHelp = /^!pasta\s+help/;
    const pastaRemove = /^!pasta\s+remove\s+([0-9a-zA-Z\-_]+)/;
    const pastaList = /^!pasta\s+list/;
    const pastaSearch = /^!pasta\s+([0-9a-zA-Z\-_]+)/;
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
        else if (/^!pasta/.test(value)) {
            message.channel.send('You think you\'re so slick just because you know what recursion is? Cute. Consider this pasta 🅱️ancelled.');
        }

        // Check if neither a message is provided nor any attachments are included in the pasta
        else if (value === '' && message.attachments.size === 0) {
            message.channel.send('Cannot add pasta. You must provide a string message, photo attachment(s), or both to create a valid pasta.');
        }

        else {
            const attachments = message.attachments.array().map(a => a.attachment);
            await store.addPasta(key, value, attachments);
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
        const [_, key] = message.content.match(pastaSearch);

        // Display the pasta corresponding to the provided key if one exists
        if (keys.includes(key)) {
            const pasta = await store.getPasta(key);
            message.channel.send(pasta.value, { files: pasta.attachments || [] });
        } else {
            message.channel.send(`Could not find a pasta matching the key: **${key}**. Try typing \`!pasta list\` to see the available keys or \`!pasta add\` to add a new pasta.`);
        }
    }
};
