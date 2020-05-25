const config = require('./config');
const { MongoClient } = require('mongodb');

module.exports = async () => {
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
