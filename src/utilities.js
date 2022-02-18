// Create a map of user IDs to user display names
const displayNames = {};

async function getDisplayName(bot, id) {
    if (displayNames[id]) {
        return displayNames[id];
    } else {
        const guild = await bot.guilds.cache.first();
        const members = await guild.members.cache;
        members.forEach(m => (displayNames[m.id] = m.displayName));
        return displayNames[id] ?? 'NO NAME';
    }
}

async function getDisplayNames(bot, ...ids) {
    const nameEntries = await Promise.all(ids.map(async id => {
        const name = await getDisplayName(bot, id);
        return [id, name];
    }));
    
    return Object.fromEntries(nameEntries);
}

module.exports = {
    getDisplayName,
    getDisplayNames
};
