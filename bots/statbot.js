module.exports = bot => message => {
    if (message.author.id === bot.user.id) return;
    console.log('StatBot at your service!');
};
