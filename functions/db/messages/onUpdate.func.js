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
const admin = require('../../admin');

const consts = require('../../constants');


module.exports = functions.database
    .ref('/messages/{chatId}/{messageId}')
    .onUpdate((change, context) => {
        const msg = change.after.val();

        // update only if status changes to "read"
        if (msg.status !== consts.MSG_STATUS_READ) {
            return true;
        }

        const db = admin.database();
        const { chatId, messageId } = context.params;

        return db.ref(`/chats/${msg.senderId}/${chatId}`).once('value')
            .then(snapshot => {
                const chat = snapshot.val();

                // updated message is not the last
                if (chat.lastMsgId !== messageId) {
                    return true;
                }

                const updates = {};
                updates[`/chats/${msg.recipientId}/${chatId}/lastMsgStatus`] = consts.MSG_STATUS_READ;
                updates[`/chats/${msg.senderId}/${chatId}/lastMsgStatus`] = consts.MSG_STATUS_READ;

                return db.ref().update(updates);
            });
    });