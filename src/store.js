const config = require('../config');
const { MongoClient } = require('mongodb');

module.exports = async () => {
    // Initialize MongoDB connection
    const client = new MongoClient(config.MONGODB_CONNECTION_STRING, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

    await client.connect();
    const db = client.db(config.MONGODB_DATABASE);
    const pastaCollection = db.collection('pastas');
    const messagesCollection = db.collection('messages');

    return {
        getPastas: async () => {
            return await pastaCollection.find({}).toArray();
        },
        getPasta: async key => {
            return await pastaCollection.findOne({ key });
        },
        addPasta: async (key, value, attachments) => {
            await pastaCollection.insertOne({ key, value, attachments });
        },
        removePasta: async key => {
            await pastaCollection.deleteOne({ key });
        },
        getMessages: async () => {
            return await messagesCollection.find({}).toArray();
        },
        getLastMessage: async () => {
            return  await messagesCollection.countDocuments({}) === 0
                ? { id: config.STATBOT_CHANNEL_FIRST_MESSAGE_ID }
                : (await messagesCollection.find({}, { limit: 1 }).sort('timestamp', -1).toArray())[0];
        },
        archiveMessages: async messages => {
            await messagesCollection.insertMany(messages);
        }
    };
};
