// Create a map of user IDs to user display names
module.exports.getDisplayNames = async bot => {
    const members = await bot.guilds.cache.first().members.fetch();
    return members.reduce((all, m) => ({ ...all, [m.id]: m.displayName }), {});
};
