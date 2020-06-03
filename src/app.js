(async () => {
    const Discord = require('discord.js');
    const config = require('../config');

    const bot = new Discord.Client();
    const store = await require('./store')();

    // Register each bot
    const megabot = require('./bots/megabot')(bot, store);
    const statbot = require('./bots/statbot')(bot, store);
    const pastabot = require('./bots/pastabot')(bot, store);

    // Register bots
    bot.on('ready', () => console.log(`Logged in as ${bot.user.tag}!`));
    bot.on('message', megabot);
    bot.on('message', statbot);
    bot.on('message', pastabot);

    bot.login(config.DISCORD_BOT_TOKEN);
})();
