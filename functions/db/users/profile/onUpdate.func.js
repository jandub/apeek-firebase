/*
 *  Triggers when users profile gets updated.
 *
 *  When users name or profile photo changes, this function updates it
 *  in the chat nodes.
 *  Every chat node stores recipientName and recipientUserPhoto -
 *  that means the functions needs to find recipient chat objects
 *  and update the new user data there - /chats/recipientId/chatId/
 */

const functions = require('firebase-functions');

// admin SDK can be only initialized once, wrap in try-catch
const admin = require('firebase-admin');
try {
    admin.initializeApp();
// eslint-disable-next-line no-empty
} catch (e) {}


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

    Object.entries(chats).forEach(([chatId, chat]) => {
        updates[`/chats/${chat.recipientId}/${chatId}/recipientName`] = firstName;
    });

    return updates;
};