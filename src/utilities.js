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

async function getAllDisplayNames(bot) {
    const members = await bot.guilds.cache.first().members.fetch();
    members.forEach(m => (displayNames[m.id] = m.displayName));
    return displayNames;
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

/**
 * Converts a list of key-value pairs into an object.
 * Naively adds values if two or more keys match.
 */
function flattenEntries(entries) {
    const obj = {};
    entries.forEach(([key, value]) => {
        if (key in obj) {
            obj[key] = obj[key] + value;
        } else {
            obj[key] = value;
        }
    });

    return obj;
}
// Returns the IDs of users whose display name matches the query
async function searchUsers(bot, query) {
    const allNames = await getAllDisplayNames(bot);
    return Object.keys(allNames).filter(id => allNames[id].toLowerCase().includes(query.toLowerCase()));
}

async function evaluateUserQuery(bot, userQuery) {
    const query = userQuery.trim();
    const targetUsers = await searchUsers(bot, query);

    // Check how many users matched the provided user query
    if (targetUsers.length === 1) {
        return { success: true, user: targetUsers[0], message: 'Query Successful' };
    } else if (targetUsers.length === 0) {
        return { success: false, user: '', message: `Query Error: No user matches query "${query}".` };
    } else {
        const displayNames = await getDisplayNames(bot, ...targetUsers);
        const displayNamesString = Object.values(displayNames).map(s => `\`${s}\``).join(', ');
        return { success: false, user: '', message: `Query Error: More than one user matches query "${query}":\n${displayNamesString}` };
    }
}

function barPlot(label, entries, width = 20) {
    const maxValue = Math.max(...entries.map(e => e[1]));
    const bars = entries.map(([key, value]) => {
        const barLength = maxValue === 0 ? -1 : Math.round(width * value / maxValue);
        const bar = Array(barLength + 1).join('█');
        return `${key} ${bar} ${value}`;
    });

    return [label, ...bars].join('\n');
}

module.exports = {
    getDisplayName,
    getDisplayNames,
    getAllDisplayNames,
    getArgs,
    flattenEntries,
    evaluateUserQuery,
    barPlot
};
