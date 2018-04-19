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
} catch (e) {}


module.exports = functions.database
    .ref('/users/{userId}/profile')
    .onUpdate((change, context) => {
        const newData = change.after.val();
        const oldData = change.before.val();

        const changes = getChanges(newData, oldData);

        if (!changes) {
            // nothing to update - user has still the same 
            // firstName and profile photo
            return true;
        }

        const db = admin.database();
        const userId = context.params.userId;

        return db.ref(`/chats/${userId}`).once('value')
            .then(snap => {
                const chats = snap.val();
                
                if (!chats) {
                    return true;
                }

                const updates = getUpdates(changes, chats);
                return db.ref().update(updates);
            });
    });

const getChanges = (newData, oldData) => {
    const changes = {};
    
    // users firstName is stored in chats recipientName attribute
    if (newData.firstName != oldData.firstName) {
        changes.recipientName = newData.firstName;
    }

    const newPhoto = !!newData.photos && !!newData.photos[0] ? 
                        newData.photos[0] : '';
    const oldPhoto = !!oldData.photos && !!oldData.photos[0] ? 
                        oldData.photos[0] : '';

    // users profile photo is stored in chats recipientUserPhoto attribute
    if (newPhoto != oldPhoto) {
        changes.recipientUserPhoto = newPhoto;
    }

    return Object.keys(changes).length != 0 ? changes : null;
};

const getUpdates = (changes, chats) => {
    const updates = {};

    for (const [chatId, chat] of Object.entries(chats)) {
        for (const [attr, newValue] of Object.entries(changes)) {
            updates[`/chats/${chat.recipientId}/${chatId}/${attr}`] = newValue;
        }
    }

    return updates;
};