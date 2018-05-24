/**
 *  Gets triggered by pub/sub message every day at 9am
 *
 *  Deletes all chat messages.
 */

const functions = require('firebase-functions');
const admin = require('../admin');


module.exports = functions.pubsub
    .topic('daily-tick')
    .onPublish((msg, event) => {
        const db = admin.database();
        const updates = {
            '/messages': null,
            '/chats': null
        };

        console.log('Cron daily at 9am - deleting all messages.');

        // using multipath update to delete nodes instead of remove
        // as the operation is atomic this way
        return db.ref().update(updates);
    });