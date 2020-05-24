(async () => {
    const Discord = require('discord.js');
    const config = require('./config');

    const store = await require('./store')();
    const pastabot = require('./bots/pastabot')(store);

    const bot = new Discord.Client();

    bot.on('ready', () => console.log(`Logged in as ${bot.user.tag}!`));
    bot.on('message', pastabot);

    bot.login(config.DISCORD_BOT_TOKEN);
})();
