module.exports = store => async message => {
    const keys = (await store.getPastas()).map(pasta => pasta.key);
    const pastaAdd = /^!pasta\s+add\s+([0-9a-zA-Z\-_]+)\s+(.+)/;
    const pastaHelp = /^!pasta\s+help/;
    const pastaRemove = /^!pasta\s+remove\s+([0-9a-zA-Z\-_]+)/;
    const pastaKeys = /^!pasta\s+keys/;
    const pastaSearch = /^!pasta\s+([0-9a-zA-Z\-_]+)/;
    const keywords = ['add', 'help', 'remove', 'keys'];

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

        else {
            await store.addPasta(key, value);
            message.channel.send(`Added new pasta: **${key}**. Type \`!pasta ${key}\` to share it with the channel.`);
        }
    }

    // Check if the message matches '!pasta help'
    else if (pastaHelp.test(message.content)) {
        message.channel.send([
            '**Usage Intstructions for PastaBot:**',
            '• `!pasta help`: View usage instructions.',
            '• `!pasta keys`: View keys to currently available pastas.',
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
            message.channel.send(`Could not find a pasta matching the key: **${key}**. Try typing \`!pasta keys\` to see the available keys.`);
        }
    }

    // Check if the message matches '!pasta keys'
    else if (pastaKeys.test(message.content)) {
        message.channel.send(`Available pastas: ${keys.join(', ')}`);
    }

    // Check if the message matches '!pasta [key]'
    else if (pastaSearch.test(message.content)) {
        const [_, key] = message.content.match(pastaSearch);

        // Display the pasta corresponding to the provided key if one exists
        if (keys.includes(key)) {
            const pasta = await store.getPasta(key);
            message.channel.send(pasta.value);
        } else {
            message.channel.send(`Could not find a pasta matching the key: **${key}**. Try typing \`!pasta keys\` to see the available keys or \`!pasta add\` to add a new pasta.`);
        }
    }
};
