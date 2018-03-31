/**
 *  Triggers when a message is updated
 *  The only allowed update for messages is changing the 
 *  message status from "delivered" to "read"
 *  If the updated message is the last one, the function 
 *  updates chat nodes and sets lastMsgStatus to "read"
 *
 *  The message status workflow:
 *  Client adds messages with status "sent"
 *  Firebase function onCreate gets triggered, processes the
 *  message and updates its status to "delivered"
 *  Other client (recipient of the message) can then update
 *  the message status to "read"
 */

const functions = require('firebase-functions');

// admin SDK can be only initialized once, wrap in try-catch
const admin = require('firebase-admin');
try {
    admin.initializeApp(functions.config().firebase);
} catch (e) {}

const consts = require('../../constants');


module.exports = functions.database
    .ref('/messages/{chatId}/{messageId}')
    .onUpdate(event => {
        return updateChats(event);
    });

const updateChats = event => {
    const msg = event.data.val();

    // update only if status changes to "read"
    if (msg.status != consts.MSG_STATUS_READ) {
        return true;
    }

    const db = admin.database();
    const chatId = event.params.chatId;
    const msgId = event.params.messageId;

    return db.ref(`/chats/${msg.senderId}/${chatId}`).once('value')
        .then(snapshot => {
            const chat = snapshot.val();

            // updated message is not the last
            if (chat.lastMsgId != msgId) {
                return true;
            }

            const chatUpdate = {lastMsgStatus: consts.MSG_STATUS_READ};

            return Promise.all([
                    db.ref(`/chats/${msg.recipientId}/${chatId}`).update(chatUpdate),
                    db.ref(`/chats/${msg.senderId}/${chatId}`).update(chatUpdate)
                ]);
        });
};