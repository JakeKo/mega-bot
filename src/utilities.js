// Create a map of user IDs to user display names
let displayNames = {};

const getDisplayNames = () => displayNames;

const cacheDisplayNames = async bot => {
    const members = await bot.guilds.cache.first().members.fetch();
    displayNames = members.reduce((all, m) => ({ ...all, [m.id]: m.displayName }), {});
    return getDisplayNames();
};

module.exports = {
    cacheDisplayNames,
    getDisplayNames
};
