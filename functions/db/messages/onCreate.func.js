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
    admin.initializeApp(functions.config().firebase);
} catch (e) {}

const consts = require('../../constants');


module.exports = functions.database
    .ref('/messages/{chatId}/{messageId}')
    .onCreate(event => {
        return Promise.all([
                markAsDelivered(event),
                handleEvent(event)
            ]);
    });

const markAsDelivered = event => {
    return event.data.adminRef.update({status: consts.MSG_STATUS_DELIVERED});
};

const handleEvent = event => {
    const msg = event.data.val();

    switch (msg.type) {
        case consts.MSG_TYPE_REQUEST:
            return handleRequest(event);
        case consts.MSG_TYPE_APPROVED:
            return handleApproved(event);
        case consts.MSG_TYPE_DENIED:
            return handleDenied(event);
        case consts.MSG_TYPE_MESSAGE:
            return handleMessage(event);
    }
};

const handleRequest = event => {
    const db = admin.database();
    const chatId = event.params.chatId;
    const msgSnap = event.data;
    const msg = msgSnap.val();

    return Promise.all([
            db.ref(`/users/${msg.senderId}/profile`).once('value'),
            db.ref(`/users/${msg.recipientId}/profile`).once('value')
        ])
        .then(([senderSnap, recipientSnap]) => {
            const senderChat = getNewChatObject(senderSnap, msgSnap);
            const recipientChat = getNewChatObject(recipientSnap, msgSnap);

            const updates = {};
            updates[`/chats/${msg.recipientId}/${chatId}`] = senderChat;
            updates[`/chats/${msg.senderId}/${chatId}`] = recipientChat;

            return db.ref().update(updates);
        });
};

const getNewChatObject = (userSnap, msgSnap) => {
    const user = userSnap.val();
    const userId = userSnap.ref.parent.key;
    const msg = msgSnap.val();
    const msgId = msgSnap.key;

    let photo = null;

    if (!!user.photos && !!user.photos[0]) {
        photo = user.photos[0];
    }

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

const handleApproved = event => {
    return updateChats(event, consts.CHAT_STATUS_APPROVED);
};

const handleDenied = event => {
    return updateChats(event, consts.CHAT_STATUS_DENIED);
};

const handleMessage = event => {
    return updateChats(event);
};

const updateChats = (event, newStatus = null) => {
    const db = admin.database();
    const chatId = event.params.chatId;
    const msgSnap = event.data;

    const updates = getChatUpdates(chatId, msgSnap, newStatus); 

    return db.ref().update(updates);
};

const getChatUpdates = (chatId, msgSnap, newStatus) => {
    const msg = msgSnap.val();
    const msgId = msgSnap.key;
    
    const newValues = {
        lastMsgId: msgId,
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

    for (const [key, value] of Object.entries(newValues)) {
        updates[`/chats/${msg.senderId}/${chatId}/${key}`] = value;
        updates[`/chats/${msg.recipientId}/${chatId}/${key}`] = value;
    }

    return updates;
};