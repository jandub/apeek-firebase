/*
 *  Triggers when users profile gets updated.
 *
 *  When users name changes, this function updates it in
 *  the chat nodes. Every chat node stores recipientName -
 *  the functions needs to find recipient chat objects and update
 *  the first name - /chats/recipientId/chatId/recipientName
 */

const functions = require('firebase-functions');
const admin = require('../../../admin');


module.exports = functions.database
    .ref('/users/{userId}/profile')
    .onUpdate((change, context) => {
        const newData = change.after.val();
        const oldData = change.before.val();

        // check if first name got updated
        if (newData.firstName === oldData.firstName) {
            return true;
        }

        const db = admin.database();
        const { userId } = context.params;

        return db.ref(`/chats/${userId}`).once('value')
            .then(snap => {
                const chats = snap.val();

                // no chats to update
                if (!chats) {
                    return true;
                }

                const updates = getUpdates(newData.firstName, chats);
                return db.ref().update(updates);
            });
    });

const getUpdates = (firstName, chats) => {
    const updates = {};

    Object.keys(chats).forEach(chatId => {
        updates[`/chats/${chats[chatId].recipientId}/${chatId}/recipientName`] = firstName;
    });

    return updates;
};