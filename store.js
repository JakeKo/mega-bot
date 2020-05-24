const config = require('./config');
const { MongoClient } = require('mongodb');

const devStore = async () => {
    const pastaCollection = [
        {
            key: 'hello',
            value: 'Hello World!'
        }
    ];

    return {
        getPastas: async () => {
            return pastaCollection;
        },
        getPasta: async key => {
            return pastaCollection.find(document => document.key === key);
        },
        addPasta: async (key, value) => {
            pastaCollection.push({ key, value });
        },
        removePasta: async key => {
            const index = pastaCollection.findIndex(document => document.key === key);
            pastaCollection = pastaCollection.splice(index, 1);
        }
    };
}

const prodStore = async () => {
    // Initialize MongoDB connection
    const client = new MongoClient(config.MONGODB_CONNECTION_STRING, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

    await client.connect();
    const db = client.db('discord-mega-bot');
    const pastaCollection = db.collection('pastas');

    return {
        getPastas: async () => {
            return await pastaCollection.find({}).toArray();
        },
        getPasta: async key => {
            return await pastaCollection.findOne({ key });
        },
        addPasta: async (key, value) => {
            await pastaCollection.insertOne({ key, value });
        },
        removePasta: async key => {
            await pastaCollection.deleteOne({ key });
        }
    };
};

module.exports = config.STAGE === 'dev' ? devStore : prodStore;
