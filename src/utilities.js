// Create a map of user IDs to user display names
const displayNames = {};

async function getDisplayName(bot, id) {
    if (displayNames[id]) {
        return displayNames[id];
    } else {
        const member = await bot.guilds.cache.first().members.fetch(id);
        displayNames[id] = member.displayName;
        return displayNames[id];
    }
}

async function getDisplayNames(bot, ...ids) {
    const nameEntries = await Promise.all(ids.map(async id => {
        const name = await getDisplayName(bot, id);
        return [id, name];
    }));
    
    return Object.fromEntries(nameEntries);
}

function getArgs(s) {
    const [lastMatch, ...matches] = [...s.matchAll(/& *(\S+)([^&]+)/g)].reverse()
        .map(m => [m[1], m[2].trim()]);

    // Construct the map of args from the regex matches
    // The last match is treated differently since the body could follow it
    // So we slice the last arg to the first space
    const argObject = Object.fromEntries(matches);
    const [lastArg, ...body] = lastMatch[1].split(' ');
    argObject[lastMatch[0]] = lastArg;

    return { args: argObject, body: body.join(' ') };
}

module.exports = {
    getDisplayName,
    getDisplayNames,
    getArgs
};
