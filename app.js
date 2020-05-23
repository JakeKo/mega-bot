const Discord = require('discord.js');
const bot = new Discord.Client();

bot.on('ready', () => {
    console.log(`Logged in as ${bot.user.tag}!`);
});

bot.on('message', message => {
    // Handle add pasta

    // Handle show keys

    // Handle search for a particular copy-pasta
    if (/!pasta [a-z]*/.test(message.content)) {
        const [_, key] = message.content.match(/!pasta ([a-z\-_]*)/);
        message.channel.send(key);
    }
});

bot.login(process.env.DISCORD_BOT_TOKEN);