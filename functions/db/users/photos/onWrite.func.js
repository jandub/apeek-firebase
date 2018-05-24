/*
 *  Triggers when users photos get created/updated/deleted.
 *
 *  When the first photo changes, this function updates it in
 *  the chat nodes. Every chat node stores recipientUserPhoto -
 *  the functions needs to find recipient chat objects and update
 *  the photo - /chats/recipientId/chatId/recipientUserPhoto
 */

const functions = require('firebase-functions');
const admin = require('../../../admin');


module.exports = functions.database
    .ref('/users/{userId}/photos')
    .onWrite((change, context) => {
        const newData = change.after.val();
        const oldData = change.before.val();

        // check if first photo got updated
        if (newData && oldData && newData[0] === oldData[0]) {
            return true;
        }

        const newPhoto = newData ? newData[0] : null;
        const db = admin.database();
        const { userId } = context.params;

        return db.ref(`/chats/${userId}`).once('value')
            .then(snap => {
                const chats = snap.val();

                // no chats to update
                if (!chats) {
                    return true;
                }

                const updates = getUpdates(newPhoto, chats);
                return db.ref().update(updates);
            });
    });

const getUpdates = (photo, chats) => {
    const updates = {};

    Object.keys(chats).forEach(chatId => {
        updates[`/chats/${chats[chatId].recipientId}/${chatId}/recipientUserPhoto`] = photo;
    });

    return updates;
};