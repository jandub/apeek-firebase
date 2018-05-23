/**
 *  Triggers when a new message is created
 *  Changes the status of message to 'delivered'
 *  Preforms different actions depending on the type of the message
 *  Supported types: request|message|approved|denied
 *
 *  Request
 *  Request for chatting. Creates a chat node for both users in
 *  /chats/{senderId}/{chatId} and /chats/{recipientId}/{chatId} with
 *  chat status set to pending.
 *
 *  Approved/Denied
 *  Approves or denies the request for chatting. Updates the status of
 *  chat nodes to approved/denied.
 *
 *  All messages
 *  Updates the chat nodes with the last message information -
 *  text, sender, timestamp and status.
 */

const functions = require('firebase-functions');

// admin SDK can be only initialized once, wrap in try-catch
const admin = require('firebase-admin');
try {
    admin.initializeApp();
// eslint-disable-next-line no-empty
} catch (e) {}

const consts = require('../../constants');


module.exports = functions.database
    .ref('/messages/{chatId}/{messageId}')
    .onCreate((msgSnap, context) => {
        return Promise.all([
            markAsDelivered(msgSnap),
            handleEvent(msgSnap, context)
        ]);
    });

const markAsDelivered = msgSnap => {
    return msgSnap.ref.update({ status: consts.MSG_STATUS_DELIVERED });
};

const handleEvent = (msgSnap, context) => {
    const msg = msgSnap.val();

    switch (msg.type) {
        case consts.MSG_TYPE_REQUEST:
            return handleRequest(msgSnap, context);
        case consts.MSG_TYPE_APPROVED:
            return handleApproved(msgSnap, context);
        case consts.MSG_TYPE_DENIED:
            return handleDenied(msgSnap, context);
        // consts.MSG_TYPE_MESSAGE
        default:
            return handleMessage(msgSnap, context);
    }
};

const handleRequest = (msgSnap, context) => {
    const db = admin.database();
    const { chatId } = context.params;
    const msg = msgSnap.val();

    return Promise.all([
        db.ref(`/users/${msg.senderId}/profile`).once('value'),
        db.ref(`/users/${msg.senderId}/photos`).once('value'),
        db.ref(`/users/${msg.recipientId}/profile`).once('value'),
        db.ref(`/users/${msg.recipientId}/photos`).once('value')
    ])
        .then(([senderSnap, senderPhotosSnap, recipientSnap, recipientPhotosSnap]) => {
            const senderChat = getNewChatObject(senderSnap, senderPhotosSnap, msgSnap);
            const recipientChat = getNewChatObject(recipientSnap, recipientPhotosSnap, msgSnap);

            const updates = {};
            updates[`/chats/${msg.recipientId}/${chatId}`] = senderChat;
            updates[`/chats/${msg.senderId}/${chatId}`] = recipientChat;

            return db.ref().update(updates);
        });
};

const getNewChatObject = (userSnap, photosSnap, msgSnap) => {
    const user = userSnap.val();
    const userId = userSnap.ref.parent.key;
    const photos = photosSnap.val();
    const photo = photos && photos[0] ? photos[0] : null;
    const msg = msgSnap.val();
    const msgId = msgSnap.key;

    return {
        recipientId: userId,
        recipientName: user.firstName,
        recipientUserPhoto: photo,
        status: consts.CHAT_STATUS_PENDING,
        lastMsgId: msgId,
        lastMsgTs: msg.ts,
        lastMsgText: msg.text,
        lastMsgSenderId: msg.senderId,
        lastMsgStatus: consts.MSG_STATUS_DELIVERED,
        lastMsgType: msg.type
    };
};

const handleApproved = (msgSnap, context) => {
    return updateChats(msgSnap, context, consts.CHAT_STATUS_APPROVED);
};

const handleDenied = (msgSnap, context) => {
    return updateChats(msgSnap, context, consts.CHAT_STATUS_DENIED);
};

const handleMessage = (msgSnap, context) => {
    return updateChats(msgSnap, context);
};

const updateChats = (msgSnap, context, newStatus = null) => {
    const db = admin.database();
    const { chatId } = context.params;

    const updates = getChatUpdates(chatId, msgSnap, newStatus);

    return db.ref().update(updates);
};

const getChatUpdates = (chatId, msgSnap, newStatus) => {
    const msg = msgSnap.val();
    const newValues = {
        lastMsgId: msgSnap.key,
        lastMsgTs: msg.ts,
        lastMsgText: msg.text,
        lastMsgSenderId: msg.senderId,
        lastMsgStatus: consts.MSG_STATUS_DELIVERED,
        lastMsgType: msg.type
    };

    if (newStatus) {
        newValues.status = newStatus;
    }

    const updates = {};

    Object.keys(newValues).forEach(key => {
        updates[`/chats/${msg.senderId}/${chatId}/${key}`] = newValues[key];
        updates[`/chats/${msg.recipientId}/${chatId}/${key}`] = newValues[key];
    });

    return updates;
};