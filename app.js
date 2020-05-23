const Discord = require('discord.js');
const bot = new Discord.Client();
const store = require('./dev-store.js');

bot.on('ready', () => {
    console.log(`Logged in as ${bot.user.tag}!`);
});

bot.on('message', message => {
    const keys = Object.keys(store.pastas);
    const pastaAdd = /^!pasta\s+add\s+([0-9a-zA-Z\-_]+)\s+(.+)/;
    const pastaRemove = /^!pasta\s+remove\s+([0-9a-zA-Z\-_]+)/;
    const pastaKeys = /^!pasta\s+keys/;
    const pastaSearch = /^!pasta\s+([0-9a-zA-Z\-_]+)/;

    // Check if the message matches '!pasta add [key] [value]'
    if (pastaAdd.test(message.content)) {
        const [_, key, value] = message.content.match(pastaAdd);

        // Check if the key is a reserved keyword
        if (key === 'keys' || key === 'add') {
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
            store.pastas[key] = value;
            message.channel.send(`Added new pasta: **${key}**. Type \`!pasta ${key}\` to share it with the channel.`);
        }
    }

    // Check if the message matches '!pasta remove [key]'
    else if (pastaRemove.test(message.content)) {
        const [_, key] = message.content.match(pastaRemove);

        // Display the pasta corresponding to the provided key if one exists
        if (keys.includes(key)) {
            delete store.pastas[key];
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
            message.channel.send(store.pastas[key]);
        } else {
            message.channel.send(`Could not find a pasta matching the key: **${key}**. Try typing \`!pasta keys\` to see the available keys or \`!pasta add\` to add a new pasta.`);
        }
    }
});

bot.login(process.env.DISCORD_BOT_TOKEN || store.token);