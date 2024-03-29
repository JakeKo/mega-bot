(async () => {
    const Discord = require('discord.js');
    const config = require('../config');
    const Logger = require('./logger');
    const { initArchiver, startArchiver } = require('./archiver');

    const bot = new Discord.Client();
    const store = await require('./store')();

    // Register each bot
    const megabot = require('./bots/megabot')(bot, store);
    const statbot = require('./bots/statbot')(bot, store);
    const pastabot = require('./bots/pastabot')(bot, store);

    // Register bots
    bot.on('ready', () => { Logger.log(`Logged in as ${bot.user.tag}!`); });
    bot.on('message', megabot);
    bot.on('message', statbot);
    bot.on('message', pastabot);

    await bot.login(config.DISCORD_BOT_TOKEN);

    // Register archiver - it is delayed so the Mongo connection finishes
    initArchiver(bot, store);
    setTimeout(startArchiver, 1000);
})();
